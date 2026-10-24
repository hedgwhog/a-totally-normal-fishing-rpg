import { fishByIsland } from "../../data/fish.js";
import { getTime } from "../../time.js";
import { getFishAmount, removeFish } from "../../fishBag.js";
import { addCoins } from "../../wallet.js";
import { addResonance } from "../../resonance.js";
import { say } from "../../dialogue.js";
import { openPopup } from "../../ui.js";
import { loadObject, save } from "../../save.js";
import { addText, addButton } from "../../helpers.js";
import { shipCalled, callShip } from "./ramlaris.js";

const researcher = "Ichthyologist"; // the name above her dialogue
const fishList = fishByIsland.freshwaterHaven;
const rareFish = ["catfish", "muskie"]; // the rare shallow and coastal fish

const rounds = [
    { waters: ["shallow"], extra: [], coins: 10, resonance: 5 },
    { waters: ["coastal"], extra: [], coins: 15, resonance: 10 },
    { waters: ["shallow", "coastal"], extra: rareFish, coins: 25, resonance: 20 },
];

// what she says when you finish a round, it goes down in an array
const thanks = [
    [
        "OH! You actually brought them.",
        "Here, take this! And come back soon, I already have a new list.",
    ],
    [
        "You're back! Was I asleep? I don't think I was asleep. Here is your reward:",
    ],
    [
        "You brought me a Catfish and a Muskie!? Thank you so much!"
    ],
];

// her greeting changes with the time of the day
const greetings = {
    morning: "Is it morning already? I haven't slept yet. Again. Who cares, I have fish to study!",
    afternoon: "Afternoon? I took a nap at six. In the morning. Or was it yesterday? Anyway, hi!",
    evening: "Finally evening. My brain only really wakes up now. Coffee number nine, let's go.",
    night: "Oh, you're up too?! Nights are the best for research. Nobody interrupts me. I love it.",
};

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
    addText(page, "\"" + greetings[getTime()] + "\"");
    addText(page, "");

    if (finishedResearch()) {
        addText(page, "\"I'm still studying your fish!\"");
        return;
    }

    const quest = rounds[progress.round - 1];
    addText(page, "\"Could you bring me one of each of these? Pretty please? It's for science! Everything is for science!\"");
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
        await say([
            "Hmm, hmm, hmm... nope! You're missing some.",
            "I need ALL of them. One of each. Did I mention it's for science? It's for science.",
        ], researcher);
        return;
    }

    const quest = rounds[progress.round - 1];
    const lines = thanks[progress.round - 1];
    progress.wanted.forEach(id => removeFish(id, 1));
    addCoins(quest.coins);
    addResonance(quest.resonance);

    progress = newQuest(progress.round + 1);
    saveProgress();
    showResearcher();

    await say(lines, researcher);
    await say("You got " + quest.coins + " coins & " + quest.resonance + " resonance!");

    if (finishedResearch()) await phoneCall();
}

async function phoneCall() {
    await say([
        { who: "", text: "Somewhere under a mountain of notes, a phone starts ringing." },
        { who: researcher, text: "Hellooo? Oh, hi Gramps! ...You need help with your research at Point Driftt?" },
        { who: researcher, text: "I can't come, I'm busy with these fish! But I know someone who can help you..." },
        { who: "", text: "She points at you. Nobody asked you." },
        { who: researcher, text: "Great! See you in 11 days! Well, not me, them! Bye!" },
        { who: "", text: "She hangs up." },
        { who: researcher, text: "Gramps will pick you up with his ship, the Ramlaris. It will be at the dock in 11 days. He'll wait until you're ready." },
    ]);
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
