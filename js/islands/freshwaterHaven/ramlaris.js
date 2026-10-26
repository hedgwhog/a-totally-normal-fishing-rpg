import { getDay, onTimeChange } from "../../time.js";
import { getIsland } from "../../islands.js";
import { totalFish } from "../../fishBag.js";
import { getItemAmount, removeItems } from "../../itemBag.js";
import { travelTo } from "../../travel.js";
import { say, ask } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";
import { findItem } from "../../data/items.js";
import { loadObject, save } from "../../save.js";

const sailor = "sailor"; // his character in data/dialogue.js (name and portrait). His lines are there too.
const daysToArrive = 11; // days between the phone call and the ship arriving
// the price for the trip: item id: how many. Add or remove items here, the rest of the code follows.
const payment = { fishCan: 8, waterBottle: 12, beer: 4 };

let ship = { arrivalDay: null, announced: false, metSailor: false, ...loadObject("saveRamlaris") };

function saveShip() {
    save("saveRamlaris", ship);
}

export function shipCalled() {
    return ship.arrivalDay !== null;
}

export function callShip() {
    ship.arrivalDay = getDay() + daysToArrive;
    saveShip();
}

function shipArrived(day) {
    return shipCalled() && day >= ship.arrivalDay;
}

// "8 Cans of processed fish, 12 Bottles of fresh water and 4 Beer"
function listText(amounts) {
    const parts = Object.entries(amounts).map(([id, amount]) => amount + " " + findItem(id).name);
    return parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts.join("");
}

function hasPayment() {
    return Object.entries(payment).every(([id, amount]) => getItemAmount(id) >= amount);
}

// when the ship arrives, it gives a message in the morning
onTimeChange((time, day) => {
    if (ship.announced || !shipArrived(day) || getIsland() !== "freshwaterHaven") return;
    ship.announced = true;
    saveShip();
    say(lines.sailor.arrival);
});

async function talkToSailor() {
    const have = {};
    for (const id of Object.keys(payment)) have[id] = getItemAmount(id);
    const values = { payment: listText(payment), have: listText(have) };

    if (!ship.metSailor) {
        ship.metSailor = true;
        saveShip();
        await say(lines.sailor.firstMeeting, sailor, values);
    }

    if (totalFish() > 0) {
        await say(lines.sailor.hasFish, sailor, values);
        return;
    }

    if (!hasPayment()) {
        await say(lines.sailor.shortSupplies, sailor, values);
        return;
    }

    const answer = await ask(lines.sailor.askBoard, ["Board the Ramlaris", "Not yet"], sailor, values);
    if (answer !== "Board the Ramlaris") {
        await say(lines.sailor.notYet, sailor, values);
        return;
    }

    for (const [id, amount] of Object.entries(payment)) removeItems(id, amount);
    await say(lines.sailor.paid, sailor, values);
    await travelTo("pointDriftt", "Sailing on the Ramlaris to Point Driftt");
    await say(lines.sailor.arrived, sailor, values);
}

export const ramlaris = {
    button: "ramlaris",
    isOpen: (time, day) => shipArrived(day),
    open: talkToSailor,
};
