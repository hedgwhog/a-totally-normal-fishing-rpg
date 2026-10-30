import { birds } from "../shared/data/birds.js";
import { items } from "../shared/data/items.js";
import { towns } from "../shared/data/world.js";
import { getState, onState, act } from "../core/state.js";
import { say, askYesNo } from "../core/dialogue.js";
import { openPopup } from "../core/ui.js";
import { addText, addButton, formatNumber, coinsText, round1 } from "../core/helpers.js";

// You receive mail from the bird (data/birds.js)

const popup = document.getElementById("mailDisplay");
const tabs = document.querySelectorAll(".mailTabs button");
const pages = {
    mailInbox: document.getElementById("mailInbox"),
    mailWrite: document.getElementById("mailWrite"),
    mailFriends: document.getElementById("mailFriends"),
};

let activeTab = "mailInbox";
const giftItems = items.filter(item => birds.giftCategories.includes(item.category));

// keep the drafts of mail
const draft = { to: null, text: "", coins: 0, resonance: 0, items: {} };

const isOpen = () => getComputedStyle(popup).display !== "none";
const bird = () => getState().bird;
const food = () => getState().items[birds.food] || 0;

export function openMail(tab = activeTab) {
    if (document.getElementById("nextFish").disabled && !isOpen()) return;
    activeTab = tab;
    showAll();
    openPopup(popup);
}

function showTab() {
    tabs.forEach(tab => tab.classList.toggle("activeTab", tab.dataset.mail === activeTab));
    for (const [id, page] of Object.entries(pages)) page.classList.toggle("activePage", id === activeTab);
}

tabs.forEach(tab => tab.addEventListener("click", () => {
    activeTab = tab.dataset.mail;
    showAll();
}));

function giftText(gifts) {
    const parts = [];
    if (gifts.coins > 0) parts.push(coinsText(gifts.coins));
    if (gifts.resonance > 0) parts.push(formatNumber(gifts.resonance) + " resonance");
    for (const [id, amount] of Object.entries(gifts.items || {})) {
        const item = items.find(item => item.id === id);
        if (item && amount > 0) parts.push(amount + "x " + item.name);
    }
    return parts.join(", ");
}

export { giftText };

function dateText(time) {
    return new Date(time).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function showInbox() {
    const page = pages.mailInbox;
    page.innerHTML = "";
    const letters = [...getState().inbox].sort((first, second) => second.arrivesAt - first.arrivesAt);
    if (letters.length === 0) {
        addText(page, "No letters yet.");
        const note = document.createElement("p");
        note.className = "note";
        note.textContent = "Friends can send you letters with their carrier pigeon. Add friends in the chat: Players here > Add friend.";
        page.appendChild(note);
        return;
    }
    for (const letter of letters) {
        const box = document.createElement("div");
        box.className = "letter";

        const head = document.createElement("div");
        head.className = "letterHead";
        const from = document.createElement("b");
        from.textContent = "From " + letter.fromName + (towns[letter.fromTown] ? " (" + towns[letter.fromTown].name + ")" : "");
        const when = document.createElement("span");
        when.textContent = dateText(letter.arrivesAt);
        head.append(from, when);

        const text = document.createElement("p");
        text.className = "letterText";
        text.textContent = letter.text; // So nobody can put code in a letter, only text is allowed
        box.append(head, text);

        const gifts = giftText(letter.gifts);
        if (gifts) {
            const giftLine = document.createElement("div");
            giftLine.className = "letterGifts";
            giftLine.textContent = "Came with: " + gifts + " (already in your inventory)";
            box.appendChild(giftLine);
        }
        addButton(box, "Throw away", async () => {
            if (!await askYesNo("Throw away the letter from " + letter.fromName + "?")) return;
            const result = await act("mail.delete", { id: letter.id });
            if (result.error) await say(result.error);
        });
        page.appendChild(box);
    }
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "You can keep " + birds.inboxSize + " letters. After that, the oldest one is thrown away.";
    page.appendChild(note);
}

function addNote(page, text) {
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = text;
    page.appendChild(note);
    return note;
}

function showWrite() {
    const page = pages.mailWrite;
    const typing = document.activeElement && document.activeElement.matches("input, textarea, select");
    if (typing && page.contains(document.activeElement)) return;
    page.innerHTML = "";

    if (!bird()) {
        addText(page, "You need a carrier pigeon to send letters.");
        addNote(page, "The mayor in the town hall of Freshwater Haven might help you get one.");
        return;
    }
    const friends = getState().friends;
    if (friends.length === 0) {
        addText(page, "You don't have any friends to write to yet.");
        addNote(page, "Open the chat, and press Add friend next to a player under Players here. They have to accept.");
        return;
    }
    if (!friends.some(friend => friend.id === draft.to)) draft.to = friends[0].id;

    const form = document.createElement("div");
    form.className = "mailForm";

    if (bird().job) {
        const busy = document.createElement("div");
        busy.textContent = bird().name + " is still out. You can already write your letter.";
        form.appendChild(busy);
    }

    const toLabel = document.createElement("label");
    toLabel.textContent = "To:";
    const select = document.createElement("select");
    for (const friend of friends) {
        const option = document.createElement("option");
        option.value = friend.id;
        option.textContent = friend.name;
        option.selected = friend.id === draft.to;
        select.appendChild(option);
    }
    select.addEventListener("change", () => draft.to = Number(select.value));
    toLabel.appendChild(select);
    form.appendChild(toLabel);

    const text = document.createElement("textarea");
    text.maxLength = birds.maxLetterLength;
    text.placeholder = "Write your letter...";
    text.value = draft.text;
    const counter = document.createElement("div");
    counter.className = "note";
    const count = () => counter.textContent = text.value.length + " / " + birds.maxLetterLength + " characters";
    text.addEventListener("input", () => {
        draft.text = text.value;
        count();
    });
    count();
    form.append(text, counter);

    const giftTitle = document.createElement("div");
    giftTitle.textContent = "Gifts (optional):";
    form.appendChild(giftTitle);
    form.appendChild(numberRow("Coins", "coins", getState().coins));
    form.appendChild(numberRow("Resonance", "resonance", getState().resonance));
    for (const item of giftItems) {
        const have = getState().items[item.id] || 0;
        if (have > 0) form.appendChild(itemRow(item, have));
    }

    const cost = document.createElement("div");
    cost.textContent = "The trip costs " + birds.mailFood + " birdfood. You have " + food() + ".";
    form.appendChild(cost);
    addButton(form, "Send with " + bird().name, send);
    page.appendChild(form);
    addNote(page, "The letter takes 1 hour per tile between your town and theirs, and " + bird().name + " flies back too.");
}

function numberRow(label, key, max) {
    const row = document.createElement("label");
    row.className = "giftRow";
    row.append(label + ":");
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.step = 0.1;
    input.value = draft[key];
    input.addEventListener("input", () => draft[key] = Math.max(0, round1(Number(input.value) || 0)));
    row.append(input, "(you have " + formatNumber(max) + ")");
    return row;
}

function itemRow(item, have) {
    const row = document.createElement("div");
    row.className = "giftRow";
    const amount = document.createElement("span");
    const show = () => amount.textContent = " " + (draft.items[item.id] || 0) + " ";
    const change = by => {
        draft.items[item.id] = Math.max(0, Math.min(have, (draft.items[item.id] || 0) + by));
        show();
    };
    addButton(row, "-", () => change(-1));
    row.appendChild(amount);
    addButton(row, "+", () => change(1));
    row.append(item.name + " (you have " + have + ")");
    show();
    return row;
}

async function send() {
    const myBird = bird();
    const friend = getState().friends.find(friend => friend.id === draft.to);
    if (!friend) return;
    if (myBird.job) return say(myBird.name + " is still out flying. You can send your letter when it's back.");
    if (!draft.text.trim()) return say("Write something first.");
    if (food() < birds.mailFood) return say(myBird.name + " needs " + birds.mailFood + " birdfood for this trip. You have " + food() + ".\n\nThe marketplace sells birdfood.");
    if (draft.coins > getState().coins) return say("You don't have that many coins.");
    if (draft.resonance > getState().resonance) return say("You don't have that much resonance.");

    const gifts = { coins: draft.coins, resonance: draft.resonance, items: { ...draft.items } };
    const giftLine = giftText(gifts);
    if (!await askYesNo("Send your letter to " + friend.name + "?\n\nIt costs " + birds.mailFood + " birdfood." + (giftLine ? "\nGifts: " + giftLine : ""))) return;

    const result = await act("mail.send", { to: friend.id, text: draft.text, gifts });
    if (result.error) return say(result.error);
    Object.assign(draft, { text: "", coins: 0, resonance: 0, items: {} });
    showWrite();
    await say(myBird.name + " flies off with your letter for " + friend.name + ".\n\nWho knows when it will be back...");
}

function showFriends() {
    const page = pages.mailFriends;
    page.innerHTML = "";
    const friends = getState().friends;
    if (friends.length === 0) addText(page, "No friends yet.");
    for (const friend of friends) {
        const row = document.createElement("div");
        row.className = "friendRow";
        const name = document.createElement("span");
        name.textContent = friend.name;
        row.appendChild(name);
        const buttons = document.createElement("span");
        addButton(buttons, "Write", () => {
            draft.to = friend.id;
            activeTab = "mailWrite";
            showAll();
        });
        addButton(buttons, "Remove", async () => {
            if (!await askYesNo("Remove " + friend.name + " as a friend? You can't send each other letters anymore.")) return;
            const result = await act("friends.remove", { id: friend.id });
            if (result.error) await say(result.error);
        });
        row.appendChild(buttons);
        page.appendChild(row);
    }
    addNote(page, "Add friends in the chat: Players here > Add friend. You can only add players who chatted in the last 15 minutes, or are in voice.");
}

function showAll() {
    tabs[0].textContent = "Letters (" + getState().inbox.length + ")";
    showTab();
    showInbox();
    showWrite();
    showFriends();
}

document.getElementById("openMail").addEventListener("click", () => openMail());
onState(() => { if (isOpen()) showAll(); });
