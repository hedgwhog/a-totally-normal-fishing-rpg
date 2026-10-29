import { allFish, isSellable } from "./data/fish.js";
import { getState, onState, act } from "./state.js";
import { ask, say, pick } from "./dialogue.js";
import { lines } from "./data/dialogue.js";
import { round1, coinsText, shortNumber } from "./helpers.js";

let selected = {};

const fishAmount = document.getElementById("fishAmount");
const fishTypes = document.getElementById("fishTypes");

export function getFishAmount(id) {
    return getState().fish[id] || 0;
}

export function totalFish() {
    return Object.values(getState().fish).reduce((sum, amount) => sum + amount, 0);
}

function changeSelected(type, change) {
    const wanted = (selected[type.id] || 0) + change;
    selected[type.id] = Math.max(0, Math.min(wanted, getFishAmount(type.id)));
    showFish();
}

function showFish() {
    for (const id of Object.keys(selected)) selected[id] = Math.min(selected[id], getFishAmount(id));

    fishAmount.textContent = "Fish (" + shortNumber(totalFish()) + ")";
    fishAmount.title = totalFish() + " fish";
    fishTypes.innerHTML = "";

    if (totalFish() === 0) {
        const empty = document.createElement("p");
        empty.className = "bagEmpty";
        empty.textContent = "No fish yet. Press Fish to cast your line.";
        fishTypes.appendChild(empty);
        return;
    }

    const hint = document.createElement("p");
    hint.className = "fishHint";
    hint.textContent = "Pick the fish you would like to sell with - and +, and then visit a fish buyer. "
    fishTypes.appendChild(hint);

    allFish.forEach(type => {
        const amount = getFishAmount(type.id);
        if (amount === 0) return;

        const minus = document.createElement("button");
        minus.textContent = "-";
        minus.addEventListener("click", () => changeSelected(type, -1));
        const plus = document.createElement("button");
        plus.textContent = "+";
        plus.addEventListener("click", () => changeSelected(type, 1));

        const name = document.createElement("span");
        name.textContent = type.name + " x" + shortNumber(amount);
        name.title = amount + " " + type.name;
        const price = document.createElement("span");
        price.className = "fishPrice";
        price.textContent = isSellable(type) ? coinsText(type.price) + " each" : "hadal fish";
        const sell = document.createElement("span");
        sell.className = "fishSell";
        if (isSellable(type)) sell.append("sell " + (selected[type.id] || 0) + " ", minus, plus);
        else sell.append("can't be sold");

        const row = document.createElement("div");
        row.className = "fishRow";
        row.append(name, price, sell);
        fishTypes.appendChild(row);
    });
}

export function sellFish() {
    return sellFishTo({ action: "fishmonger.sell", speaker: "fishmonger", offer: lines.fishmonger.sellOffer, nothing: lines.fishmonger.nothingSelected });
}

export async function sellFishTo({ action, speaker, offer, nothing }) {
    let total = 0;
    let list = "";
    allFish.forEach(type => {
        const amount = selected[type.id] || 0;
        if (amount > 0 && isSellable(type)) {
            total = round1(total + amount * type.price);
            list += amount + " " + type.name + "\n";
        }
    });

    if (total === 0) {
        await say(pick(nothing), speaker);
        return;
    }

    const answer = await ask(offer, ["Sell", "No thanks"], speaker, { list: list, price: coinsText(total) });
    if (answer !== "Sell") return;

    const sellable = {};
    for (const [id, amount] of Object.entries(selected)) if (isSellable(allFish.find(type => type.id === id))) sellable[id] = amount;
    const result = await act(action, { selected: sellable });
    if (result.error) return say(result.error);
    selected = {};
    showFish();
}

onState(showFish);
showFish();
