import { starterGear, allGear } from "./data/gear.js";
import { enchants, roman } from "./data/enchants.js";
import { loadObject, loadList, save } from "./save.js";
import { showArt } from "./ascii.js";
import { say, ask, askYesNo } from "./dialogue.js";

const slots = ["Hat", "Cloak", "Rod"]; // the equipped slots, in order. Each one has an "inventory<Slot>" box in game.html
const startSlots = 2; // backpack slots for a new player

function refreshItem(savedItem) {
    if (!savedItem || !savedItem.id) return null;
    if (savedItem.enchant) savedItem.enchants = [savedItem.enchant];
    delete savedItem.enchant;
    const current = allGear.find(item => item.id === savedItem.id);
    return current ? { ...savedItem, ...current } : savedItem;
}

const savedEquipped = loadObject("saveEquipped");
const equipped = {};
for (const slot of slots) {
    equipped[slot] = refreshItem(savedEquipped[slot]) || { ...starterGear[slot] };
}

let backpack = loadList("saveBackpack").map(refreshItem).filter(Boolean);
let backpackSize = Math.max(startSlots, parseInt(localStorage.getItem("saveBackpackSize")) || 0, backpack.length);

function saveGear() {
    save("saveEquipped", equipped);
    save("saveBackpack", backpack);
    save("saveBackpackSize", backpackSize);
    document.dispatchEvent(new Event("inventoryChanged"));
}

// Enchants
export function getEnchants(item) {
    return (item.enchants || []).filter(enchant => enchants[enchant.id]);
}

export function enchantText(item) {
    const list = getEnchants(item);
    if (list.length === 0) return "No enchant";
    return list.map(enchant => enchants[enchant.id].name + " " + roman[enchant.level]).join(", ");
}

export function setEnchants(item, list) {
    item.enchants = list;
    saveGear();
    showGear();
}

// Showing the gear
function artPath(item) {
    return "ascii/gear/" + item.slot.toLowerCase() + "s/" + item.id + ".txt";
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

const backpackBox = document.getElementById("inventoryItems");

function showGear() {
    for (const slot of slots) {
        const item = equipped[slot];
        showArt(document.getElementById("ASCII" + slot), item ? artPath(item) : null);
        showPages(document.getElementById("inventory" + slot), item);
    }

    backpackBox.innerHTML = "";
    for (let n = 0; n < backpackSize; n++) {
        const item = backpack[n];
        const itemBox = document.createElement("div");
        itemBox.className = "inventoryOutline";
        if (item) {
            itemBox.innerHTML = '<pre class="ASCII"></pre><div class="name"></div><div class="effect"></div>';
            showArt(itemBox.querySelector(".ASCII"), artPath(item));
            showPages(itemBox, item);
            itemBox.addEventListener("click", () => equip(n));
        }
        backpackBox.appendChild(itemBox);
    }
}

function equip(n) {
    const item = backpack[n];
    const oldItem = equipped[item.slot];
    equipped[item.slot] = item;
    backpack.splice(n, 1);
    if (oldItem) backpack.push(oldItem);
    saveGear();
    showGear();
}

export function getEquipped(slot) {
    return equipped[slot];
}

export function getBackpack() {
    return backpack;
}

export function hasGear(id) {
    return Object.values(equipped).some(item => item && item.id === id) || backpack.some(item => item.id === id);
}

export function backpackFull() {
    return backpack.length >= backpackSize;
}

export function getBackpackSize() {
    return backpackSize;
}

export function setBackpackSize(slots) {
    backpackSize = slots;
    saveGear();
    showGear();
}

export async function giveGear(item) {
    if (!backpackFull()) {
        addGear(item);
        return;
    }

    while (true) {
        const equippedItem = equipped[item.slot];
        const choices = ["Equipped: " + equippedItem.name, ...backpack.map((gear, n) => "Slot " + (n + 1) + ": " + gear.name)];
        const answer = await ask(
            "Your backpack is full!\nWhat do you want to drop to make room for the " + item.name + "?\n\nDropped gear is gone for good (0 coins).",
            choices
        );
        const index = choices.indexOf(answer);
        const dropped = (index === 0) ? equippedItem : backpack[index - 1];
        if (!await askYesNo("Drop your " + dropped.name + " for 0 coins?")) continue;

        if (index === 0) {
            equipped[item.slot] = { ...item }; 
            await say("You drop your " + dropped.name + " and put on the " + item.name + ".");
        } else {
            backpack[index - 1] = { ...item };
            await say("You drop your " + dropped.name + ". The " + item.name + " goes into your backpack.");
        }
        saveGear();
        showGear();
        return;
    }
}

export function addGear(item) {
    backpack.push({ ...item });
    saveGear();
    showGear();
}

export function removeGear(id) {
    const index = backpack.findIndex(item => item.id === id);
    if (index === -1) return null;
    const [removed] = backpack.splice(index, 1);
    saveGear();
    showGear();
    return removed;
}

export function getStat(name, base, waters = []) {
    let total = 0;
    let found = false;

    function add(amount) {
        if (!amount) return;
        total += amount;
        found = true;
    }

    for (const item of Object.values(equipped)) {
        if (!item) continue;
        add(item.stats && item.stats[name]);
        for (const water of waters) {
            add(item.waterStats && item.waterStats[water] && item.waterStats[water][name]);
        }
        for (const enchant of getEnchants(item)) {
            if (enchants[enchant.id].stat === name) add(enchants[enchant.id].perLevel * enchant.level);
        }
    }
    return found ? total : base;
}

saveGear();
showGear();
