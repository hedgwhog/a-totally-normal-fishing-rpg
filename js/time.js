export let i = 0
export let times = ["morning", "afternoon", "evening", "night"];
let addDay = 1;

const timeDisplay = document.getElementById("time")
const dayDisplay = document.getElementById("dayPopupHidden")
const fishmonger = document.getElementById("sellFish")  

timeDisplay.innerHTML = times[i];

export function nextTime() {
    i++;
    // So it resets the array properly
    if (i >= times.length) {
        i = 0;
    }
    timeDisplay.innerHTML = times[i]
    console.log(times[i])

    if (times[i] === "morning") {
        fishmonger.style.display = "block"
    } else {
        fishmonger.style.display = "none";
    }
}

function nextDay() {
    let time = times[i]

    if (time === "evening" || time === "night") {
        addDay++
        dayDisplay.style.display = "block"; 
        dayDisplay.innerHTML = "Day " + addDay;

        setTimeout(() => {
            dayDisplay.style.display = "none";
            document.getElementById("dayContainer").innerHTML = "Day " + addDay;
        }, 2000)

        console.log(addDay) // What are you looking at huh
        nextTime();
    } else {
        alert("You can't sleep during the day, get back to work.")
    }
}

document.getElementById('nextDay').addEventListener('click', nextDay);