import { i, times, nextTime } from "./time.js";
import { hasItem, addItem, getStat } from "./user.js";

let addFish = parseInt(localStorage.getItem("saveFish")) || 0;
let addCoin = parseInt(localStorage.getItem("saveCoin")) || 0;

const fishAmount = document.getElementById("fishAmount");
const coinAmount = document.getElementById("coinAmount");
const marketplaceItem = document.getElementById("marketplaceItem");

coinAmount.innerHTML = "You got " + addCoin + " coins";
fishAmount.innerHTML = "You got " + addFish + " fish";

// const fishes [
//     { id: "salmon", name: "Salmon", price: "1" }
//     { id: "cod", name: "Cod", price: "1" }
//     { id: "salmon", name: "Salmon", price: "1" }
// ]

const marketplaceItems = [
    { id: "8rod", name: "a slightly better fishing rod (+2 fish)", price: 8, slot: "Rod", effect: "Catch 2 fish", stats: { fishPerCatch: 2 } },
    { id: "14rod", name: "an even more slightly better fishing rod (+3 fish)", price: 14, slot: "Rod", effect: "Catch 3 fish", stats: { fishPerCatch: 3 } },
    { id: "fishingHat", name: "fishing hat (+1 fish bonus)", price: 0, slot: "Hat", effect: "+1 fish per catch", stats: { bonusFishPerCatch: 1 } },
];
 
function showMarketplace() {
    marketplaceItem.innerHTML = "";
    marketplaceItems.forEach(item => {
        const itemButton = document.createElement("button");
        if (hasItem(item.id)) {
            itemButton.innerHTML = " (owned): " + item.name;
        } else {
            itemButton.innerHTML = item.price + " Coins: " + item.name;
        }
        itemButton.addEventListener("click", () => buyItem(item));
        marketplaceItem.appendChild(itemButton);
    });
}
 
function buyItem(item) {
    if (hasItem(item.id)) {
        alert("You already own the " + item.name + ".");
        return;
    }
    if (addCoin < item.price) {
        alert("You need " + item.price + " coins to buy the " + item.name + ".");
        return;
    }
    addCoin -= item.price;
    localStorage.setItem("saveCoin", addCoin);
    coinAmount.innerHTML = "You got " + addCoin + " coins";
    addItem(item);
    showMarketplace();
}
showMarketplace();

function setButtonsDisabled(status) {
    const allButtons = document.querySelectorAll("button");
    allButtons.forEach(btn => {
        btn.disabled = status;
    });
}

function coins() {
    addCoin++;
    localStorage.setItem("saveCoin", addCoin); 
    coinAmount.innerHTML = "You got " + addCoin + " coins";
}

function nextFish(e) {
    let time = times[i];

    if (time === "morning" || time === "afternoon" || time === "evening") {
        const clickedButton = e.currentTarget;
        setButtonsDisabled(true);

        const duration = 2000;
        let start = null;

        // Timer animation
        function animationTimer(timestamp) {
            if (!start) start = timestamp;
            let progress = timestamp - start;
            let percentage = Math.min((progress / duration) * 100, 100);

            clickedButton.style.background =
                `linear-gradient(to right, #b0b0b0 ${percentage}%, #EFEFEF ${percentage}%)`;

            if (progress < duration) {
                requestAnimationFrame(animationTimer);
            } else {
                addFish += getStat("fishPerCatch", 1) + getStat("bonusFishPerCatch", 0);
                localStorage.setItem("saveFish", addFish);
                fishAmount.innerHTML = "You got " + addFish + " fish";
                clickedButton.style.background = "";
                setButtonsDisabled(false);
                nextTime();
            }
        }
        requestAnimationFrame(animationTimer);
    } else {
        alert("You can't fish at night, you are too sleepy.");
    }
}


function sellFish() {
    if (addFish < 4) {
        alert("You need atleast 4 fish to be able to sell");
    } else {
        addFish -= 4;
        localStorage.setItem("saveFish", addFish);
        fishAmount.innerHTML = "You got " + addFish + " fish"; 
        coins();
    }
}

document.getElementById('nextFish').addEventListener('click', nextFish);
document.getElementById('sellFish').addEventListener('click', sellFish);