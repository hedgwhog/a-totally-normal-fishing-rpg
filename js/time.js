import { dayAnimationEnabled } from "./settings.js";
import { playMusicFor } from "./audio.js";

export const times = ["morning", "afternoon", "evening", "night"];

let timeIndex = parseInt(localStorage.getItem("gameTimeIndex")) || 0;
if (timeIndex < 0 || timeIndex >= times.length) timeIndex = 0;
let day = parseInt(localStorage.getItem("gameDay")) || 1;

const timeDisplay = document.getElementById("time");
const dayDisplay = document.getElementById("dayContainer");
const dayPopup = document.getElementById("dayPopupHidden");

const listeners = [];

export function onTimeChange(listener) {
    listeners.push(listener);
}

export function getTime() {
    return times[timeIndex];
}

export function getDay() {
    return day;
}

export function refreshTime() {
    timeDisplay.textContent = getTime();
    dayDisplay.textContent = "Day " + day;
    playMusicFor(getTime());
    listeners.forEach(listener => listener(getTime(), day));
}

export function nextTime() {
    if (getTime() === "night") {
        nextDay();
        return;
    }
    timeIndex++;
    localStorage.setItem("gameTimeIndex", timeIndex);
    refreshTime();
}

export function nextDay() {
    day++;
    timeIndex = 0; // a new day always starts in the morning
    localStorage.setItem("gameDay", day);
    localStorage.setItem("gameTimeIndex", timeIndex);

    // the big "Day" popup, it disappears after 2000 ms
    if (dayAnimationEnabled()) {
        dayPopup.textContent = "Day " + day;
        dayPopup.style.display = "flex";
        setTimeout(() => dayPopup.style.display = "none", 2000);
    }
    refreshTime();
}
