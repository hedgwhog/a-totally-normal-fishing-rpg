import { fishByIsland, fishTimes } from "./data/fish.js";
import { islandNames } from "./islands.js";
import { isDiscovered, timesCaught } from "./fishLog.js";

const tabs = document.querySelectorAll(".catalogTabs button");
const pages = document.querySelectorAll(".catalogPage");
const fishPage = document.getElementById("catalogFish");

function showPage(pageId) {
    pages.forEach(page => page.style.display = (page.id === pageId) ? "block" : "none");
    tabs.forEach(tab => tab.classList.toggle("activeTab", tab.dataset.page === pageId));
}

tabs.forEach(tab => tab.addEventListener("click", () => showPage(tab.dataset.page)));

function timeText(type) {
    const times = fishTimes(type);
    if (times.length === 1) return times[0];
    if (times.includes("night")) return "always";
    return "day";
}

function addLine(box, text) {
    const line = document.createElement("div");
    line.textContent = text;
    box.appendChild(line);
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
    addLine(slot, "Bites: " + timeText(type));
    addLine(slot, "Worth: " + type.price + (type.price === 1 ? " coin" : " coins"));
    addLine(slot, "Caught: " + timesCaught(type.id));
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

document.addEventListener("fishLogChanged", showFishPage);

showFishPage();
showPage("catalogFish");
