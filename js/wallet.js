// COINS: how many coins you have, with 1 decimal (like 12.5). Saved as "saveCoin".
// Use addCoins(10) to give coins, addCoins(-10) to pay. Check getCoins() before paying.

import { loadNumber, save } from "./save.js";
import { round1, formatNumber } from "./helpers.js";

const coinDisplay = document.getElementById("coinAmount");
let coins = round1(loadNumber("saveCoin", 0));

function showCoins() {
    coinDisplay.textContent = "You got " + formatNumber(coins) + " coins";
}

export function getCoins() {
    return coins;
}

// use a negative amount to pay. Always rounded to 1 decimal.
export function addCoins(amount) {
    coins = round1(coins + amount);
    save("saveCoin", coins);
    showCoins();
}

showCoins();
