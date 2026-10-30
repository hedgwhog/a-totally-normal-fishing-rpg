import { mayor as numbers } from "../../shared/data/quests.js";
import { lines } from "../../shared/data/dialogue.js";
import { getState, onState, act } from "../../core/state.js";
import { say, pick, fill, whenFree } from "../../core/dialogue.js";
import { openPopup } from "../../core/ui.js";
import { addText, addButton, coinsText } from "../../core/helpers.js";
import { openBird } from "../../systems/bird.js";
import { whenIntroSeen } from "../../screens/intro.js";

const page = document.getElementById("mayorItem");
const values = () => ({ helps: numbers.tavernHelps, donation: numbers.donation, bird: getState().bird ? getState().bird.name : "" });
const helped = () => Math.min(numbers.tavernHelps, getState().tavernHelped || 0);
const ready = () => helped() >= numbers.tavernHelps && getState().mayor.donated;

function showMayor() {
    page.innerHTML = "";
    addText(page, "\"" + fill(pick(lines.mayor.greeting), values()) + "\"");
    addText(page, "");

    if (getState().bird) {
        addText(page, "\"" + fill(pick(lines.mayor.afterGift), values()) + "\"");
        return;
    }

    addText(page, "\"" + fill(pick(lines.mayor.request), values()) + "\"");
    addText(page, "");
    addText(page, "Help out the tavern: " + helped() + " / " + numbers.tavernHelps);
    addText(page, "Donate to the town: " + (getState().mayor.donated ? "done" : "0 / " + coinsText(numbers.donation)));
    addText(page, "");
    if (!getState().mayor.donated) addButton(page, "Donate " + coinsText(numbers.donation), donate);
    if (ready()) addButton(page, "Accept the carrier pigeon", claim);
}

async function donate() {
    if (getState().coins < numbers.donation) return say("You need " + coinsText(numbers.donation) + " to donate.");
    const result = await act("mayor.donate");
    if (result.error) return say(result.error);
    await say(lines.mayor.thanks, "mayor", values());
}

async function claim() {
    const result = await act("mayor.claim");
    if (result.error) return say(result.error);
    await say(lines.mayor.gift, "mayor", values());
    openBird();
}

async function welcome() {
    const save = getState();
    if (save.mayor.met || save.island !== "freshwaterHaven") return;
    await whenIntroSeen();
    await whenFree();
    if (getState().mayor.met) return;
    await say(lines.mayor.welcome, "mayor", values());
    await act("mayor.met");
}

onState(() => {
    if (getComputedStyle(document.getElementById("mayorDisplay")).display !== "none") showMayor();
});
welcome();

export const mayor = {
    button: "mayor",
    open() {
        showMayor();
        openPopup("mayorDisplay");
    },
};
