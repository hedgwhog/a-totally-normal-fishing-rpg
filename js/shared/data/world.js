export const tileSize = { width: 16, height: 8 };

// the edges of the world
export const worldBounds = { minColumn: -10, maxColumn: 10, minRow: -7, maxRow: 6 };

// the id must match the island id in game.html
export const towns = {
    freshwaterHaven: { name: "Freshwater Haven", column: 0, row: 1, x: 8, y: 1 },
    pointDriftt: { name: "Point Driftt", column: 5, row: 0, x: 7, y: 3 },
};

const specialTiles = [
    { id: "fwhSouth", name: "Map piece of Freshwater Haven", island: "freshwaterHaven", source: "marketplace", price: 30,
      column: 0, row: 1, art: "ascii/map/freshwaterHaven/south.txt" },
    { id: "fwhWest", name: "Map piece of Freshwater Haven", island: "freshwaterHaven", source: "fishing", chance: 3,
      column: 0, row: 0, art: "ascii/map/freshwaterHaven/west.txt" },
    { id: "fwhEast", name: "Map piece of Freshwater Haven", island: "freshwaterHaven", source: "ritual",
      column: 1, row: 0, art: "ascii/map/freshwaterHaven/east.txt" },
    { id: "pointDriftt", name: "Point Driftt", island: "pointDriftt", source: "locker",
      column: 5, row: 0, art: "ascii/map/pointDriftt/town.txt" },
    { id: "hadalDeep", name: "The Hadal Deep", island: "hadalDeep", source: "research",
      column: 5, row: -1, art: "ascii/map/pointDriftt/hadalDeep.txt" },
];

// Everywhere else is open ocean that the pigeon can find. The art is picked by the spot, so it never changes.
const oceanArt = ["waves1", "waves2", "waves3", "waves4"].map(name => "ascii/map/ocean/" + name + ".txt");
export const fogArt = ["clouds1", "clouds2", "clouds3"].map(name => "ascii/map/fog/" + name + ".txt");

// a fixed "random" number for a spot
export function spotNumber(column, row) {
    return Math.abs((column * 73 + row * 151 + column * row * 37) % 997);
}

function oceanTile(column, row) {
    return {
        id: "sea_" + column + "_" + row,
        name: "open ocean",
        source: "bird",
        column,
        row,
        art: oceanArt[spotNumber(row, column) % oceanArt.length],
    };
}

export const mapTiles = [...specialTiles];
for (let row = worldBounds.minRow; row <= worldBounds.maxRow; row++) {
    for (let column = worldBounds.minColumn; column <= worldBounds.maxColumn; column++) {
        if (!specialTiles.some(tile => tile.column === column && tile.row === row)) mapTiles.push(oceanTile(column, row));
    }
}

export function findTile(id) {
    return mapTiles.find(tile => tile.id === id);
}

export function tileAt(column, row) {
    return mapTiles.find(tile => tile.column === column && tile.row === row);
}