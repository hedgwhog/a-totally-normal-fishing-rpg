import { fishByIsland, fishTimes } from "./data/fish.js";
import { items } from "./data/items.js";
import { getTime, nextTime, nextDay } from "./time.js";
import { getIsland } from "./islands.js";
import { getEquipped, getStat } from "./gear.js";
import { startFishing } from "./fishing.js";
import { addFish } from "./fishBag.js";
import { addItems, boostMultiplier, useBoostCatch } from "./itemBag.js";
import { addMapPiece, getMissingPieces } from "./map.js";
import { addResonance } from "./resonance.js";
import { logCatch } from "./fishLog.js";
import { say } from "./dialogue.js";
import { closeAllPopups } from "./ui.js";
import { round1, formatNumber } from "./helpers.js";

// Fishing
// Picks a random fish. Every fish has a weight: a bigger weight = more likely.
// Luck makes rarer fish (rarity above 0) heavier: weight = chance * (1 + luck * rarity).
// A Luck trinket doubles the weight of every rare fish, so they really show up about 2x as often,
// even if you have no luck at all. (Before, it doubled your luck stat, which did nothing with 0 luck.)
function pickFish(canCatch, waters) {
    const luck = getStat("luck", 0, waters);
    const trinket = boostMultiplier("luck");
    const weights = canCatch.map(type => {
        const weight = type.chance * (1 + luck * type.rarity);
        return Math.max(0, type.rarity > 0 ? weight * trinket : weight);
    });
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let n = 0; n < canCatch.length; n++) {
        roll -= weights[n];
        if (roll < 0) return canCatch[n];
    }
    return canCatch[canCatch.length - 1];
}

// explains why there's nothing to catch right now
function nothingToCatch(rod, fishHere, reachable) {
    if (fishHere.length === 0) {
        return say("The water here is strangely quiet. Nothing bites yet.");
    }
    if (getTime() === "night") {
        return say("It's pitch dark. Your " + rod.name + " can't catch anything at night.\n\nYou should go to sleep.");
    }
    if (reachable.length > 0) {
        return say("Nothing bites on your " + rod.name + " right now.");
    }
    return say("Your " + rod.name + " can't catch anything here.");
}

function catchRewards(type) {
    const lines = [];

    // the fish's resonance (x2 with a Resonance trinket), plus 0.1 per level of the Resonity enchant
    const resonance = round1(type.resonance * boostMultiplier("resonance") + getStat("resonity", 0));
    addResonance(resonance);
    lines.push("+" + formatNumber(resonance) + " Resonance");
    useBoostCatch();

    for (const item of items) {
        if (item.fishChance && Math.random() * 100 < item.fishChance) {
            addItems(item.id);
            lines.push("Something else was on your hook: a " + item.name + "!");
        }
    }

    for (const piece of getMissingPieces("fishing", getIsland())) {
        if (Math.random() * 100 < piece.chance) {
            addMapPiece(piece.id);
            lines.push("You got a piece of a map!\nIt goes straight into your world map.");
        }
    }
    return lines;
}

async function goFishing() {
    const rod = getEquipped("Rod");
    const waters = rod.waters || [];
    const fishHere = fishByIsland[getIsland()] || [];
    const reachable = fishHere.filter(type => type.waters.some(water => waters.includes(water)));
    const canCatch = reachable.filter(type => fishTimes(type).includes(getTime()));

    if (canCatch.length === 0) {
        await nothingToCatch(rod, fishHere, reachable);
        return;
    }

    const type = pickFish(canCatch, waters);
    const caught = await startFishing(type);

    if (caught) {
        addFish(type.id);
        const lines = catchRewards(type);
        if (logCatch(type.id)) lines.push("New species! The " + type.name + " was added to your catalogue.");
        await say("You caught a " + type.name + "!\n\n" + lines.join("\n"));
    } else {
        await say("The fish got away...");
    }
    nextTime();
}

// Sleeping & resting
async function sleep() {
    closeAllPopups();
    if (getTime() === "evening" || getTime() === "night") {
        nextDay();
    } else {
        await say("You can't sleep during the day, get back to work.");
    }
}

async function rest() {
    closeAllPopups();
    if (getTime() === "night") {
        await say("It's night. Resting won't help, you should go to sleep.");
        return;
    }
    nextTime();
}

document.getElementById("nextFish").addEventListener("click", goFishing);
document.getElementById("nextDay").addEventListener("click", sleep);
document.getElementById("rest").addEventListener("click", rest);
