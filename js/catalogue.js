import { fishByIsland, fishTimes, isSellable } from "./data/fish.js";
import {  mechanics } from "./data/catalogue.js";
import { islandNames } from "./islands.js";
import { isDiscovered, timesCaught } from "./fishLog.js";
import { getState, onState } from "./state.js";

const tabs = document.querySelectorAll("#catalogDisplay .catalogTabs button");
const pages = document.querySelectorAll(".catalogPage");
const fishPage = document.getElementById("catalogFish");
const mechanicsPage = document.getElementById("catalogMechanics");

function showPage(pageId) {
    pages.forEach(page => page.style.display = (page.id === pageId) ? "block" : "none");
    tabs.forEach(tab => tab.classList.toggle("activeTab", tab.dataset.page === pageId));
}

tabs.forEach(tab => tab.addEventListener("click", () => showPage(tab.dataset.page)));

function timeText(type) {
    const times = fishTimes(type);
    if (times.length === 4) return "always";
    if (times.length === 1) return times[0];
    if (times.length === 3 && !times.includes("night")) return "day";
    return times.join(" & ");
}

function addLine(box, text, tag = "div") {
    const line = document.createElement(tag);
    line.textContent = text;
    box.appendChild(line);
    return line;
}

function fishSlot(type) {
    const slot = document.createElement("div");
    slot.className = "fishSlot";

    if (!isDiscovered(type.id)) {
        slot.classList.add("unknownFish");
        addLine(slot, "???");
        addLine(slot, "Water: " + type.waters.join(", "));
        return slot;
    }

    const name = document.createElement("div");
    name.className = "fishSlotName";
    name.textContent = type.name;
    slot.appendChild(name);
    addLine(slot, "Water: " + type.waters.join(", "));
    addLine(slot, "Time: " + timeText(type));
    addLine(slot, "Worth: " + (isSellable(type) ? type.price + (type.price === 1 ? " coin" : " coins") : "can't be sold"));
    addLine(slot, "Caught: " + timesCaught(type.id));
    addLine(slot, "Chance: " + type.chance + "%");
    addLine(slot, "Rarity: " + type.rarity);
    return slot;
}

function showFishPage() {
    fishPage.innerHTML = "";

    for (const [island, fishList] of Object.entries(fishByIsland)) {
        if (fishList.length === 0) continue;

        const discovered = fishList.filter(type => isDiscovered(type.id)).length;
        const title = document.createElement("h3");
        title.textContent = islandNames[island] + " (" + discovered + "/" + fishList.length + " discovered)";
        fishPage.appendChild(title);

        const slots = document.createElement("div");
        slots.className = "fishSlots";
        fishList.forEach(type => slots.appendChild(fishSlot(type)));
        fishPage.appendChild(slots);
    }
}

function showMechanicsPage() {
    mechanicsPage.innerHTML = "";
    const save = getState();
    for (const part of mechanics) {
        if (part.show && !part.show(save)) continue;
        const section = document.createElement("div");
        section.className = "catalogSection";
        addLine(section, part.title, "h3");
        part.text.forEach(text => addLine(section, text, "p"));
        mechanicsPage.appendChild(section);
    }
}

document.addEventListener("fishLogChanged", showFishPage);
onState((state, previous) => {
    if (!previous || JSON.stringify(state.visited) !== JSON.stringify(previous.visited)) {
        showMechanicsPage();
    }
});

showFishPage();
showMechanicsPage();
showPage("catalogFish");
