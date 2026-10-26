import { travelTo } from "../../travel.js";
import { askYesNo, say } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";

async function sailBack() {
    const sure = await askYesNo(lines.boatman.askSail, "boatman", "Sail back", "Stay here");
    if (!sure) return;
    await travelTo("freshwaterHaven", "Sailing back to Freshwater Haven");
    await say(lines.boatman.back);
}

export const backToHaven = {
    button: "backToHaven",
    isOpen: () => true, 
    open: sailBack,
};
