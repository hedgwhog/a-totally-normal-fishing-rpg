// A full screen ASCII animation on top of the game. Used by the title, loading, travel and day screens.
// scene.draw(time => { canvas.text(x, y, "..."); }) is called every frame, time in ms since the start.

const container = document.getElementById("container");
const fontSize = 12;
const lineHeight = 14;

let charWidth = 0;
function measure() {
    if (charWidth) return charWidth;
    const probe = document.createElement("pre");
    probe.className = "sceneText";
    probe.style.cssText = "position:absolute;visibility:hidden";
    probe.textContent = "x".repeat(50);
    container.appendChild(probe);
    charWidth = probe.getBoundingClientRect().width / 50 || fontSize * 0.6;
    probe.remove();
    return charWidth;
}

export function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function createScene(className = "") {
    const box = document.createElement("div");
    box.className = "scene " + className;
    const text = document.createElement("pre");
    text.className = "sceneText";
    box.appendChild(text);
    container.appendChild(box);

    const columns = Math.floor((container.clientWidth - 4) / measure());
    const rows = Math.floor((container.clientHeight - 4) / lineHeight);
    let grid = [];
    let running = false;
    let started = 0;

    const canvas = {
        columns,
        rows,
        clear() {
            grid = Array.from({ length: rows }, () => Array(columns).fill(" "));
        },
        // writes text at x, y. Spaces in the text are see-through unless solid is true.
        text(x, y, value, solid = false) {
            x = Math.round(x);
            y = Math.round(y);
            if (y < 0 || y >= rows) return;
            for (let i = 0; i < value.length; i++) {
                const column = x + i;
                if (column < 0 || column >= columns) continue;
                if (value[i] !== " " || solid) grid[y][column] = value[i];
            }
        },
        lines(x, y, list, solid = false) {
            list.forEach((line, i) => canvas.text(x, y + i, line, solid));
        },
        center(y, value, solid = false) {
            canvas.text((columns - value.length) / 2, y, value, solid);
        },
        // the waves at the bottom, moving sideways
        sea(top, time, speed = 0.004) {
            const pattern = "~   ~~  ~    ~ ~   ~~~   ~  ";
            for (let y = top; y < rows; y++) {
                const shift = Math.floor(time * speed * (1 + (y - top) * 0.35)) + y * 7;
                let line = "";
                for (let x = 0; x < columns; x++) line += pattern[(x + shift) % pattern.length];
                canvas.text(0, y, line);
            }
        },
    };

    // a small sailboat that bobs on the waves. x = the middle of the boat, y = the waterline.
    // backwards = the sail faces the other way
    canvas.sailboat = (x, y, time, backwards = false) => {
        const bob = Math.round(Math.sin(time / 380) * 0.6);
        const boat = backwards ? [
            "      /|     ",
            "     / |     ",
            "    /  |     ",
            "   /___|     ",
            " \\_________/ ",
        ] : [
            "     |\\     ",
            "     | \\    ",
            "     |  \\   ",
            "     |___\\  ",
            " \\_________/ ",
        ];
        canvas.lines(x - 7, y - boat.length + 1 + bob, boat, true);
    };

    return {
        box,
        canvas,
        draw(frame) {
            running = true;
            started = performance.now();
            const tick = now => {
                if (!running) return;
                canvas.clear();
                frame(now - started);
                text.textContent = grid.map(row => row.join("")).join("\n");
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        },
        stop() {
            running = false;
        },
        fadeOut(ms = 400) {
            return new Promise(resolve => {
                box.style.transition = "opacity " + ms + "ms";
                box.style.opacity = "0";
                setTimeout(() => {
                    running = false;
                    box.remove();
                    resolve();
                }, ms);
            });
        },
        remove() {
            running = false;
            box.remove();
        },
    };
}

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
