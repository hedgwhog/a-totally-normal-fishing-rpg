import { getDay } from "./time.js";
import { mapPieces } from "./data/mapPieces.js";
import { hasMapPiece } from "./map.js";
import { loadNumber } from "./save.js";
import { openPopup } from "./ui.js";

const page = document.getElementById("milestoneItem");
const popup = document.getElementById("milestoneDisplay");

// Playtime
let playtime = loadNumber("savePlaytime", 0);
let stopped = false;

function savePlaytime() {
    if (!stopped) localStorage.setItem("savePlaytime", Math.floor(playtime));
}

setInterval(() => {
    if (document.visibilityState !== "visible" || stopped) return;
    playtime++;
    if (playtime % 10 === 0) savePlaytime();
    if (getComputedStyle(popup).display !== "none") showMilestones();
}, 1000);

window.addEventListener("pagehide", savePlaytime);
document.addEventListener("visibilitychange", savePlaytime);
document.addEventListener("resetProgress", () => stopped = true);

function timeText(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = Math.floor(seconds % 60);
    return (hours > 0 ? hours + "h " : "") + (hours > 0 || minutes > 0 ? minutes + "m " : "") + rest + "s";
}

// The categories
const categories = [
    {
        title: "Playtime",
        rows: () => [
            ["Days in game", getDay()],
            ["Time played", timeText(playtime)],
        ],
    },
    {
        title: "Maps",
        rows: () => [
            ["Map pieces", mapPieces.filter(piece => hasMapPiece(piece.id)).length + " / " + mapPieces.length],
        ],
    },
];

function showMilestones() {
    page.innerHTML = "";
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
            number.textContent = value;
            row.append(label, number);
            page.appendChild(row);
        }
    }
}

document.getElementById("milestones").addEventListener("click", () => {
    showMilestones();
    openPopup(popup);
});
