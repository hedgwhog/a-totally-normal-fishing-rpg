import { addEvent } from "../../islands.js";
import { lines } from "../../data/dialogue.js";
import { act } from "../../state.js";
import { travel } from "../../travel.js";
import { say, askYesNo } from "../../dialogue.js";

async function headBack() {
    if (!await askYesNo(lines.boatman.askReturn, "boatman", "Head back", "Stay")) return;
    const result = await travel("The boatman sails you back to Point Driftt", () => act("hadal.return"));
    if (result.error) return say(result.error);
    await say(lines.boatman.back);
}

addEvent("hadalDeep", {
    button: "hadalReturn",
    isOpen: () => true,
    open: headBack,
});
