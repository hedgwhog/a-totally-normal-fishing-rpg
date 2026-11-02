// The shop of the Capital: open in the afternoon and evening. Sells supplies and bottles, and only buys delicacies.
import { capitalShop as numbers } from "../../shared/data/areas/pantryIsles.js";
import { items, findItem } from "../../shared/data/items.js";
import { lines } from "../../shared/data/dialogue.js";
import { isCapitalShopOpen } from "../../shared/rules/pantryIsles.js";
import { getState, act } from "../../core/state.js";
import { say, pick } from "../../core/dialogue.js";
import { openPanel, redrawPanel } from "../../core/panel.js";
import { getItemAmount } from "../../player/itemBag.js";
import { getCoins } from "../../player/wallet.js";
import { addButton, round1, coinsText } from "../../core/helpers.js";
import { addCategory, addNote, addAmountRow } from "./shopRows.js";

const amounts = {};
let greeting = "";
const priceOf = item => round1(item.price * (numbers.bottles.includes(item.id) ? numbers.bottleMultiplier : 1));

function showShop(box) {
    addNote(box, "Mx. Chrome: \"" + greeting + "\"");
    const row = item => addAmountRow(box, {
        label: item.name + " | " + coinsText(priceOf(item)) + " each | you have " + getItemAmount(item.id),
        id: item.id, amounts, redraw: redrawPanel,
        buyLabel: amount => "Buy for " + coinsText(round1(amount * priceOf(item))),
        onBuy: amount => buy(item, amount),
    });
    addCategory(box, "Supplies");
    numbers.supplies.map(findItem).forEach(row);
    addCategory(box, "Bottles (" + numbers.bottleMultiplier + "x the price)");
    numbers.bottles.map(findItem).forEach(row);

    addCategory(box, "Sell delicacies (" + numbers.delicacyPercent + "% of their price)");
    const delicacies = items.filter(item => item.category === "Delicacies" && (getState().items[item.id] || 0) > 0);
    if (delicacies.length === 0) addNote(box, pick(lines.capitalShopkeeper.noDelicacy));
    delicacies.forEach(item => addButton(box, "Sell 1 " + item.name + " (you have " + getItemAmount(item.id) + ") | "
        + coinsText(round1(item.price * numbers.delicacyPercent / 100)), () => sell(item)));
}

async function buy(item, amount) {
    if (amount === 0) return say("Choose how many you want to buy with + and - first.");
    if (getCoins() < round1(amount * priceOf(item))) return say("You need " + coinsText(round1(amount * priceOf(item))) + " for that.");
    const result = await act("capitalShop.buy", { id: item.id, amount });
    if (result.error) return say(result.error);
    amounts[item.id] = 0;
    redrawPanel();
}

async function sell(item) {
    const result = await act("capitalShop.sell", { id: item.id });
    if (result.error) return say(result.error);
}

export const capitalShopEvent = {
    button: "capitalShop",
    isOpen: time => isCapitalShopOpen(time),
    open() {
        greeting = pick(lines.capitalShopkeeper.greeting);
        openPanel({ title: "Capital shop", note: "Open in the afternoon & evening. Only buys delicacies.", render: showShop });
    },
};
