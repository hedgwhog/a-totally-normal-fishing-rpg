import { i, times, nextTime } from "./time.js";
import { hasItem, addItem, getStat, getEquipped, backpackFull, getBackpack, removeItem, getResonance, addResonance, enchants, roman, enchantText, getEnchants, enchantName, setEnchants } from "./user.js";
import { marketplaceItems } from "./items.js";
import { fishList } from "./fish.js";
import { affinityFishCaught, getFishSlowdown, getSellMultiplier } from "./affinity.js";

// some safety for old saves (I hope it works)
let savedFish;
try {
    savedFish = JSON.parse(localStorage.getItem("saveFish")) || {};
} catch {
    savedFish = {};
}
if (typeof savedFish === "number") savedFish = { cod: savedFish }; // very old save format
if (typeof savedFish !== "object" || Array.isArray(savedFish)) savedFish = {};

let fish = {};
for (const type of fishList) {
    const amount = parseInt(savedFish[type.id]);
    if (amount > 0) fish[type.id] = amount;
}

localStorage.setItem("saveFish", JSON.stringify(fish));

let selected = {};
let addCoin = parseInt(localStorage.getItem("saveCoin")) || 0;

const fishAmount = document.getElementById("fishAmount");
const fishTypes = document.getElementById("fishTypes");
const coinAmount = document.getElementById("coinAmount");
const marketplaceItem = document.getElementById("marketplaceItem");
const fishingPopup = document.getElementById("fishingPopup");
const fishingText = document.getElementById("fishingText");
const fishingButtons = document.getElementById("fishingButtons");
const ichthyologist = document.getElementById("ichthyologist")
const ichthyologistDisplay = document.getElementById("ichthyologistDisplay");
const ichthyologistItem = document.getElementById("ichthyologistItem");
const resonanceDisplay = document.getElementById("resonanceDisplay");
const resonanceItem = document.getElementById("resonanceItem");

coinAmount.innerHTML = "You got " + addCoin + " coins";

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
    if (addCoin < item.price) {
        alert("You need " + item.price + " coins to buy the " + item.name + ".");
        return;
    }
    addCoin -= item.price;
    localStorage.setItem("saveCoin", addCoin);
    coinAmount.innerHTML = "You got " + addCoin + " coins";
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

function setButtonsDisabled(status) {
    const allButtons = document.querySelectorAll("button");
    allButtons.forEach(btn => {
        btn.disabled = status;
    });
}

function coins(amount) {
    addCoin += amount;
    localStorage.setItem("saveCoin", addCoin);
    coinAmount.innerHTML = "You got " + addCoin + " coins";
}

function totalFish() {
    return Object.values(fish).reduce((sum, amount) => sum + amount, 0);
}

function showFish() {
    fishAmount.innerHTML = "You got " + totalFish() + " fish in total";
    fishTypes.innerHTML = "";
    fishList.forEach(type => {
        const ownFish = fish[type.id] || 0;
        if (ownFish === 0) return;

        const minusFish = document.createElement("button");
        minusFish.textContent = "-";
        minusFish.addEventListener("click", () => changeSelected(type, -1));
        const plusFish = document.createElement("button");
        plusFish.textContent = "+";
        plusFish.addEventListener("click", () => changeSelected(type, 1));

        const rowFish = document.createElement("div");
        rowFish.style.width = "227px"
        rowFish.append(
            document.createElement("br"),
            " Worth €" + type.price + " per fish",
            document.createElement("br"),
            type.name + ": " + ownFish,  
            document.createElement("br"),
            "(selling " + (selected[type.id] || 0) + ") ",
            minusFish, plusFish
        );
        fishTypes.appendChild(rowFish);
    });
}

function changeSelected(type, change) {
    const wantedFish = (selected[type.id] || 0) + change;
    selected[type.id] = Math.max(0, Math.min(wantedFish, fish[type.id] || 0));
    showFish();
}

function openEvent(text, buttons) {
    setButtonsDisabled(true);
    fishingText.textContent = text;
    fishingButtons.innerHTML = "";
    buttons.forEach(([label, action]) => {
        const button = document.createElement("button");
        button.textContent = label;
        button.addEventListener("click", action);
        fishingButtons.appendChild(button);
    });
    fishingPopup.style.display = "block";
}

function closeEvent() {
    fishingPopup.style.display = "none";
    setButtonsDisabled(false);
}

function nextFish() {
    let time = times[i];

    if (time === "morning" || time === "afternoon" || time === "evening") {
        fishingEvent();
    } else {
        alert("You can't fish at night, you are too sleepy.");
    }
}

function pickFish(canCatch) {
    const luck = getStat("luck", 0);
    const weights = canCatch.map(type => Math.max(0, type.chance * (1 + luck * type.rarity)));
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let n = 0; n < canCatch.length; n++) {
        roll -= weights[n];
        if (roll < 0) return canCatch[n];
    }
    return canCatch[canCatch.length - 1];
}

function fishingEvent() {
    const rod = getEquipped("Rod");
    if (!rod) {
        alert("You need to equip a fishing rod first.");
        return;
    }
    const waters = rod.waters || [];
    const canCatch = fishList.filter(fishType => fishType.waters.some(water => waters.includes(water)));
    if (canCatch.length === 0) {
        alert("Your " + rod.name + " can't catch anything here.");
        return;
    }
    const type = pickFish(canCatch);

    const catchBar = 22;
    const catchZone = Math.max(1, type.zone + getStat("zoneBonus", 0));
    let fishRound = 1; // starts on round 1
    let fishHits = 0; // starts on 0 hits
    let position = 0; // starts on the left side of the catch bar
    let direction = 1;
    let catchZoneStart = Math.floor(Math.random() * (catchBar - catchZone));
    let finished = false;
    let rewinds = getStat("rewind", 0); // Rewind enchant: how many rounds you can redo
    const roundHits = []; // true or false for every round you already reeled

    function fishingDraw() {
        let fishBar = "";
        for (let addFish = 0; addFish < catchBar; addFish++) {
            if (addFish === position) fishBar += "|";
            else if (addFish >= catchZoneStart && addFish < catchZoneStart + catchZone) fishBar += "=";
            else fishBar += "-";
        }
        fishingText.textContent = "Click the button or press space to reel.\n\n You'll catch a fish after " + type.hits + " hits in " + type.rounds + " rounds.\n\n" +
            "[" + fishBar + "]\n\n" +
            "Round " + fishRound + "/" + type.rounds + ", hits: " + fishHits;
        if (rewinds > 0) fishingText.textContent += ", rewinds left: " + rewinds;
    }

        const startTime = Date.now();
        let timer;
        function barSpeed() {
            return (type.speed + getStat("slowBar", 0)) * getFishSlowdown((Date.now() - startTime) / 1000);
        }
        function moveBar() {
            position += direction;
            if (position === 0 || position === catchBar - 1) direction = -direction;
            fishingDraw();
            timer = setTimeout(moveBar, barSpeed());
        }
    timer = setTimeout(moveBar, barSpeed());

    function reel() {
        if (finished) return; // ignore any inputs after done fishing
        const hit = position >= catchZoneStart && position < catchZoneStart + catchZone;
        if (hit) fishHits++;
        // stop right away if you have enough hits
        const caught = fishHits >= type.hits;
        // stop right away if you can't get enough hits anymore (and have no rewinds left)
        const noChanceLeft = fishHits + (type.rounds - fishRound) < type.hits && rewinds === 0;
        if (fishRound === type.rounds || caught || noChanceLeft) {
            finished = true;
            clearTimeout(timer);
            window.removeEventListener("keydown", spacebarReel);
            finishFishing(fishHits, type);
            return;
        }
        roundHits.push(hit);
        fishRound++;
        catchZoneStart = Math.floor(Math.random() * (catchBar - catchZone));
    }

    // goes back one round and takes away the hit of that round
    function rewind() {
        if (finished || rewinds === 0 || roundHits.length === 0) return;
        if (roundHits.pop()) fishHits--;
        fishRound--;
        rewinds--;
        catchZoneStart = Math.floor(Math.random() * (catchBar - catchZone));
        fishingDraw();
    }

    function spacebarReel(event) {
        if (event.code !== "Space" || event.repeat) return; 
        event.preventDefault();
        if (document.activeElement) document.activeElement.blur(); 
        reel();
    }

    window.addEventListener("keydown", spacebarReel);
    const fishingEventButtons = [["Click here to reel", reel]];
    if (rewinds > 0) fishingEventButtons.push(["Rewind", rewind]);
    openEvent("", fishingEventButtons);
    fishingDraw();
}

function finishFishing(hits, type) { 
    let message = "The fish got away..."; 
    
    if (hits >= type.hits) { // enough hits, you get a fish
        fish[type.id] = (fish[type.id] || 0) + 1; 
        localStorage.setItem("saveFish", JSON.stringify(fish)); 
        addResonance(type.resonance); 
        message = "You caught a " + type.name + "!\n+" + type.resonance + " Resonance" + affinityFishCaught(); 
    } 

    function handleContinue() {
        window.removeEventListener("keydown", enterContinue);
        closeEvent(); 
        showFish(); 
        nextTime(); 
    }

    function enterContinue(event) { 
        if (event.code !== "Enter" || event.repeat) return; 
        event.preventDefault(); 
        if (document.activeElement) document.activeElement.blur(); 
        handleContinue(); 
    } 

    window.addEventListener("keydown", enterContinue); 
    openEvent(message, [["Continue or press enter", () => handleContinue()]]); 
}


function sellFish() {
    let sellFishTotal = 0;
    let sellFishList = "";
    fishList.forEach(type => {
        const sellFishAmount = selected[type.id] || 0;
        if (sellFishAmount > 0) {
            sellFishTotal += sellFishAmount * type.price;
            sellFishList += sellFishAmount + " " + type.name + "\n";
        }
    });

    if (sellFishTotal === 0) {
        alert("Select the fish you want to sell with + and - first.");
        return;
    }

    sellFishTotal = Math.round(sellFishTotal * getSellMultiplier()); // Laziness sells for less
    openEvent("The Fishmonger checks your fish:\n" + sellFishList + "\n\"I'll give you " + sellFishTotal + " coins for those.\"", [
        ["Sell", () => {
            fishList.forEach(type => {
                fish[type.id] = (fish[type.id] || 0) - (selected[type.id] || 0);
            });
            selected = {};
            localStorage.setItem("saveFish", JSON.stringify(fish));
            coins(sellFishTotal);
            closeEvent();
            showFish();
        }],
        ["No thanks", closeEvent],
    ]);
}


function addText(box, text) {
    const line = document.createElement("p");
    line.textContent = text;
    box.appendChild(line);
}

function addButton(box, label, action) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", action);
    box.appendChild(button);
}

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
    addText(resonanceItem, "You have " + getResonance() + " resonance and " + addCoin + " coins.");

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
    if (addCoin < DissonanceCost) {
        alert("You need " + DissonanceCost + " coins to disenchant.");
        return;
    }
    if (!confirm("Remove " + enchantText(enchantRod) + " for " + DissonanceCost + " coins?")) return;
    coins(-DissonanceCost);
    setEnchants(enchantRod, []);
    showResonanceShop();
}

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
        addText(ichthyologistItem, "- " + fishType.name + " (you have " + (fish[id] || 0) + ")");
    });
    addText(ichthyologistItem, "Reward: " + fishResearcherQuest.coins + " coins & " + fishResearcherQuest.resonance + " resonance");
    addButton(ichthyologistItem, "Give the fish", giveFishResearcherFish);
}

function giveFishResearcherFish() {
    if (fishResearcher.wanted.some(id => !fish[id])) {
        alert("You don't have all the fish yet.");
        return;
    }
    const fishResearcherQuest = fishResearcherRounds[fishResearcher.round - 1];
    fishResearcher.wanted.forEach(id => {
        fish[id]--;
        selected[id] = Math.min(selected[id] || 0, fish[id]);
    });
    localStorage.setItem("saveFish", JSON.stringify(fish));
    coins(fishResearcherQuest.coins);
    addResonance(fishResearcherQuest.resonance);
    alert("The researcher checks the fish and is satisfied \nYou got " + fishResearcherQuest.coins + " coins & " + fishResearcherQuest.resonance + " resonance!");

    fishResearcher = newFishResearcherQuest(fishResearcher.round + 1);
    localStorage.setItem("saveFishResearcher", JSON.stringify(fishResearcher));
    showFish();
    showFishResearcher();
}

showFish();

document.getElementById('nextFish').addEventListener('click', nextFish);
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