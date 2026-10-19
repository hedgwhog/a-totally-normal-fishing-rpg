const starterHat = { id: "oldHat", name: "Old Hat", slot: "Hat", effect: "", stats: {} };
const starterCloak = { id: "oldCloak", name: "Old Cloak", slot: "Cloak", effect: "", stats: {} };
const starterRod = { id: "oldRod", name: "Old Fishing Rod (shallow)", slot: "Rod", effect: "", stats: {}, waters: ["shallow"]};
const backpackSize = 4;

let equipped = JSON.parse(localStorage.getItem("saveEquipped")) || { Hat: starterHat, Cloak: starterCloak, Rod: starterRod };
let backpack = JSON.parse(localStorage.getItem("saveBackpack")) || [];

equipped.Hat = equipped.Hat || starterHat;
equipped.Cloak = equipped.Cloak || starterCloak;
equipped.Rod = equipped.Rod || starterRod;

const inventoryItems = document.getElementById("inventoryItems");

function save() {
    localStorage.setItem("saveEquipped", JSON.stringify(equipped));
    localStorage.setItem("saveBackpack", JSON.stringify(backpack));
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
    return statFound ? statStat : base;
}

showInventory();