import { getEquipped, hasItem, addItem, backpackFull, getBackpack, removeItem, getResonance, addResonance, enchants, roman, enchantText, getEnchants, setEnchants, addItemTypes } from "./user.js";
import { getCoins, coins, getFishAmount, removeFish, sellFish, addText, addButton } from "./events.js";
import { fishList } from "./fish.js";

const marketplaceItem = document.getElementById("marketplaceItem");
const ichthyologist = document.getElementById("ichthyologist");
const ichthyologistDisplay = document.getElementById("ichthyologistDisplay");
const ichthyologistItem = document.getElementById("ichthyologistItem");
const resonanceDisplay = document.getElementById("resonanceDisplay");
const resonanceItem = document.getElementById("resonanceItem");

// Marketplace

// slow bar = the higher number, the more helpfull it is aka "Focus"
// zone bonus = bigger bar
// luck = higher chance for fish
const marketplaceItems = [
    { id: "rodShallow", name: "Shallow fishing rod (Shallow)", price: 20, slot: "Rod", effect: "Focus: 5%", stats: { slowBar: 5 }, waters: ["shallow"] },
    { id: "rodCoastal", name: "Coastal fishing rod (Coastal)", price: 45, slot: "Rod", effect: "Focus: 5%", stats: { slowBar: 5 }, waters: ["coastal"] },
    { id: "rodDock", name: "Dock fishing rod (Shallow & Coastal)", price: 75, slot: "Rod", effect: "Focus: 2.5% + Luck: +0.5 ", stats: { slowBar: 2.5, luck: 0.5 }, waters: ["shallow", "coastal"] },
    { id: "fishingHat", name: "Cozy fishing hat", price: 25, slot: "Hat", effect: "Luck: +1", stats: { luck: 1 } },
];
addItemTypes(marketplaceItems); // so your saved items from here get their newest stats

function showMarketplace() {
    marketplaceItem.innerHTML = "";
    marketplaceItems.forEach(item => {
        const itemButton = document.createElement("button");
        if (hasItem(item.id)) {
            itemButton.innerHTML = item.name + " (owned)" ;
        } else {
            itemButton.innerHTML = item.name + " | Effects: " + item.effect + " | " + item.price + " coins";
        }
        itemButton.addEventListener("click", () => buyItem(item));
        marketplaceItem.appendChild(itemButton);
    });

    const sellTitle = document.createElement("p");
    sellTitle.textContent = "Sell your items (" + 70 + "% of the price):";
    marketplaceItem.appendChild(sellTitle);

    const sellableItems = getBackpack().filter(item => sellPrice(item) > 0);
    if (sellableItems.length === 0) {
        const nothingToSell = document.createElement("p");
        nothingToSell.textContent = "You have nothing to sell. Only items in your backpack can be sold.";
        marketplaceItem.appendChild(nothingToSell);
    }
    sellableItems.forEach(item => {
        const sellButton = document.createElement("button");
        sellButton.innerHTML = "Sell: " + item.name + " | Effects: " + item.effect + " | " + sellPrice(item) + " coins";
        sellButton.addEventListener("click", () => sellItem(item));
        marketplaceItem.appendChild(sellButton);
    });
}

function buyItem(item) {
    if (hasItem(item.id)) {
        alert("You already own the " + item.name + ".");
        return;
    }
    if (backpackFull()) {
        alert("Your backpack is full, you can't buy the " + item.name + ".");
        return;
    }
    if (getCoins() < item.price) {
        alert("You need " + item.price + " coins to buy the " + item.name + ".");
        return;
    }
    coins(-item.price);
    addItem(item);
    showMarketplace();
}

function sellPrice(item) {
    if (item.sellValue) return item.sellValue;
    return Math.floor((item.price || 0) * 70 / 100);
}

function sellItem(item) {
    const price = sellPrice(item);
    const wantsToSell = confirm(
        "The trader looks at your " + item.name + ":\n" +
        "\"I'll give you " + price + " coins for it.\"\n\n" +
        "Do you want to sell it?"
    );
    if (!wantsToSell) return;

    if (removeItem(item.id)) {
        coins(price);
        alert("You sold your " + item.name + " for " + price + " coins.");
    }
    showMarketplace();
}

document.addEventListener("inventoryChanged", showMarketplace);
showMarketplace();

// Resonance altar

// extraChance: chance for a 2nd enchant, everything after that is 0.5
// levelUpChance: chance to go from level I to II. Every level after that is harder (II -> III is half, III -> IV is a third...)
const enchantLevels = [
    { level: 1, cost: 25, extraChance: 0.25, levelUpChance: 0.4 },
    { level: 2, cost: 50, extraChance: 0.4, levelUpChance: 0.75 },
    { level: 3, cost: 125, extraChance: 0.65, levelUpChance: 0.95 },
];
const DissonanceCost = 20;
let enchantRod = null;

function randomEnchant(randomEnchantIds) {
    let roll = Math.random() * randomEnchantIds.reduce((sum, id) => sum + enchants[id].chance, 0);
    for (const enchantId of randomEnchantIds) {
        roll -= enchants[enchantId].chance;
        if (roll < 0) return enchantId;
    }
    return randomEnchantIds[randomEnchantIds.length - 1];
}

function showResonanceShop() {
    resonanceItem.innerHTML = "";
    addText(resonanceItem, "You have " + getResonance() + " resonance and " + getCoins() + " coins.");

    if (!enchantRod) {
        addText(resonanceItem, "Choose the rod you want to resonance:");
        const rods = [getEquipped("Rod"), ...getBackpack().filter(item => item.slot === "Rod")];
        rods.forEach((rod, n) => {
            const place = (n === 0) ? "equipped" : "backpack";
            addButton(resonanceItem, rod.name + " (" + place + ") | " + enchantText(rod), () => {
                enchantRod = rod;
                showResonanceShop();
            });
        });
        return;
    }

    addText(resonanceItem, "Rod: " + enchantRod.name + " | " + enchantText(enchantRod));
    addText(resonanceItem, "Choose a rank:");
    enchantLevels.forEach(level => {
        addButton(resonanceItem, "Rank " + roman[level.level] + " | " + level.cost + " resonance", () => enchantRodLevel(level));
    });
    addButton(resonanceItem, "Dissonance | " + DissonanceCost + " coins", DissonancRod);
    addButton(resonanceItem, "Back", () => {
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

function enchantRodLevel(level) {
    if (getEnchants(enchantRod).length > 0) {
        alert("This rod already has " + enchantText(enchantRod) + ".\nDissonance it first.");
        return;
    }
    if (getResonance() < level.cost) {
        alert("You need " + level.cost + " resonance for rank " + roman[level.level] + ".");
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
    alert("Your rod starts to glow...\nIt got " + enchantText(enchantRod));
    showResonanceShop();
}

function DissonancRod() {
    if (getCoins() < DissonanceCost) {
        alert("You need " + DissonanceCost + " coins to disenchant.");
        return;
    }
    if (!confirm("Remove " + enchantText(enchantRod) + " for " + DissonanceCost + " coins?")) return;
    coins(-DissonanceCost);
    setEnchants(enchantRod, []);
    showResonanceShop();
}

// Ichthyologist

const rareFishShallowCoastal = ["catfish", "lumpfish"];
const fishResearcherRounds = [
    { waters: ["shallow"], extra: [], coins: 10, resonance: 5 },
    { waters: ["coastal"], extra: [], coins: 15, resonance: 10 },
    { waters: ["shallow", "coastal"], extra: rareFishShallowCoastal, coins: 25, resonance: 20 },
];

function newFishResearcherQuest(round) {
    const fishResearcherQuest = fishResearcherRounds[round - 1];
    if (!fishResearcherQuest) return { round: round, wanted: [] };
    const fishResearcherFishPool = fishList.filter(type => type.waters.some(water => fishResearcherQuest.waters.includes(water)) && !rareFishShallowCoastal.includes(type.id));
    const fishResearcherRandomFish = fishResearcherFishPool.sort(() => Math.random() - 0.5).slice(0, 3).map(type => type.id);
    return { round: round, wanted: [...fishResearcherQuest.extra, ...fishResearcherRandomFish] };
}

let fishResearcher;
try {
    fishResearcher = JSON.parse(localStorage.getItem("saveFishResearcher"));
} catch {
    fishResearcher = null;
}
// to make sure a quests does exist, even with an old safe.
if (!fishResearcher || !Array.isArray(fishResearcher.wanted) || !fishResearcher.wanted.every(id => fishList.some(type => type.id === id))) {
    fishResearcher = newFishResearcherQuest(1);
}
localStorage.setItem("saveFishResearcher", JSON.stringify(fishResearcher));

function showFishResearcher() {
    ichthyologistItem.innerHTML = "";
    const fishResearcherQuest = fishResearcherRounds[fishResearcher.round - 1];
    if (!fishResearcherQuest) {
        addText(ichthyologistItem, "\"Thanks to you, my research is finished.\"");
        return;
    }
    // I want to add some information about getting to the next place after this quest.

    addText(ichthyologistItem, "\"Could you bring me one of each fish?\"");
    fishResearcher.wanted.forEach(id => {
        const fishType = fishList.find(type => type.id === id);
        addText(ichthyologistItem, "- " + fishType.name + " (you have " + getFishAmount(id) + ")");
    });
    addText(ichthyologistItem, "Reward: " + fishResearcherQuest.coins + " coins & " + fishResearcherQuest.resonance + " resonance");
    addButton(ichthyologistItem, "Give the fish", giveFishResearcherFish);
}

function giveFishResearcherFish() {
    if (fishResearcher.wanted.some(id => getFishAmount(id) === 0)) {
        alert("You don't have all the fish yet.");
        return;
    }
    const fishResearcherQuest = fishResearcherRounds[fishResearcher.round - 1];
    fishResearcher.wanted.forEach(id => removeFish(id, 1));
    coins(fishResearcherQuest.coins);
    addResonance(fishResearcherQuest.resonance);
    alert("The researcher checks the fish and is satisfied \nYou got " + fishResearcherQuest.coins + " coins & " + fishResearcherQuest.resonance + " resonance!");

    fishResearcher = newFishResearcherQuest(fishResearcher.round + 1);
    localStorage.setItem("saveFishResearcher", JSON.stringify(fishResearcher));
    showFishResearcher();
}

document.getElementById('sellFish').addEventListener('click', sellFish);
document.getElementById('resonance').addEventListener('click', () => {
    enchantRod = null;
    showResonanceShop();
    resonanceDisplay.style.display = "block";
});
ichthyologist.addEventListener('click', () => {
    showFishResearcher();
    ichthyologistDisplay.style.display = "block";
});
