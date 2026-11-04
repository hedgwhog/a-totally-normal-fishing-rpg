import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import { config } from "./config.js";
import * as store from "./store.js";
import { actions, newSave, refresh, publicSave, deliverBirds, GameError, ghostBlocks } from "./game.js";
import { setupSocial } from "./social.js";
import { cleanText, isReservedName, hasBrackets } from "../js/shared/rules/text.js";
import { islandNames } from "../js/shared/data/islands.js";
import { times } from "../js/shared/rules/schedule.js";
import { legal } from "../js/shared/data/legal.js";
import { parseBirthDate, ageOf, oldEnoughToPlay, oldEnoughToChat, chatDate } from "../js/shared/rules/age.js";
import { hasFilteredWord } from "./filter.js";
import * as moderation from "./moderation.js";
import { setupAdmin } from "./admin.js";
import * as titles from "./titles.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));

const strictPages = ["/game.html", "/chat.html", "/trade.html", "/duel.html"];
const strictPolicy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
].join("; ");
app.use((request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Permissions-Policy", "microphone=(self), camera=(), geolocation=(), payment=()");
    if (strictPages.includes(request.path)) response.setHeader("Content-Security-Policy", strictPolicy);
    else response.setHeader("Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'none'");
    next();
});

const alwaysCheck = { setHeaders: response => response.setHeader("Cache-Control", "no-cache") };
for (const folder of ["css", "js", "ascii"]) app.use("/" + folder, express.static(path.join(root, folder), alwaysCheck));
app.use("/ost", express.static(path.join(root, "ost")));
for (const page of ["index.html", "game.html", "chat.html", "trade.html", "duel.html"]) {
    app.get("/" + page, (request, response) => response.sendFile(path.join(root, page), { headers: { "Cache-Control": "no-cache" } }));
}
app.get("/", (request, response) => response.sendFile(path.join(root, "index.html"), { headers: { "Cache-Control": "no-cache" } }));
app.use(express.static(path.join(root, "public"), alwaysCheck));

function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString("hex");
}

function checkPassword(user, password) {
    const hash = Buffer.from(hashPassword(password, user.salt), "hex");
    return crypto.timingSafeEqual(hash, Buffer.from(user.hash, "hex"));
}

// Protection against bots and password guessing. Kept in memory only (see the privacy policy).
const attempts = new Map();
function tooManyAttempts(ip) {
    const now = Date.now();
    const recent = (attempts.get(ip) || []).filter(time => now - time < 60000);
    recent.push(now);
    attempts.set(ip, recent);
    return recent.length > 10;
}

const failedLogins = new Map(); // username -> times of wrong passwords
function tooManyFailedLogins(username) {
    const recent = (failedLogins.get(username) || []).filter(time => Date.now() - time < 15 * 60000);
    failedLogins.set(username, recent);
    return recent.length >= 10;
}

const signups = new Map(); // IP -> times of new accounts
function tooManySignups(ip) {
    const recent = (signups.get(ip) || []).filter(time => Date.now() - time < 24 * 3600000);
    signups.set(ip, recent);
    return recent.length >= config.signupsPerIpPerDay;
}

// someone who filled in an age under 13 can't just try again with another birth date for a day
const underageTries = new Map(); // IP -> time
const triedUnderage = ip => Date.now() - (underageTries.get(ip) || 0) < 24 * 3600000;

setInterval(() => {
    for (const map of [attempts, failedLogins, signups]) map.clear();
    for (const [ip, time] of underageTries) if (Date.now() - time > 24 * 3600000) underageTries.delete(ip);
}, 24 * 3600000).unref();

const ipOf = request => moderation.clientIp(request.socket.remoteAddress, request.headers);

// a password needs 8+ characters, with a capital letter, a small letter and a number
function passwordProblem(password, repeat) {
    if (password.length < 8) return "Your password needs at least 8 characters.";
    if (password.length > 200) return "Your password is too long.";
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return "Your password needs at least one capital letter, one small letter and one number.";
    }
    if (password !== repeat) return "The passwords are not the same.";
    return null;
}

// an account made before the age check and the Terms of Service has to fill those in first
const needsUpdate = user => !user.birthDate || (user.tosVersion || 0) < legal.tosVersion;

function checkDisplayName(name) {
    if (name.length < 1 || name.length > 20) return "Your display name needs 1-20 characters.";
    if (isReservedName(name)) return "That display name is reserved. Pick another one.";
    if (hasBrackets(name)) return "A display name can't have brackets, like [ ] or ( ).";
    if (hasFilteredWord(name)) return "That display name isn't allowed. Pick another one.";
    return null;
}

function newSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    store.addSession(token, userId);
    return token;
}

const tokenOf = request => (request.headers.authorization || "").replace("Bearer ", "");

function userFromRequest(request) {
    const token = (request.headers.authorization || "").replace("Bearer ", "");
    const session = store.findSession(token);
    return session ? store.findUser(session.userId) : null;
}

app.post("/api/signup", (request, response) => {
    const { username = "", displayName = "", password = "", password2 = "", birthDate = "", acceptTerms = false, website = "" } = request.body || {};
    const ip = ipOf(request);
    if (website) return response.json({ error: "Something went wrong. Try again." }); // a hidden field only bots fill in
    if (tooManyAttempts(ip)) return response.json({ error: "Too many tries. Wait a minute." });
    if (triedUnderage(ip)) return response.json({ error: "Sorry, you must be at least " + legal.minimumAge + " years old to play." });
    if (tooManySignups(ip)) return response.json({ error: "Too many new accounts from this connection today. Try again tomorrow." });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return response.json({ error: "Your username needs 3-20 letters, numbers or _." });
    if (hasFilteredWord(username) || isReservedName(username)) return response.json({ error: "That username isn't allowed. Pick another one." });
    const name = cleanText(displayName, { maxLength: 40 });
    const nameProblem = checkDisplayName(name);
    if (nameProblem) return response.json({ error: nameProblem });
    if (!parseBirthDate(birthDate)) return response.json({ error: "Fill in your date of birth." });
    if (!oldEnoughToPlay(birthDate)) {
        underageTries.set(ip, Date.now()); // nothing about the person is stored
        return response.json({ error: "Sorry, you must be at least " + legal.minimumAge + " years old to play." });
    }
    if (acceptTerms !== true) return response.json({ error: "To make an account, you need to accept the Terms of Service and the Privacy Policy." });
    const weak = passwordProblem(String(password), String(password2));
    if (weak) return response.json({ error: weak });
    if (store.findUserByName(username)) return response.json({ error: "That username is taken." });

    const salt = crypto.randomBytes(16).toString("hex");
    const user = store.addUser({
        username, displayName: name, salt, hash: hashPassword(password, salt), created: Date.now(),
        birthDate, tosVersion: legal.tosVersion, tosAccepted: Date.now(),
    });
    signups.get(ip)?.push(Date.now()) ?? signups.set(ip, [Date.now()]);
    response.json({ token: newSession(user.id), displayName: user.displayName, username: user.username });
});

app.post("/api/login", (request, response) => {
    const { username = "", password = "" } = request.body || {};
    const ip = ipOf(request);
    if (tooManyAttempts(ip)) return response.json({ error: "Too many tries. Wait a minute." });
    const key = String(username).toLowerCase();
    if (tooManyFailedLogins(key)) return response.json({ error: "Too many wrong passwords for this account. Wait 15 minutes." });
    const user = store.findUserByName(String(username));
    if (!user || !checkPassword(user, String(password))) {
        failedLogins.get(key)?.push(Date.now()) ?? failedLogins.set(key, [Date.now()]);
        return response.json({ error: "Wrong username or password." });
    }
    response.json({ token: newSession(user.id), displayName: user.displayName, username: user.username });
});

// ---------- Your account (the Account button on the start screen) ----------
function accountDetails(user) {
    const account = store.getAccount(user.id);
    const restrictions = Object.keys(moderation.restrictionKinds)
        .map(kind => moderation.activeRestriction(user.id, kind))
        .filter(Boolean)
        .map(record => ({ kind: record.kind, text: moderation.restrictionMessage(record) }));
    return {
        username: user.username,
        displayName: user.displayName,
        created: user.created,
        birthDate: user.birthDate || null,
        age: ageOf(user.birthDate),
        chatAllowed: oldEnoughToChat(user.birthDate),
        chatDate: chatDate(user.birthDate),
        tosVersion: user.tosVersion || 0,
        nextNameChange: (account.nameChangedAt || 0) + config.nameChangeHours * 3600000,
        restrictions,
        titles: titles.ownedTitles(user.id),
        title: account.title || null,
    };
}

app.get("/api/account", (request, response) => {
    const user = userFromRequest(request);
    if (!user) return response.status(401).json({ error: "Please log in again." });
    titles.checkEarnedTitles(user.id);
    response.json({ ...accountDetails(user), legal });
});

// wear one of your titles (or none)
app.post("/api/account/title", (request, response) => {
    const user = userFromRequest(request);
    if (!user) return response.status(401).json({ error: "Please log in again." });
    try {
        titles.wearTitle(user.id, String((request.body || {}).title || ""));
        response.json({});
    } catch (error) {
        response.json({ error: error.message });
    }
});

// change your password: you stay logged in here, every other device is logged out
app.post("/api/account/password", (request, response) => {
    const user = userFromRequest(request);
    if (!user) return response.status(401).json({ error: "Please log in again." });
    const { current = "", password = "", password2 = "" } = request.body || {};
    if (tooManyAttempts(ipOf(request))) return response.json({ error: "Too many tries. Wait a minute." });
    if (!checkPassword(user, String(current))) return response.json({ error: "Your current password is wrong." });
    const weak = passwordProblem(String(password), String(password2));
    if (weak) return response.json({ error: weak });
    user.salt = crypto.randomBytes(16).toString("hex");
    user.hash = hashPassword(String(password), user.salt);
    store.saveUsers();
    store.removeSessionsOf(user.id, (request.headers.authorization || "").replace("Bearer ", ""));
    kickUser(user.id, "Your password was changed, so this window was closed. Log in again.", tokenOf(request));
    response.json({});
});

// accounts from before the age check: fill in the birth date and accept the (new) Terms of Service
app.post("/api/account/update", (request, response) => {
    const user = userFromRequest(request);
    if (!user) return response.status(401).json({ error: "Please log in again." });
    const { birthDate = "", acceptTerms = false } = request.body || {};
    if (!user.birthDate) {
        if (!parseBirthDate(birthDate)) return response.json({ error: "Fill in your date of birth." });
        if (!oldEnoughToPlay(birthDate)) {
            kickUser(user.id, "Your account was deleted.");
            store.deleteUser(user.id, config.saveSlots);
            return response.json({ deleted: true, error: "Sorry, you must be at least " + legal.minimumAge + " years old to play. Your account has been deleted." });
        }
        user.birthDate = birthDate;
    }
    if (acceptTerms !== true) return response.json({ error: "To keep playing, you need to accept the Terms of Service and the Privacy Policy." });
    user.tosVersion = legal.tosVersion;
    user.tosAccepted = Date.now();
    store.saveUsers();
    response.json({});
});

app.post("/api/account/displayName", (request, response) => {
    const user = userFromRequest(request);
    if (!user) return response.status(401).json({ error: "Please log in again." });
    const account = store.getAccount(user.id);
    const wait = (account.nameChangedAt || 0) + config.nameChangeHours * 3600000 - Date.now();
    if (wait > 0) return response.json({ error: "You can change your display name again in " + Math.ceil(wait / 3600000) + " hours." });
    const name = cleanText((request.body || {}).displayName, { maxLength: 40 });
    const problem = checkDisplayName(name);
    if (problem) return response.json({ error: problem });
    if (name === user.displayName) return response.json({ error: "That's already your display name." });
    user.displayName = name;
    store.saveUsers();
    store.renameInAccounts(user.id, name);
    account.nameChangedAt = Date.now();
    store.saveAccounts();
    response.json({ displayName: name });
});

app.post("/api/account/delete", (request, response) => {
    const user = userFromRequest(request);
    if (!user) return response.status(401).json({ error: "Please log in again." });
    if (!checkPassword(user, String((request.body || {}).password || ""))) return response.json({ error: "Wrong password." });
    kickUser(user.id, "Your account was deleted.");
    store.deleteUser(user.id, config.saveSlots);
    response.json({});
});

app.post("/api/logout", (request, response) => {
    store.removeSession((request.headers.authorization || "").replace("Bearer ", ""));
    response.json({});
});

function onlineCount() {
    return activeGames.size;
}

app.get("/api/saves", (request, response) => {
    const user = userFromRequest(request);
    if (!user) return response.status(401).json({ error: "Please log in again." });
    titles.checkEarnedTitles(user.id);
    if (needsUpdate(user)) {
        return response.json({ needsUpdate: { birthDate: !user.birthDate }, displayName: user.displayName, username: user.username, legal, notice: moderation.activeNotice() });
    }

    const saves = [];
    for (let slot = 1; slot <= config.saveSlots; slot++) {
        const save = store.loadSave(user.id, slot);
        if (save) {
            saves.push({ slot, day: save.day, time: times[save.timeIndex], area: islandNames[save.island] || save.island, playtime: save.playtime || 0 });
        } else {
            saves.push({ slot, day: null });
        }
    }

    // players under 16 play alone: no friends list
    const multiplayer = oldEnoughToChat(user.birthDate);
    const friends = !multiplayer ? [] : store.getAccount(user.id).friends.map(friend => {
        return { name: friend.name, online: activeGames.has(friend.id) };
    });

    response.json({
        displayName: user.displayName,
        username: user.username,
        lastSlot: store.getAccount(user.id).lastSlot,
        saves,
        friends,
        multiplayer,
        online: onlineCount(),
        blocked: moderation.playBlock(user.id) ? moderation.restrictionMessage(moderation.playBlock(user.id)) : null,
        messages: moderation.menuMessages(user.id), // warnings and chat timeouts, shown once on the start screen
        isAdmin: moderation.isAdmin(user),
        notice: moderation.activeNotice(),
    });
});


const httpServer = http.createServer(app);
const io = new Server(httpServer, { maxHttpBufferSize: 64 * 1024 });

const activeGames = new Map();

io.use((socket, next) => {
    const { token, kind, slot } = socket.handshake.auth || {};
    const session = store.findSession(String(token || ""));
    const user = session && store.findUser(session.userId);
    if (!user) return next(new Error("Please log in again."));

    socket.data.user = user;
    socket.data.kind = String(kind || "game");
    // new Terms of Service (or an old account without a birth date): the start screen asks to accept them first
    if (needsUpdate(user)) return next(new Error("There are new Terms of Service. Accept them on the start screen, then you can play again."));
    const block = moderation.playBlock(user.id);
    if (block) return next(new Error(moderation.restrictionMessage(block)));
    // playing with others (chat, voice, trades, duels) is for players aged 16 and older
    if (socket.data.kind !== "game" && !oldEnoughToChat(user.birthDate)) {
        return next(new Error("Playing with others is for players aged " + legal.chatAge + " and older."));
    }
    if (socket.data.kind === "game") {
        const number = Number(slot);
        if (!(number >= 1 && number <= config.saveSlots)) return next(new Error("That save doesn't exist."));
        socket.data.slot = number;
    } else if (!activeGames.has(user.id)) {
        return next(new Error("Open the game first."));
    }
    next();
});

export function getSave(userId, slot) {
    let save = store.loadSave(userId, slot);
    if (!save) {
        save = newSave();
        store.writeSave(userId, slot, save);
    }
    refresh(save);
    if (deliverBirds(save)) storeSave(userId, slot, save);
    return save;
}

function slotOf(userId) {
    const game = activeGames.get(userId);
    if (game) return game.slot;
    return store.getAccount(userId).lastSlot;
}

export function saveOf(userId) {
    return getSave(userId, slotOf(userId));
}

export function storeSave(userId, slot, save) {
    store.writeSave(userId, slot, save);
    io.to("game:" + userId + ":" + slot).emit("state", publicSave(save));
    if (slotOf(userId) === slot) social.islandChanged(userId, save.island);
}

export function storeSaveOf(userId, save) {
    storeSave(userId, slotOf(userId), save);
}

const social = setupSocial(io, { saveOf, storeSaveOf });

// closes every window of a player (game, chat, trade, duel) with a message
// keepToken: don't close the windows of this login (changing your password only closes your other devices)
export function kickUser(userId, message, keepToken = null) {
    const isKept = socket => keepToken && String(socket.handshake.auth.token || "") === keepToken;
    const game = activeGames.get(userId);
    if (game && !isKept(game.socket)) {
        game.socket.emit("kicked", message);
        game.socket.disconnect(true);
    }
    for (const socket of io.sockets.sockets.values()) {
        if (isKept(socket)) continue;
        if (socket.data.user && socket.data.user.id === userId) {
            socket.emit("game:closed", message);
            socket.disconnect(true);
        }
    }
}

setupAdmin(app, { io, userFromRequest, kickUser, social, onlineCount: () => activeGames.size });

// an error in a request: log it here, but never send the details (file paths, code) to the browser
app.use((error, request, response, next) => {
    console.error(error);
    response.status(500).json({ error: "Something went wrong on the server." });
});

io.on("connection", socket => {
    const { user, kind } = socket.data;
    if (kind !== "game") return social.connect(socket);

    const slot = socket.data.slot;

    const old = activeGames.get(user.id);
    if (old) {
        old.socket.emit("kicked", "Your account opened a save somewhere else, so this window stopped.");
        old.socket.disconnect(true);
    }
    activeGames.set(user.id, { socket, slot });
    store.setLastSlot(user.id, slot);

    socket.join("game:" + user.id + ":" + slot);
    const startedAt = Date.now();
    socket.emit("state", publicSave(getSave(user.id, slot)));
    const notice = moderation.activeNotice();
    if (notice) socket.emit("notice", notice);
    social.islandChanged(user.id, getSave(user.id, slot).island);

    const actTimes = [];
    socket.on("act", (message, answer) => {
        if (typeof answer !== "function") return;
        // at most config.actionsPerSecond actions per second (a script could otherwise flood the server)
        const now = Date.now();
        while (actTimes.length && now - actTimes[0] > 1000) actTimes.shift();
        if (actTimes.length >= config.actionsPerSecond) return answer({ error: "Slow down a little." });
        actTimes.push(now);
        const action = actions[message && message.type];
        if (!action) return answer({ error: "Unknown action." });

        const save = getSave(user.id, slot);
        const copy = structuredClone(save);
        const blocked = ghostBlocks(copy, message.type);
        if (blocked) return answer({ error: blocked });

        const others = new Map();
        const ctx = {
            userId: user.id,
            displayName: user.displayName,
            // playing with others (letters) is for players aged 16 and older, on both sides
            multiplayer: oldEnoughToChat(user.birthDate),
            canContact: id => oldEnoughToChat(store.findUser(id)?.birthDate),
            loadOther(id) {
                if (id === user.id || !store.findUser(id)) return null;
                if (!store.loadSave(id, slotOf(id))) return null;
                if (!others.has(id)) others.set(id, structuredClone(saveOf(id)));
                return others.get(id);
            },
        };

        let data = {};
        if (message.data && typeof message.data === "object") data = message.data;

        try {
            const result = action(copy, data, ctx);
            store.writeSave(user.id, slot, copy);
            for (const [id, other] of others) storeSaveOf(id, other);
            social.islandChanged(user.id, copy.island);
            answer({ ...result, state: publicSave(copy) });
        } catch (error) {
            if (!(error instanceof GameError)) console.error(error);
            const text = error instanceof GameError ? error.message : "Something went wrong.";
            answer({ error: text });
        }
    });

    socket.on("resetSave", (data, answer) => {
        store.deleteSave(user.id, slot);
        if (typeof answer === "function") answer({});
    });

    socket.on("disconnect", () => {
        const game = activeGames.get(user.id);
        if (game && game.socket === socket) {
            activeGames.delete(user.id);
            social.playerLeft(user.id);
        }
        const save = store.loadSave(user.id, slot);
        if (!save) return;
        save.playtime = (save.playtime || 0) + Math.round((Date.now() - startedAt) / 1000);
        store.writeSave(user.id, slot, save);
        titles.checkEarnedTitles(user.id);
    });
});

setInterval(() => {
    for (const [userId, game] of activeGames) {
        getSave(userId, game.slot);
    }
}, 10 * 1000);

// A safety net: an unexpected error is written to the log, instead of stopping the server for everyone.
process.on("uncaughtException", error => console.error("Unexpected error (the server keeps running):", error));
process.on("unhandledRejection", error => console.error("Unexpected error (the server keeps running):", error));

httpServer.listen(config.port, () => console.log("Game server running on port " + config.port));

export default app;