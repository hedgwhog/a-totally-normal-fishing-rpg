import { birds } from "../shared/data/birds.js";
import { findItem } from "../shared/data/items.js";
import { discoverableTiles, compass } from "../shared/rules/birds.js";
import { getState, onState, act, multiplayerAllowed } from "../core/state.js";
import { showArt } from "../core/ascii.js";
import { say, askYesNo } from "../core/dialogue.js";
import { openPopup } from "../core/ui.js";
import { addText, addButton } from "../core/helpers.js";
import { openMail } from "./mail.js";

// You get the bird from the mayor islands/freshwaterHaven/mayor.js
// You can send mail (mail.js)
// The time is irl time. All the numbers are in data/birds.js

const slot = document.getElementById("inventoryBird");
const slotArt = document.getElementById("ASCIIBird");
const slotName = document.getElementById("nameBird");
const slotEffect = document.getElementById("effectBird");
const popup = document.getElementById("birdDisplay");
const title = document.getElementById("birdTitle");
const page = document.getElementById("birdItem");

const food = findItem(birds.food);

export function getBird() {
    return getState().bird;
}

export function birdFood() {
    return getState().items[birds.food] || 0;
}

// It is supposed to be made so that you dont know when the bird is back. The time of its travels, will never be showed to the player. So all the player may know is: Out exploring
export function birdStatus(bird = getBird()) {
    if (!bird) return "";
    if (!bird.job) return "Home, ready to fly";
    if (bird.job.type === "discover") return "Out exploring...";
    return "Out with a letter for " + bird.job.toName + "...";
}

let shownArt = null;

function showSlot() {
    const bird = getBird();
    const art = !bird ? "ascii/bird/unknown.txt" : bird.job ? "ascii/bird/away.txt" : "ascii/bird/pigeon.txt";
    if (art !== shownArt) {
        shownArt = art;
        showArt(slotArt, art);
    }
    slot.classList.toggle("noBird", !bird);
    slot.classList.toggle("birdAway", Boolean(bird && bird.job));
    slotName.textContent = bird ? bird.name : "???";
    slotEffect.textContent = bird ? birdStatus(bird) : "Something will live here one day.";
}

slot.addEventListener("click", () => {
    if (document.getElementById("nextFish").disabled) return;
    if (!getBird()) return say("An empty perch. Maybe someone in Freshwater Haven knows more...\n\nThe mayor in the town hall, perhaps?");
    openBird();
});

export function openBird() {
    showPopup();
    openPopup(popup);
}

function showPopup() {
    const bird = getBird();
    if (!bird) return;
    title.textContent = bird.name;
    page.innerHTML = "";

    const top = document.createElement("div");
    top.className = "birdTop";
    const art = document.createElement("pre");
    showArt(art, bird.job ? "ascii/bird/away.txt" : "ascii/bird/pigeon.txt");
    const info = document.createElement("div");
    addText(info, "Your carrier pigeon.");
    addText(info, birdStatus(bird) + ".");
    addText(info, food.name + ": " + birdFood() + " (the marketplace sells it)");
    top.append(art, info);
    page.appendChild(top);

    const nameRow = document.createElement("div");
    nameRow.className = "birdName";
    const label = document.createElement("label");
    label.textContent = "Name: ";
    const input = document.createElement("input");
    input.value = bird.name;
    input.maxLength = birds.maxNameLength;
    label.appendChild(input);
    nameRow.appendChild(label);
    addButton(nameRow, "Rename", () => rename(input.value));
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") rename(input.value);
    });
    page.appendChild(nameRow);

    const actions = document.createElement("div");
    actions.className = "birdActions";
    const directions = document.createElement("div");
    directions.className = "birdDirections";
    directions.append("Send out to discover waters (" + birds.discoverFood + " birdfood): ");
    for (const direction of compass) {
        const left = discoverableTiles(getState(), direction).length;
        const button = addButton(directions, capital(direction) + (left > 0 ? "" : " (nothing new)"), () => discover(direction));
        button.title = left > 0 ? "New waters to find in the " + direction : "Nothing left to find in the " + direction + " from here";
    }
    actions.appendChild(directions);
    // players under 16 play alone: their pigeon only explores
    if (multiplayerAllowed()) addButton(actions, "Send out with a letter (" + birds.mailFood + " birdfood)", () => openMail("mailWrite"));
    page.appendChild(actions);

    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "It flies 1 hour per tile, and back again. It keeps flying while you're logged out. "
        + "Pick a direction: the map is split corner to corner, so east is everything between the top right and bottom right corner. "
        + "It finds a random spot in that direction next to what's on your map, and it can't find map pieces of islands.";
    page.appendChild(note);
}

async function rename(name) {
    const clean = name.trim();
    if (!clean || clean === getBird().name) return;
    const result = await act("bird.rename", { name: clean });
    if (result.error) return say(result.error);
}

const capital = text => text[0].toUpperCase() + text.slice(1);

async function discover(direction) {
    const bird = getBird();
    if (bird.job) return say(bird.name + " is still out flying. " + birdStatus(bird) + ".");
    if (birdFood() < birds.discoverFood) return say(bird.name + " needs " + birds.discoverFood + " birdfood for this trip. You have " + birdFood() + ".\n\nThe marketplace sells birdfood.");
    if (discoverableTiles(getState(), direction).length === 0) return say(bird.name + " can't find any new waters in the " + direction + " from here. Try another direction.");
    if (!await askYesNo("Send " + bird.name + " out to the " + direction + " to discover new waters?\n\nIt costs " + birds.discoverFood + " birdfood. It flies to a random spot in the " + direction + " next to what you know, and back.")) return;
    const result = await act("bird.discover", { direction });
    if (result.error) return say(result.error);
    await say(bird.name + " flies off over the water.\n\nWho knows when it will be back...");
}

function refresh() {
    showSlot();
    if (getComputedStyle(popup).display !== "none") showPopup();
}

onState(refresh);
refresh();
