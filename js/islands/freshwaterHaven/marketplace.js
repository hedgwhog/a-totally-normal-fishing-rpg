import { marketplaceGear } from "../../data/gear.js";
import { items } from "../../data/items.js";
import { mapPieces } from "../../data/mapPieces.js";
import { hasGear, addGear, backpackFull, getBackpack, removeGear } from "../../gear.js";
import { getItemAmount, addItems } from "../../itemBag.js";
import { hasMapPiece, addMapPiece } from "../../map.js";
import { getCoins, addCoins } from "../../wallet.js";
import { say, askYesNo } from "../../dialogue.js";
import { openPopup } from "../../ui.js";

const sellPercent = 70; // price you sell your own items
const shop = document.getElementById("marketplaceItem");

const supplies = items.filter(item => item.category === "Supplies" && item.price);
const maps = mapPieces.filter(piece => piece.island === "freshwaterHaven" && piece.source === "marketplace");
let supplyAmounts = {}; // amount of each suply

// easy helpers to build the page
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

// Gear
function addGearRow(item) {
    const label = hasGear(item.id)
        ? item.name + " (owned)"
        : item.name + (item.effect ? " | Effects: " + item.effect : "") + " | " + item.price + " coins";
    addShopButton(shop, label, () => buyGear(item));
}

async function buyGear(item) {
    if (hasGear(item.id)) {
        await say("You already own the " + item.name + ".");
        return;
    }
    if (backpackFull()) {
        await say("Your backpack is full, you can't buy the " + item.name + ".");
        return;
    }
    if (getCoins() < item.price) {
        await say("You need " + item.price + " coins to buy the " + item.name + ".");
        return;
    }
    addCoins(-item.price);
    addGear(item);
    showMarketplace();
}

// Supplies: choose an amount with - and + and then buy
function addSupplyRow(item) {
    const amount = supplyAmounts[item.id] || 0;
    const row = document.createElement("div");
    row.className = "supplyRow";
    row.textContent = item.name + " | " + item.price + (item.price === 1 ? " coin" : " coins") + " each | you have " + getItemAmount(item.id);

    const controls = document.createElement("div");
    controls.className = "supplyControls";
    addShopButton(controls, "-", () => changeSupply(item, -1));
    controls.append(" " + amount + " ");
    addShopButton(controls, "+", () => changeSupply(item, 1));
    addShopButton(controls, "Buy for " + amount * item.price + " coins", () => buySupply(item));
    row.appendChild(controls);
    shop.appendChild(row);
}

function changeSupply(item, change) {
    supplyAmounts[item.id] = Math.max(0, (supplyAmounts[item.id] || 0) + change);
    showMarketplace();
}

async function buySupply(item) {
    const amount = supplyAmounts[item.id] || 0;
    const price = amount * item.price;
    if (amount === 0) {
        await say("Choose how many you want to buy with + and - first.");
        return;
    }
    if (getCoins() < price) {
        await say("You need " + price + " coins to buy " + amount + " " + item.name.toLowerCase() + ".");
        return;
    }
    addCoins(-price);
    addItems(item.id, amount);
    supplyAmounts[item.id] = 0;
    showMarketplace();
}

// Map piece
function addMapRow(piece) {
    if (hasMapPiece(piece.id)) {
        addShopButton(shop, piece.name + " (already on your map)", () => {});
        return;
    }
    addShopButton(shop, piece.name + " | " + piece.price + " coins", () => buyMapPiece(piece));
}

async function buyMapPiece(piece) {
    if (getCoins() < piece.price) {
        await say("You need " + piece.price + " coins to buy this map piece.");
        return;
    }
    addCoins(-piece.price);
    addMapPiece(piece.id);
    showMarketplace();
    await say("You bought a map piece!\n\nIt goes straight into your world map. Click the map in your inventory to look at it.");
}

// Sell the gear from your backpack
function sellPrice(item) {
    if (item.sellValue) return item.sellValue;
    return Math.floor((item.price || 0) * sellPercent / 100);
}

async function sellGear(item) {
    const price = sellPrice(item);
    if (!await askYesNo("looks at your " + item.name + "\nI'll give you " + price + " coins for it.\n\nDo you want to sell it?", "Trader")) return;
    if (removeGear(item.id)) addCoins(price);
    showMarketplace();
}

// The page items showing up
function showMarketplace() {
    shop.innerHTML = "";

    addCategory("Fishing rods");
    marketplaceGear.filter(item => item.slot === "Rod").forEach(addGearRow);

    addCategory("Clothing");
    marketplaceGear.filter(item => item.slot !== "Rod").forEach(addGearRow);

    addCategory("Supplies");
    supplies.forEach(addSupplyRow);

    addCategory("Maps");
    maps.forEach(addMapRow);

    addCategory("Sell your gear (" + sellPercent + "% of the price)");
    const backpack = getBackpack();
    if (backpack.length === 0) addNote("You have nothing to sell. Only gear in your backpack can be sold.");
    backpack.forEach(item => {
        addShopButton(shop, "Sell: " + item.name + " | " + sellPrice(item) + " coins", () => sellGear(item));
    });
}

document.addEventListener("inventoryChanged", showMarketplace);

export const marketplace = {
    button: "marketplace",
    isOpen: (time, day) => time !== "night" && day % 7 < 2,
    open() {
        showMarketplace();
        openPopup("marketplaceDisplay");
    },
};
