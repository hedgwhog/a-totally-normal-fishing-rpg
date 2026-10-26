import { loadNumber, save } from "./save.js";
import { round1, formatNumber } from "./helpers.js";

const resonanceDisplay = document.querySelector(".resonance");
let resonance = round1(loadNumber("saveResonance", 0));

function showResonance() {
    resonanceDisplay.textContent = "Resonance: " + formatNumber(resonance);
}

export function getResonance() {
    return resonance;
}

// use a negative amount to pay. Always rounded to 1 decimal.
export function addResonance(amount) {
    resonance = round1(resonance + amount);
    save("saveResonance", resonance);
    showResonance();
}

showResonance();
