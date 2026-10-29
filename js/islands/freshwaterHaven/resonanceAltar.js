import { altar as numbers } from "../../data/quests.js";
import { isAltarOpen } from "../../rules/schedule.js";
import { lines } from "../../data/dialogue.js";
import { pick } from "../../dialogue.js";
import { resonanceShop } from "../../resonanceShop.js";
import { openPopup } from "../../ui.js";
import { addText } from "../../helpers.js";

let greeting = "";

const shop = resonanceShop({
    box: document.getElementById("resonanceItem"),
    onOpen: () => greeting = pick(lines.altarKeeper.greeting),
    top: box => {
        addText(box, "Altar keeper: \"" + greeting + "\"");
        addText(box, "");
    },
    levels: () => numbers.levels,
    dissonanceCost: numbers.dissonanceCost,
    resonateAction: "altar.resonate",
    dissonanceAction: "altar.dissonance",
});

export const resonanceAltar = {
    button: "resonance",
    isOpen: (time, day) => isAltarOpen(time, day),
    open() {
        shop.open();
        openPopup("resonanceDisplay");
    },
};
