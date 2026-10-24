import { travelTo } from "../../travel.js";
import { askYesNo, say } from "../../dialogue.js";

async function sailBack() {
    const sure = await askYesNo(
        "A small fishing boat is about to leave for Freshwater Haven.\nDo you want to sail back?",
        "", "Sail back", "Stay here"
    );
    if (!sure) return;
    await travelTo("freshwaterHaven", "Sailing back to Freshwater Haven");
    await say("You're back in Freshwater Haven.");
}

export const backToHaven = {
    button: "backToHaven",
    isOpen: () => true, 
    open: sailBack,
};
