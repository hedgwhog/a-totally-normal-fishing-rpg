import { altar as numbers } from "../../shared/data/quests.js";
import { isAltarOpen } from "../../shared/rules/schedule.js";
import { lines } from "../../shared/data/dialogue.js";
import { pick } from "../../core/dialogue.js";
import { resonanceShop } from "../../systems/resonanceShop.js";
import { openPopup } from "../../core/ui.js";
import { addText } from "../../core/helpers.js";

let greeting = "";

const shop = resonanceShop({
    box: document.getElementById("resonanceItem"),
    onOpen: () => greeting = pick(lines.altarKeeper.greeting),
    top: box => {
        addText(box, "Mr/Miss. ?: \"" + greeting + "\"");
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
