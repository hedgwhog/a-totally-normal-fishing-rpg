// Loading a save: a sailboat bobs on the water while the save loads, then it zooms out to the game.
// Cast out: the same animation, but backwards (it zooms in, the bar empties), then back to the start screen.
import { createScene, reducedMotion, wait } from "./scene.js";

const length = 3200;

function drawLoading(canvas, time, label, progress, backwards) {
    const { columns, rows } = canvas;
    const seaTop = rows - 8;
    const middle = Math.floor((seaTop - 4) / 2);

    canvas.center(middle, label + ".".repeat(1 + Math.floor(time / 350) % 3).padEnd(3));
    const width = 40;
    const filled = Math.round(progress * width);
    canvas.center(middle + 2, "[" + "=".repeat(filled) + "-".repeat(width - filled) + "] " + String(Math.round(progress * 100)).padStart(3) + "%");

    canvas.sea(seaTop, time, 0.003);
    canvas.sailboat(columns / 2 + Math.sin(time / 1500) * 6, seaTop, time, backwards);
}

export function startCastIn(label) {
    const scene = createScene("castScene");
    const started = performance.now();
    let ready = false;
    // fills up over the loading time, but waits at 90% until the save is there
    scene.draw(time => drawLoading(scene.canvas, time, label, Math.min(ready ? 1 : 0.9, time / length), false));

    return {
        // when the game is ready underneath: zoom out to it
        async finish() {
            ready = true;
            const left = length - (performance.now() - started);
            if (left > 0) await wait(left);
            await wait(400);
            if (reducedMotion()) return scene.fadeOut(200);
            scene.box.classList.add("zoomOut");
            await wait(650);
            scene.remove();
        },
        cancel() {
            scene.remove();
        },
    };
}

// plays the loading screen backwards, then reloads to the start screen
export async function castOut(label) {
    const scene = createScene("castScene closed");
    // time runs backwards: the waves flow back, the bar empties
    scene.draw(time => drawLoading(scene.canvas, Math.max(0, length - time), label, Math.max(0, 1 - time / length), true));
    if (!reducedMotion()) {
        await wait(30);
        scene.box.classList.add("zoomIn");
    } else {
        scene.box.classList.remove("closed");
    }
    await wait(length + 300);
    location.reload();
}
