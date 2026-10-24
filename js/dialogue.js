import { closeAllPopups } from "./ui.js";

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

function formatLine(line, speaker) {
    const who = (typeof line === "object") ? line.who : speaker;
    const text = (typeof line === "object") ? line.text : line;
    return who ? who + ":\n\n" + text : text;
}

function showLine(text) {
    return new Promise(resolve => {
        function next() {
            window.removeEventListener("keydown", onKey);
            resolve();
        }
        function onKey(event) {
            if ((event.code !== "Enter" && event.code !== "NumpadEnter") || event.repeat) return;
            event.preventDefault();
            next();
        }
        showBox(text, [["Continue [Enter]", next]]);
        dialogueOpen = true;
        window.addEventListener("keydown", onKey);
    });
}

export function say(lines, speaker = "") {
    const list = Array.isArray(lines) ? lines : [lines];
    return inLine(async () => {
        for (const line of list) await showLine(formatLine(line, speaker));
    });
}

export function ask(text, choices, speaker = "") {
    return inLine(() => new Promise(resolve => {
        showBox(formatLine(text, speaker), choices.map(choice => [choice, () => resolve(choice)]));
        dialogueOpen = true;
    }));
}

export async function askYesNo(text, speaker = "", yes = "Yes", no = "No") {
    return (await ask(text, [yes, no], speaker)) === yes;
}
