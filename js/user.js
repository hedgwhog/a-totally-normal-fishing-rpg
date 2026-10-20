import { marketplaceItems } from "./items.js";
import { getAffinityStat } from "./affinity.js";

const starterHat = { id: "oldHat", name: "Old Hat", slot: "Hat", effect: "", stats: {}, sellValue: 2 };
const starterCloak = { id: "oldCloak", name: "Old Cloak", slot: "Cloak", effect: "", stats: {}, sellValue: 2 };
const starterRod = { id: "oldRod", name: "Old Fishing Rod (shallow)", slot: "Rod", effect: "", stats: {}, waters: ["shallow"], sellValue: 2 };
const starters = { Hat: starterHat, Cloak: starterCloak, Rod: starterRod };
const backpackSize = 4;

const allItems = [starterHat, starterCloak, starterRod, ...marketplaceItems];

// replaces a saved item with its current ID, if it is null, then it gets returned to nothing (check line 29 for that fix)
function refreshItem(savedItem) {
    if (!savedItem || !savedItem.id) return null;
    const current = allItems.find(item => item.id === savedItem.id);
    return current ? { ...savedItem, ...current } : null;
}

// Makes sure that you don't crash
function loadSave(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

// if an item is missing in your inventory, you automatically get your starter item
let savedEquipped = loadSave("saveEquipped", {});
if (typeof savedEquipped !== "object" || Array.isArray(savedEquipped)) savedEquipped = {};
let equipped = {};
for (const slot of ["Hat", "Cloak", "Rod"]) {
    equipped[slot] = refreshItem(savedEquipped[slot]) || starters[slot];
}

// Makes sure that when the backpack has items without ID (due of new updates), that they get removed
let backpack = loadSave("saveBackpack", []);
if (!Array.isArray(backpack)) backpack = [];
backpack = backpack.map(refreshItem).filter(Boolean).slice(0, backpackSize);

const inventoryItems = document.getElementById("inventoryItems");

function save() {
    localStorage.setItem("saveEquipped", JSON.stringify(equipped));
    localStorage.setItem("saveBackpack", JSON.stringify(backpack));
    document.dispatchEvent(new Event("inventoryChanged"));
}

// Loads the art from ascii/<item id>.txt
async function showArt(element, item) {
    if (!item) {
        element.textContent = "";
        return;
    }
    const response = await fetch("ascii/" + item.id + ".txt");
    element.textContent = await response.text();
}

function showInventory() {
    for (const slot of ["Hat", "Cloak", "Rod"]) {
        const item = equipped[slot];
        showArt(document.getElementById("ASCII" + slot), item);
        document.getElementById("name" + slot).textContent = item ? item.name : "";
        document.getElementById("effect" + slot).textContent = item ? item.effect : "";
    }

    inventoryItems.innerHTML = "";
    for (let item = 0; item < backpackSize; item++) {
        const inventoryItem = backpack[item];
        const inventoryBox = document.createElement("div");
        inventoryBox.className = "inventoryOutline";
        if (inventoryItem) {
            inventoryBox.innerHTML = '<pre class="ASCII"></pre><div class="name">' + inventoryItem.name + '</div><div class="effect">' + inventoryItem.effect + '</div>';
            showArt(inventoryBox.querySelector(".ASCII"), inventoryItem);
            inventoryBox.addEventListener("click", () => equip(item));
        }
        inventoryItems.appendChild(inventoryBox);
    }
}

function equip(item) {
    const equipItem = backpack[item];
    const oldItem = equipped[equipItem.slot];
    equipped[equipItem.slot] = equipItem;
    backpack.splice(item, 1);
    if (oldItem) backpack.push(oldItem);
    save();
    showInventory();
}

export function hasItem(id) {
    return Object.values(equipped).some(item => item && item.id === id) || backpack.some(item => item.id === id);
}

export function backpackFull() {
    return backpack.length >= backpackSize;
}

export function addItem(item) {
    backpack.push(item);
    save();
    showInventory();
}

export function getBackpack() {
    return backpack;
}

export function removeItem(id) {
    const index = backpack.findIndex(item => item.id === id);
    if (index === -1) return null;
    const [removed] = backpack.splice(index, 1);
    save();
    showInventory();
    return removed;
}

export function getEquipped(slot) {
    return equipped[slot];
}

export function getStat(name, base) {
    let statStat = 0;
    let statFound = false;
    for (const item of Object.values(equipped)) {
        if (item && item.stats[name]) {
            statStat += item.stats[name];
            statFound = true;
        }
    }
    // your affinity gives stats too
    const affinityStat = getAffinityStat(name);
    if (affinityStat) {
        statStat += affinityStat;
        statFound = true;
    }
    return statFound ? statStat : base;
}

save();
showInventory();