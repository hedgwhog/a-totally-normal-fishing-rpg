import { items, itemCategories } from "./data/items.js";
import { getState, onState, act } from "./state.js";
import { say } from "./dialogue.js";
import { shortNumber } from "./helpers.js";

const bagBox = document.getElementById("itemBag");
const itemTab = document.getElementById("itemAmount");

export function getItemAmount(id) {
    return getState().items[id] || 0;
}

export function boostMultiplier(boost) {
    if (getState().boosts[boost] > 0) return 2;
    return 1;
}

async function useItem(item) {
    const result = await act("item.use", { id: item.id });
    if (result.error) await say(result.error);
}

function canUse(item) {
    return Boolean(item.boost || item.resonance);
}

function showInfo(item) {
    say(item.name + "\n\n" + (item.info || "Nobody knows what this does."));
}

function addLine(text) {
    const line = document.createElement("div");
    line.className = "itemNote";
    line.textContent = text;
    bagBox.appendChild(line);
}

function addItemRow(item) {
    const row = document.createElement("div");
    row.className = "itemRow";

    const info = document.createElement("button");
    info.className = "infoButton";
    info.textContent = "i";
    info.title = "What does it do?";
    info.addEventListener("click", () => showInfo(item));
    row.appendChild(info);

    const amount = shortNumber(getItemAmount(item.id));
    if (canUse(item)) {
        const use = document.createElement("button");
        use.textContent = "Use: " + item.name + " (" + amount + ")";
        use.addEventListener("click", () => useItem(item));
        row.appendChild(use);
    } else {
        const name = document.createElement("span");
        name.textContent = item.name + ": " + amount;
        row.appendChild(name);
    }
    bagBox.appendChild(row);
}

function showBag() {
    bagBox.innerHTML = "";
    let total = 0;
    for (const amount of Object.values(getState().items)) total += Math.max(0, amount);
    itemTab.textContent = "Items (" + shortNumber(total) + ")";
    itemTab.title = total + " items";

    if (total === 0) {
        const empty = document.createElement("p");
        empty.className = "bagEmpty";
        empty.textContent = "No items yet. Trinkets, bottles and supplies show up here.";
        bagBox.appendChild(empty);
    }

    for (const category of itemCategories) {
        const owned = items.filter(item => item.category === category && getItemAmount(item.id) > 0);
        const boostLines = [];
        if (category === "Trinkets") boostLines.push(...activeTrinketLines());
        if (owned.length === 0 && boostLines.length === 0) continue;

        const title = document.createElement("div");
        title.className = "bagCategory";
        title.textContent = category;
        bagBox.appendChild(title);

        owned.forEach(addItemRow);
        boostLines.forEach(addLine);
    }
}

function activeTrinketLines() {
    const lines = [];
    const boosts = getState().boosts;
    for (const boost of Object.keys(boosts)) {
        const trinket = items.find(item => item.boost === boost);
        if (boosts[boost] > 0 && trinket) lines.push(trinket.name + ": " + boosts[boost] + " catches left");
    }
    return lines;
}

onState(showBag);
showBag();
