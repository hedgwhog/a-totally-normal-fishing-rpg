import { openEvent, setEventText, closeEvent } from "./dialogue.js";
import { holdIsland } from "./islands.js";

const travelTime = 4000;
const barWidth = 30;

export async function travel(text, action) {
    holdIsland(true);
    const result = await action();
    if (result.error) {
        holdIsland(false);
        return result;
    }
    await new Promise(resolve => {
        const start = Date.now();
        openEvent("");
        function draw() {
            const progress = Math.min(1, (Date.now() - start) / travelTime);
            const line = Math.round(progress * (barWidth - 1));
            let bar = "";
            for (let spot = 0; spot < barWidth; spot++) bar += spot === line ? "|" : spot < line ? "=" : "-";
            const waves = (Math.floor(Date.now() / 300) % 2 === 0) ? " ~  ~   ~  ~ " : "  ~  ~   ~  ~";
            setEventText(text + "...\n\n" + waves + "\n\n[" + bar + "] " + Math.round(progress * 100) + "%");
            if (progress < 1) return setTimeout(draw, 80);
            closeEvent();
            resolve();
        }
        draw();
    });
    holdIsland(false);
    return result;
}
