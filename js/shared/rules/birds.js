import { birds } from "../data/birds.js";
import { towns, mapTiles, findTile, tileAt, worldBounds } from "../data/world.js";

export function tileDistance(from, to) {
    const distance = Math.hypot(from.column - to.column, from.row - to.row);
    return Math.max(birds.minTiles, Math.round(distance));
}

export function townOf(island) {
    return towns[island] || null;
}

export function flightMs(tiles) {
    return tiles * birds.msPerTile;
}

function knownSpots(save) {
    const spots = save.map.map(findTile).filter(Boolean);
    const town = townOf(save.island);
    if (town) spots.push(town);
    return spots;
}

// The 4 directions you can send the pigeon to. The world map is split by its 2 diagonals (corner to corner),
// so east is the part between the top right and the bottom right corner, and so on.
// A tile right on a diagonal belongs to both directions.
export const compass = ["north", "east", "south", "west"];

export function compassOf(tile) {
    const middleColumn = (worldBounds.minColumn + worldBounds.maxColumn) / 2;
    const middleRow = (worldBounds.minRow + worldBounds.maxRow) / 2;
    const halfWidth = (worldBounds.maxColumn - worldBounds.minColumn + 1) / 2;
    const halfHeight = (worldBounds.maxRow - worldBounds.minRow + 1) / 2;
    const x = (tile.column - middleColumn) / halfWidth;   // -1 (west edge) to 1 (east edge)
    const y = (tile.row - middleRow) / halfHeight;        // -1 (north edge) to 1 (south edge)
    const close = 1e-9;
    const found = [];
    if (y <= -Math.abs(x) + close) found.push("north");
    if (x >= Math.abs(y) - close) found.push("east");
    if (y >= Math.abs(x) - close) found.push("south");
    if (x <= -Math.abs(y) + close) found.push("west");
    return found;
}

// direction: "north", "east", "south" or "west". Without it, every direction counts.
export function discoverableTiles(save, direction = null) {
    const spots = knownSpots(save);
    const isNext = tile => spots.some(spot => Math.abs(spot.column - tile.column) + Math.abs(spot.row - tile.row) === 1);
    return mapTiles.filter(tile => tile.source === "bird" && !save.map.includes(tile.id) && isNext(tile)
        && (!direction || compassOf(tile).includes(direction)));
}

export function direction(from, tile) {
    const northSouth = tile.row < from.row ? "north" : tile.row > from.row ? "south" : "";
    const eastWest = tile.column > from.column ? "east" : tile.column < from.column ? "west" : "";
    return [northSouth, eastWest].filter(Boolean).join("-") || "right here";
}

export function durationText(ms) {
    if (ms < 60 * 1000) return "less than a minute";
    const minutes = Math.ceil(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return (hours > 0 ? hours + "h" : "") + (hours > 0 && rest > 0 ? " " : "") + (rest > 0 ? rest + "m" : "");
}

export { tileAt };
