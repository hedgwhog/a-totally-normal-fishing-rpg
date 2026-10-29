import { areaTasks } from "../data/completion.js";
import { islandNames } from "../data/islands.js";
import { allFish } from "../data/fish.js";
import { mapTiles } from "../data/world.js";

const average = list => (list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : 0);

export function areaCompletion(save, area) {
    if (!(save.visited || []).includes(area)) return 0;
    return average((areaTasks[area] || []).map(task => {
        try {
            return Math.max(0, Math.min(1, Number(task.progress(save)) || 0));
        } catch {
            return 0;
        }
    }));
}

export const allAreas = () => Object.keys(islandNames);

export function areasVisited(save) {
    return allAreas().filter(area => (save.visited || []).includes(area)).length;
}

export function fishDiscovered(save) {
    return allFish.filter(type => save.fishLog[type.id]).length;
}

export function tilesFound(save) {
    return mapTiles.filter(tile => save.map.includes(tile.id)).length;
}

export function gameCompletion(save) {
    const parts = allAreas().map(area => areaCompletion(save, area));
    parts.push(areasVisited(save) / allAreas().length);
    parts.push(allFish.length ? fishDiscovered(save) / allFish.length : 1);
    parts.push(tilesFound(save) / mapTiles.length);
    return average(parts);
}

export function barText(part, width = 20) {
    const filled = Math.round(part * width);
    return "[" + "#".repeat(filled) + "-".repeat(width - filled) + "] " + String(Math.floor(part * 100)).padStart(3) + "%";
}
