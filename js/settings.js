import { askYesNo } from "./dialogue.js";

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
    localStorage.clear();
    location.reload();
});
