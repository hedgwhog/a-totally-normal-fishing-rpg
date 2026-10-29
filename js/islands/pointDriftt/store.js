import { store as numbers } from "../../data/pointDriftt.js";
import { findItem } from "../../data/items.js";
import { lines } from "../../data/dialogue.js";
import { isStoreOpen } from "../../rules/schedule.js";
import { shopStock, buyPrice, isResold } from "../../rules/shops.js";
import { getState, onState, act } from "../../state.js";
import { hasGear, backpackFull, getBackpack } from "../../gear.js";
import { getItemAmount } from "../../itemBag.js";
import { getCoins } from "../../wallet.js";
import { sellFishTo } from "../../fishBag.js";
import { say, askYesNo, pick } from "../../dialogue.js";
import { openPopup } from "../../ui.js";
import { addText, addButton, round1, coinsText } from "../../helpers.js";

const shopkeeper = "shopkeeper";
const shop = document.getElementById("storeItem");
const popup = document.getElementById("storeDisplay");
const supplies = numbers.supplies.map(findItem);
let supplyAmounts = {};
let greeting = "";

const supplyPrice = item => round1(item.price * numbers.supplyMultiplier);

async function buy(type, data) {
    const result = await act(type, data);
    if (result.error) await say(result.error);
    return result;
}

function addCategory(title) {
    const header = document.createElement("p");
    header.className = "marketCategory";
    header.textContent = title;
    shop.appendChild(header);
}

function addGearRow(item) {
    const resold = isResold(getState(), item.id, "pointDriftt") ? " (you sold this here)" : "";
    const label = hasGear(item.id)
        ? item.name + " (owned)"
        : item.name + resold + (item.effect ? " | Effects: " + item.effect : "") + " | " + coinsText(buyPrice(item));
    addButton(shop, label, () => buyGear(item));
}

async function buyGear(item) {
    if (hasGear(item.id)) return say("You already own the " + item.name + ".");
    if (backpackFull()) return say("Your backpack is full, you can't buy the " + item.name + ".");
    if (getCoins() < buyPrice(item)) return say("You need " + coinsText(buyPrice(item)) + " to buy the " + item.name + ".");
    await buy("store.buyGear", { id: item.id });
}

function addSupplyRow(item) {
    const amount = supplyAmounts[item.id] || 0;
    const row = document.createElement("div");
    row.className = "supplyRow";
    row.textContent = item.name + " | " + coinsText(supplyPrice(item)) + " each | you have " + getItemAmount(item.id);

    const controls = document.createElement("div");
    controls.className = "supplyControls";
    addButton(controls, "-", () => changeSupply(item, -1));
    controls.append(" " + amount + " ");
    addButton(controls, "+", () => changeSupply(item, 1));
    addButton(controls, "Buy for " + coinsText(round1(amount * supplyPrice(item))), () => buySupply(item));
    row.appendChild(controls);
    shop.appendChild(row);
}

function changeSupply(item, change) {
    supplyAmounts[item.id] = Math.max(0, (supplyAmounts[item.id] || 0) + change);
    showStore();
}

async function buySupply(item) {
    const amount = supplyAmounts[item.id] || 0;
    if (amount === 0) return say("Choose how many you want to buy with + and - first.");
    const result = await buy("store.buySupply", { id: item.id, amount });
    if (!result.error) {
        supplyAmounts[item.id] = 0;
        showStore();
    }
}

function sellPrice(item) {
    if (item.sellValue) return item.sellValue;
    return round1((item.price || 0) * numbers.sellPercent / 100);
}

async function sellGear(item, index) {
    const price = sellPrice(item);
    if (!await askYesNo(lines.shopkeeper.sellOffer, shopkeeper, "Yes", "No", { item: item.name, price: coinsText(price) })) return;
    await buy("store.sellGear", { index });
}

function showStore() {
    shop.innerHTML = "";
    addText(shop, "Shopkeeper: \"" + greeting + "\"");
    const stock = shopStock(getState(), "pointDriftt");

    const rods = stock.filter(item => item.slot === "Rod");
    if (rods.length > 0) {
        addCategory("Fishing rods");
        rods.forEach(addGearRow);
    }

    addCategory("Clothing");
    stock.filter(item => item.slot !== "Rod").forEach(addGearRow);

    addCategory("Supplies (" + numbers.supplyMultiplier + "x the price, it's a long way)");
    supplies.forEach(addSupplyRow);

    addCategory("Sell your gear (" + numbers.sellPercent + "% of the price)");
    const backpack = getBackpack();
    if (backpack.length === 0) addText(shop, "You have nothing to sell. Only gear in your backpack can be sold.");
    backpack.forEach((item, index) => {
        if (item.bound) return addText(shop, item.name + ": can't be sold (it belongs to the research facility).");
        addButton(shop, "Sell: " + item.name + " | " + coinsText(sellPrice(item)), () => sellGear(item, index));
    });

    addCategory("Fish");
    addText(shop, "Pick your fish with + and - in the fish tab, then use \"Sell fish to the inconvenience store\".");
}

onState(() => {
    if (getComputedStyle(popup).display !== "none") showStore();
});

export const inconvenienceStore = {
    button: "inconvenienceStore",
    isOpen: (time, day) => isStoreOpen(time, day),
    open() {
        greeting = pick(lines.shopkeeper.greeting);
        showStore();
        openPopup(popup);
    },
};

export const storeFishBuyer = {
    button: "sellFishStore",
    isOpen: (time, day) => isStoreOpen(time, day),
    open: () => sellFishTo({
        action: "store.sellFish",
        speaker: shopkeeper,
        offer: lines.shopkeeper.fishSellOffer,
        nothing: lines.shopkeeper.nothingSelected,
    }),
};
