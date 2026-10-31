import { mapTiles, worldBounds, tileSize, towns, fogArt, spotNumber, tileAt } from "../shared/data/world.js";
import { getState, onState } from "../core/state.js";
import { openPopup } from "../core/ui.js";
import { transportLines } from "../shared/data/transport.js";
import { linePosition } from "../shared/rules/transport.js";
import { lineRoutes, dockIndex } from "./routes.js";
// Which tiles are in data/world.js
// Which tiles comes from where = save.map

const popup = document.getElementById("mapDisplay");
const view = document.getElementById("mapView");
const world = document.getElementById("mapWorld");
const status = document.getElementById("mapStatus");
const zoomButtons = document.querySelectorAll(".mapZoom button");

export function hasMapPiece(id) {
    return getState().map.includes(id);
}

const lineHeight = 13;
const columns = worldBounds.maxColumn - worldBounds.minColumn + 1;
const rows = worldBounds.maxRow - worldBounds.minRow + 1;

const artFiles = new Map();
function loadArt(path) {
    if (!artFiles.has(path)) {
        artFiles.set(path, fetch(path).then(response => (response.ok ? response.text() : "")).catch(() => ""));
    }
    return artFiles.get(path);
}

let charWidth = 0;
let tileWidth = 0;
const tileHeight = lineHeight * tileSize.height;

function measure() {
    if (charWidth) return true;
    const probe = document.createElement("pre");
    probe.className = "mapTile";
    probe.style.visibility = "hidden";
    probe.textContent = "x".repeat(40);
    world.appendChild(probe);
    charWidth = probe.getBoundingClientRect().width / 40;
    probe.remove();
    if (!charWidth) return false;
    tileWidth = charWidth * tileSize.width;
    return true;
}

const worldWidth = () => columns * tileWidth;
const worldHeight = () => rows * tileHeight;
const spotLeft = column => (column - worldBounds.minColumn) * tileWidth;
const spotTop = row => (row - worldBounds.minRow) * tileHeight;

const tileBoxes = new Map();
let drawnKnown = null; 

function buildWorld() {
    world.innerHTML = "";
    tileBoxes.clear();
    world.style.width = worldWidth() + "px";
    world.style.height = worldHeight() + "px";
    for (let row = worldBounds.minRow; row <= worldBounds.maxRow; row++) {
        for (let column = worldBounds.minColumn; column <= worldBounds.maxColumn; column++) {
            const box = document.createElement("pre");
            box.className = "mapTile";
            box.style.left = spotLeft(column) + "px";
            box.style.top = spotTop(row) + "px";
            box.style.width = tileWidth + "px";
            box.style.height = tileHeight + "px";
            world.appendChild(box);
            tileBoxes.set(column + "," + row, box);
        }
    }
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function drawTiles() {
    const known = new Set(getState().map);
    const firstTime = drawnKnown === null;
    for (let row = worldBounds.minRow; row <= worldBounds.maxRow; row++) {
        for (let column = worldBounds.minColumn; column <= worldBounds.maxColumn; column++) {
            const box = tileBoxes.get(column + "," + row);
            const tile = tileAt(column, row);
            const isKnown = Boolean(tile && known.has(tile.id));
            const fog = (spotNumber(column, row) + column) % fogArt.length;
            const path = isKnown ? tile.art : fogArt[fog];
            if (box.dataset.art === path) continue;
            box.dataset.art = path;
            box.classList.toggle("mapFog", !isKnown);
            box.classList.toggle("mapFound", isKnown && !firstTime && !drawnKnown.has(tile.id));
            box.title = isKnown ? capitalize(tile.name) : "Unknown waters";
            loadArt(path).then(text => {
                if (box.dataset.art === path) box.textContent = text.replace(/\n$/, "");
            });
        }
    }
    drawnKnown = known;
    drawTowns(known);
    drawRoutes(known);
}

// Route charts: the route and the ship, only where the tile under it is known (clouds hide the rest)

const svgSpace = "http://www.w3.org/2000/svg";
const shipIcon = { ferry: ["[=]>", "<[=]"], boat: ["\\_/>", "<\\_/"], train: ["[]=>", "<=[]"] };

function tileKnown(known, point) {
    const column = worldBounds.minColumn + Math.floor(point.x / tileSize.width);
    const row = worldBounds.minRow + Math.floor(point.y / tileSize.height);
    const tile = tileAt(column, row);
    return Boolean(tile && known.has(tile.id));
}

const toPixels = point => (point.x + 0.5) * charWidth + "," + (point.y + 0.5) * lineHeight;

let drawing = 0;

async function drawRoutes(known) {
    const id = ++drawing;
    const owned = transportLines.filter(line => (getState().charts || []).includes(line.id));
    const routes = await Promise.all(owned.map(line => lineRoutes(line, loadArt)));
    if (id !== drawing) return; // a newer drawing started
    const layer = world.querySelector(".mapRoutes") || world.appendChild(document.createElementNS(svgSpace, "svg"));
    layer.setAttribute("class", "mapRoutes");
    layer.setAttribute("width", worldWidth());
    layer.setAttribute("height", worldHeight());
    world.querySelectorAll(".mapShip").forEach(ship => ship.remove());
    const parts = [];
    shipLines = [];
    for (const [index, line] of owned.entries()) {
        const legs = routes[index];
        for (const path of Object.values(legs)) {
            let run = [];
            for (const point of path) {
                if (tileKnown(known, point)) run.push(point);
                else if (run.length) { parts.push(run); run = []; }
            }
            if (run.length) parts.push(run);
        }
        drawShip(line, legs, known);
    }
    layer.innerHTML = "";
    for (const run of parts) {
        if (run.length < 2) continue;
        const polyline = document.createElementNS(svgSpace, "polyline");
        polyline.setAttribute("points", run.map(toPixels).join(" "));
        layer.appendChild(polyline);
    }
    showStatus();
}

let shipLines = []; // status lines for the ships you can see

function pointAlong(path, progress) {
    let total = 0;
    const lengths = path.slice(1).map((point, i) => {
        const length = Math.hypot(point.x - path[i].x, point.y - path[i].y);
        total += length;
        return length;
    });
    let left = progress * total;
    for (let i = 0; i < lengths.length; i++) {
        if (left <= lengths[i]) {
            const part = lengths[i] ? left / lengths[i] : 0;
            return { x: path[i].x + (path[i + 1].x - path[i].x) * part, y: path[i].y + (path[i + 1].y - path[i].y) * part, dx: path[i + 1].x - path[i].x };
        }
        left -= lengths[i];
    }
    return { ...path[path.length - 1], dx: 1 };
}

function drawShip(line, legs, known) {
    const position = linePosition(line, getState());
    if (!position) return;
    let point;
    if (position.docked) {
        const key = Object.keys(legs).find(leg => leg.startsWith(position.town + ">"));
        const path = legs[key];
        point = { ...path[Math.min(path.length - 1, dockIndex(path) + 4)], dx: 1 }; // just outside the harbour
    } else {
        const path = legs[position.from + ">" + position.to];
        const start = dockIndex(path);
        const end = path.length - 1 - dockIndex([...path].reverse());
        point = pointAlong(path.slice(start, end + 1), position.progress);
    }
    if (!tileKnown(known, point)) {
        shipLines.push(line.name + ": somewhere under the clouds.");
        return;
    }
    const ship = document.createElement("div");
    ship.className = "mapShip";
    const icons = shipIcon[line.kind] || shipIcon.ferry;
    ship.textContent = point.dx < 0 ? icons[1] : icons[0];
    ship.title = line.name;
    ship.style.left = (point.x + 0.5) * charWidth + "px";
    ship.style.top = (point.y + 0.5) * lineHeight + "px";
    world.appendChild(ship);
    shipLines.push(position.docked
        ? line.name + ": docked at " + towns[position.town].name + ", leaves on day " + position.departs + "."
        : line.name + ": sailing to " + towns[position.to].name + ", arrives on day " + position.arrives + ".");
}

// the names next to the towns
function drawTowns(known) {
    world.querySelectorAll(".mapTown").forEach(label => label.remove());
    for (const [id, town] of Object.entries(towns)) {
        const tile = tileAt(town.column, town.row);
        if (!tile || !known.has(tile.id)) continue;
        const here = getState().island === id;
        const label = document.createElement("div");
        label.className = "mapTown" + (here ? " here" : "");
        label.textContent = town.name + (here ? " (you)" : "");
        label.style.left = (spotLeft(town.column) + (town.x + 1.5) * charWidth) + "px";
        label.style.top = (spotTop(town.row) + (town.y + 0.5) * lineHeight) + "px";
        world.appendChild(label);
    }
}

let zoom = "nearby";
let scale = 1;
let offsetX = 0;
let offsetY = 0;

function clampOffset() {
    const width = worldWidth() * scale;
    const height = worldHeight() * scale;
    offsetX = width <= view.clientWidth ? (view.clientWidth - width) / 2 : Math.min(0, Math.max(view.clientWidth - width, offsetX));
    offsetY = height <= view.clientHeight ? (view.clientHeight - height) / 2 : Math.min(0, Math.max(view.clientHeight - height, offsetY));
}

function applyView(smooth) {
    clampOffset();
    world.classList.toggle("smooth", smooth);
    world.style.setProperty("--zoom", scale);
    world.style.transform = "translate(" + offsetX + "px, " + offsetY + "px) scale(" + scale + ")";
}

function setZoom(level, smooth = true) {
    zoom = level;
    zoomButtons.forEach(button => button.classList.toggle("activeTab", button.dataset.zoom === level));
    if (level === "world") {
        scale = Math.min(view.clientWidth / worldWidth(), view.clientHeight / worldHeight());
    } else {
        scale = 1;
        const here = towns[getState().island];
        const hereTile = here && tileAt(here.column, here.row);
        const town = hereTile && getState().map.includes(hereTile.id) ? here : { column: 0, row: 0 };
        offsetX = view.clientWidth / 2 - (spotLeft(town.column) + tileWidth / 2);
        offsetY = view.clientHeight / 2 - (spotTop(town.row) + tileHeight / 2);
    }
    applyView(smooth);
}

zoomButtons.forEach(button => button.addEventListener("click", () => setZoom(button.dataset.zoom)));

let drag = null;
view.addEventListener("pointerdown", event => {
    drag = { x: event.clientX, y: event.clientY, startX: offsetX, startY: offsetY };
    view.setPointerCapture(event.pointerId);
    view.classList.add("dragging");
});
view.addEventListener("pointermove", event => {
    if (!drag) return;
    offsetX = drag.startX + event.clientX - drag.x;
    offsetY = drag.startY + event.clientY - drag.y;
    applyView(false);
});
const stopDrag = () => {
    drag = null;
    view.classList.remove("dragging");
};
view.addEventListener("pointerup", stopDrag);
view.addEventListener("pointercancel", stopDrag);

function showStatus() {
    const save = getState();
    const found = mapTiles.filter(tile => save.map.includes(tile.id)).length;
    let text = "Tiles found: " + found + " / " + mapTiles.length + ".";
    const bird = save.bird;
    if (!bird) text += " The clouds hide the waters you haven't seen yet.";
    else if (!bird.job) text += " Send " + bird.name + " out to discover new waters.";
    else if (bird.job.type === "discover") text += " " + bird.name + " is out exploring.";
    else text += " " + bird.name + " is bringing a letter to " + bird.job.toName + ".";
    status.textContent = [text, ...shipLines].join("\n");
}

let built = false;
const isOpen = () => getComputedStyle(popup).display !== "none";

function refreshMap() {
    if (!built || !isOpen()) return;
    drawTiles();
    showStatus();
}

document.getElementById("openMap").addEventListener("click", () => {
    if (document.getElementById("nextFish").disabled) return;
    openPopup(popup);
    if (!measure()) return;
    if (!built) {
        buildWorld();
        built = true;
    }
    drawTiles();
    showStatus();
    setZoom(zoom, false);
});

onState(refreshMap);
