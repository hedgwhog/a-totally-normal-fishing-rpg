import { fishByIsland } from "../../data/fish.js";
import { researcherRounds } from "../../data/quests.js";
import { getTime } from "../../time.js";
import { getFishAmount } from "../../fishBag.js";
import { getState, act } from "../../state.js";
import { say, pick } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";
import { openPopup } from "../../ui.js";
import { addText, addButton } from "../../helpers.js";

const researcher = "researcher";
const fishList = fishByIsland.freshwaterHaven;
const page = document.getElementById("ichthyologistItem");

const quest = () => getState().researcher;
const finishedResearch = () => !researcherRounds[quest().round - 1];

function showResearcher() {
    page.innerHTML = "";
    addText(page, "\"" + pick(lines.researcher.greeting[getTime()]) + "\"");
    addText(page, "");

    if (finishedResearch()) {
        addText(page, "\"" + pick(lines.researcher.stillStudying) + "\"");
        return;
    }

    const round = researcherRounds[quest().round - 1];
    addText(page, "\"" + pick(lines.researcher.questIntro) + "\"");
    quest().wanted.forEach(id => {
        const type = fishList.find(fish => fish.id === id);
        addText(page, "- " + type.name + " (you have " + getFishAmount(id) + ")");
    });
    addText(page, "");
    addText(page, "Reward: " + round.coins + " coins & " + round.resonance + " resonance");
    addButton(page, "Give the fish", giveFish);
}

async function giveFish() {
    if (quest().wanted.some(id => getFishAmount(id) === 0)) return say(lines.researcher.missingFish, researcher);

    const result = await act("researcher.give");
    if (result.error) return say(result.error);
    showResearcher();

    const thanks = lines.researcher.thanks[result.round - 1] || [];
    if (thanks.length > 0) await say(thanks, researcher);
    await say("You got " + result.coins + " coins & " + result.resonance + " resonance!");
    if (result.phoneCall) await say(lines.researcher.phoneCall);
}

export const ichthyologist = {
    button: "ichthyologist",
    isOpen: () => true,
    open() {
        showResearcher();
        openPopup("ichthyologistDisplay");
    },
};
