import { askYesNo } from "./dialogue.js";
import { keyNames, getKey, setKey, resetKeys, keyLabel, setListening } from "./keybinds.js";


const dayDisplayToggle = document.getElementById("dayDisplayToggle");
const invertCheckbox = document.getElementById("invert-toggle");
const volumeSlider = document.getElementById("volumeSlider");

// Day animation
const savedDayAnimation = localStorage.getItem("enableAnimationDay");
if (savedDayAnimation !== null) dayDisplayToggle.checked = savedDayAnimation === "true";

dayDisplayToggle.addEventListener("change", () => {
    localStorage.setItem("enableAnimationDay", dayDisplayToggle.checked);
});

export function dayAnimationEnabled() {
    return dayDisplayToggle.checked;
}

// Invert colors
function applyInvert() {
    document.documentElement.classList.toggle("inverted-theme", invertCheckbox.checked);
}

invertCheckbox.checked = localStorage.getItem("invertColors") === "true";
applyInvert();

invertCheckbox.addEventListener("change", () => {
    localStorage.setItem("invertColors", invertCheckbox.checked);
    applyInvert();
});

// OST volume
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
        "Remove progress?\n\nThis deletes ALL your progress: coins, fish, gear, map, quests.\nThis can't be undone!",
        "", "Yes, delete everything", "No, keep my save"
    );
    if (!sure) return;
    document.dispatchEvent(new Event("resetProgress"));
    localStorage.clear();
    location.reload();
});

// Keybinds
const keybindList = document.getElementById("keybindList");

function showKeybinds() {
    keybindList.innerHTML = "";
    for (const action of Object.keys(keyNames)) {
        const row = document.createElement("label");
        row.textContent = keyNames[action] + ": ";
        const button = document.createElement("button");
        button.className = "settings-btn keybindButton";
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

function waitForKey(action, button) {
    button.textContent = "press a key...";
    setListening(true);

    function onKey(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.removeEventListener("keydown", onKey, true);
        if (event.code !== "Escape") setKey(action, event.code);
        setTimeout(() => setListening(false), 0);
        showKeybinds();
    }
    window.addEventListener("keydown", onKey, true); 
}

showKeybinds();
