export let i = parseInt(localStorage.getItem("gameTimeIndex")) || 0;
export let times = ["morning", "afternoon", "evening", "night"];
let addDay = parseInt(localStorage.getItem("gameDay")) || 1;

const timeDisplay = document.getElementById("time")
const dayDisplay = document.getElementById("dayPopupHidden")
const fishmonger = document.getElementById("sellFish")
const marketplace = document.getElementById("marketplace")
const dayDisplayToggle = document.getElementById("dayDisplayToggle");

timeDisplay.innerHTML = times[i];
document.getElementById("dayContainer").innerHTML = "Day " + addDay;
updateFishmonger();
updateMarketplace();

function updateFishmonger() {
    fishmonger.style.display = (times[i] === "morning") ? "block" : "none";
}

function updateMarketplace() {
    const cycleDay = addDay % 7; 
    const openDays = (cycleDay < 2);

    const time = times[i];
    const activeTimes = (time === "morning" || time === "afternoon" || time === "evening");

    if (openDays && activeTimes) {
        marketplace.style.display = "block";
    } else {
        marketplace.style.display = "none";
    }
}

const savedSettingDay = localStorage.getItem("enableAnimationDay");
        if (savedSettingDay !== null) {
        dayDisplayToggle.checked = savedSettingDay === "true";
    }

    dayDisplayToggle.addEventListener("change", () => {
    localStorage.setItem("enableAnimationDay", dayDisplayToggle.checked);
});

export function nextTime() {
    i++;
    if (i >= times.length) {
        i = 0;
    }
    
    localStorage.setItem("gameTimeIndex", i);
    timeDisplay.innerHTML = times[i];
    console.log(times[i]);
    updateFishmonger();
    updateMarketplace(); 
}

function nextDay() {
    let time = times[i]

    if (time === "evening" || time === "night") {
        addDay++
        localStorage.setItem("gameDay", addDay); 
        dayDisplay.style.display = "block"; 
        dayDisplay.innerHTML = "Day " + addDay;

        const updateDayAnimation = () => {
        dayDisplay.style.display = "none";
        document.getElementById("dayContainer").innerHTML = "Day " + addDay;
        };

        if (dayDisplayToggle.checked) {
            setTimeout(updateDayAnimation, 2000);
        } else {
            updateDayAnimation();
        }

        console.log(addDay)
        i = -1
        nextTime(times[i]);
    } else {
        alert("You can't sleep during the day, get back to work.")
    }
}

document.getElementById('nextDay').addEventListener('click', nextDay);