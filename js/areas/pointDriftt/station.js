import { station as numbers } from "../../shared/data/areas/pointDriftt.js";
import { lines } from "../../shared/data/dialogue.js";
import { isStationOpen } from "../../shared/rules/schedule.js";
import { getState } from "../../core/state.js";
import { say, pick, fill } from "../../core/dialogue.js";
import { resonanceShop } from "../../systems/resonanceShop.js";
import { openPopup } from "../../core/ui.js";
import { addText } from "../../core/helpers.js";

const researcher = "Dr. Sparky";
let greeting = "";

const resonated = () => (getState().driftt ? getState().driftt.rankResonations : 0);
const upgraded = () => resonated() >= numbers.rodsWanted;

const shop = resonanceShop({
    box: document.getElementById("stationItem"),
    onOpen: () => greeting = pick(lines.stationResearcher.greeting),
    top: box => {
        addText(box, "Dr. Sparky: \"" + greeting + "\"");
        const research = upgraded()
            ? lines.stationResearcher.afterUpgrade
            : fill(lines.stationResearcher.research, { count: resonated(), wanted: numbers.rodsWanted });
        addText(box, "\"" + research + "\"");
        addText(box, "");
    },
    levels: () => (upgraded() ? [...numbers.levels, numbers.upgradeLevel] : numbers.levels),
    dissonanceCost: numbers.dissonanceCost,
    resonateAction: "station.resonate",
    dissonanceAction: "station.dissonance",
    afterResonate: async result => {
        if (result.stationUpgraded) await say(lines.stationResearcher.upgraded, researcher);
    },
});

export const resonanceStation = {
    button: "resonanceStation",
    isOpen: time => isStationOpen(time),
    open() {
        shop.open();
        openPopup("stationDisplay");
    },
};
