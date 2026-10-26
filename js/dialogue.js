import { closeAllPopups } from "./ui.js";
import { characters } from "./data/dialogue.js";
import { isKey, keyHint, isListening } from "./keybinds.js";

const box = document.getElementById("fishingPopup");
const boxText = document.getElementById("fishingText");
const boxButtons = document.getElementById("fishingButtons");

function setButtonsDisabled(disabled) {
    document.querySelectorAll("button").forEach(button => {
        button.disabled = disabled;
    });
}

export function openEvent(text, buttons = []) {
    cancelCleanup();
    dialogueOpen = false;
    hiddenPopups = [];
    closeAllPopups();
    showBox(text, buttons);
}

function showBox(text, buttons) {
    cancelCleanup();
    setButtonsDisabled(true);
    boxText.textContent = text;
    boxButtons.innerHTML = "";
    buttons.forEach(([label, action]) => {
        const button = document.createElement("button");
        button.textContent = label;
        button.addEventListener("click", action);
        boxButtons.appendChild(button);
    });
    box.style.display = "block";
}

export function setEventText(text) {
    boxText.textContent = text;
}

export function closeEvent() {
    box.style.display = "none";
    setButtonsDisabled(false);
}

let hiddenPopups = [];

function hidePopups() {
    document.querySelectorAll(".popup").forEach(popup => {
        if (getComputedStyle(popup).display === "none") return;
        hiddenPopups.push([popup, popup.style.display]);
        popup.style.display = "none";
    });
}

let cleanupTimer = null;
let dialogueOpen = false;

function cancelCleanup() {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
}

function cleanup() {
    cleanupTimer = null;
    if (dialogueOpen) closeEvent();
    dialogueOpen = false;
    hiddenPopups.forEach(([popup, display]) => popup.style.display = display);
    hiddenPopups = [];
}

function cleanupLater() {
    cleanupTimer = setTimeout(cleanup, 0);
}

let queue = Promise.resolve();

function inLine(task) {
    const run = queue.then(async () => {
        cancelCleanup();
        hidePopups();
        try {
            return await task();
        } finally {
            cleanupLater();
        }
    });
    queue = run.catch(() => {});
    return run;
}

// Lines
export function pick(list) {
    return Array.isArray(list) ? list[Math.floor(Math.random() * list.length)] : list;
}

export function fill(text, values = {}) {
    return text.replace(/\{(\w+)\}/g, (match, word) => (word in values ? values[word] : match));
}

function speakerName(who) {
    if (!who) return "";
    return characters[who] ? characters[who].name : who;
}

function prepareLine(line, speaker, values) {
    const isObject = typeof line === "object";
    const name = speakerName(isObject ? line.who : speaker);
    const text = fill(isObject ? line.text : line, values);
    return name ? name + ":\n\n" + text : text;
}

function showLine(text, canGoBack) {
    return new Promise(resolve => {
        function done(result) {
            window.removeEventListener("keydown", onKey);
            resolve(result);
        }
        function onKey(event) {
            if (event.repeat || isListening()) return;
            if (isKey(event, "continue")) {
                event.preventDefault();
                done("next");
            } else if (canGoBack && isKey(event, "back")) {
                event.preventDefault();
                done("back");
            }
        }
        const buttons = [];
        if (canGoBack) buttons.push(["Back" + keyHint("back"), () => done("back")]);
        buttons.push(["Continue" + keyHint("continue"), () => done("next")]);
        showBox(text, buttons);
        dialogueOpen = true;
        window.addEventListener("keydown", onKey);
    });
}

export function say(lines, speaker = "", values = {}) {
    const list = (Array.isArray(lines) ? lines : [lines]).map(line => prepareLine(line, speaker, values));
    return inLine(async () => {
        let n = 0;
        while (n < list.length) {
            const result = await showLine(list[n], n > 0);
            n += (result === "back") ? -1 : 1;
        }
    });
}

export function ask(text, choices, speaker = "", values = {}) {
    const question = prepareLine(text, speaker, values);
    return inLine(() => new Promise(resolve => {
        showBox(question, choices.map(choice => [choice, () => resolve(choice)]));
        dialogueOpen = true;
    }));
}

export async function askYesNo(text, speaker = "", yes = "Yes", no = "No", values = {}) {
    return (await ask(text, [yes, no], speaker, values)) === yes;
}