import { luckRod } from "../../data/gear.js";
import { lines } from "../../data/dialogue.js";
import { getItemAmount, removeItems } from "../../itemBag.js";
import { giveGear } from "../../gear.js";
import { say, ask, pick } from "../../dialogue.js";
import { loadObject, save } from "../../save.js";
import { ritualAttended } from "./ritual.js";
import { refreshEvents } from "../../islands.js";

const trinketsWanted = 3;
const trinket = "luckCharm";

let visit = { met: false, done: false, gone: false, ...loadObject("saveFortuneTeller") };

function saveVisit() {
    save("saveFortuneTeller", visit);
}

async function visitFortuneTeller() {
    const values = { amount: trinketsWanted, have: getItemAmount(trinket) };

    if (visit.done) {
        await say(lines.fortuneTeller.goodbye, "fortuneTeller", values);
        visit.gone = true;
        saveVisit();
        refreshEvents();
        return;
    }

    if (!visit.met) {
        visit.met = true;
        saveVisit();
        await say(lines.fortuneTeller.firstMeeting, "fortuneTeller", values);
    }
    await say(pick(lines.fortuneTeller.request), "fortuneTeller", values);

    if (getItemAmount(trinket) < trinketsWanted) {
        await say(pick(lines.fortuneTeller.notEnough), "fortuneTeller", values);
        return;
    }

    const answer = await ask(lines.fortuneTeller.askGive, ["Give " + trinketsWanted + " luck trinkets", "Not now"], "fortuneTeller", values);
    if (answer === "Not now") {
        await say(pick(lines.fortuneTeller.notNow), "fortuneTeller", values);
        return;
    }

    await say(lines.fortuneTeller.fortune, "fortuneTeller", values);
    await giveGear(luckRod); 
    removeItems(trinket, trinketsWanted);
    visit.done = true;
    saveVisit();
    await say("You got the " + luckRod.name + "! (" + luckRod.effect + ")");
}

export const fortuneTeller = {
    button: "fortuneTeller",
    isOpen: time => ritualAttended() && !visit.gone && time === "evening",
    open: visitFortuneTeller,
};
