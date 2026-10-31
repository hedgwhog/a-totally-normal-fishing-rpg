import { fishByIsland } from "../../shared/data/fish.js";
import { findItem } from "../../shared/data/items.js";
import { tavern as numbers } from "../../shared/data/quests.js";
import { isTavernOpen, tavernLastDay } from "../../shared/rules/schedule.js";
import { lines } from "../../shared/data/dialogue.js";
import { getDay, getTime } from "../../core/time.js";
import { getFishAmount } from "../../player/fishBag.js";
import { getState, act } from "../../core/state.js";
import { say, pick, fill } from "../../core/dialogue.js";
import { openPopup } from "../../core/ui.js";
import { addText, addButton, round1, coinsText, formatNumber } from "../../core/helpers.js";

const fishList = fishByIsland.freshwaterHaven;
const page = document.getElementById("tavernItem");

const order = () => getState().tavern;
const wantedFish = () => fishList.find(type => type.id === order().fishId);

function values() {
    const last = tavernLastDay(getDay());
    return { fish: wantedFish().name, day: last, nextDay: last + 1 };
}

function showTavern() {
    const fish = wantedFish();
    page.innerHTML = "";
    addText(page, "\"" + pick(lines.chef.greeting[getTime()]) + "\"");
    addText(page, "");

    if (order().delivered) {
        addText(page, "\"" + fill(pick(lines.chef.waiting), values()) + "\"");
        return;
    }

    addText(page, "\"" + fill(pick(lines.chef.request), values()) + "\"");
    addText(page, "");
    addText(page, "Wanted: " + fish.name + " (you have " + getFishAmount(fish.id) + ")");
    addText(page, "Reward: " + coinsText(round1(fish.price * numbers.coinMultiplier)) + ", " +
        formatNumber(fish.resonance * numbers.resonanceMultiplier) + " resonance and 1 random supply");
    addButton(page, "Give the " + fish.name, giveFish);
}

async function giveFish() {
    const fish = wantedFish();
    if (getFishAmount(fish.id) === 0) return say(pick(lines.chef.missingFish), "chef", values());

    const result = await act("tavern.give");
    if (result.error) return say(result.error);
    showTavern();
    await say(pick(lines.chef.thanks), "chef", values());
    const supply = result.supply ? findItem(result.supply) : null;
    await say("You got " + coinsText(result.coins) + " and " + formatNumber(result.resonance) + " resonance!" + (supply ? "\nFrom the pantry: +1 " + supply.name : ""));
}

export const tavern = {
    button: "tavern",
    isOpen: time => isTavernOpen(time),
    open() {
        showTavern();
        openPopup("tavernDisplay");
    },
};
