import { api, connect, getToken, setToken } from "./core/net.js";
import { startState } from "./core/state.js";
import { playTitle } from "./screens/titleScreen.js";
import { startCastIn } from "./screens/castIn.js";

const screen = document.getElementById("startScreen");
const panels = {
    login: document.getElementById("loginPanel"),
    signup: document.getElementById("signupPanel"),
    saves: document.getElementById("savePanel"),
};

let selectedSlot = Number(localStorage.getItem("selectedSlot")) || 1;
let account = null;

function showPanel(name, message = "") {
    for (const key of Object.keys(panels)) {
        if (key === name) panels[key].style.display = "block";
        else panels[key].style.display = "none";
    }
    const messageBox = panels[name].querySelector(".startMessage");
    if (messageBox) messageBox.textContent = message;
}

function value(id) {
    return document.getElementById(id).value;
}

document.getElementById("loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const result = await api("/api/login", { username: value("loginUsername"), password: value("loginPassword") });
    if (result.error) return showPanel("login", result.error);
    setToken(result.token);
    showSaves();
});

document.getElementById("signupForm").addEventListener("submit", async event => {
    event.preventDefault();
    const result = await api("/api/signup", {
        username: value("signupUsername"),
        displayName: value("signupDisplayName"),
        password: value("signupPassword"),
        password2: value("signupPassword2"),
    });
    if (result.error) return showPanel("signup", result.error);
    setToken(result.token);
    showSaves();
});

document.getElementById("toSignup").addEventListener("click", () => showPanel("signup"));
document.getElementById("toLogin").addEventListener("click", () => showPanel("login"));
document.getElementById("logout").addEventListener("click", async () => {
    await api("/api/logout", {});
    setToken(null);
    showPanel("login");
});

function playtimeText(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return hours + "h " + minutes + "m";
    return minutes + "m";
}

function addLine(box, text, className = "") {
    const line = document.createElement("span");
    line.className = className;
    line.textContent = text;
    box.appendChild(line);
}

function showSaveButtons() {
    const list = document.getElementById("saveList");
    list.innerHTML = "";
    for (const save of account.saves) {
        const button = document.createElement("button");
        button.className = "saveButton";
        if (save.slot === selectedSlot) button.classList.add("selected");

        addLine(button, "Save " + save.slot, "saveName");
        if (save.day) {
            addLine(button, "Day " + save.day + " - " + save.time);
            addLine(button, save.area);
            addLine(button, playtimeText(save.playtime) + " played");
        } else {
            addLine(button, "Empty: starts a new game");
        }

        button.addEventListener("click", () => {
            selectedSlot = save.slot;
            localStorage.setItem("selectedSlot", selectedSlot);
            showSaveButtons();
        });
        list.appendChild(button);
    }
}

function showFriends() {
    const list = document.getElementById("friendList");
    list.innerHTML = "";
    if (account.friends.length === 0) {
        addLine(list, "No friends yet. Add them in the chat.", "startNote");
        return;
    }
    for (const friend of account.friends) {
        const row = document.createElement("div");
        row.className = "friendLine";
        addLine(row, friend.name);
        addLine(row, friend.online ? "online" : "offline", friend.online ? "online" : "offline");
        list.appendChild(row);
    }
}

async function showSaves(message = "") {
    const result = await api("/api/saves");
    if (result.error) {
        setToken(null);
        return showPanel("login", result.error);
    }
    account = result;
    if (!localStorage.getItem("selectedSlot")) selectedSlot = result.lastSlot || 1;

    document.getElementById("loggedInAs").textContent = "Logged in as " + result.displayName + " (" + result.username + ")";
    let online = result.online + " players online";
    if (result.online === 1) online = "1 player online";
    document.getElementById("totalOnline").textContent = online;

    showSaveButtons();
    showFriends();
    showPanel("saves", message);
}

function play() {
    const slot = selectedSlot;
    const loading = startCastIn("Loading save " + slot);
    const socket = connect("game", { slot: slot });

    socket.once("connect_error", error => {
        loading.cancel();
        socket.close();
        showSaves(error.message || "Can't connect to the server.");
    });

    socket.on("kicked", message => {
        alert(message);
        location.reload();
    });

    socket.once("state", async state => {
        startState(socket, { username: account.username, displayName: account.displayName, slot: slot }, state);
        screen.style.display = "none";
        await import("./game.js");
        loading.finish();
    });
}

document.getElementById("playButton").addEventListener("click", play);

if (getToken()) showSaves();
else showPanel("login");
playTitle();
