import { askYesNo } from "./dialogue.js";
import { resetSave, getState, onState } from "./state.js";
import { keyNames, getKey, setKey, resetKeys, keyLabel, setListening } from "./keybinds.js";

const dayDisplayToggle = document.getElementById("dayDisplayToggle");
const invertCheckbox = document.getElementById("invert-toggle");
const volumeSlider = document.getElementById("volumeSlider");

const savedDayAnimation = localStorage.getItem("enableAnimationDay");
if (savedDayAnimation !== null) dayDisplayToggle.checked = savedDayAnimation === "true";

dayDisplayToggle.addEventListener("change", () => {
    localStorage.setItem("enableAnimationDay", dayDisplayToggle.checked);
});

export function dayAnimationEnabled() {
    return dayDisplayToggle.checked;
}

const travelToggle = document.getElementById("travelAnimationToggle");
const savedTravelAnimation = localStorage.getItem("enableAnimationTravel");
if (savedTravelAnimation !== null) travelToggle.checked = savedTravelAnimation === "true";
travelToggle.addEventListener("change", () => localStorage.setItem("enableAnimationTravel", travelToggle.checked));

export function travelAnimationEnabled() {
    return travelToggle.checked;
}

function applyInvert() {
    document.documentElement.classList.toggle("inverted-theme", invertCheckbox.checked);
}

invertCheckbox.checked = localStorage.getItem("invertColors") === "true";
applyInvert();

invertCheckbox.addEventListener("change", () => {
    localStorage.setItem("invertColors", invertCheckbox.checked);
    applyInvert();
});

const volumeListeners = [];
volumeSlider.value = localStorage.getItem("ostVolume") ?? "0.5";

volumeSlider.addEventListener("input", () => {
    localStorage.setItem("ostVolume", volumeSlider.value);
    volumeListeners.forEach(listener => listener(getOstVolume()));
});

export function getOstVolume() {
    return parseFloat(volumeSlider.value);
}

export function onVolumeChange(listener) {
    volumeListeners.push(listener);
}

const resetButton = document.getElementById("resetProgress");

resetButton.addEventListener("click", async () => {
    const sure = await askYesNo(
        "Reset progress?\n\nThis deletes ALL progress of this save: coins, fish, gear, map, quests.\nYour other saves, your friends and your letters stay.\nThis can't be undone!",
        "", "Yes, delete everything", "No, keep my save"
    );
    if (!sure) return;
    await resetSave();
    location.reload();
});

const keybindList = document.getElementById("keybindList");
const settingsPopup = document.getElementById("settingsPopup");

function showKeybinds() {
    keybindList.innerHTML = "";
    for (const action of Object.keys(keyNames)) {
        if (action.startsWith("slot") && parseInt(action.slice(4)) > getState().backpackSize) continue;
        const row = document.createElement("label");
        row.textContent = keyNames[action] + ": ";
        const button = document.createElement("button");
        button.className = "settings-btn keybindButton";
        button.dataset.action = action;
        button.textContent = keyLabel(getKey(action));
        button.addEventListener("click", () => waitForKey(action, button));
        row.appendChild(button);
        keybindList.appendChild(row);
    }
    const reset = document.createElement("button");
    reset.className = "settings-btn";
    reset.textContent = "Reset keybinds";
    reset.addEventListener("click", () => {
        resetKeys();
        showKeybinds();
    });
    keybindList.appendChild(reset);
}

let stopWaiting = null;

function cancelWaitForKey() {
    if (!stopWaiting) return;
    stopWaiting();
    showKeybinds();
}

function waitForKey(action, button) {
    if (stopWaiting) cancelWaitForKey();
    button = keybindList.querySelector('[data-action="' + action + '"]');
    button.textContent = "press a key...";
    button.blur();
    setListening(true);

    function stop() {
        window.removeEventListener("keydown", onKey, true);
        stopWaiting = null;
        setTimeout(() => setListening(stopWaiting !== null), 0);
    }

    function onKey(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        stop();
        if (event.code !== "Escape") setKey(action, event.code);
        showKeybinds();
    }
    stopWaiting = stop;
    window.addEventListener("keydown", onKey, true);
}

let shownSlots = getState().backpackSize;
onState(state => {
    if (state.backpackSize === shownSlots) return;
    shownSlots = state.backpackSize;
    if (stopWaiting) stopWaiting();
    showKeybinds();
});

new MutationObserver(() => {
    if (getComputedStyle(settingsPopup).display === "none") cancelWaitForKey();
}).observe(settingsPopup, { attributes: true, attributeFilter: ["style"] });

showKeybinds();
