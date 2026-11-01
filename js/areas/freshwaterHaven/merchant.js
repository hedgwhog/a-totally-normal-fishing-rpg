import { backpackUpgrades, merchantStock, merchantBuyPercent } from "../../shared/data/merchant.js";
import { findItem } from "../../shared/data/items.js";
import { isMerchantHere } from "../../shared/rules/schedule.js";
import { getBackpackSize } from "../../player/gear.js";
import { getItemAmount } from "../../player/itemBag.js";
import { getCoins } from "../../player/wallet.js";
import { getState, onState, act, localKey } from "../../core/state.js";
import { onTimeChange } from "../../core/time.js";
import { getIsland } from "../areas.js";
import { say, pick } from "../../core/dialogue.js";
import { lines } from "../../shared/data/dialogue.js";
import { openPopup } from "../../core/ui.js";
import { addText, addButton, round1, coinsText } from "../../core/helpers.js";

const merchant = "merchant";
const shop = document.getElementById("merchantItem");

onTimeChange((time, day) => {
    const key = localKey("merchantAnnounced");
    if (time !== "morning" || !isMerchantHere(time, day) || localStorage.getItem(key) === String(day) || getIsland() !== "freshwaterHaven") return;
    localStorage.setItem(key, day);
    say(lines.merchant.arrival);
});

function sellPrice(item) {
    return round1(item.price * merchantBuyPercent / 100);
}

function nextUpgrade() {
    return backpackUpgrades.find(upgrade => upgrade.slots > getBackpackSize());
}

async function buyUpgrade() {
    const upgrade = nextUpgrade();
    if (getCoins() < upgrade.price) return say(pick(lines.merchant.noCoinsUpgrade), merchant, { price: coinsText(upgrade.price) });
    const result = await act("merchant.buyUpgrade");
    if (result.error) return say(result.error);
    await say(pick(lines.merchant.upgraded), merchant, { slots: result.slots });
}

async function buyItem(item) {
    if (getCoins() < item.price) return say(pick(lines.merchant.noCoinsItem), merchant, { price: coinsText(item.price) });
    const result = await act("merchant.buyItem", { id: item.id });
    if (result.error) await say(result.error);
}

async function sellItem(item) {
    const result = await act("merchant.sellItem", { id: item.id });
    if (result.error) await say(result.error);
}

function showMerchant() {
    shop.innerHTML = "";
    addText(shop, "\"" + pick(lines.merchant.welcome) + "\"");

    addCategoryText("Backpack upgrade");
    const upgrade = nextUpgrade();
    if (upgrade) addButton(shop, "Upgrade: " + getBackpackSize() + " → " + upgrade.slots + " slots | " + coinsText(upgrade.price), buyUpgrade);
    else addText(shop, "Your backpack can't get any bigger.");

    addCategoryText("For sale:");
    const stock = getState().merchant.stock || {};
    let anythingInStock = false;
    for (const id of Object.keys(merchantStock)) {
        const item = findItem(id);
        if (!(stock[id] > 0)) continue;
        anythingInStock = true;
        let effect = "";
        if (item.effect) effect = " (" + item.effect + (item.tries ? " for " + item.tries + " tries" : "") + ")";
        else if (item.resonance) effect = " (+" + item.resonance + " resonance)";
        addButton(shop, item.name + effect + " | " + coinsText(item.price) + " | " + stock[id] + " in stock", () => buyItem(item));
    }
    if (!anythingInStock) addText(shop, "\"" + pick(lines.merchant.soldOut) + "\"");

    addCategoryText("Sell to the merchant (" + merchantBuyPercent + "% of the price)");
    let anythingToSell = false;
    for (const id of Object.keys(merchantStock)) {
        const item = findItem(id);
        if (getItemAmount(id) === 0) continue;
        anythingToSell = true;
        addButton(shop, "Sell: " + item.name + " (you have " + getItemAmount(id) + ") | " + coinsText(sellPrice(item)), () => sellItem(item));
    }
    if (!anythingToSell) addText(shop, "\"" + pick(lines.merchant.nothingToSell) + "\"");
}

function addCategoryText(title) {
    const header = document.createElement("p");
    header.className = "marketCategory";
    header.textContent = title;
    shop.appendChild(header);
}

onState(() => {
    if (getComputedStyle(document.getElementById("merchantDisplay")).display !== "none") showMerchant();
});

export const travelingMerchant = {
    button: "merchant",
    isOpen: (time, day) => isMerchantHere(time, day),
    open() {
        showMerchant();
        openPopup("merchantDisplay");
    },
};