// The resonance library of the Capital: always open, but only rank I and II.
import { library as numbers } from "../../shared/data/areas/pantryIsles.js";
import { lines } from "../../shared/data/dialogue.js";
import { pick } from "../../core/dialogue.js";
import { openPanel, panelBox } from "../../core/panel.js";
import { resonanceShop } from "../../systems/resonanceShop.js";
import { addText } from "../../core/helpers.js";

let greeting = "";

const shop = resonanceShop({
    box: panelBox,
    onOpen: () => greeting = pick(lines.librarian.greeting),
    top: box => {
        addText(box, "Librarian Folio: \"" + greeting + "\"");
        addText(box, "");
    },
    levels: () => numbers.levels,
    dissonanceCost: numbers.dissonanceCost,
    resonateAction: "library.resonate",
    dissonanceAction: "library.dissonance",
});

export const resonanceLibrary = {
    button: "capitalLibrary",
    open: () => openPanel({ title: "Resonance library", note: "Always open. Only rank I and II.", render: () => shop.open(), live: false }),
};
