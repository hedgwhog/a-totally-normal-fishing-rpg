import { mapPieces, gridSize } from "./data/mapPieces.js";
import { loadList, save } from "./save.js";
import { showArt } from "./ascii.js";
import { openPopup } from "./ui.js";

let found = loadList("saveMap").filter(id => mapPieces.some(piece => piece.id === id));
save("saveMap", found);

const slot = document.getElementById("inventoryMap");
const slotArt = document.getElementById("ASCIIMap");
const slotName = document.getElementById("nameMap");
const slotEffect = document.getElementById("effectMap");
const mapBox = document.getElementById("mapPaper");

export function hasMapPiece(id) {
    return found.includes(id);
}

export function addMapPiece(id) {
    if (hasMapPiece(id)) return;
    found.push(id);
    save("saveMap", found);
    showMap();
}

export function getMissingPieces(source, island) {
    return mapPieces.filter(piece => piece.source === source && piece.island === island && !hasMapPiece(piece.id));
}

const half = gridSize / 2;

function coordinate(n, negative, positive) {
    if (n === 0) return "0";
    return Math.abs(n) + (n < 0 ? negative : positive);
}

function addToMap(className, text = "", column = 0, row = 0) {
    const element = document.createElement("div");
    element.className = className;
    element.textContent = text;
    element.style.setProperty("--column", column);
    element.style.setProperty("--row", row);
    mapBox.appendChild(element);
    return element;
}

function buildMap() {
    mapBox.innerHTML = "";
    mapBox.style.setProperty("--size", gridSize);
    mapBox.style.setProperty("--half", half);

    addToMap("mapAxis mapAxisX");
    addToMap("mapAxis mapAxisY");
    addToMap("mapCompass mapCompassN", "N");
    addToMap("mapCompass mapCompassE", "E");
    addToMap("mapCompass mapCompassS", "S");
    addToMap("mapCompass mapCompassW", "W");

    for (let n = 0; n <= gridSize; n++) {
        const value = n - half;
        if (value === 0) continue;

        const tickX = addToMap("mapTick mapTickX " + (value < 0 ? "mapTickWest" : "mapTickEast"), coordinate(value, "W", "E"), n, 0);
        tickX.dataset.covers = (value < 0 ? value : value - 1) + ",0";

        const tickY = addToMap("mapTick mapTickY " + (value < 0 ? "mapTickNorth" : "mapTickSouth"), coordinate(value, "N", "S"), 0, n);
        tickY.dataset.covers = "-1," + (value < 0 ? value : value - 1);
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

    const foundSquares = mapPieces.filter(piece => hasMapPiece(piece.id)).map(piece => piece.column + "," + piece.row);
    document.querySelectorAll(".mapTick").forEach(tick => {
                const covered = tick.dataset.covers.split(" ").some(square => foundSquares.includes(square));
        tick.style.display = covered ? "none" : "block";
    });

    document.getElementById("mapEmpty").style.display = found.length === 0 ? "block" : "none";
}

slot.addEventListener("click", () => {
    if (document.getElementById("nextFish").disabled) return;
    openPopup("mapDisplay");
});

buildMap();
showMap();