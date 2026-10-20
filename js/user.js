import { marketplaceItems } from "./items.js";
import { getAffinityStat } from "./affinity.js";

const starterHat = { id: "oldHat", name: "Old Hat", slot: "Hat", effect: "", stats: {}, sellValue: 2 };
const starterCloak = { id: "oldCloak", name: "Old Cloak", slot: "Cloak", effect: "", stats: {}, sellValue: 2 };
const starterRod = { id: "oldRod", name: "Old Fishing Rod (shallow)", slot: "Rod", effect: "", stats: {}, waters: ["shallow"], sellValue: 2 };
const starters = { Hat: starterHat, Cloak: starterCloak, Rod: starterRod };
const backpackSize = 4;

// stat: which stat it boosts, perLevel: how much each level adds
// chance: how often you get it in the atelier (hitbox is really rare)
export const enchants = {
    luck: { name: "Luck", stat: "luck", perLevel: 0.5, maxLevel: 10, chance: 48 },
    focus: { name: "Focus", stat: "slowBar", perLevel: 2.5, maxLevel: 10, chance: 48 },
    hitbox: { name: "Hitbox", stat: "zoneBonus", perLevel: 1, maxLevel: 3, chance: 4 },
};
export const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const allItems = [starterHat, starterCloak, starterRod, ...marketplaceItems];

// replaces a saved item with its current ID, if it is null, then it gets returned to nothing (check line 29 for that fix)
function refreshItem(savedItem) {
    if (!savedItem || !savedItem.id) return null;
    if (savedItem.enchant) savedItem.enchants = [savedItem.enchant];
    delete savedItem.enchant;
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
    equipped[slot] = refreshItem(savedEquipped[slot]) || { ...starters[slot] };
}

// Makes sure that when the backpack has items without ID (due of new updates), that they get removed
let backpack = loadSave("saveBackpack", []);
if (!Array.isArray(backpack)) backpack = [];
backpack = backpack.map(refreshItem).filter(Boolean).slice(0, backpackSize);

const inventoryItems = document.getElementById("inventoryItems");
const resonanceDisplay = document.querySelector(".resonance");

let resonance = parseInt(localStorage.getItem("saveResonance")) || 0;

function showResonance() {
    resonanceDisplay.innerHTML = "Resonance: <br>" + resonance;
}

export function getResonance() {
    return resonance;
}

export function addResonance(amount) {
    resonance += amount;
    localStorage.setItem("saveResonance", resonance);
    showResonance();
}

export function getEnchants(item) {
    return (item.enchants || []).filter(enchant => enchants[enchant.id]);
}

export function enchantName(enchant) {
    return enchants[enchant.id].name + " " + roman[enchant.level];
}

export function enchantText(item) {
    const list = getEnchants(item);
    if (list.length === 0) return "No enchant";
    return list.map(enchantName).join(", ");
}

export function setEnchants(item, list) {
    item.enchants = list;
    save();
    showInventory();
}

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

function itemPages(item) {
    const pages = [[item.name, item.effect]];
    if (item.slot === "Rod") pages.push(["Enchants:", enchantText(item)]);
    return pages;
}

function showPages(box, item) {
    const pages = item ? itemPages(item) : [["", ""]];
    let page = 0;

    function showPage() {
        box.querySelector(".name").textContent = pages[page][0];
        box.querySelector(".effect").textContent = pages[page][1];
    }

    function makeArrow(label, change) {
        const arrow = document.createElement("button");
        arrow.textContent = label;
        arrow.addEventListener("click", event => {
            event.stopPropagation();
            page = (page + change + pages.length) % pages.length;
            showPage();
        });
        return arrow;
    }

    let arrows = box.querySelector(".pageArrows");
    if (!arrows) {
        arrows = document.createElement("div");
        arrows.className = "pageArrows";
        box.appendChild(arrows);
    }
    arrows.innerHTML = "";
    if (pages.length > 1) arrows.append(makeArrow("<", -1), makeArrow(">", 1));
    showPage();
}

function showInventory() {
    for (const slot of ["Hat", "Cloak", "Rod"]) {
        const item = equipped[slot];
        showArt(document.getElementById("ASCII" + slot), item);
        showPages(document.getElementById("inventory" + slot), item);
    }

    inventoryItems.innerHTML = "";
    for (let item = 0; item < backpackSize; item++) {
        const inventoryItem = backpack[item];
        const inventoryBox = document.createElement("div");
        inventoryBox.className = "inventoryOutline";
        if (inventoryItem) {
            inventoryBox.innerHTML = '<pre class="ASCII"></pre><div class="name"></div><div class="effect"></div>';
            showArt(inventoryBox.querySelector(".ASCII"), inventoryItem);
            showPages(inventoryBox, inventoryItem);
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
    backpack.push({ ...item });
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
        if (item) {
            for (const enchant of getEnchants(item)) {
                if (enchants[enchant.id].stat === name) {
                    statStat += enchants[enchant.id].perLevel * enchant.level;
                    statFound = true;
                }
            }
        }
    }
    const affinityStat = getAffinityStat(name);
    if (affinityStat) {
        statStat += affinityStat;
        statFound = true;
    }
    return statFound ? statStat : base;
}

save();
showInventory();
showResonance();