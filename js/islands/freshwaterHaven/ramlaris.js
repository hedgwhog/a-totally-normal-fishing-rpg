import { getDay, onTimeChange } from "../../time.js";
import { getIsland } from "../../islands.js";
import { totalFish } from "../../fishBag.js";
import { getItemAmount, removeItems } from "../../itemBag.js";
import { travelTo } from "../../travel.js";
import { say, ask } from "../../dialogue.js";
import { loadObject, save } from "../../save.js";

const sailor = "Old sailor"; // the name above his dialogue
const daysToArrive = 11; // days between the phone call and the ship arriving
const payment = { fishCan: 8, waterBottle: 12, beer: 4 }; // the price for the 

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

// when the ships arrives, it gives a message in the worning
onTimeChange((time, day) => {
    if (ship.announced || !shipArrived(day) || getIsland() !== "freshwaterHaven") return;
    ship.announced = true;
    saveShip();
    say([
        "A deep ship horn sounds over Freshwater Haven.",
        "An old ship is waiting at the dock. Its name is painted on the side: Ramlaris.",
    ]);
});

async function talkToSailor() {
    if (!ship.metSailor) {
        ship.metSailor = true;
        saveShip();
        await say([
            "So you're the one she volunteered.",
            "Welcome to the Ramlaris. Oldest ship on these waters, and she still floats. Most of the days.",
            "We're sailing to Point Driftt. The price for the trip: " + payment.fishCan + " cans of processed fish and " + payment.waterBottle + " bottles of fresh water. We need food and water for the crossing.",
            "And no fish on board. They rot, so we can't bring it with us.",
            "No rush, the Ramlaris waits at the dock until you're ready.",
        ], sailor);
    }

    if (totalFish() > 0) {
        await say("I can smell the fish. You can't board with fish.\n\nSell every last one of them first.", sailor);
        return;
    }

    const cans = getItemAmount("fishCan");
    const bottles = getItemAmount("waterBottle");
    if (cans < payment.fishCan || bottles < payment.waterBottle) {
        await say(
            "You're short on supplies. I need " + payment.fishCan + " cans of processed fish and " + payment.waterBottle + " bottles of fresh water.\n\n" +
            "You've got " + cans + " cans and " + bottles + " bottles.",
            sailor
        );
        return;
    }

    const answer = await ask(
        "Ready to sail? Once we leave, there's no ship back to Freshwater Haven.",
        ["Board the Ramlaris", "Not yet"],
        sailor
    );
    if (answer !== "Board the Ramlaris") {
        await say("The Ramlaris isn't going anywhere without you. Take your time.", sailor);
        return;
    }

    removeItems("fishCan", payment.fishCan);
    removeItems("waterBottle", payment.waterBottle);
    await say("You hand over the supplies. The old sailor looks satified.");
    await travelTo("pointDriftt", "Sailing on the Ramlaris to Point Driftt");
    await say([
        { who: "", text: "After a long trip, the Ramlaris arrives at its destination, point Driftt." },
        { who: sailor, text: "That's it for now, off you go. Thanks for your help." },
    ]);
}

export const ramlaris = {
    button: "ramlaris",
    isOpen: (time, day) => shipArrived(day),
    open: talkToSailor,
};

