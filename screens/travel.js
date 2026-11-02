// Traveling between areas: the server moves you (action), and a full screen loading bar shows the trip.
// options: { kind: "boat" | "ferry" | "train", days, from, to }
import { holdIsland } from "../areas/areas.js";
import { travelAnimationEnabled } from "../core/settings.js";
import { getState } from "../core/state.js";
import { createScene, reducedMotion } from "./scene.js";

const barWidth = 54;

function drawTrip(canvas, time, length, text, options, startDay) {
    const { columns, rows } = canvas;
    const progress = Math.min(1, time / length);
    const seaTop = rows - 7;

    canvas.center(3, text + "...");

    // clouds drifting by
    const clouds = ["  .--.    ", " (    )-. ", "(___.__)_)"];
    for (let i = 0; i < 4; i++) {
        const x = ((i * 31 + time / (40 + i * 12)) % (columns + 14)) - 12;
        canvas.lines(columns - x, 6 + (i % 2) * 3, clouds);
    }

    // the trip: just the loading bar (no ship on top)
    const left = Math.floor((columns - barWidth - 2) / 2);
    const position = Math.round(progress * (barWidth - 1));

    let bar = "";
    for (let x = 0; x < barWidth; x++) bar += x === position ? "|" : x < position ? "=" : "-";
    canvas.text(left, 18, "[" + bar + "]");
    canvas.text(left, 19, (options.from || "").slice(0, 26));
    if (options.to) canvas.text(left + barWidth + 2 - options.to.length, 19, options.to);
    canvas.center(21, Math.round(progress * 100) + "%");
    if (options.days) {
        const day = Math.min(options.days, Math.floor(progress * options.days));
        canvas.center(23, "Day " + (startDay + day) + "  (" + day + " of " + options.days + " days on the way)");
    }

    canvas.sea(seaTop, time);
}

export async function travel(text, action, options = {}) {
    holdIsland(true);
    const startDay = getState().day;
    const result = await action();
    if (result.error || !travelAnimationEnabled()) {
        holdIsland(false);
        return result;
    }
    const length = reducedMotion() ? 1500 : Math.min(7000, 3800 + (options.days || 0) * 200);
    const scene = createScene("travelScene");
    scene.draw(time => drawTrip(scene.canvas, time, length, text, options, startDay));
    await new Promise(resolve => setTimeout(resolve, length + 300));
    await scene.fadeOut(400);
    holdIsland(false);
    return result;
}
