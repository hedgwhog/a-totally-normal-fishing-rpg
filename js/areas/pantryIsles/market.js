// The local market of an island in the Pantry Isles: rods & hats for its waters, trinkets, its ingredients,
// and it buys your fish for the full price. Open in the morning and afternoon, 5 days open and 1 day closed.
import { markets, marketDays } from "../../shared/data/areas/pantryIsles.js";
import { items, findItem } from "../../shared/data/items.js";
import { islandNames } from "../../shared/data/islands.js";
import { lines, characters } from "../../shared/data/dialogue.js";
import { shopStock, buyPrice } from "../../shared/rules/shops.js";
import { isMarketOpen } from "../../shared/rules/pantryIsles.js";
import { getState, act } from "../../core/state.js";
import { say, pick } from "../../core/dialogue.js";
import { openPanel, redrawPanel } from "../../core/panel.js";
import { sellFishTo } from "../../player/fishBag.js";
import { backpackFull } from "../../player/gear.js";
import { getItemAmount } from "../../player/itemBag.js";
import { getCoins } from "../../player/wallet.js";
import { addButton, round1, coinsText } from "../../core/helpers.js";
import { addCategory, addNote, addAmountRow } from "./shopRows.js";

const trinkets = items.filter(item => item.category === "Trinkets" && item.price);
const note = "Open in the morning & afternoon. " + marketDays.open + " days open, then " + marketDays.closed + " day closed.";

function showMarket(box, island, state) {
    const market = markets[island];
    const keeper = characters[market.keeper].name;
    box.innerHTML = "";
    addNote(box, keeper + ": \"" + state.greeting + "\"");

    addCategory(box, "Fishing rods & hats");
    const gear = shopStock(getState(), island);
    gear.forEach(item => addButton(box, item.name + (item.effect ? " | Effects: " + item.effect : "") + " | " + coinsText(buyPrice(item)), () => buyGear(item)));
    if (gear.length === 0) addNote(box, "Sold out. Gear you sell here shows up again.");

    const row = item => addAmountRow(box, {
        label: item.name + " | " + coinsText(item.price) + " each | you have " + getItemAmount(item.id),
        id: item.id, amounts: state.amounts, redraw: redrawPanel,
        buyLabel: amount => "Buy for " + coinsText(round1(amount * item.price)),
        onBuy: amount => buyItem(item, amount, state),
    });
    addCategory(box, "Ingredients of " + islandNames[island]);
    market.ingredients.map(findItem).forEach(row);
    addCategory(box, "Trinkets");
    trinkets.forEach(row);

    addCategory(box, "Fish");
    addNote(box, "Pick your fish with + and - in the fish tab, then use \"Sell fish at the local market\". You get the full price.");
}

async function buyGear(item) {
    if (backpackFull()) return say("Your backpack is full, you can't buy the " + item.name + ".");
    if (getCoins() < buyPrice(item)) return say("You need " + coinsText(buyPrice(item)) + " to buy the " + item.name + ".");
    const result = await act("pantryMarket.buyGear", { id: item.id });
    if (result.error) return say(result.error);
}

async function buyItem(item, amount, state) {
    if (amount === 0) return say("Choose how many you want to buy with + and - first.");
    if (getCoins() < round1(amount * item.price)) return say("You need " + coinsText(round1(amount * item.price)) + " for that.");
    const result = await act("pantryMarket.buyItem", { id: item.id, amount });
    if (result.error) return say(result.error);
    state.amounts[item.id] = 0;
    redrawPanel();
}

export function localMarket(island, button) {
    const state = { amounts: {}, greeting: "" };
    return {
        button,
        isOpen: (time, day) => isMarketOpen(time, day),
        open() {
            state.greeting = pick(lines.marketKeeper.greeting);
            openPanel({ title: "Local market", note, render: box => showMarket(box, island, state) });
        },
    };
}

export function marketFishBuyer(island, button) {
    return {
        button,
        isOpen: (time, day) => isMarketOpen(time, day),
        open: () => sellFishTo({
            action: "pantryMarket.sellFish",
            speaker: markets[island].keeper,
            offer: lines.marketKeeper.sellOffer,
            nothing: lines.marketKeeper.nothingSelected,
        }),
    };
}
