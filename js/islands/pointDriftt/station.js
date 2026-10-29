import { station as numbers } from "../../data/pointDriftt.js";
import { lines } from "../../data/dialogue.js";
import { isStationOpen } from "../../rules/schedule.js";
import { getState } from "../../state.js";
import { say, pick, fill } from "../../dialogue.js";
import { resonanceShop } from "../../resonanceShop.js";
import { openPopup } from "../../ui.js";
import { addText } from "../../helpers.js";

const researcher = "stationResearcher";
let greeting = "";

const resonated = () => (getState().driftt ? getState().driftt.rankResonations : 0);
const upgraded = () => resonated() >= numbers.rodsWanted;

const shop = resonanceShop({
    box: document.getElementById("stationItem"),
    onOpen: () => greeting = pick(lines.stationResearcher.greeting),
    top: box => {
        addText(box, "Resonance researcher: \"" + greeting + "\"");
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
