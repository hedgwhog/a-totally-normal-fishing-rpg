import { resonances, roman } from "./data/resonances.js";
import { items } from "./data/items.js";
import { getStat, getResonances, equippedGear } from "./rules/stats.js";
import { getState, onState } from "./state.js";
import { formatNumber } from "./helpers.js";

// The effects come from the players gear and resonances (js/rules/stats.js)

const effectsBox = document.getElementById("statsEffects");
const resonancesBox = document.getElementById("statsResonances");

// all the stats the game knows: stat, name, number format
const stats = [
    ["luck", "Luck", format => "+" + formatNumber(format)],
    ["slowBar", "Focus", format => "+" + formatNumber(format) + "%"],
    ["zoneBonus", "Hitbox", format => "+" + formatNumber(format)],
    ["rewind", "Rewind", format => "x" + formatNumber(format)],
    ["resonity", "Resonity", format => "+" + formatNumber(format)],
    ["temptation", "Temptation", format => formatNumber(Math.min(50, format)) + "%"],
];

function lines(box, list, empty) {
    box.innerHTML = "";
    for (const text of list.length ? list : [empty]) {
        const line = document.createElement("div");
        line.textContent = text;
        box.appendChild(line);
    }
}

function showStats() {
    const save = getState();
    const effects = [];
    for (const [stat, name, show] of stats) {
        const value = getStat(save, stat, 0);
        if (value) effects.push(name + " " + show(value));
    }
    // specific stats that only work under certain things:
    const abyssalLuck = getStat(save, "luck", 0, ["abyssal"]) - getStat(save, "luck", 0);
    if (abyssalLuck) effects.push("Luck +" + formatNumber(abyssalLuck) + " (abyssal)");
    
    for (const [boost, catches] of Object.entries(save.boosts)) {
        const trinket = items.find(item => item.boost === boost);
        if (catches > 0 && trinket) effects.push(trinket.name.replace(" trinket", "") + " x2 (" + catches + ")");
    }
    lines(effectsBox, effects, "None yet");

    const rod = equippedGear(save, "Rod");
    const rodResonances = getResonances(rod).map(rodResonance => resonances[rodResonance.id].name + " " + roman[rodResonance.level]);
    lines(resonancesBox, rodResonances, "None yet");
    document.getElementById("statsBox").title = "Base Effects: " + (effects.join(", ") || "none") + "\nResonance of your " + rod.name + ": " + (rodResonances.join(", ") || "none");
}

onState(showStats);
showStats();
