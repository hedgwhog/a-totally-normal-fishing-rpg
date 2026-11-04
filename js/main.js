import { api, connect, getToken, setToken } from "./core/net.js";
import { startState } from "./core/state.js";
import { playTitle } from "./screens/titleScreen.js";
import { startCastIn } from "./screens/castIn.js";
import { playMenuMusic, stopMenuMusic } from "./screens/menuMusic.js";
import { listenForNotices, showNotice, showPopup } from "./core/notice.js";
import { ageOf } from "./shared/rules/age.js";
import { legal } from "./shared/data/legal.js";
import { titles } from "./shared/data/titles.js";
import "./screens/legalBox.js";

const screen = document.getElementById("startScreen");
const panels = {
    login: document.getElementById("loginPanel"),
    signup: document.getElementById("signupPanel"),
    saves: document.getElementById("savePanel"),
    update: document.getElementById("updatePanel"),
    account: document.getElementById("accountPanel"),
    admin: document.getElementById("adminPanel"),
};
const menuButtons = document.querySelector(".menuButtons");

let selectedSlot = Number(localStorage.getItem("selectedSlot")) || 1;
let account = null;
let shownBlock = null;

function showPanel(name, message = "") {
    // the Account button only when you're logged in and your account is up to date
    if (menuButtons) menuButtons.style.display = ["saves", "account", "admin"].includes(name) ? "flex" : "none";
    // the admin panel uses the whole screen: the box with the rules and policies steps aside
    const legal = document.getElementById("legalBox");
    if (legal) legal.style.display = name === "admin" ? "none" : "";
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
        birthDate: value("signupBirthDate"),
        acceptTerms: document.getElementById("signupTerms").checked,
        website: value("signupWebsite"), // bots fill this in, people don't see it
    });
    if (result.error) return showPanel("signup", result.error);
    setToken(result.token);
    showSaves();
});

document.getElementById("toSignup").addEventListener("click", () => {
    document.getElementById("signupForm").reset();
    showPanel("signup");
});
document.getElementById("toLogin").addEventListener("click", () => showPanel("login"));
// empties the forms with things you typed (so the sign-up form doesn't show your old details after logging out)
function clearForms() {
    for (const id of ["signupForm", "updateForm", "deleteForm", "passwordForm"]) document.getElementById(id)?.reset();
    document.getElementById("loginPassword").value = "";
}

document.getElementById("logout").addEventListener("click", async () => {
    await api("/api/logout", {});
    setToken(null);
    clearForms();
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
    showNotice(result.notice);
    if (result.needsUpdate) return showUpdate(result);
    // messages from the admins (warnings, timeouts, bans) are shown here, on the start screen
    for (const text of result.messages || []) showPopup("Message from the admins", text);
    if (result.blocked && result.blocked !== shownBlock) {
        shownBlock = result.blocked; // once per visit, not every time you come back from Account
        showPopup("Message from the admins", result.blocked);
    }
    account = result;
    const adminButton = document.getElementById("adminButton");
    if (adminButton) adminButton.style.display = result.isAdmin ? "inline-block" : "none";
    if (!localStorage.getItem("selectedSlot")) selectedSlot = result.lastSlot || 1;

    document.getElementById("loggedInAs").textContent = "Logged in as " + result.displayName + " (" + result.username + ")";
    let online = result.online + " players online";
    if (result.online === 1) online = "1 player online";
    document.getElementById("totalOnline").textContent = online;

    showSaveButtons();
    showFriends();
    // players under 16 play alone: no friends list on the start screen
    document.querySelector("#savePanel .startSide").style.visibility = result.multiplayer === false ? "hidden" : "visible";
    // banned or timed out: you can still see your account, but not play
    document.getElementById("playButton").disabled = Boolean(result.blocked);
    showPanel("saves", message || result.blocked || "");
}

// ---------- Accounts from before the age check, or a new version of the Terms of Service ----------
function showUpdate(result) {
    const needsBirthDate = result.needsUpdate.birthDate;
    document.getElementById("updateBirthRow").style.display = needsBirthDate ? "flex" : "none";
    document.getElementById("updateBirthDate").required = needsBirthDate;
    document.getElementById("updateNote").textContent = (needsBirthDate
        ? "We now ask everyone for their date of birth, and to accept our Terms of Service. "
        : "Our Terms of Service changed. ")
        + "You can play again after this.";
    showPanel("update");
}

document.getElementById("updateForm").addEventListener("submit", async event => {
    event.preventDefault();
    const birthDate = value("updateBirthDate");
    if (document.getElementById("updateBirthRow").style.display !== "none") {
        const age = ageOf(birthDate);
        if (age === null) return showPanel("update", "Fill in your date of birth.");
        if (age < legal.minimumAge && !confirm("You must be at least " + legal.minimumAge + " years old to play.\nIf this date is right, your account will be deleted. Continue?")) return;
    }
    const result = await api("/api/account/update", { birthDate, acceptTerms: document.getElementById("updateTerms").checked });
    if (result.deleted) {
        setToken(null);
        return showPanel("login", result.error);
    }
    if (result.error) return showPanel("update", result.error);
    showSaves();
});

document.getElementById("updateLogout").addEventListener("click", async () => {
    await api("/api/logout", {});
    setToken(null);
    clearForms();
    showPanel("login");
});

// ---------- Your account ----------
function detailRow(box, label, text) {
    const row = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = label;
    const content = document.createElement("span");
    content.textContent = text;
    row.append(name, content);
    box.appendChild(row);
}

async function showAccount(message = "") {
    const details = await api("/api/account");
    if (details.error) return showPanel("login", details.error);
    const box = document.getElementById("accountDetails");
    box.innerHTML = "";
    detailRow(box, "Username", details.username);
    detailRow(box, "Display name", details.displayName);
    detailRow(box, "Age", details.age === null ? "unknown" : String(details.age));
    detailRow(box, "Date of birth", details.birthDate || "unknown");
    detailRow(box, "Chat", details.chatAllowed ? "on" : "from " + details.chatDate + " (when you turn " + details.legal.chatAge + ")");
    detailRow(box, "Account made", new Date(details.created).toLocaleDateString());
    for (const restriction of details.restrictions) {
        const row = document.createElement("div");
        row.className = "restriction";
        row.textContent = restriction.text;
        box.appendChild(row);
    }
    const note = document.createElement("p");
    note.className = "startNote";
    note.textContent = "Wrong date of birth? Email " + details.legal.email + ".";
    box.appendChild(note);
    document.getElementById("newDisplayName").value = details.displayName;

    // titles: only shown when you have one
    const select = document.getElementById("titleSelect");
    select.innerHTML = "";
    const none = document.createElement("option");
    none.value = "";
    none.textContent = "No title";
    select.appendChild(none);
    for (const id of details.titles) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = titles[id] ? titles[id].name : id;
        select.appendChild(option);
    }
    select.value = details.title && details.titles.includes(details.title) ? details.title : "";
    document.getElementById("titleForm").style.display = details.titles.length ? "" : "none";
    showPanel("account", message);
}

document.getElementById("accountButton").addEventListener("click", () => showAccount());
document.getElementById("accountBack").addEventListener("click", () => showSaves());

document.getElementById("nameForm").addEventListener("submit", async event => {
    event.preventDefault();
    const result = await api("/api/account/displayName", { displayName: value("newDisplayName") });
    showAccount(result.error || "Your display name is now " + result.displayName + ".");
});

document.getElementById("titleForm").addEventListener("submit", async event => {
    event.preventDefault();
    const title = value("titleSelect");
    const result = await api("/api/account/title", { title });
    showAccount(result.error || (title ? "You now wear the title " + titles[title].name + "." : "You don't wear a title now."));
});

document.getElementById("passwordForm").addEventListener("submit", async event => {
    event.preventDefault();
    const result = await api("/api/account/password", {
        current: value("currentPassword"), password: value("newPassword"), password2: value("newPassword2"),
    });
    document.getElementById("passwordForm").reset();
    showAccount(result.error || "Your password was changed. Your other devices are logged out.");
});

document.getElementById("deleteForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!confirm("Delete your account forever? Your saves, friends and letters will be gone. This can't be undone.")) return;
    const result = await api("/api/account/delete", { password: value("deletePassword") });
    if (result.error) return showAccount(result.error);
    setToken(null);
    clearForms();
    showPanel("login", "Your account has been deleted.");
});

// ---------- The admin panel (only for admins) ----------
document.getElementById("adminButton").addEventListener("click", async () => {
    showPanel("admin");
    const { showAdmin } = await import("./admin.js");
    showAdmin();
});
document.getElementById("adminBack").addEventListener("click", () => showSaves());

function play() {
    const slot = selectedSlot;
    const loading = startCastIn("Loading save " + slot);
    const socket = connect("game", { slot: slot });

    let playing = false;
    socket.on("connect_error", async error => {
        if (!playing) {
            // the save didn't open (banned, account needs updating, ...): back to the saves, with the reason
            loading.cancel();
            socket.close();
            return showSaves(error.message || "Can't connect to the server.");
        }
        // While playing, the connection came back (for example after a server restart), but the server said no:
        // a ban or timeout, or new Terms of Service to accept. Go back to the start screen, which explains it.
        // (Network problems don't come here: socket.active stays true, and socket.io keeps trying by itself.)
        if (socket.active) return;
        await showPopup("Back to the start screen", error.message || "The server closed your game.");
        location.reload();
    });

    socket.on("kicked", async message => {
        await showPopup("You left the game", message);
        location.reload();
    });
    listenForNotices(socket); // emergency notices and messages from the admins

    socket.once("state", async state => {
        playing = true;
        startState(socket, { username: account.username, displayName: account.displayName, slot: slot, multiplayer: account.multiplayer !== false }, state);
        screen.style.display = "none";
        stopMenuMusic();
        await import("./game.js");
        loading.finish();
    });
}

document.getElementById("playButton").addEventListener("click", play);

if (getToken()) showSaves();
else showPanel("login");
playTitle();
playMenuMusic();
