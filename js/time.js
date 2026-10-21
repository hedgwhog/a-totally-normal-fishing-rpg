import { dayAnimationEnabled } from "./affinity.js";

export let i = parseInt(localStorage.getItem("gameTimeIndex")) || 0;
export let times = ["morning", "afternoon", "evening", "night"];
let addDay = parseInt(localStorage.getItem("gameDay")) || 1;

const timeDisplay = document.getElementById("time")
const dayDisplay = document.getElementById("dayPopupHidden")

// Shops that are only open on specific days and times are grouped
// id: the id of the button,
// times: when its open
// openDay: true on the days it is open
const timedShops = {
    freshwaterHaven: [
        { id: "sellFish", times: ["morning"], openDay: day => true },
        { id: "marketplace", times: ["morning", "afternoon", "evening"], openDay: day => day % 7 < 2 }, // open 2 days every 7 days
        { id: "resonance", times: ["morning", "afternoon", "night"], openDay: day => day % 5 !== 0 }, // open 4 days, closed 1 day
    ],
};

function updateShops() {
    for (const shops of Object.values(timedShops)) {
        for (const shop of shops) {
            const open = shop.times.includes(times[i]) && shop.openDay(addDay);
            document.getElementById(shop.id).style.display = open ? "block" : "none";
        }
    }
}

timeDisplay.innerHTML = times[i];
document.getElementById("dayContainer").innerHTML = "Day " + addDay;
updateShops();

export function nextTime() {
    i++;
    if (i >= times.length) {
        i = 0;
    }
    
    localStorage.setItem("gameTimeIndex", i);
    timeDisplay.innerHTML = times[i];
    console.log(times[i]);
    updateShops();
}

// starts the next day
export function nextDay() {
    addDay++
    localStorage.setItem("gameDay", addDay); 
    dayDisplay.style.display = "block"; 
    dayDisplay.innerHTML = "Day " + addDay;
    dayDisplay.style.justifyContent = "center"
    dayDisplay.style.alignContent = "center"

    const updateDayAnimation = () => {
    dayDisplay.style.display = "none";
    document.getElementById("dayContainer").innerHTML = "Day " + addDay;
    };

    if (dayAnimationEnabled()) {
        setTimeout(updateDayAnimation, 2000);
    } else {
        updateDayAnimation();
    }

    console.log(addDay)
    i = -1
    nextTime(times[i]);
}
