import { loadNumber, save } from "./save.js";

const coinDisplay = document.getElementById("coinAmount");
let coins = loadNumber("saveCoin", 0);

function showCoins() {
    coinDisplay.textContent = "You got " + coins + " coins";
}

export function getCoins() {
    return coins;
}

// use a negative amount to pay
export function addCoins(amount) {
    coins += amount;
    save("saveCoin", coins);
    showCoins();
}

showCoins();
