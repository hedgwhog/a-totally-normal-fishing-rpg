import { contract } from "../../shared/data/areas/pointDriftt.js";
import { hadalFish } from "../../shared/data/fish.js";
import { lines } from "../../shared/data/dialogue.js";
import { getState, onState, act } from "../../core/state.js";
import { getFishAmount } from "../../player/fishBag.js";
import { say, pick } from "../../core/dialogue.js";
import { openPopup } from "../../core/ui.js";
import { addText, addButton } from "../../core/helpers.js";
import { barText } from "../../shared/rules/completion.js";

const director = "director";
const page = document.getElementById("researchItem");
const popup = document.getElementById("researchDisplay");
let greeting = "";

const delivered = () => (getState().driftt ? getState().driftt.delivered : 0);
const left = () => Math.max(0, contract.hadalFishWanted - delivered());

function showResearch() {
    page.innerHTML = "";
    addText(page, "Research director: \"" + greeting + "\"");
    addText(page, "");
    addText(page, "Your contract: " + delivered() + " / " + contract.hadalFishWanted + " hadal fish");
    addText(page, barText(delivered() / contract.hadalFishWanted, 24));
    addText(page, "");

    if (left() === 0) {
        addText(page, "\"" + pick(lines.director.afterContract) + "\"");
        showDonations();
        return;
    }

    const yours = hadalFish.filter(type => getFishAmount(type.id) > 0);
    if (yours.length === 0) {
        addText(page, "\"" + pick(lines.director.noHadalFish) + "\"");
        return;
    }

    addText(page, "Your hadal fish:");
    for (const type of yours) {
        const have = getFishAmount(type.id);
        addButton(page, "Give 1 " + type.name + " (you have " + have + ")", () => give(type, 1));
        const all = Math.min(have, left());
        if (all > 1) addButton(page, "Give " + all + " " + type.name, () => give(type, all));
    }
}

function showDonations() {
    const yours = hadalFish.filter(type => getFishAmount(type.id) > 0);
    if (yours.length === 0) return;

    addText(page, "");
    addText(page, "Hadal fish can't be sold, but you can donate them to the research:");
    for (const type of yours) {
        const have = getFishAmount(type.id);
        addButton(page, "Donate 1 " + type.name + " (you have " + have + ")", () => donate(type, 1));
        if (have > 1) addButton(page, "Donate all " + have + " " + type.name, () => donate(type, have));
    }
}

async function donate(type, amount) {
    const result = await act("research.donate", { id: type.id, amount });
    if (result.error) return say(result.error);
    await say(pick(lines.director.donated), director);
    showResearch();
}

async function give(type, amount) {
    const result = await act("research.give", { id: type.id, amount });
    if (result.error) return say(result.error);
    if (result.done) await say(lines.director.done, director);
    else await say(pick(lines.director.thanks), director, { left: left() });
    showResearch();
}

onState(() => {
    if (getComputedStyle(popup).display !== "none") showResearch();
});

export const researchFacility = {
    button: "researchFacility",
    isOpen: () => true,
    open() {
        greeting = pick(lines.director.greeting);
        showResearch();
        openPopup(popup);
    },
};