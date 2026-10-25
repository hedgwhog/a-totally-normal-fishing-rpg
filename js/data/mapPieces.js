// the middle of the map is 0, 0
// Column, which square it is west to east
// Row: which square it is north to south
// art: which file for the map it is
// label: if some text need sto be shown with the exact coordinates
// source: where to get it

export const gridSize = 8; // the map is 8 x 8

export const mapPieces = [
  { id: "fwhNorthWest", island: "freshwaterHaven", name: "Map piece of Freshwater Haven", source: "marketplace", price: 30,
    column: -3, row: -3, art: "ascii/map/freshwaterHaven/southwest.txt", 
    labels: [{ text: "Freshwater Haven", x: 9, y: 1 }] },

  { id: "fwhSouthWest", island: "freshwaterHaven", name: "Map piece of Freshwater Haven", source: "fishing", chance: 3,
    column: -2, row: -3, art: "ascii/map/freshwaterHaven/northwest.txt" },

  { id: "fwhNorthEast", island: "freshwaterHaven", name: "Map piece of Freshwater Haven", source: "ritual",
    column: -3, row: -2, art: "ascii/map/freshwaterHaven/northeast.txt"},
];

