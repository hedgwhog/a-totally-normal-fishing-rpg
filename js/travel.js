import { openEvent, setEventText, closeEvent } from "./dialogue.js";
import { setIsland } from "./islands.js";

const travelTime = 4000; // ms
const barWidth = 30;

export function travelTo(islandId, text) {
    return new Promise(resolve => {
        const start = Date.now();
        openEvent("");

        function draw() {
            const progress = Math.min(1, (Date.now() - start) / travelTime);
            const line = Math.round(progress * (barWidth - 1));
            let bar = "";
            for (let n = 0; n < barWidth; n++) {
                if (n === line) bar += "|";
                else if (n < line) bar += "=";
                else bar += "-";
            }
            const waves = (Math.floor(Date.now() / 300) % 2 === 0) ? " ~  ~   ~  ~ " : "  ~  ~   ~  ~";
            setEventText(text + "...\n\n" + waves + "\n\n[" + bar + "] " + Math.round(progress * 100) + "%");

            if (progress < 1) {
                setTimeout(draw, 80);
            } else {
                closeEvent();
                setIsland(islandId);
                resolve();
            }
        }
        draw();
    });
}

