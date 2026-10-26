import { merchantEvery, backpackUpgrades, merchantStock, merchantBuyPercent } from "../../data/merchant.js";
import { findItem } from "../../data/items.js";
import { getBackpackSize, setBackpackSize } from "../../gear.js";
import { getItemAmount, addItems, removeItems } from "../../itemBag.js";
import { getCoins, addCoins } from "../../wallet.js";
import { getDay, onTimeChange } from "../../time.js";
import { getIsland } from "../../islands.js";
import { say, pick } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";
import { openPopup } from "../../ui.js";
import { loadObject, save } from "../../save.js";
import { addText, addButton, round1, coinsText } from "../../helpers.js";

const merchant = "merchant"; // his character in data/dialogue.js (name and portrait). His lines are there too.
const shop = document.getElementById("merchantItem");
let visit = { day: null, stock: {}, announcedDay: null, ...loadObject("saveMerchant") };

function saveVisit() {
    save("saveMerchant", visit);
}

function isMerchantDay(day) {
    return day % merchantEvery === 0;
}

function randomBetween(least, most) {
    return least + Math.floor(Math.random() * (most - least + 1));
}

// every visit he brings a random stock
function checkStock() {
    if (visit.day === getDay()) return;
    visit.day = getDay();
    visit.stock = {};
    for (const [id, [least, most]] of Object.entries(merchantStock)) {
        visit.stock[id] = randomBetween(least, most);
    }
    saveVisit();
}

// an arrival message
onTimeChange((time, day) => {
    if (time !== "morning" || !isMerchantDay(day) || visit.announcedDay === day || getIsland() !== "freshwaterHaven") return;
    visit.announcedDay = day;
    saveVisit();
    say(lines.merchant.arrival);
});

// helpers for the page
function addCategory(title) {
    const header = document.createElement("p");
    header.className = "marketCategory";
    header.textContent = title;
    shop.appendChild(header);
}

// what he pays you, with 1 decimal (50% of 5 coins = 2.5 coins)
function sellPrice(item) {
    return round1(item.price * merchantBuyPercent / 100);
}

// Backpack upgrades
function nextUpgrade() {
    return backpackUpgrades.find(upgrade => upgrade.slots > getBackpackSize());
}

async function buyUpgrade() {
    const upgrade = nextUpgrade();
    if (getCoins() < upgrade.price) {
        await say(pick(lines.merchant.noCoinsUpgrade), merchant, { price: coinsText(upgrade.price) });
        return;
    }
    addCoins(-upgrade.price);
    setBackpackSize(upgrade.slots);
    showMerchant();
    await say(pick(lines.merchant.upgraded), merchant, { slots: upgrade.slots });
}

// Buying and selling items
async function buyItem(item) {
    if (getCoins() < item.price) {
        await say(pick(lines.merchant.noCoinsItem), merchant, { price: coinsText(item.price) });
        return;
    }
    addCoins(-item.price);
    addItems(item.id);
    visit.stock[item.id]--;
    saveVisit();
    showMerchant();
}

function sellItem(item) {
    if (!removeItems(item.id)) return;
    addCoins(sellPrice(item));
    showMerchant();
}

// The page shows the contents
function showMerchant() {
    checkStock();
    shop.innerHTML = "";
    addText(shop, "\"" + pick(lines.merchant.welcome) + "\"");

    addCategory("Backpack upgrade");
    const upgrade = nextUpgrade();
    if (upgrade) {
        addButton(shop, "Upgrade: " + getBackpackSize() + " → " + upgrade.slots + " slots | " + coinsText(upgrade.price), buyUpgrade);
    } else {
        addText(shop, "Your backpack can't get any bigger.");
    }

    addCategory("For sale:");
    let anythingInStock = false;
    for (const id of Object.keys(merchantStock)) {
        const item = findItem(id);
        const stock = visit.stock[id] || 0;
        if (stock === 0) continue;
        anythingInStock = true;
        // what it does: the effect from data/items.js, or the resonance of a bottle
        let effect = "";
        if (item.effect) effect = " (" + item.effect + (item.catches ? " for " + item.catches + " catches" : "") + ")";
        else if (item.resonance) effect = " (+" + item.resonance + " resonance)";
        addButton(shop, item.name + effect + " | " + coinsText(item.price) + " | " + stock + " in stock", () => buyItem(item));
    }
    if (!anythingInStock) addText(shop, "\"" + pick(lines.merchant.soldOut) + "\"");

    addCategory("Sell to the merchant (" + merchantBuyPercent + "% of the price)");
    let anythingToSell = false;
    for (const id of Object.keys(merchantStock)) {
        const item = findItem(id);
        if (getItemAmount(id) === 0) continue;
        anythingToSell = true;
        addButton(shop, "Sell: " + item.name + " (you have " + getItemAmount(id) + ") | " + coinsText(sellPrice(item)), () => sellItem(item));
    }
    if (!anythingToSell) addText(shop, "\"" + pick(lines.merchant.nothingToSell) + "\"");
}

export const travelingMerchant = {
    button: "merchant",
    isOpen: (time, day) => isMerchantDay(day) && time !== "night",
    open() {
        showMerchant();
        openPopup("merchantDisplay");
    },
};
