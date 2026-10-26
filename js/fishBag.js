import { allFish } from "./data/fish.js";
import { addCoins } from "./wallet.js";
import { ask, say, pick } from "./dialogue.js";
import { lines } from "./data/dialogue.js";
import { round1, coinsText } from "./helpers.js";
import { loadObject, save } from "./save.js";

const savedFish = loadObject("saveFish");
let fish = {};
for (const type of allFish) {
    const amount = parseInt(savedFish[type.id]);
    if (amount > 0) fish[type.id] = amount;
}

let selected = {}; // how many of each fish you want to sell

const fishAmount = document.getElementById("fishAmount");
const fishTypes = document.getElementById("fishTypes");

function saveFish() {
    save("saveFish", fish);
    showFish();
}

export function totalFish() {
    return Object.values(fish).reduce((sum, amount) => sum + amount, 0);
}

export function getFishAmount(id) {
    return fish[id] || 0;
}

export function addFish(id, amount = 1) {
    fish[id] = getFishAmount(id) + amount;
    saveFish();
}

export function removeFish(id, amount = 1) {
    fish[id] = Math.max(0, getFishAmount(id) - amount);
    selected[id] = Math.min(selected[id] || 0, fish[id]);
    saveFish();
}

function changeSelected(type, change) {
    const wanted = (selected[type.id] || 0) + change;
    selected[type.id] = Math.max(0, Math.min(wanted, getFishAmount(type.id)));
    showFish();
}

function showFish() {
    fishAmount.textContent = "You got " + totalFish() + " fish in total";
    fishTypes.innerHTML = "";

    allFish.forEach(type => {
        const amount = getFishAmount(type.id);
        if (amount === 0) return;

        const minus = document.createElement("button");
        minus.textContent = "-";
        minus.addEventListener("click", () => changeSelected(type, -1));
        const plus = document.createElement("button");
        plus.textContent = "+";
        plus.addEventListener("click", () => changeSelected(type, 1));

        const row = document.createElement("div");
        row.className = "fishRow";
        row.append(
            document.createElement("br"),
            " Worth " + coinsText(type.price) + " each.",
            document.createElement("br"),
            type.name + ": " + amount,
            document.createElement("br"),
            "Picked to sell: " + (selected[type.id] || 0) + " ",
            minus, plus
        );
        fishTypes.appendChild(row);
    });
}

// the fishmonger buys the fish you selected
export async function sellFish() {
    let total = 0;
    let list = "";
    allFish.forEach(type => {
        const amount = selected[type.id] || 0;
        if (amount > 0) {
            total = round1(total + amount * type.price);
            list += amount + " " + type.name + "\n";
        }
    });

    if (total === 0) {
        await say(pick(lines.fishmonger.nothingSelected), "fishmonger");
        return;
    }

    const answer = await ask(lines.fishmonger.sellOffer, ["Sell", "No thanks"], "fishmonger", { list: list, price: coinsText(total) });
    if (answer !== "Sell") return;

    allFish.forEach(type => {
        fish[type.id] = Math.max(0, getFishAmount(type.id) - (selected[type.id] || 0));
    });
    selected = {};
    addCoins(total);
    saveFish();
}

saveFish();
