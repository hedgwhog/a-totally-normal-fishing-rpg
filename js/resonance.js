import { loadNumber, save } from "./save.js";

const resonanceDisplay = document.querySelector(".resonance");
let resonance = loadNumber("saveResonance", 0);

function showResonance() {
    resonanceDisplay.textContent = "Resonance: " + resonance;
}

export function getResonance() {
    return resonance;
}

export function addResonance(amount) {
    resonance += amount;
    save("saveResonance", resonance);
    showResonance();
}

showResonance();
