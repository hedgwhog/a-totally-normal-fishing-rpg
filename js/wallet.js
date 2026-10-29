import { getState, onState } from "./state.js";
import { formatNumber, shortNumber } from "./helpers.js";

const coinDisplay = document.getElementById("coinAmount");

export function getCoins() {
    return getState().coins;
}

function showCoins() {
    coinDisplay.textContent = "Coins: " + shortNumber(getCoins());
    coinDisplay.title = formatNumber(getCoins()) + " coins";
}

onState(showCoins);
showCoins();
