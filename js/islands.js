import { getState, onState } from "./state.js";
import { getTime, getDay } from "./time.js";

export { islandNames } from "./data/islands.js";

const events = [];
let shownIsland = null;
let holding = false;

export function getIsland() {
    return getState().island;
}

export function addEvent(islandId, event) {
    events.push({ island: islandId, ...event });
    document.getElementById(event.button).addEventListener("click", () => event.open());
}

export function refreshEvents() {
    const island = holding ? shownIsland : getIsland();
    for (const event of events) {
        const open = event.island === island && (!event.isOpen || event.isOpen(getTime(), getDay(), getState()));
        document.getElementById(event.button).style.display = open ? "block" : "none";
    }
}

function showIsland() {
    if (!holding) shownIsland = getIsland();
    document.querySelectorAll(".island").forEach(islandBox => {
        islandBox.style.display = (islandBox.id === shownIsland) ? "block" : "none";
    });
    refreshEvents();
}

export function holdIsland(hold) {
    holding = hold;
    showIsland();
}

onState(showIsland);
showIsland();
