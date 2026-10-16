const starterHat = { id: "oldHat", name: "Old Hat", slot: "Hat", effect: "", stats: {} }; 
const starterWaders = { id: "oldWaders", name: "Old Waders", slot: "Waders", effect: "", stats: {} }; 
const starterRod = { id: "oldRod", name: "Old Fishing Rod", slot: "Rod", effect: "", stats: {} };

let equipped = JSON.parse(localStorage.getItem("saveEquipped")) || { Hat: starterHat, Waders: starterWaders, Rod: starterRod };
let backpack = JSON.parse(localStorage.getItem("saveBackpack")) || [];

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
    for (const slot of ["Hat", "Waders", "Rod"]) {
        const item = equipped[slot];
        showArt(document.getElementById("ASCII" + slot), item);
        document.getElementById("name" + slot).textContent = item ? item.name : "";
        document.getElementById("effect" + slot).textContent = item ? item.effect : "";
    }

    inventoryItems.innerHTML = "";
    for (let n = 0; n < 4; n++) {
        const item = backpack[n];
        const box = document.createElement("div");
        box.className = "inventoryOutline";
        if (item) {
            box.innerHTML = '<pre class="ASCII"></pre><div class="name">' + item.name + '</div><div class="effect">' + item.effect + '</div>';
            showArt(box.querySelector(".ASCII"), item);
            box.addEventListener("click", () => equip(n));
        }
        inventoryItems.appendChild(box);
    }
}

function unequip(slot) {
    if (!equipped[slot]) return;
    if (backpack.length >= 4) {
        alert("Your backpack is full.");
        return;
    }
    backpack.push(equipped[slot]);
    equipped[slot] = null;
    save();
    showInventory();
}

function equip(n) {
    const item = backpack[n];
    const old = equipped[item.slot];
    equipped[item.slot] = item;
    backpack.splice(n, 1);
    if (old) backpack.push(old);
    save();
    showInventory();
}

export function hasItem(id) {
    return Object.values(equipped).some(item => item && item.id === id) || backpack.some(item => item.id === id);
}

export function addItem(item) {
    backpack = backpack.filter(owned => owned.slot !== item.slot);
    equipped[item.slot] = item;
    save();
    showInventory();
}

export function getEquipped(slot) {
    return equipped[slot];
}

// Shows the highest stat of all the available items equipped.
export function getStat(name, base) {
    let total = 0;
    let found = false;
    for (const item of Object.values(equipped)) {
        if (item && item.stats[name]) {
            total += item.stats[name];
            found = true;
        }
    }
    return found ? total : base;
}

document.getElementById("inventoryHat").addEventListener("click", () => unequip("Hat"));
document.getElementById("inventoryWaders").addEventListener("click", () => unequip("Waders"));
document.getElementById("inventoryRod").addEventListener("click", () => unequip("Rod"));

showInventory();