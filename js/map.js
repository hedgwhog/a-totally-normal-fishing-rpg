import { mapTiles, worldBounds, tileSize, towns, fogArt, spotNumber, tileAt } from "./data/world.js";
import { getState, onState } from "./state.js";
import { openPopup } from "./ui.js";
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
    status.textContent = text;
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
