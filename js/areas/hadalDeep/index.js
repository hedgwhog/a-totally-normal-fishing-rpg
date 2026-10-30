import { addEvent } from "../areas.js";
import { lines } from "../../shared/data/dialogue.js";
import { boatman } from "../../shared/data/areas/pointDriftt.js";
import { act } from "../../core/state.js";
import { travel } from "../../screens/travel.js";
import { say, askYesNo } from "../../core/dialogue.js";

async function headBack() {
    if (!await askYesNo(lines.boatman.askReturn, "boatman", "Head back", "Stay")) return;
    const result = await travel("Kaya sails you back to Point Driftt", () => act("hadal.return"), { kind: "boat", days: boatman.travelDays, from: "The Hadal Deep", to: "Point Driftt" });
    if (result.error) return say(result.error);
    await say(lines.boatman.back);
}

addEvent("hadalDeep", {
    button: "hadalReturn",
    isOpen: () => true,
    open: headBack,
});
