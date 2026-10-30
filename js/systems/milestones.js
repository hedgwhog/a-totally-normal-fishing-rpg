import { getDay } from "../core/time.js";
import { mapTiles } from "../shared/data/world.js";
import { allFish } from "../shared/data/fish.js";
import { islandNames } from "../shared/data/islands.js";
import { areaCompletion, gameCompletion, areasVisited, fishDiscovered, tilesFound, allAreas, barText } from "../shared/rules/completion.js";
import { getState } from "../core/state.js";
import { openPopup } from "../core/ui.js";

// what couns is in data/completion.js
// math is in rules/completion.js

const page = document.getElementById("milestoneItem");
const popup = document.getElementById("milestoneDisplay");
const openedAt = Date.now();

function playtime() {
    return (getState().playtime || 0) + Math.floor((Date.now() - openedAt) / 1000);
}

// calculates the seconds into readable time
function timeText(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = Math.floor(seconds % 60);
    return (hours > 0 ? hours + "h " : "") + (hours > 0 || minutes > 0 ? minutes + "m " : "") + rest + "s";
}

const categories = [
    {
        title: "Playtime",
        rows: () => [
            ["Days in game", getDay()],
            ["Time played", timeText(playtime())],
        ],
    },
    {
        title: "Exploring",
        rows: () => [
            ["Areas visited", areasVisited(getState()) + " / " + allAreas().length],
            ["Fish discovered", fishDiscovered(getState()) + " / " + allFish.length],
            ["Map tiles found", tilesFound(getState()) + " / " + mapTiles.length],
        ],
    },
    {
        // an area you havent been to shows up as ???
        title: "Areas",
        rows: () => allAreas().map(area => {
            const visited = (getState().visited || []).includes(area);
            return [visited ? islandNames[area] : "???", barText(areaCompletion(getState(), area), 16)];
        }),
    },
];

function showMilestones() {
    page.innerHTML = "";
    const total = document.createElement("div");
    total.className = "milestoneTotal";
    const label = document.createElement("div");
    label.textContent = "Game completed";
    const bar = document.createElement("div");
    bar.className = "milestoneBar";
    bar.textContent = barText(gameCompletion(getState()), 30);
    total.append(label, bar);
    page.appendChild(total);

    for (const category of categories) {
        const title = document.createElement("h3");
        title.textContent = category.title;
        page.appendChild(title);
        for (const [name, value] of category.rows()) {
            const row = document.createElement("div");
            row.className = "milestoneRow";
            const label = document.createElement("span");
            label.textContent = name;
            const number = document.createElement("span");
            number.className = "milestoneValue";
            number.textContent = value;
            row.append(label, number);
            page.appendChild(row);
        }
    }
}

setInterval(() => {
    if (getComputedStyle(popup).display !== "none") showMilestones();
}, 1000);

document.getElementById("milestones").addEventListener("click", () => {
    showMilestones();
    openPopup(popup);
});
