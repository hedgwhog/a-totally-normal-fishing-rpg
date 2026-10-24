import { items, itemCategories } from "./data/items.js";
import { loadObject, save } from "./save.js";
import { addResonance } from "./resonance.js";

let bag = loadObject("saveItems");
let boosts = loadObject("saveBoosts");

const bagBox = document.getElementById("itemBag");

function saveBag() {
    save("saveItems", bag);
    save("saveBoosts", boosts);
    showBag();
}

export function getItemAmount(id) {
    return bag[id] || 0;
}

export function addItems(id, amount = 1) {
    bag[id] = getItemAmount(id) + amount;
    saveBag();
}

// returns false if you don't have enough
export function removeItems(id, amount = 1) {
    if (getItemAmount(id) < amount) return false;
    bag[id] -= amount;
    saveBag();
    return true;
}

// Boosts
export function boostMultiplier(boost) {
    return (boosts[boost] > 0) ? 2 : 1;
}

// every active boost loses 1 catch
export function useBoostCatch() {
    for (const boost of Object.keys(boosts)) {
        if (boosts[boost] > 0) boosts[boost]--;
    }
    saveBag();
}

function useItem(item) {
    if (!removeItems(item.id)) return;
    if (item.boost) boosts[item.boost] = (boosts[item.boost] || 0) + item.catches;
    if (item.resonance) addResonance(item.resonance);
    saveBag();
}

function canUse(item) {
    return Boolean(item.boost || item.resonance);
}

// Showing the list
function addLine(text) {
    const line = document.createElement("div");
    line.textContent = text;
    bagBox.appendChild(line);
}

function showBag() {
    bagBox.innerHTML = "";

    for (const category of itemCategories) {
        const owned = items.filter(item => item.category === category && getItemAmount(item.id) > 0);
        if (owned.length === 0) continue;

        const title = document.createElement("div");
        title.className = "bagCategory";
        title.textContent = category;
        bagBox.appendChild(title);

        for (const item of owned) {
            if (canUse(item)) {
                const button = document.createElement("button");
                button.textContent = "Use: " + item.name + " (" + getItemAmount(item.id) + ")";
                button.addEventListener("click", () => useItem(item));
                bagBox.appendChild(button);
            } else {
                addLine(item.name + ": " + getItemAmount(item.id));
            }
        }
    }

    for (const boost of Object.keys(boosts)) {
        if (boosts[boost] > 0 && items.some(item => item.boost === boost)) {
            addLine(boost + " x2: " + boosts[boost] + " catches left");
        }
    }
}


showBag();
