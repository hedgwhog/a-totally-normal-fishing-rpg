import { dayAnimationEnabled } from "./settings.js";
import { playMusicFor } from "./audio.js";
import { times } from "../shared/rules/schedule.js";
import { getState, onState } from "./state.js";
import { showDay } from "../screens/dayAnimation.js";

export { times };

const dayDisplay = document.getElementById("dayContainer");

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
    if (state.day === previous.day + 1 && dayAnimationEnabled()) { // not after trips that skip days
        showDay(state.day);
    }
    refreshTime();
});
