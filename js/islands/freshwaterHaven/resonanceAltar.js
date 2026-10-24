import { enchants, roman } from "../../data/enchants.js";
import { getEquipped, getBackpack, enchantText, getEnchants, setEnchants } from "../../gear.js";
import { getResonance, addResonance } from "../../resonance.js";
import { getCoins, addCoins } from "../../wallet.js";
import { say, askYesNo } from "../../dialogue.js";
import { openPopup } from "../../ui.js";
import { addText, addButton } from "../../helpers.js";

// cost = resonance.
// extraChance: chance for a 2nd enchant, everything after that is 0.5
// levelUpChance: chance to go from level I to II. Every level after that is harder.
const enchantLevels = [
    { level: 1, cost: 25, extraChance: 0.25, levelUpChance: 0.4 },
    { level: 2, cost: 50, extraChance: 0.4, levelUpChance: 0.75 },
    { level: 3, cost: 125, extraChance: 0.65, levelUpChance: 0.95 },
];
const dissonanceCost = 20; // coins to remove all enchants from a rod
let enchantRod = null; // the rod you picked

const altar = document.getElementById("resonanceItem");

function randomEnchant(randomEnchantIds) {
    let roll = Math.random() * randomEnchantIds.reduce((sum, id) => sum + enchants[id].chance, 0);
    for (const enchantId of randomEnchantIds) {
        roll -= enchants[enchantId].chance;
        if (roll < 0) return enchantId;
    }
    return randomEnchantIds[randomEnchantIds.length - 1];
}

function showResonanceShop() {
    altar.innerHTML = "";
    addText(altar, "You have " + getResonance() + " resonance and " + getCoins() + " coins.");

    if (!enchantRod) {
        addText(altar, "Choose the rod you want to resonate:");
        const rods = [getEquipped("Rod"), ...getBackpack().filter(item => item.slot === "Rod")];
        rods.forEach((rod, n) => {
            const place = (n === 0) ? "equipped" : "backpack";
            addButton(altar, rod.name + " (" + place + ") | " + enchantText(rod), () => {
                enchantRod = rod;
                showResonanceShop();
            });
        });
        return;
    }

    addText(altar, "Rod: " + enchantRod.name + " | " + enchantText(enchantRod));
    addText(altar, "Choose a rank:");
    enchantLevels.forEach(level => {
        addButton(altar, "Rank " + roman[level.level] + " | " + level.cost + " resonance", () => enchantRodLevel(level));
    });
    addButton(altar, "Dissonance | " + dissonanceCost + " coins", dissonanceRod);
    addButton(altar, "Back", () => {
        enchantRod = null;
        showResonanceShop();
    });
}

function rollEnchantLevel(id, level) {
    let enchantLevel = 1;
    const levelUp = level.levelUpChance * (enchants[id].levelUp || 1);
    while (enchantLevel < enchants[id].maxLevel && Math.random() < levelUp / enchantLevel) enchantLevel++;
    return enchantLevel;
}

async function enchantRodLevel(level) {
    if (getEnchants(enchantRod).length > 0) {
        await say("This rod already has " + enchantText(enchantRod) + ".\nUse dissonance on it first.");
        return;
    }
    if (getResonance() < level.cost) {
        await say("You need " + level.cost + " resonance for rank " + roman[level.level] + ".");
        return;
    }
    addResonance(-level.cost);

    const rolledEnchants = [];
    let extraChance = 1;
    while (Math.random() < extraChance) {
        const enchantOptions = Object.keys(enchants).filter(id => (enchants[id].minRank || 1) <= level.level && !rolledEnchants.some(enchant => enchant.id === id));
        if (enchantOptions.length === 0) break;
        const randomEnchantId = randomEnchant(enchantOptions);
        rolledEnchants.push({ id: randomEnchantId, level: rollEnchantLevel(randomEnchantId, level) });
        extraChance = (rolledEnchants.length === 1) ? level.extraChance : extraChance / 2;
    }

    setEnchants(enchantRod, rolledEnchants);
    showResonanceShop();
    await say("Your rod starts to glow...\n\nIt got " + enchantText(enchantRod) + "!");
}

async function dissonanceRod() {
    if (getEnchants(enchantRod).length === 0) {
        await say("This rod has no enchants to remove.");
        return;
    }
    if (getCoins() < dissonanceCost) {
        await say("You need " + dissonanceCost + " coins for dissonance.");
        return;
    }
    if (!await askYesNo("Remove " + enchantText(enchantRod) + " for " + dissonanceCost + " coins?")) return;
    addCoins(-dissonanceCost);
    setEnchants(enchantRod, []);
    showResonanceShop();
}

export const resonanceAltar = {
    button: "resonance",
    isOpen: (time, day) => ["morning", "afternoon", "night"].includes(time) && day % 5 !== 0,
    open() {
        enchantRod = null;
        showResonanceShop();
        openPopup("resonanceDisplay");
    },
};
