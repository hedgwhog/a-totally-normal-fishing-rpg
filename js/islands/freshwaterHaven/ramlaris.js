import { findItem } from "../../data/items.js";
import { ramlaris as numbers } from "../../data/quests.js";
import { shipArrived } from "../../rules/schedule.js";
import { onTimeChange } from "../../time.js";
import { getIsland } from "../../islands.js";
import { totalFish } from "../../fishBag.js";
import { getItemAmount } from "../../itemBag.js";
import { getState, act, localKey } from "../../state.js";
import { travel } from "../../travel.js";
import { say, ask } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";

const sailor = "sailor";

function listText(amounts) {
    const parts = Object.entries(amounts).map(([id, amount]) => amount + " " + findItem(id).name);
    return parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts.join("");
}

const hasPayment = () => Object.entries(numbers.payment).every(([id, amount]) => getItemAmount(id) >= amount);

onTimeChange((time, day) => {
    const key = localKey("shipAnnounced");
    if (localStorage.getItem(key) || !shipArrived(getState(), day) || getIsland() !== "freshwaterHaven") return;
    localStorage.setItem(key, "true");
    say(lines.sailor.arrival);
});

async function talkToSailor() {
    const have = {};
    for (const id of Object.keys(numbers.payment)) have[id] = getItemAmount(id);
    const values = { payment: listText(numbers.payment), have: listText(have) };

    if (!localStorage.getItem(localKey("metSailor"))) {
        localStorage.setItem(localKey("metSailor"), "true");
        await say(lines.sailor.firstMeeting, sailor, values);
    }
    if (totalFish() > 0) return say(lines.sailor.hasFish, sailor, values);
    if (!hasPayment()) return say(lines.sailor.shortSupplies, sailor, values);

    const answer = await ask(lines.sailor.askBoard, ["Board the Ramlaris", "Not yet"], sailor, values);
    if (answer !== "Board the Ramlaris") return say(lines.sailor.notYet, sailor, values);

    await say(lines.sailor.paid, sailor, values);
    const result = await travel("Sailing on the Ramlaris to Point Driftt", () => act("ramlaris.board"));
    if (result.error) return say(result.error);
    await say(lines.sailor.arrived, sailor, values);
}

export const ramlaris = {
    button: "ramlaris",
    isOpen: (time, day, save) => shipArrived(save, day),
    open: talkToSailor,
};

