export const tileSize = { width: 16, height: 8 };

// the edges of the world
export const worldBounds = { minColumn: -10, maxColumn: 10, minRow: -7, maxRow: 12 };

// the id must match the island id in game.html
// x, y: the spot of the town in its tile (the name label goes right of it)
// dock (optional): where the ferry docks and leaves from, counted from the same tile (it may go past the tile's edge).
//                  Without it, the ferry docks just outside the town spot. Keep it off the name label.
export const towns = {
    freshwaterHaven: { name: "Freshwater Haven", column: 0, row: 1, x: 8, y: 1, dock: { x: 19, y: 0 } },
    pointDriftt: { name: "Point Driftt", column: 5, row: 0, x: 7, y: 3 },
    // the Pantry Isles
    capital: { name: "The Capital", column: 1, row: 6, x: 14, y: 4, dock: { x: 3, y: 0 } },
    heathland: { name: "Heathland", column: -1, row: 4, x: 6, y: 7 },
    tableland: { name: "Tableland", column: 4, row: 5, x: 4, y: 6 },
    mangal: { name: "Mangal", column: 1, row: 8, x: 8, y: 7 },
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
    ...pantryTiles(),
];

// The Pantry Isles. Every island is a block of tiles (the art is in ascii/map/pantryIsles/<island>_<x>_<y>.txt).
// source: "nikki" = Nikki gives it, "islandQuest" = the island's fish quest, "restaurant" = a restaurant quest
//         (data/areas/pantryIsles.js says which one), "fishing" = a chance (%) to fish it up on that island.
function pantryTiles() {
    const islands = [
        // island, left column, top row, width, height, { "x_y": source } (every other tile: fishing)
        ["capital", 1, 6, 1, 1, { "0_0": "nikki" }],
        ["heathland", -2, 4, 2, 2, { "1_0": "islandQuest", "0_1": "restaurant" }],
        ["tableland", 3, 5, 3, 2, { "1_0": "islandQuest", "0_0": "restaurant", "2_1": "restaurant" }],
        ["mangal", 0, 8, 3, 3, { "1_0": "islandQuest", "1_1": "restaurant", "0_1": "restaurant" }],
    ];
    const names = { capital: "The Capital", heathland: "Heathland", tableland: "Tableland", mangal: "Mangal" };
    const tiles = [];
    for (const [island, left, top, width, height, sources] of islands) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const spot = x + "_" + y;
                const source = sources[spot] || "fishing";
                tiles.push({
                    id: island + "_" + spot,
                    name: island === "capital" ? "Map of The Capital" : "Map piece of " + names[island],
                    island, source,
                    ...(source === "fishing" ? { chance: 2 } : {}),
                    column: left + x, row: top + y,
                    art: "ascii/map/pantryIsles/" + island + "_" + spot + ".txt",
                });
            }
        }
    }
    return tiles;
}

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