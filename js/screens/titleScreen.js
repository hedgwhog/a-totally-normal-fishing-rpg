// The animation when the game is opened with "Launch game": the title drops in, a sailboat sails by.
// Click or press a key to skip.
import { createScene, reducedMotion } from "./scene.js";
import { titleArt, taglineArt } from "./lettering.js";

const length = 3800;

function drawTitle(canvas, time) {
    const { columns, rows } = canvas;
    const seaTop = rows - Math.min(7, Math.floor(time / 90));
    const blockHeight = taglineArt.length + 1 + titleArt.length;
    const top = Math.max(1, Math.floor((rows - 7 - blockHeight) / 2));

    // the tagline types itself
    const tagLeft = Math.floor((columns - taglineArt[0].length) / 2);
    const typed = Math.floor(Math.max(0, time - 1300) / 8);
    taglineArt.forEach((line, i) => canvas.text(tagLeft, top + i, line.slice(0, typed)));

    // every column of the title falls into place, left to right
    const left = Math.floor((columns - titleArt[0].length) / 2);
    const titleTop = top + taglineArt.length + 1;
    for (let x = 0; x < titleArt[0].length; x++) {
        const start = 250 + x * 11;
        if (time < start) continue;
        const fall = Math.max(0, 1 - (time - start) / 380);
        const offset = -Math.round(fall * fall * 12);
        titleArt.forEach((line, y) => canvas.text(left + x, titleTop + y + offset, line[x]));
    }

    canvas.sea(seaTop, time);

    // a sailboat crosses the water
    if (time > 700) canvas.sailboat(-10 + (time - 700) / 32, seaTop, time);
}

// only when the window was opened with "Launch game" (index.html adds #launch), not after a reload
export function playTitle() {
    if (location.hash !== "#launch") return Promise.resolve();
    history.replaceState(null, "", location.pathname + location.search);

    const scene = createScene("titleScene");
    const hint = document.createElement("div");
    hint.className = "sceneHint";
    hint.textContent = "Click or press any key to skip";
    scene.box.appendChild(hint);

    return new Promise(resolve => {
        let done = false;
        const finish = async () => {
            if (done) return;
            done = true;
            window.removeEventListener("keydown", finish);
            scene.box.removeEventListener("click", finish);
            await scene.fadeOut(450);
            resolve();
        };
        window.addEventListener("keydown", finish);
        scene.box.addEventListener("click", finish);
        const quick = reducedMotion();
        scene.draw(time => drawTitle(scene.canvas, quick ? length : time));
        setTimeout(finish, quick ? 1200 : length);
    });
}
