import { loadSave } from "./save.js";
import { getTime, getDay, onTimeChange } from "./time.js";

export const islandNames = {
    freshwaterHaven: "Freshwater haven",
    pointDriftt: "Point Driftt",
};

let island = loadSave("saveIsland", "freshwaterHaven");
if (!islandNames[island]) island = "freshwaterHaven";

const events = [];

export function addEvent(islandId, event) {
    events.push({ island: islandId, ...event });
    document.getElementById(event.button).addEventListener("click", () => event.open());
}

export function refreshEvents() {
    for (const event of events) {
        const open = event.island === island && (!event.isOpen || event.isOpen(getTime(), getDay()));
        document.getElementById(event.button).style.display = open ? "block" : "none";
    }
}

function showIsland() {
    document.querySelectorAll(".island").forEach(islandBox => {
        islandBox.style.display = (islandBox.id === island) ? "block" : "none";
    });
    refreshEvents();
}

export function getIsland() {
    return island;
}

export function setIsland(id) {
    island = id;
    localStorage.setItem("saveIsland", JSON.stringify(island));
    showIsland();
}

onTimeChange(refreshEvents);
showIsland();
