import { getState, onState } from "../core/state.js";
import { formatNumber, shortNumber } from "../core/helpers.js";

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
