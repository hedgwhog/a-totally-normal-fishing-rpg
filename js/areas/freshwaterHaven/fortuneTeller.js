import { luckRod } from "../../shared/data/gear.js";
import { fortuneTeller as numbers } from "../../shared/data/quests.js";
import { isFortuneTellerHere } from "../../shared/rules/schedule.js";
import { lines } from "../../shared/data/dialogue.js";
import { getItemAmount } from "../../player/itemBag.js";
import { handlePendingGear } from "../../player/gear.js";
import { getState, act, localKey } from "../../core/state.js";
import { say, ask, pick } from "../../core/dialogue.js";

async function visitFortuneTeller() {
    const values = { amount: numbers.trinketsWanted, have: getItemAmount(numbers.trinket) };

    if (getState().fortune.done) {
        await say(lines.fortuneTeller.goodbye, "fortuneTeller", values);
        await act("fortune.goodbye");
        return;
    }

    if (!localStorage.getItem(localKey("metFortuneTeller"))) {
        localStorage.setItem(localKey("metFortuneTeller"), "true");
        await say(lines.fortuneTeller.firstMeeting, "fortuneTeller", values);
    }
    await say(pick(lines.fortuneTeller.request), "fortuneTeller", values);

    if (getItemAmount(numbers.trinket) < numbers.trinketsWanted) return say(pick(lines.fortuneTeller.notEnough), "fortuneTeller", values);

    const answer = await ask(lines.fortuneTeller.askGive, ["Give " + numbers.trinketsWanted + " luck trinkets", "Not now"], "fortuneTeller", values);
    if (answer === "Not now") return say(pick(lines.fortuneTeller.notNow), "fortuneTeller", values);

    const result = await act("fortune.give");
    if (result.error) return say(result.error);
    await say(lines.fortuneTeller.fortune, "fortuneTeller", values);
    await handlePendingGear();
    await say("You got the " + luckRod.name + "! (" + luckRod.effect + ")");
}

export const fortuneTeller = {
    button: "fortuneTeller",
    isOpen: (time, day, save) => isFortuneTellerHere(save, time),
    open: visitFortuneTeller,
};
