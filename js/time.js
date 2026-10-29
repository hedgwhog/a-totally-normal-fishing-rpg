import { dayAnimationEnabled } from "./settings.js";
import { playMusicFor } from "./audio.js";
import { times } from "./rules/schedule.js";
import { getState, onState } from "./state.js";

export { times };

const dayDisplay = document.getElementById("dayContainer");
const dayPopup = document.getElementById("dayPopupHidden");

const listeners = [];

export function onTimeChange(listener) {
    listeners.push(listener);
}

export function getTime() {
    return times[getState().timeIndex];
}

export function getDay() {
    return getState().day;
}

export function refreshTime() {
    dayDisplay.textContent = "Day " + getDay() + " - " + getTime();
    playMusicFor(getTime());
    listeners.forEach(listener => listener(getTime(), getDay()));
}

onState((state, previous) => {
    if (!previous || (state.day === previous.day && state.timeIndex === previous.timeIndex)) return;
    if (state.day > previous.day && dayAnimationEnabled()) {
        dayPopup.textContent = "Day " + state.day;
        dayPopup.style.display = "flex";
        setTimeout(() => dayPopup.style.display = "none", 2000);
    }
    refreshTime();
});
