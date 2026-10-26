import { fishByIsland } from "../../data/fish.js";
import { items } from "../../data/items.js";
import { lines } from "../../data/dialogue.js";
import { getDay, getTime } from "../../time.js";
import { getFishAmount, removeFish } from "../../fishBag.js";
import { addItems } from "../../itemBag.js";
import { addCoins } from "../../wallet.js";
import { addResonance } from "../../resonance.js";
import { say, pick, fill } from "../../dialogue.js";
import { openPopup } from "../../ui.js";
import { loadObject, save } from "../../save.js";
import { addText, addButton, round1, coinsText, formatNumber } from "../../helpers.js";

const orderDays = 3;
const coinMultiplier = 1.5;
const resonanceMultiplier = 2;
const fishList = fishByIsland.freshwaterHaven;
const supplies = items.filter(item => item.category === "Supplies");

let order = { period: null, fishId: null, delivered: false, ...loadObject("saveTavern") };

function currentPeriod() {
    return Math.floor((getDay() - 1) / orderDays);
}

// the last day of this order, and the first day of the next one
function lastDay() {
    return (currentPeriod() + 1) * orderDays;
}

// a new order every period
function checkOrder() {
    const fishExists = fishList.some(type => type.id === order.fishId);
    if (order.period === currentPeriod() && fishExists) return;
    order = { period: currentPeriod(), fishId: pick(fishList).id, delivered: false };
    save("saveTavern", order);
}

function wantedFish() {
    return fishList.find(type => type.id === order.fishId);
}

function reward(fish) {
    return { coins: round1(fish.price * coinMultiplier), resonance: round1(fish.resonance * resonanceMultiplier) };
}

const page = document.getElementById("tavernItem");

function showTavern() {
    checkOrder();
    const fish = wantedFish();
    const values = { fish: fish.name, day: lastDay(), nextDay: lastDay() + 1 };
    page.innerHTML = "";
    addText(page, "\"" + pick(lines.chef.greeting[getTime()]) + "\"");
    addText(page, "");

    if (order.delivered) {
        addText(page, "\"" + fill(pick(lines.chef.waiting), values) + "\"");
        return;
    }

    const pay = reward(fish);
    addText(page, "\"" + fill(pick(lines.chef.request), values) + "\"");
    addText(page, "");
    addText(page, "Wanted: " + fish.name + " (you have " + getFishAmount(fish.id) + ")");
    addText(page, "Reward: " + coinsText(pay.coins) + ", " + formatNumber(pay.resonance) + " resonance and 1 random supply");
    addButton(page, "Give the " + fish.name, giveFish);
}

async function giveFish() {
    checkOrder();
    const fish = wantedFish();
    const values = { fish: fish.name, day: lastDay(), nextDay: lastDay() + 1 };

    if (getFishAmount(fish.id) === 0) {
        await say(pick(lines.chef.missingFish), "chef", values);
        return;
    }

    const pay = reward(fish);
    const supply = pick(supplies);
    removeFish(fish.id, 1);
    addCoins(pay.coins);
    addResonance(pay.resonance);
    if (supply) addItems(supply.id, 1);
    order.delivered = true;
    save("saveTavern", order);
    showTavern();

    await say(pick(lines.chef.thanks), "chef", values);
    await say("You got " + coinsText(pay.coins) + " and " + formatNumber(pay.resonance) + " resonance!" + (supply ? "\nFrom the pantry: +1 " + supply.name : ""));
}

export const tavern = {
    button: "tavern",
    isOpen: time => time !== "morning", // closed in the morning
    open() {
        showTavern();
        openPopup("tavernDisplay");
    },
};
