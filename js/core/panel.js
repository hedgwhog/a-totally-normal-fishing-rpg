// One shared window for places that don't need their own (the Pantry Isles use it).
// openPanel({ title, note, render }): render(box) fills the window, and runs again on every state change while it's open.
// Leave render out of the updates with { live: false } (for things that redraw themselves).
import { onState } from "./state.js";
import { openPopup, ensurePopup } from "./ui.js";

const popup = ensurePopup("panelDisplay", `
    <button id="panelClose" class="popupClose" data-close="panelDisplay">Close</button>
    <h1 id="panelTitle"></h1>
    <h4 id="panelNote"></h4>
    <div id="panelItem" class="popupBody"></div>`);
const titleBox = document.getElementById("panelTitle");
const noteBox = document.getElementById("panelNote");
const closeButton = document.getElementById("panelClose");
const box = document.getElementById("panelItem");
let current = null;

export const panelBox = box;
export const isPanelOpen = () => getComputedStyle(popup).display !== "none";

export function openPanel({ title, note = "", render, live = true }) {
    current = { render, live };
    titleBox.textContent = title;
    noteBox.textContent = note;
    noteBox.style.display = note ? "" : "none";
    closeButton.textContent = "Close " + title.replace(/^The /, "").toLowerCase();
    box.innerHTML = "";
    render(box);
    openPopup(popup);
}

export function redrawPanel() {
    if (!current || !isPanelOpen()) return;
    const scroll = box.scrollTop;
    box.innerHTML = "";
    current.render(box);
    box.scrollTop = scroll;
}

onState(() => {
    if (current && current.live) redrawPanel();
});
