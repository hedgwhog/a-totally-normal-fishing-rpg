import { lines } from "../shared/data/dialogue.js";
import { getState, onState, act } from "../core/state.js";

const popup = document.getElementById("introPopup");
const textBox = document.getElementById("introText");

let waiting = [];

export function whenIntroSeen() {
    if (getState().introSeen) return Promise.resolve();
    return new Promise(resolve => waiting.push(resolve));
}

function finish() {
    waiting.forEach(resolve => resolve());
    waiting = [];
}

function show() {
    textBox.innerHTML = "";
    const title = document.createElement("h2");
    title.textContent = lines.intro.title;
    textBox.appendChild(title);
    for (const text of lines.intro.text) {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        textBox.appendChild(paragraph);
    }
    popup.style.display = "flex";
}

document.getElementById("introStart").addEventListener("click", async () => {
    popup.style.display = "none";
    await act("intro.seen");
    finish();
});

onState(state => {
    if (state.introSeen) finish();
});

if (!getState().introSeen) show();
