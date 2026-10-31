import { lockers as numbers } from "../../shared/data/areas/pointDriftt.js";
import { lines } from "../../shared/data/dialogue.js";
import { resolveGear } from "../../shared/rules/stats.js";
import { getState, onState, act } from "../../core/state.js";
import { getBackpack, backpackFull, resonanceText } from "../../player/gear.js";
import { getCoins } from "../../player/wallet.js";
import { say, pick } from "../../core/dialogue.js";
import { openPopup } from "../../core/ui.js";
import { addText, addButton, coinsText } from "../../core/helpers.js";

const keeper = "Mr. Bartholomew Lock";
const page = document.getElementById("lockerItem");
const popup = document.getElementById("lockerDisplay");
let greeting = "";

const myLockers = () => getState().lockers || [];

function gearName(gear) {
    return gear.slot === "Rod" ? gear.name + " | " + resonanceText(gear) : gear.name;
}

function showLockers() {
    page.innerHTML = "";
    addText(page, "Mr. Bartholomew Lock: \"" + greeting + "\"");
    addText(page, "");

    myLockers().forEach((saved, number) => {
        const slot = document.createElement("div");
        slot.className = "lockerSlot";
        const gear = resolveGear(saved);
        addText(slot, "Locker " + (number + 1) + ": " + (gear ? gearName(gear) : "empty"));
        if (gear) {
            addButton(slot, "Take it out (into your backpack)", () => takeOut(number));
        } else {
            const backpack = getBackpack();
            if (backpack.length === 0) addText(slot, "Your backpack is empty. Only gear in your backpack fits in a locker.");
            backpack.forEach((item, index) => addButton(slot, "Put in: " + gearName(item), () => putIn(index, number)));
        }
        page.appendChild(slot);
    });

    const price = numbers.prices[myLockers().length];
    addText(page, "");
    if (price === undefined) addText(page, "\"" + pick(lines.lockerKeeper.allBought) + "\"");
    else addButton(page, "Buy locker " + (myLockers().length + 1) + " | " + coinsText(price), buyLocker);
}

async function buyLocker() {
    const price = numbers.prices[myLockers().length];
    if (getCoins() < price) return say("You need " + coinsText(price) + " for this locker.");
    const result = await act("locker.buy");
    if (result.error) return say(result.error);
    if (result.mapPiece) await say(lines.lockerKeeper.firstLocker, keeper);
    else await say(pick(lines.lockerKeeper.bought), keeper);
}

async function putIn(index, locker) {
    const result = await act("locker.store", { index, locker });
    if (result.error) await say(result.error);
}

async function takeOut(locker) {
    if (backpackFull()) return say("Your backpack is full. Make room first.");
    const result = await act("locker.take", { locker });
    if (result.error) await say(result.error);
}

onState(() => {
    if (getComputedStyle(popup).display !== "none") showLockers();
});

export const storageLockers = {
    button: "storageLockers",
    isOpen: () => true,
    open() {
        greeting = pick(lines.lockerKeeper.greeting);
        showLockers();
        openPopup(popup);
    },
};
