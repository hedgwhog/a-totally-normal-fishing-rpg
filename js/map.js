import { mapPieces, gridSize } from "./data/mapPieces.js";
import { loadList, save } from "./save.js";
import { showArt } from "./ascii.js";
import { openPopup } from "./ui.js";

let found = loadList("saveMap")
    .map(id => id)
    .filter(id => mapPieces.some(piece => piece.id === id));
save("saveMap", found);

const slot = document.getElementById("inventoryMap");
const slotArt = document.getElementById("ASCIIMap");
const slotName = document.getElementById("nameMap");
const slotEffect = document.getElementById("effectMap");
const mapBox = document.getElementById("mapPaper");

export function hasMapPiece(id) {
    return found.includes(id);
}

// a piece goes straight into your map
export function addMapPiece(id) {
    if (hasMapPiece(id)) return;
    found.push(id);
    save("saveMap", found);
    showMap();
}

// the pieces you can still get in a certain way, like getMissingPieces("fishing", "freshwaterHaven")
export function getMissingPieces(source, island) {
    return mapPieces.filter(piece => piece.source === source && piece.island === island && !hasMapPiece(piece.id));
}

// Building the map
const half = gridSize / 2;

function coordinate(n, negative, positive) {
    if (n === 0) return "0";
    return Math.abs(n) + (n < 0 ? negative : positive);
}

function addLabel(className, text, column, row) {
    const label = document.createElement("div");
    label.className = className;
    label.textContent = text;
    label.style.setProperty("--column", column);
    label.style.setProperty("--row", row);
    mapBox.appendChild(label);
}

function buildMap() {
    mapBox.innerHTML = "";
    mapBox.style.setProperty("--size", gridSize);

    for (let n = 0; n <= gridSize; n++) {
        addLabel("mapCoordinate mapTop", coordinate(n - half, "W", "E"), n, 0);
        addLabel("mapCoordinate mapLeft", coordinate(n - half, "N", "S"), 0, n);
    }

    const grid = document.createElement("div");
    grid.id = "mapGrid";
    for (let row = -half; row < half; row++) {
        for (let column = -half; column < half; column++) {
            const square = document.createElement("div");
            square.className = "mapSquare";
            square.dataset.square = column + "," + row;
            grid.appendChild(square);
        }
    }
    mapBox.appendChild(grid);
}

function showMap() {
    showArt(slotArt, "ascii/map/icon.txt");
    slotName.textContent = "World map";
    slotEffect.textContent = found.length + (found.length === 1 ? " piece" : " pieces");

    document.querySelectorAll(".mapSquare").forEach(square => square.innerHTML = "");
    for (const piece of mapPieces) {
        if (!hasMapPiece(piece.id)) continue;
        const square = document.querySelector('.mapSquare[data-square="' + piece.column + "," + piece.row + '"]');
        if (!square) continue; 

        const art = document.createElement("pre");
        art.className = "mapPiece";
        showArt(art, piece.art);
        square.appendChild(art);

        for (const label of piece.labels || []) {
            const name = document.createElement("div");
            name.className = "mapName";
            name.textContent = label.text;
            name.style.setProperty("--x", label.x);
            name.style.setProperty("--y", label.y);
            square.appendChild(name);
        }
    }

    document.getElementById("mapEmpty").style.display = found.length === 0 ? "block" : "none";
}

slot.addEventListener("click", () => {
    if (document.getElementById("nextFish").disabled) return;
    openPopup("mapDisplay");
});

buildMap();
showMap();
