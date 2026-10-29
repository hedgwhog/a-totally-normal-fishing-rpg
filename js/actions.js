import { allFish } from "./data/fish.js";
import { act, getState } from "./state.js";
import { startFishing } from "./fishing.js";
import { say, pick } from "./dialogue.js";
import { lines as dialogue } from "./data/dialogue.js";
import { travel } from "./travel.js";
import { holdIsland } from "./islands.js";
import { closeAllPopups } from "./ui.js";
import { formatNumber } from "./helpers.js";

function nothingToCatch(reason, rod) {
    if (reason === "quiet") return say("The water here is strangely quiet. Nothing bites yet.");
    if (reason === "night") return say("It's pitch dark. Your " + rod + " can't catch anything at night.\n\nYou should go to sleep.");
    if (reason === "notNow") return say("Nothing bites on your " + rod + " right now.");
    if (getState().island === "hadalDeep") return say("Your " + rod + " can't reach the hadal fish.\n\nEquip your deep fishing rod, or head back with the boatman.");
    return say("Your " + rod + " can't catch anything here.");
}

async function goFishing() {
    const start = await act("fish.start");
    if (start.error) return say(start.error);
    if (start.none) return nothingToCatch(start.none, start.rod);

    const type = allFish.find(fish => fish.id === start.fishId);
    const onTrip = getState().island === "hadalDeep";
    const caught = await startFishing(type);
    if (onTrip) holdIsland(true);
    const result = await act("fish.finish", { caught });
    if (result.error) {
        if (onTrip) holdIsland(false);
        return say(result.error);
    }

    if (!result.caught) {
        await say("The fish got away...");
        if (result.tripOver) await sailBack(dialogue.boatman.missed);
        return;
    }
    const lines = ["+" + formatNumber(result.resonance) + " Resonance"];
    for (const name of result.drops) lines.push("Something else was on your hook: a " + name + "!");
    if (result.mapPiece) lines.push("You got a piece of a map!\nIt goes straight into your world map (Map, at the top).");
    if (result.newSpecies) lines.push("New species! The " + type.name + " was added to your catalogue.");
    await say("You caught a " + type.name + "!\n\n" + lines.join("\n"));
    if (result.tripOver) await sailBack(dialogue.boatman.caught);
}

async function sailBack(boatmanLines) {
    await say(pick(boatmanLines), "boatman");
    await travel("The boatman sails you back to Point Driftt", async () => ({}));
    await say(dialogue.boatman.back);
}

async function sleep() {
    closeAllPopups();
    const result = await act("time.sleep");
    if (result.error) await say(result.error);
}

async function rest() {
    closeAllPopups();
    const result = await act("time.rest");
    if (result.error) await say(result.error);
}

function openChat() {
    window.open("chat.html", "chat", "width=400,height=560");
}

document.getElementById("nextFish").addEventListener("click", goFishing);
document.getElementById("nextDay").addEventListener("click", sleep);
document.getElementById("rest").addEventListener("click", rest);
document.getElementById("openChat").addEventListener("click", openChat);
document.getElementById("switchSave").addEventListener("click", () => location.reload());

if (getState().fishing) goFishing();
