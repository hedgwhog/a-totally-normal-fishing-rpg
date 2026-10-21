import { i, times, nextTime, nextDay } from "./time.js";
import { getStat, getEquipped, addResonance } from "./user.js";
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
const fishingPopup = document.getElementById("fishingPopup");
const fishingText = document.getElementById("fishingText");
const fishingButtons = document.getElementById("fishingButtons");

coinAmount.innerHTML = "You got " + addCoin + " coins";

// Coins

export function getCoins() {
    return addCoin;
}

export function coins(amount) {
    addCoin += amount;
    localStorage.setItem("saveCoin", addCoin);
    coinAmount.innerHTML = "You got " + addCoin + " coins";
}

// Fish amounts

function totalFish() {
    return Object.values(fish).reduce((sum, amount) => sum + amount, 0);
}

export function getFishAmount(id) {
    return fish[id] || 0;
}

export function removeFish(id, amount) {
    fish[id] = getFishAmount(id) - amount;
    selected[id] = Math.min(selected[id] || 0, fish[id]);
    localStorage.setItem("saveFish", JSON.stringify(fish));
    showFish();
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

// Popup for events (fishing, selling)
function setButtonsDisabled(status) {
    const allButtons = document.querySelectorAll("button");
    allButtons.forEach(btn => {
        btn.disabled = status;
    });
}

export function openEvent(text, buttons) {
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

export function closeEvent() {
    fishingPopup.style.display = "none";
    setButtonsDisabled(false);
}

// Fishing
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
    const barWidths = Array.isArray(type.barWidth) ? type.barWidth : Array(type.bars || 1).fill(type.barWidth);
    const barCount = barWidths.length; 
    const zoneSize = Math.max(1, type.zone + getStat("zoneBonus", 0));
    const fishLooks = ["="]; 

    const bars = [];
    barWidths.forEach(width => {
        const bar = { width: width, catchZone: Math.min(width - 1, zoneSize), fishDirection: -1 };
        bar.zoneStart = randomZoneStart(bar);
        bars.push(bar);
    });
    let activeBar = 0; 
    let fishRound = 1; // starts on round 1
    let fishHits = 0; // starts on 0 hits
    let position = 0; // starts on the left side of the catch bar
    let direction = 1;
    let finished = false;
    let rewinds = getStat("rewind", 0); // Rewind enchant: how many rounds you can redo
    const roundHits = [];

    function randomZoneStart(bar) {
        return Math.floor(Math.random() * (bar.width - bar.catchZone + 1));
    }

    function switchBar(n) {
        activeBar = n;
        position = Math.min(position, bars[activeBar].width - 1);
    }

    function fishingDraw() {
        let text = "Click the button or press space to reel.\n\n You'll catch a fish after " + type.hits + " hits in " + type.rounds + " rounds.\n\n";
        bars.forEach((bar, n) => {
            let fishBar = "";
            for (let addFish = 0; addFish < bar.width; addFish++) {
                if (n === activeBar && addFish === position) fishBar += "|";
                else if (addFish >= bar.zoneStart && addFish < bar.zoneStart + bar.catchZone) fishBar += fishLooks[n % fishLooks.length];
                else fishBar += "-";
            }
            const marker = (barCount > 1 && n === activeBar) ? "> " : "  ";
            text += marker + "[" + fishBar + "]\n";
        });
        text += "\nRound " + fishRound + "/" + type.rounds + ", hits: " + fishHits;
        if (rewinds > 0) text += ", rewinds left: " + rewinds;
        fishingText.textContent = text;
    }

    const startTime = Date.now();
    let lineTimer;
    let fishTimer;

    function lineSpeed() {
        return type.speed + getStat("slowBar", 0);
    }
    function moveLine() {
        const width = bars[activeBar].width;
        position += direction;
        if (position <= 0) {
            position = 0;
            direction = 1;
        }
        if (position >= width - 1) {
            position = width - 1;
            direction = -1;
        }
        fishingDraw();
        lineTimer = setTimeout(moveLine, lineSpeed());
    }

    function fishSpeed() {
        return (type.fishSpeed + getStat("slowFish", 0)) * getFishSlowdown((Date.now() - startTime) / 1000);
    }
    function moveFish() {
        bars.forEach(bar => {
            const next = bar.zoneStart + bar.fishDirection;
            if (next < 0 || next > bar.width - bar.catchZone) bar.fishDirection = -bar.fishDirection;
            bar.zoneStart += bar.fishDirection;
        });
        fishingDraw();
        fishTimer = setTimeout(moveFish, fishSpeed());
    }

    lineTimer = setTimeout(moveLine, lineSpeed());
    if (type.fishSpeed > 0) fishTimer = setTimeout(moveFish, fishSpeed());

    function reel() {
        if (finished) return; // ignore any inputs after done fishing
        const bar = bars[activeBar];
        const hit = position >= bar.zoneStart && position < bar.zoneStart + bar.catchZone;
        if (hit) fishHits++;

        // stops if you have enough hits
        const caught = fishHits >= type.hits;

        // stops if you have no more rounds left and no more rewinds
        const noChanceLeft = fishHits + (type.rounds - fishRound) < type.hits && rewinds === 0;
        if (fishRound === type.rounds || caught || noChanceLeft) {
            finished = true;
            clearTimeout(lineTimer);
            clearTimeout(fishTimer);
            window.removeEventListener("keydown", spacebarReel);
            finishFishing(fishHits, type);
            return;
        }
        roundHits.push({ hit: hit, bar: activeBar });
        fishRound++;
        bar.zoneStart = randomZoneStart(bar);
        if (hit) switchBar((activeBar + 1) % barCount);
        fishingDraw();
    }

    function rewind() {
        if (finished || rewinds === 0 || roundHits.length === 0) return;
        const lastRound = roundHits.pop();
        if (lastRound.hit) fishHits--;
        switchBar(lastRound.bar);
        fishRound--;
        rewinds--;
        bars[activeBar].zoneStart = randomZoneStart(bars[activeBar]);
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


export function sellFish() {
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

// some helpers
export function addText(box, text) {
    const line = document.createElement("p");
    line.textContent = text;
    box.appendChild(line);
}

export function addButton(box, label, action) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", action);
    box.appendChild(button);
}

// Sleeping
function sleep() {
    const time = times[i];
    if (time === "evening" || time === "night") {
        nextDay();
    } else {
        alert("You can't sleep during the day, get back to work.");
    }
}

showFish();

document.getElementById('nextFish').addEventListener('click', nextFish);
document.getElementById('nextDay').addEventListener('click', sleep);