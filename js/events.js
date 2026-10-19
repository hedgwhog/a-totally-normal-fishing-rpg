import { i, times, nextTime } from "./time.js";
import { hasItem, addItem, getStat, getEquipped, backpackFull, getBackpack, removeItem } from "./user.js";
import { marketplaceItems } from "./items.js";
import { fishList } from "./fish.js";

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
        sellButton.innerHTML = "Sell '" + item.name + "' | " + sellPrice(item) + " coins";
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
        rowFish.style.width = "240px"
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

    function fishingDraw() {
        let fishBar = "";
        for (let addFish = 0; addFish < catchBar; addFish++) {
            if (addFish === position) fishBar += "|";
            else if (addFish >= catchZoneStart && addFish < catchZoneStart + catchZone) fishBar += "=";
            else fishBar += "-";
        }
        fishingText.textContent = "Click the button or press space to reel.\n\n You'll catch a fish after 3 hits in 3 rounds.\n\n" +
            "[" + fishBar + "]\n\n" +
            "Round " + fishRound + "/3, hits: " + fishHits;
    }

    const timer = setInterval(() => {
        position += direction;
        if (position === 0 || position === catchBar - 1) direction = -direction;
        fishingDraw();
    }, type.speed + getStat("slowBar", 0));

    function reel() {
        if (finished) return; // ignore any inputs after done fishing
        if (position >= catchZoneStart && position < catchZoneStart + catchZone) fishHits++;
        if (fishRound === 3) {
            finished = true;
            clearInterval(timer);
            window.removeEventListener("keydown", spacebarReel);
            finishFishing(fishHits, type);
            return;
        }
        fishRound++;
        catchZoneStart = Math.floor(Math.random() * (catchBar - catchZone));
    }

    function spacebarReel(event) {
        if (event.code !== "Space" || event.repeat) return; 
        event.preventDefault();
        if (document.activeElement) document.activeElement.blur(); 
        reel();
    }

    window.addEventListener("keydown", spacebarReel);
    openEvent("", [["Click here to reel", reel]]);
    fishingDraw();
}

function finishFishing(hits, type) {
    let message = "The fish got away...";
    if (hits >= 3) { // if 3 hits, you get a fish
        fish[type.id] = (fish[type.id] || 0) + 1;
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
