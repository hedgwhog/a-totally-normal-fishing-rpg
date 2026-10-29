import { getState, onState } from "./state.js";
import { formatNumber, shortNumber } from "./helpers.js";

const resonanceDisplay = document.querySelector(".resonance");

export function getResonance() {
    return getState().resonance;
}

function showResonance() {
    resonanceDisplay.textContent = "Resonance: " + shortNumber(getResonance());
    resonanceDisplay.title = formatNumber(getResonance()) + " resonance";
}

onState(showResonance);
showResonance();
