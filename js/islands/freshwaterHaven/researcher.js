import { fishByIsland } from "../../data/fish.js";
import { getTime } from "../../time.js";
import { getFishAmount, removeFish } from "../../fishBag.js";
import { addCoins } from "../../wallet.js";
import { addResonance } from "../../resonance.js";
import { say, pick } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";
import { openPopup } from "../../ui.js";
import { loadObject, save } from "../../save.js";
import { addText, addButton } from "../../helpers.js";
import { shipCalled, callShip } from "./ramlaris.js";

const researcher = "researcher"; // her character in data/dialogue.js (name and portrait)
const fishList = fishByIsland.freshwaterHaven;
const rareFish = ["catfish", "muskie"]; // the rare shallow and coastal fish

const rounds = [
    { waters: ["shallow"], extra: [], coins: 10, resonance: 5 },
    { waters: ["coastal"], extra: [], coins: 15, resonance: 10 },
    { waters: ["shallow", "coastal"], extra: rareFish, coins: 25, resonance: 20 },
];

// What she says is in data/dialogue.js (lines.researcher).

function newQuest(round) {
    const quest = rounds[round - 1];
    if (!quest) return { round: round, wanted: [] };
    const pool = fishList.filter(type => type.waters.some(water => quest.waters.includes(water)) && !rareFish.includes(type.id));
    const randomFish = pool.sort(() => Math.random() - 0.5).slice(0, 3).map(type => type.id);
    return { round: round, wanted: [...quest.extra, ...randomFish] };
}

let progress = loadObject("saveFishResearcher");
if (!(progress.round >= 1)) {
    progress = newQuest(1);
} else if (!Array.isArray(progress.wanted) || !progress.wanted.every(id => fishList.some(type => type.id === id))) {
    progress = newQuest(progress.round);
}

function saveProgress() {
    save("saveFishResearcher", progress);
}
saveProgress();

function finishedResearch() {
    return !rounds[progress.round - 1];
}

const page = document.getElementById("ichthyologistItem");

function showResearcher() {
    page.innerHTML = "";
    addText(page, "\"" + pick(lines.researcher.greeting[getTime()]) + "\"");
    addText(page, "");

    if (finishedResearch()) {
        addText(page, "\"" + pick(lines.researcher.stillStudying) + "\"");
        return;
    }

    const quest = rounds[progress.round - 1];
    addText(page, "\"" + pick(lines.researcher.questIntro) + "\"");
    progress.wanted.forEach(id => {
        const type = fishList.find(fish => fish.id === id);
        addText(page, "- " + type.name + " (you have " + getFishAmount(id) + ")");
    });
    addText(page, "");
    addText(page, "Reward: " + quest.coins + " coins & " + quest.resonance + " resonance");
    addButton(page, "Give the fish", giveFish);
}

async function giveFish() {
    if (progress.wanted.some(id => getFishAmount(id) === 0)) {
        await say(lines.researcher.missingFish, researcher);
        return;
    }

    const quest = rounds[progress.round - 1];
    const thanks = lines.researcher.thanks[progress.round - 1] || [];
    progress.wanted.forEach(id => removeFish(id, 1));
    addCoins(quest.coins);
    addResonance(quest.resonance);

    progress = newQuest(progress.round + 1);
    saveProgress();
    showResearcher();

    if (thanks.length > 0) await say(thanks, researcher);
    await say("You got " + quest.coins + " coins & " + quest.resonance + " resonance!");

    if (finishedResearch()) await phoneCall();
}

async function phoneCall() {
    await say(lines.researcher.phoneCall);
    callShip();
}

export const ichthyologist = {
    button: "ichthyologist",
    isOpen: () => true, 
    async open() {
        showResearcher();
        openPopup("ichthyologistDisplay");
        if (finishedResearch() && !shipCalled()) await phoneCall();
    },
};
