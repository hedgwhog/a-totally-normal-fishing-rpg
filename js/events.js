import { i, times, nextTime } from "./time.js";
let addFish = 0
let addCoin = 0

const fishAmount = document.getElementById("fishAmount")
const coinAmount = document.getElementById("coinAmount")

function coins() {
    addCoin++;
    coinAmount.innerHTML = "Coins: " + addCoin;
} 

function nextFish() {
    let time = times[i];

    if (time === "morning" || time === "afternoon" || time === "evening") {
        addFish++;
        fishAmount.innerHTML = "You got " + addFish + " fih";
        
        // setTimeout(function() {
            nextTime();
        // }, 3000);
    } else {
        alert("You can't fish at night, you are to sleepy.");
    }
}

function sellFish() {
    let time = times[i];

    if (addFish < 4) {
        alert("You need atleast 4 fih to be able to sell");
    } else {
        nextTime(time);
        addFish -= 4;
        fishAmount.innerHTML = "You got " + addFish + " fih"; 
        coins() += 1;
    }
}

document.getElementById('nextFish').addEventListener('click', nextFish);
document.getElementById('sellFish').addEventListener('click', sellFish);