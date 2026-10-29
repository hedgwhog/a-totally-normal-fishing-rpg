import { connect } from "./net.js";
import { showOfferForm, offerText } from "./offerForm.js";
import { positions } from "./rules/duel.js";
import { duelLimits } from "./data/duel.js";
import { isKey, keyHint } from "./keybinds.js";

const params = new URLSearchParams(location.search);
const socket = connect("duel", { sessionId: params.get("id") });
const el = id => document.getElementById(id);

let stakeFormShown = false;
let shownSettings = null;
let shownRods = null;
let iAmReady = false;

socket.on("connect_error", error => el("duelError").textContent = error.message);
socket.on("duel:error", message => el("duelError").textContent = message);

const settingFields = [
    ["time", "Time limit (seconds)", duelLimits.time],
    ["lives", "Lives", duelLimits.lives],
    ["minLineSpeed", "Line speed min (ms)", duelLimits.lineSpeed],
    ["maxLineSpeed", "Line speed max (ms)", duelLimits.lineSpeed],
    ["minFishSpeed", "Fish speed min (ms)", duelLimits.fishSpeed],
    ["maxFishSpeed", "Fish speed max (ms)", duelLimits.fishSpeed],
    ["minWidth", "Bar length min", duelLimits.width],
    ["maxWidth", "Bar length max", duelLimits.width],
];

function showSettings(settings) {
    if (JSON.stringify(settings) === shownSettings) return;
    shownSettings = JSON.stringify(settings);
    const box = el("settingsForm");
    box.innerHTML = "";
    const inputs = {};
    for (const [key, label, [least, most]] of settingFields) {
        const row = document.createElement("label");
        row.className = "row";
        row.textContent = label + " (" + least + "-" + most + ")";
        const input = document.createElement("input");
        input.type = "number";
        input.min = least;
        input.max = most;
        input.value = settings[key];
        input.style.width = "60px";
        row.appendChild(input);
        box.appendChild(row);
        inputs[key] = input;
    }
    const save = document.createElement("button");
    save.textContent = "Save settings";
    save.addEventListener("click", async () => {
        const values = {};
        for (const key of Object.keys(inputs)) values[key] = Number(inputs[key].value);
        const result = await socket.emitWithAck("duel:settings", values);
        el("duelError").textContent = result.error || "";
    });
    box.appendChild(save);
}

function showRods(duel) {
    const select = el("rodSelect");
    const options = JSON.stringify(duel.rods);
    if (options !== shownRods) {
        shownRods = options;
        select.innerHTML = "";
        for (const rod of duel.rods) {
            const option = document.createElement("option");
            option.value = rod.key;
            option.textContent = (rod.key === "equipped" ? "(worn) " : "") + rod.name;
            select.appendChild(option);
        }
    }
    select.value = duel.myRod.key;
    el("theirRod").textContent = duel.other + " uses: " + duel.theirRod;
}

el("rodSelect").addEventListener("change", async () => {
    const result = await socket.emitWithAck("duel:rod", el("rodSelect").value);
    el("duelError").textContent = result.error || "";
});

socket.on("duel:state", duel => {
    el("title").textContent = "Duel with " + duel.other;
    if (duel.phase === "setup") {
        showSettings(duel.settings);
        showRods(duel);
        if (!stakeFormShown) {
            showOfferForm(el("myStakeForm"), duel.inventory, duel.myStake, async stake => {
                const result = await socket.emitWithAck("duel:stake", stake);
                el("duelError").textContent = result.error || "";
            });
            stakeFormShown = true;
        }
        el("myStake").textContent = offerText(duel.myStake);
        el("theirStakeLine").textContent = duel.other + " puts in: " + offerText(duel.theirStake);
        el("readyStatus").textContent = (duel.iReady ? "You're ready. " : "") + (duel.theyReady ? duel.other + " is ready." : "Waiting for " + duel.other + ".");
        iAmReady = duel.iReady;
        if (duel.iReady) el("ready").textContent = "Unready";
        else el("ready").textContent = "Ready";
        return;
    }
    if (duel.phase === "cancelled") {
        el("setup").querySelectorAll("button, input, select").forEach(input => input.disabled = true);
        el("setupFooter").querySelectorAll("button").forEach(button => button.disabled = true);
        el("readyStatus").textContent = "The duel was cancelled. You can close this window.";
        return;
    }
    el("setup").style.display = "none";
    el("setupFooter").style.display = "none";
    el("playing").style.display = "flex";
    showScore(duel);
    phase = duel.phase;
    if (duel.phase === "playing" && !duel.started) el("roundStatus").textContent = "The duel starts...";
    if (duel.phase === "playing" && duel.myLives <= 0) {
        stopBar();
        el("reel").disabled = true;
        el("roundStatus").textContent = "You're out of lives! Waiting for the timer (or for " + duel.other + ").";
    }
    if (duel.phase === "done") {
        stopBar();
        const text = { won: "You won! You get both stakes.", lost: "You lost. " + duel.other + " gets both stakes.", tie: "It's a tie! Everyone gets their stake back." };
        el("roundStatus").textContent = text[duel.result] + " You can close this window.";
        el("reel").disabled = true;
        el("timer").textContent = "";
    }
});

let phase = "setup";
let endsAt = 0;

function showScore(duel) {
    if (duel.myLives === undefined) return;
    endsAt = performance.now() + duel.timeLeftMs;
    el("lives").textContent = "You: " + duel.myHits + " hits, " + duel.myLives + " lives | " + duel.other + ": " + duel.theirHits + " hits, " + duel.theirLives + " lives";
}

setInterval(() => {
    if (phase !== "playing") return;
    el("timer").textContent = "Time left: " + Math.ceil(Math.max(0, endsAt - performance.now()) / 1000) + "s";
}, 100);

el("ready").addEventListener("click", async () => {
    let action = "duel:ready";
    if (iAmReady) action = "duel:unready";
    const result = await socket.emitWithAck(action, {});
    el("duelError").textContent = result.error || "";
});
el("cancel").addEventListener("click", () => socket.emit("duel:cancel"));

let round = null;
let roundNo = 0;
let myStats = null;
let roundStart = 0;
let reeled = false;
let frame = null;

function drawBar(elapsed) {
    const { line, fish, zone } = positions(round, myStats, elapsed);
    let bar = "";
    for (let spot = 0; spot < round.width; spot++) {
        if (spot === line) bar += "|";
        else if (spot >= fish && spot < fish + zone) bar += "=";
        else bar += "-";
    }
    el("duelBar").textContent = "[" + bar + "]";
}

function animate() {
    if (performance.now() >= endsAt) {
        el("roundStatus").textContent = "Time's up!";
        el("reel").disabled = true;
        return stopBar();
    }
    drawBar(performance.now() - roundStart);
    frame = requestAnimationFrame(animate);
}

function stopBar() {
    cancelAnimationFrame(frame);
    reeled = true;
}

socket.on("duel:round", data => {
    round = data.round;
    roundNo = data.roundNo;
    myStats = data.myStats;
    roundStart = performance.now();
    reeled = false;
    showScore(data);
    el("reel").disabled = false;
    el("reel").textContent = "Reel" + keyHint("reel");
    const last = data.lastHit === null ? "" : data.lastHit ? "Hit! " : "Miss! You lose a life. ";
    el("roundStatus").textContent = last + "Reel when your line | is on the fish ===";
    cancelAnimationFrame(frame);
    animate();
});

function reel() {
    if (reeled || !round || performance.now() >= endsAt) return;
    const elapsed = performance.now() - roundStart;
    stopBar();
    drawBar(elapsed);
    el("reel").disabled = true;
    socket.emit("duel:reel", { roundNo, elapsed });
}

el("reel").addEventListener("click", reel);
window.addEventListener("keydown", event => {
    if (isKey(event, "reel") && !event.repeat) {
        event.preventDefault();
        reel();
    }
});
