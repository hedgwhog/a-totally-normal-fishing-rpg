import { resonances, roman } from "../shared/data/resonances.js";
import { slots, resolveGear, equippedGear, getResonances as resonancesOf, getStat as statOf } from "../shared/rules/stats.js";
import { getState, onState, act } from "../core/state.js";
import { showArt } from "../core/ascii.js";
import { say, ask, askYesNo } from "../core/dialogue.js";

export function getEquipped(slot) {
    return equippedGear(getState(), slot);
}

export function getBackpack() {
    return getState().backpack.map(resolveGear).filter(Boolean);
}

export function getBackpackSize() {
    return getState().backpackSize;
}

export function backpackFull() {
    return getState().backpack.length >= getBackpackSize();
}

export function hasGear(id) {
    return slots.some(slot => getEquipped(slot).id === id) || getBackpack().some(gear => gear.id === id);
}

export function getResonances(item) {
    return resonancesOf(item);
}

export function resonanceText(item) {
    const list = getResonances(item);
    if (list.length === 0) return "No resonance";
    return list.map(rodResonance => resonances[rodResonance.id].name + " " + roman[rodResonance.level]).join(", ");
}

export function getStat(name, base, waters = []) {
    return statOf(getState(), name, base, waters);
}

function artPath(item) {
    return "ascii/gear/" + item.slot.toLowerCase() + "s/" + item.id + ".txt";
}

function itemPages(item) {
    const pages = [[item.name, item.effect]];
    if (item.slot === "Rod") pages.push(["Resonances:", resonanceText(item)]);
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
    box.classList.toggle("hasPages", pages.length > 1);
    showPage();
}

const backpackBox = document.getElementById("inventoryItems");
let shown = null;

function showGear() {
    const state = getState();
    const now = JSON.stringify([state.equipped, state.backpack, state.backpackSize]);
    if (now === shown) return;
    shown = now;

    for (const slot of slots) {
        const item = getEquipped(slot);
        showArt(document.getElementById("ASCII" + slot), artPath(item));
        showPages(document.getElementById("inventory" + slot), item);
    }

    const backpack = getBackpack();
    backpackBox.innerHTML = "";
    for (let slot = 0; slot < getBackpackSize(); slot++) {
        const item = backpack[slot];
        const itemBox = document.createElement("div");
        itemBox.className = "inventoryOutline";
        if (item) {
            itemBox.innerHTML = '<pre class="ASCII"></pre><div class="name"></div><div class="effect"></div>';
            showArt(itemBox.querySelector(".ASCII"), artPath(item));
            showPages(itemBox, item);
            itemBox.addEventListener("click", () => equipSlot(slot));
        }
        backpackBox.appendChild(itemBox);
    }
}

export async function equipSlot(slot) {
    if (!getState().backpack[slot]) return;
    const result = await act("gear.equip", { index: slot });
    if (result.error) await say(result.error);
}

export async function handlePendingGear() {
    while (getState().pendingGear) {
        const gear = resolveGear({ id: getState().pendingGear });
        if (!backpackFull()) {
            await act("gear.resolvePending", {});
            return;
        }
        const options = [{ label: "Equipped: ", gear: getEquipped(gear.slot), drop: "equipped" }]
            .concat(getBackpack().map((item, slot) => ({ label: "Slot " + (slot + 1) + ": ", gear: item, drop: slot })))
            .filter(option => !option.gear.bound);
        const choices = options.map(option => option.label + option.gear.name);
        const answer = await ask(
            "Your backpack is full!\nWhat do you want to drop to make room for the " + gear.name + "?\n\nDropped gear is gone for good (0 coins).",
            choices
        );
        const option = options[choices.indexOf(answer)];
        const dropped = option.gear;
        if (!await askYesNo("Drop your " + dropped.name + " for 0 coins?")) continue;

        const result = await act("gear.resolvePending", { drop: option.drop });
        if (result.error) return say(result.error);
        if (option.drop === "equipped") await say("You drop your " + dropped.name + " and put on the " + gear.name + ".");
        else await say("You drop your " + dropped.name + ". The " + gear.name + " goes into your backpack.");
    }
}

onState(showGear);
showGear();
