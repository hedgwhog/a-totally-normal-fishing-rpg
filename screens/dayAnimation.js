// A new day: the sun rises over the water, with the day number.
import { createScene, reducedMotion } from "./scene.js";
import { bigText } from "./lettering.js";

const length = 2600;
const sun = [
    "      .-'''-.      ",
    "    .'       '.    ",
    "   /           \\   ",
    "  |             |  ",
    "   \\           /   ",
    "    '.       .'    ",
    "      '-...-'      ",
];
const rays = [
    "  \\      |      /  ",
    "   \\     |     /   ",
];

function drawDay(canvas, time, day) {
    const { columns, rows } = canvas;
    const horizon = rows - 9;
    const rise = Math.min(1, time / 1700);
    const eased = 1 - Math.pow(1 - rise, 3);
    const left = Math.floor((columns - sun[0].length) / 2);
    const top = Math.round(horizon + 1 - eased * (sun.length + 3));

    if (rise > 0.75) canvas.lines(left, top - 3, rays);
    sun.forEach((line, i) => {
        if (top + i < horizon) canvas.text(left, top + i, line);
    });
    canvas.text(0, horizon, "_".repeat(columns));

    canvas.sea(horizon + 1, time, 0.003);
    // the sunlight on the water
    for (let y = 1; y <= 3; y++) {
        const width = Math.round(eased * (sun[0].length - y * 4));
        if (width > 0) canvas.text(Math.floor((columns - width) / 2), horizon + y * 2, "= ".repeat(Math.ceil(width / 2)).slice(0, width), true);
    }

    // the day number drops in
    const text = bigText("Day " + day);
    const drop = Math.max(0, 1 - (time - 300) / 600);
    if (time > 300) canvas.lines(Math.floor((columns - text[0].length) / 2), 3 - Math.round(drop * drop * 8), text);
}

export async function showDay(day) {
    const scene = createScene("dayScene");
    const quick = reducedMotion();
    scene.draw(time => drawDay(scene.canvas, quick ? length : time, day));
    await new Promise(resolve => setTimeout(resolve, quick ? 1200 : length));
    await scene.fadeOut(500);
}
