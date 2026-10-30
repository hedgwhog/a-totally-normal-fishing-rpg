// Finds the route of a transport line over the world map, character by character:
// the shortest way between two towns that keeps away from coasts. Only the game uses this (for the map).
import { mapTiles, worldBounds, tileSize, towns } from "../shared/data/world.js";
import { visits } from "../shared/rules/transport.js";

const width = (worldBounds.maxColumn - worldBounds.minColumn + 1) * tileSize.width;
const height = (worldBounds.maxRow - worldBounds.minRow + 1) * tileSize.height;
const charAspect = 1.85;   // a character is about this much taller than wide
const portRadius = 7;      // near a town, a route may cross land (to leave the harbour)
const coastPenalty = [0, 9, 4, 1.5]; // extra cost 1, 2 and 3 characters from land

let grid = null;      // 1 = land
let toLand = null;    // steps to the nearest land
const routes = new Map();

async function loadGrid(loadArt) {
    if (grid) return;
    const land = new Uint8Array(width * height);
    await Promise.all(mapTiles.map(async tile => {
        const lines = (await loadArt(tile.art)).split("\n");
        const left = (tile.column - worldBounds.minColumn) * tileSize.width;
        const top = (tile.row - worldBounds.minRow) * tileSize.height;
        for (let y = 0; y < tileSize.height; y++) {
            const line = lines[y] || "";
            for (let x = 0; x < tileSize.width; x++) {
                const char = line[x] || " ";
                if (char !== " " && char !== "~") land[(top + y) * width + left + x] = 1;
            }
        }
    }));
    const distance = new Int16Array(width * height).fill(99);
    const queue = [];
    for (let i = 0; i < land.length; i++) if (land[i]) { distance[i] = 0; queue.push(i); }
    for (let head = 0; head < queue.length; head++) {
        const i = queue[head];
        const x = i % width, y = Math.floor(i / width);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const n = ny * width + nx;
            if (distance[n] > distance[i] + 1) { distance[n] = distance[i] + 1; queue.push(n); }
        }
    }
    grid = land;
    toLand = distance;
}

export function townSpot(id) {
    const town = towns[id];
    return {
        x: (town.column - worldBounds.minColumn) * tileSize.width + town.x,
        y: (town.row - worldBounds.minRow) * tileSize.height + town.y,
    };
}

function nearPort(x, y, ports) {
    return ports.some(port => Math.abs(port.x - x) <= portRadius && Math.abs(port.y - y) * charAspect <= portRadius);
}

// A* from a to b. Gives back a list of { x, y } characters.
function search(a, b) {
    const ports = [a, b];
    const total = width * height;
    const cost = new Float64Array(total).fill(Infinity);
    const from = new Int32Array(total).fill(-1);
    const heap = [];
    const push = (i, f) => {
        heap.push([f, i]);
        let c = heap.length - 1;
        while (c > 0) {
            const p = (c - 1) >> 1;
            if (heap[p][0] <= heap[c][0]) break;
            [heap[p], heap[c]] = [heap[c], heap[p]];
            c = p;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            let c = 0;
            for (;;) {
                const l = 2 * c + 1, r = l + 1;
                let m = c;
                if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
                if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
                if (m === c) break;
                [heap[m], heap[c]] = [heap[c], heap[m]];
                c = m;
            }
        }
        return top;
    };
    const guess = (x, y) => Math.hypot(x - b.x, (y - b.y) * charAspect);
    const start = a.y * width + a.x;
    const goal = b.y * width + b.x;
    cost[start] = 0;
    push(start, guess(a.x, a.y));
    while (heap.length) {
        const [, i] = pop();
        if (i === goal) break;
        const x = i % width, y = Math.floor(i / width);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const n = ny * width + nx;
            const port = nearPort(nx, ny, ports);
            if (grid[n] && !port) continue;
            const step = Math.hypot(dx, dy * charAspect) + (port ? 0 : coastPenalty[toLand[n]] || 0);
            if (cost[i] + step < cost[n]) {
                cost[n] = cost[i] + step;
                from[n] = i;
                push(n, cost[n] + guess(nx, ny));
            }
        }
    }
    const path = [];
    for (let i = goal; i !== -1; i = from[i]) path.push({ x: i % width, y: Math.floor(i / width) });
    return path.reverse();
}

// a moving average, so the route doesn't zigzag between characters
function smooth(path) {
    return path.map((point, i) => {
        if (i < 2 || i > path.length - 3) return point;
        const near = path.slice(i - 2, i + 3);
        return { x: near.reduce((s, p) => s + p.x, 0) / 5, y: near.reduce((s, p) => s + p.y, 0) / 5 };
    });
}

function legRoute(line, fromTown, toTown) {
    const forced = line.waypoints && line.waypoints[fromTown + ">" + toTown];
    const stops = [townSpot(fromTown), ...(forced || []).map(([x, y]) => ({ x, y })), townSpot(toTown)];
    let path = [];
    for (let i = 0; i < stops.length - 1; i++) path = path.concat(search(stops[i], stops[i + 1]).slice(i ? 1 : 0));
    return smooth(path);
}

// { "from>to": [points] } for every leg of the line (also the way back)
export async function lineRoutes(line, loadArt) {
    if (routes.has(line.id)) return routes.get(line.id);
    await loadGrid(loadArt);
    const result = {};
    const list = visits(line);
    list.forEach((visit, i) => {
        const next = list[(i + 1) % list.length];
        const key = visit.town + ">" + next.town;
        const back = next.town + ">" + visit.town;
        if (result[key]) return;
        result[key] = result[back] ? [...result[back]].reverse() : legRoute(line, visit.town, next.town);
    });
    routes.set(line.id, result);
    return result;
}

// the first point of a route that's on water (where a docked ship waits)
export function dockIndex(path) {
    const index = path.findIndex(point => !grid[Math.round(point.y) * width + Math.round(point.x)]);
    return index === -1 ? 0 : index;
}

export const worldChars = { width, height };
