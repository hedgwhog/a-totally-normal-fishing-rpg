import { shopStock, buyPrice, isResold } from "../../rules/shops.js";
import { items } from "../../data/items.js";
import { mapTiles } from "../../data/world.js";
import { marketplace as numbers } from "../../data/quests.js";
import { isMarketplaceOpen } from "../../rules/schedule.js";
import { hasGear, backpackFull, getBackpack } from "../../gear.js";
import { getItemAmount } from "../../itemBag.js";
import { hasMapPiece } from "../../map.js";
import { getCoins } from "../../wallet.js";
import { act, onState, getState } from "../../state.js";
import { say, askYesNo, pick } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";
import { round1, coinsText } from "../../helpers.js";
import { openPopup } from "../../ui.js";

const shop = document.getElementById("marketplaceItem");
const supplies = items.filter(item => item.category === "Supplies" && item.price);
const maps = mapTiles.filter(piece => piece.island === "freshwaterHaven" && piece.source === "marketplace");
let supplyAmounts = {};
let greeting = "";

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

function addShopButton(box, label, action) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", action);
    box.appendChild(button);
    return button;
}

function addNote(text) {
    const note = document.createElement("p");
    note.className = "marketNote";
    note.textContent = text;
    shop.appendChild(note);
}

function addGearRow(item) {
    const resold = isResold(getState(), item.id, "freshwaterHaven") ? " (you sold this here)" : "";
    const label = hasGear(item.id)
        ? item.name + " (owned)"
        : item.name + resold + (item.effect ? " | Effects: " + item.effect : "") + " | " + coinsText(buyPrice(item));
    addShopButton(shop, label, () => buyGear(item));
}

async function buyGear(item) {
    if (hasGear(item.id)) return say("You already own the " + item.name + ".");
    if (backpackFull()) return say("Your backpack is full, you can't buy the " + item.name + ".");
    if (getCoins() < buyPrice(item)) return say("You need " + coinsText(buyPrice(item)) + " to buy the " + item.name + ".");
    await buy("marketplace.buyGear", { id: item.id });
}

function addSupplyRow(item) {
    const amount = supplyAmounts[item.id] || 0;
    const row = document.createElement("div");
    row.className = "supplyRow";
    row.textContent = item.name + " | " + coinsText(item.price) + " each | you have " + getItemAmount(item.id);

    const controls = document.createElement("div");
    controls.className = "supplyControls";
    addShopButton(controls, "-", () => changeSupply(item, -1));
    controls.append(" " + amount + " ");
    addShopButton(controls, "+", () => changeSupply(item, 1));
    addShopButton(controls, "Buy for " + coinsText(round1(amount * item.price)), () => buySupply(item));
    row.appendChild(controls);
    shop.appendChild(row);
}

function changeSupply(item, change) {
    supplyAmounts[item.id] = Math.max(0, (supplyAmounts[item.id] || 0) + change);
    showMarketplace();
}

async function buySupply(item) {
    const amount = supplyAmounts[item.id] || 0;
    if (amount === 0) return say("Choose how many you want to buy with + and - first.");
    const result = await buy("marketplace.buySupply", { id: item.id, amount });
    if (!result.error) {
        supplyAmounts[item.id] = 0;
        showMarketplace();
    }
}

function addMapRow(piece) {
    if (hasMapPiece(piece.id)) {
        addShopButton(shop, piece.name + " (already on your map)", () => {});
        return;
    }
    addShopButton(shop, piece.name + " | " + coinsText(piece.price), () => buyMapPiece(piece));
}

async function buyMapPiece(piece) {
    if (getCoins() < piece.price) return say("You need " + coinsText(piece.price) + " to buy this map piece.");
    const result = await buy("marketplace.buyMap", { id: piece.id });
    if (!result.error) await say("You bought a map piece!\n\nIt goes straight into your world map. Click Map at the top to look at it.");
}

function sellPrice(item) {
    if (item.sellValue) return item.sellValue;
    return round1((item.price || 0) * numbers.sellPercent / 100);
}

async function sellGear(item, index) {
    const price = sellPrice(item);
    if (!await askYesNo(lines.trader.sellOffer, "trader", "Yes", "No", { item: item.name, price: coinsText(price) })) return;
    await buy("marketplace.sellGear", { index });
}

function showMarketplace() {
    shop.innerHTML = "";
    if (greeting) addNote("Trader: \"" + greeting + "\"");
    const stock = shopStock(getState(), "freshwaterHaven");

    addCategory("Fishing rods");
    stock.filter(item => item.slot === "Rod").forEach(addGearRow);

    addCategory("Clothing");
    stock.filter(item => item.slot !== "Rod").forEach(addGearRow);

    addCategory("Supplies");
    supplies.forEach(addSupplyRow);

    addCategory("Maps");
    maps.forEach(addMapRow);

    addCategory("Sell your gear (" + numbers.sellPercent + "% of the price)");
    const backpack = getBackpack();
    if (backpack.length === 0) addNote("You have nothing to sell. Only gear in your backpack can be sold.");
    backpack.forEach((item, index) => {
        if (item.bound) return addNote(item.name + ": can't be sold (it belongs to the research facility).");
        addShopButton(shop, "Sell: " + item.name + " | " + coinsText(sellPrice(item)), () => sellGear(item, index));
    });
}

onState(showMarketplace);

export const marketplace = {
    button: "marketplace",
    isOpen: (time, day) => isMarketplaceOpen(time, day),
    open() {
        greeting = pick(lines.trader.greeting);
        showMarketplace();
        openPopup("marketplaceDisplay");
    },
};
