import { i, times, nextTime } from "./time.js";
import { hasItem, addItem, getStat, getEquipped, backpackFull } from "./user.js";

const savedFish = JSON.parse(localStorage.getItem("saveFish")) || {};
let fish = typeof savedFish === "object" ? savedFish : { cod: savedFish };
let selected = {};
let addCoin = parseInt(localStorage.getItem("saveCoin")) || 0;

const fishAmount = document.getElementById("fishAmount");
const fishTypes = document.getElementById("fishTypes");
const coinAmount = document.getElementById("coinAmount");
const marketplaceItem = document.getElementById("marketplaceItem");
const fishingPopup = document.getElementById("fishingPopup");
const fishingText = document.getElementById("fishingText");
const fishingButtons = document.getElementById("fishingButtons");

coinAmount.innerHTML = "You got " + addCoin + " coins";

// water: type of water the fish lives in.
// zone: size of the hitbox, smaller is harder!
// speed: ms for the bar, lower ms is harder!
// chance: how often it shows up in comparison to other fish
// rarity: 0 = common, higher = more rare. The luch stat boosts the chance of rarer fish.
const fishList = [
    // Shallow
    { id: "crappie", name: "Crappie", price: 2, waters: ["shallow"], zone: 4, speed: 50, chance: 45, rarity: 0 },
    { id: "bluegill", name: "Bluegill", price: 1, waters: ["shallow"], zone: 6, speed: 40, chance: 60, rarity: 0 },
    { id: "panfish", name: "Panfish", price: 1, waters: ["shallow"], zone: 6, speed: 40, chance: 60, rarity: 1 },

    { id: "catfish", name: "Catfish", price: 4, waters: ["shallow"], zone: 3, speed: 75, chance: 5, rarity: 3 },

    // Shallow & Coastal
    { id: "flounder", name: "Flounder", price: 3, waters: ["shallow", "coastal"], zone: 4, speed: 40, chance: 30, rarity: 0.2 },
    { id: "bass", name: "Bass", price: 2, waters: ["shallow", "coastal"], zone: 5, speed: 50, chance: 35, rarity: 0 },

    // Coastal
    { id: "snook", name: "Snook", price: 2, waters: ["coastal"], zone: 4, speed: 65, chance: 35, rarity: 0 },
    { id: "mackerel", name: "Mackerel", price: 2, waters: ["coastal"], zone: 4, speed: 65, chance: 35, rarity: 0 },
    { id: "cod", name: "Cod", price: 1, waters: ["coastal"], zone: 5, speed: 50, chance: 70, rarity: 0 },

    { id: "lumpfish", name: "Lumpfish", price: 7, waters: ["coastal"], zone: 3, speed: 90, chance: 8, rarity: 5 },
];

// slow bar = the higher number, the more helpfull it is aka "Relax"
// zone bonus = bigger bar
// luck = higher chance for fish
const marketplaceItems = [
    { id: "rodShallow", name: "Shallow fishing rod (Shallow)", price: 20, slot: "Rod", effect: "Relax: 0.05", stats: { slowBar: 5 }, waters: ["shallow"] },
    { id: "rodCoastal", name: "Coastal fishing rod (Coastal)", price: 45, slot: "Rod", effect: "Relax: 0.05", stats: { slowBar: 5 }, waters: ["coastal"] },
    { id: "rodDock", name: "Dock fishing rod (Shallow & Coastal)", price: 75, slot: "Rod", effect: "Relax: 0.05 + Luck: +0.5 ", stats: { slowBar: 2.5, luck: 0.5 }, waters: ["shallow", "coastal"] },
    { id: "fishingHat", name: "Cozy fishing hat", price: 25, slot: "Hat", effect: "Luck: +1", stats: { luck: 1 } },
];

function showMarketplace() {
    marketplaceItem.innerHTML = "";
    marketplaceItems.forEach(item => {
        const itemButton = document.createElement("button");
        if (hasItem(item.id)) {
            itemButton.innerHTML = " (owned): " + item.name;
        } else {
            itemButton.innerHTML = item.price + " Coins: " + item.name;
        }
        itemButton.addEventListener("click", () => buyItem(item));
        marketplaceItem.appendChild(itemButton);
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
    fishAmount.innerHTML = "You got " + totalFish() + " fish";
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
        rowFish.append(
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

// Picks a fish, rarer fish get more likely with luck
function pickFish(canCatch) {
    const luck = getStat("luck", 0);
    const weights = canCatch.map(type => type.chance * (1 + luck * type.rarity));
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let n = 0; n < canCatch.length; n++) {
        roll -= weights[n];
        if (roll < 0) return canCatch[n];
    }
    return canCatch[canCatch.length - 1];
}

function fishingEvent() {
    // the rod decides which waters you can fish in (no rod or an old save = shallow only)
    const rod = getEquipped("Rod");
    if (!rod) {
        alert("You need to equip a fishing rod first.");
        return;
    }
    const waters = rod.waters;  
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

    function fishingDraw() {
        let fishBar = "";
        for (let addFish = 0; addFish < catchBar; addFish++) {
            if (addFish === position) fishBar += "|";
            else if (addFish >= catchZoneStart && addFish < catchZoneStart + catchZone) fishBar += "=";
            else fishBar += "-";
        }
        fishingText.textContent = "You'll catch a fish after 3 rounds:\n\n" +
            "[" + fishBar + "]\n\n" +
            "Round " + fishRound + "/3, hits: " + fishHits;
    }

    const timer = setInterval(() => {
        position += direction;
        if (position === 0 || position === catchBar - 1) direction = -direction;
        fishingDraw();
    },  type.speed + getStat("slowBar", 0));

    function reel() {
        if (position >= catchZoneStart && position < catchZoneStart + catchZone) fishHits++;
        if (fishRound === 3) {
            clearInterval(timer);
            finishFishing(fishHits, type);
            return;
        }
        fishRound++;
        catchZoneStart = Math.floor(Math.random() * (catchBar - catchZone));
    }
    // For in the future spacebar press becomes fishing.
    // window.addEventListener('keydown', function (spacebarReel) {
    //     if (spacebarReel.key === ' ') {
    //         spacebarReel.preventDefault();
    //         reel();
    //     }
    // });
    openEvent("", [["Click here to fish", reel]]);
    fishingDraw();
}

function finishFishing(hits, type) {
    let message = "The fish got away...";
    if (hits >= 3) { // if more then 3 hits, you get a fish
        fish[type.id] = (fish[type.id] || 0) + 1;
        console.log("caught:", type.id, JSON.stringify(fish));
        localStorage.setItem("saveFish", JSON.stringify(fish));
        message = "You caught a " + type.name + "!";
    }

    openEvent(message, [["Continue", () => {
        closeEvent();
        showFish();
        nextTime();
    }]]);
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

showFish();

document.getElementById('nextFish').addEventListener('click', nextFish);
document.getElementById('sellFish').addEventListener('click', sellFish);
