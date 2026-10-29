import { birds } from "../data/birds.js";
import { towns, mapTiles, findTile, tileAt } from "../data/world.js";

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

export function discoverableTiles(save) {
    const spots = knownSpots(save);
    const isNext = tile => spots.some(spot => Math.abs(spot.column - tile.column) + Math.abs(spot.row - tile.row) === 1);
    return mapTiles.filter(tile => tile.source === "bird" && !save.map.includes(tile.id) && isNext(tile));
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
