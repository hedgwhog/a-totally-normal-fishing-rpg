import { ferry } from "../data/ferry.js";
import { nextDeparture, ferryOpen, otherPort } from "../rules/ferry.js";
import { islandNames } from "../data/islands.js";
import { lines } from "../data/dialogue.js";
import { getState, act } from "../state.js";
import { getCoins } from "../wallet.js";
import { travel } from "../travel.js";
import { say, ask } from "../dialogue.js";
import { coinsText } from "../helpers.js";

const clerk = "ferryClerk";

async function visitFerry() {
    const save = getState();
    const here = save.island;
    const departure = nextDeparture(save.driftt.doneDay, save.day, here);
    const values = {
        price: coinsText(ferry.price),
        place: islandNames[otherPort(here)],
        days: ferry.travelDays,
        day: departure,
        wait: departure - save.day,
    };

    if (departure !== save.day) return say(lines.ferryClerk.notToday, clerk, values);

    const board = "Board (" + values.price + ")";
    const answer = await ask(lines.ferryClerk.askBoard, [board, "Not now"], clerk, values);
    if (answer !== board) return say(lines.ferryClerk.notNow, clerk, values);
    if (getCoins() < ferry.price) return say(lines.ferryClerk.noCoins, clerk, values);

    const result = await travel("The FFC ferry sails to " + values.place, () => act("ferry.board"));
    if (result.error) return say(result.error);
    await say(lines.ferryClerk.arrived, clerk, values);
}

export function ferryOffice(button) {
    return {
        button: button,
        isOpen: (time, day, save) => ferryOpen(save),
        open: visitFerry,
    };
}