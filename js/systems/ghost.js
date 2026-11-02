// The Ghost of Noy: shows up in the night before every 101st day (wherever you are) with the gear you lost.
// You pay with days, plus coins and/or resonance. The days pass when you leave.
// The numbers are in shared/data/ghost.js, the server part is ghost.buy and ghost.leave (server/game.js).
import { findGear } from "../shared/data/gear.js";
import { lines } from "../shared/data/dialogue.js";
import { ghostPrice, ghostStock } from "../shared/rules/ghost.js";
import { getState, onState, act, localKey } from "../core/state.js";
import { say, pick, fill, whenFree, isFree } from "../core/dialogue.js";
import { openPopup, ensurePopup } from "../core/ui.js";
import { addText, addButton, round1, formatNumber } from "../core/helpers.js";
import { handlePendingGear } from "../player/gear.js";

const ghost = "ghost";
const popup = ensurePopup("ghostDisplay", `
    <button id="ghostLeave" class="popupClose">Leave</button>
    <h1>Ghost of Noy</h1>
    <h4>Visits in the night before every 101st day. Pays in days, and coins and/or resonance.</h4>
    <div id="ghostItem" class="popupBody"></div>`);
const page = document.getElementById("ghostItem");
let busy = false;

const isShown = () => getComputedStyle(popup).display !== "none";
const daysText = days => days + (days === 1 ? " day" : " days");

// waits until no full screen animation (a new day, a trip) is playing
function whenNoScene() {
    return new Promise(resolve => {
        const check = () => document.querySelector(".scene") ? setTimeout(check, 250) : resolve();
        check();
    });
}

async function arrive() {
    if (busy || !getState().ghost) return;
    busy = true;
    try {
        await whenNoScene();
        await whenFree(400);
        const visit = getState().ghost;
        if (!visit) return;
        const key = localKey("ghostGreeted");
        if (localStorage.getItem(key) !== String(visit.day)) {
            localStorage.setItem(key, visit.day);
            await say(lines.ghost.arrival, ghost);
        }
        if (getState().ghost) open();
    } finally {
        busy = false;
    }
}

function open() {
    show();
    openPopup(popup);
}

function show() {
    const save = getState();
    page.innerHTML = "";
    if (!save.ghost) return;

    addText(page, "Ghost of Noy: \"" + pick(lines.ghost.welcome) + "\"");
    addText(page, "You have " + formatNumber(save.coins) + " coins and " + formatNumber(save.resonance) + " resonance. "
        + "Days owed so far: " + save.ghost.owed + " (they pass when you leave).");

    const stock = ghostStock(save);
    if (stock.length === 0) addText(page, "The ghost has nothing left of yours.");
    for (const id of stock) addRow(findGear(id));
}

function addRow(gear) {
    const save = getState();
    const price = ghostPrice(gear);
    const row = document.createElement("div");
    row.className = "ghostRow";
    addText(row, gear.name + (gear.effect ? " | Effects: " + gear.effect : ""));
    addText(row, "Price: " + daysText(price.days) + " + " + formatNumber(price.value) + " in coins and/or resonance");

    const pay = document.createElement("div");
    pay.className = "ghostPay";
    const label = document.createElement("label");
    label.textContent = "Coins: ";
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = price.value;
    input.step = 0.1;
    input.value = Math.min(price.value, save.coins);
    label.appendChild(input);
    const rest = document.createElement("span");
    const coins = () => round1(Math.min(price.value, Math.max(0, Number(input.value) || 0)));
    const showRest = () => rest.textContent = "+ " + formatNumber(round1(price.value - coins())) + " resonance";
    input.addEventListener("input", showRest);
    showRest();
    pay.append(label, rest);
    addButton(pay, "Buy back", () => buy(gear, coins()));
    row.appendChild(pay);
    page.appendChild(row);
}

async function buy(gear, coins) {
    const result = await act("ghost.buy", { id: gear.id, coins });
    if (result.error) return say(result.error);
    await say(pick(lines.ghost.bought), ghost);
    await handlePendingGear();
}

document.getElementById("ghostLeave").addEventListener("click", async () => {
    const result = await act("ghost.leave");
    if (result.error) return say(result.error);
    popup.style.display = "none";
    if (result.days > 0) await say(fill(pick(lines.ghost.leavePaid), { days: result.days }), ghost);
    else await say(pick(lines.ghost.leaveNothing), ghost);
});

onState(state => {
    if (!state.ghost) {
        popup.style.display = "none";
        return;
    }
    if (isShown()) show();
    else arrive();
});

// the ghost doesn't let you walk away: if something else closed its window, it comes back
setInterval(() => {
    if (getState().ghost && !isShown() && !busy && isFree() && !document.querySelector(".scene")) open();
}, 700);

arrive();
