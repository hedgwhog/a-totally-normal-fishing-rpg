import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import { config } from "./config.js";
import * as store from "./store.js";
import { actions, newSave, refresh, publicSave, deliverBirds, GameError } from "./game.js";
import { setupSocial } from "./social.js";
import { cleanText, isReservedName } from "../js/shared/rules/text.js";
import { islandNames } from "../js/shared/data/islands.js";
import { times } from "../js/shared/rules/schedule.js";

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

const attempts = new Map();
function tooManyAttempts(ip) {
    const now = Date.now();
    const recent = (attempts.get(ip) || []).filter(time => now - time < 60000);
    recent.push(now);
    attempts.set(ip, recent);
    return recent.length > 10;
}

function newSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    store.addSession(token, userId);
    return token;
}

function userFromRequest(request) {
    const token = (request.headers.authorization || "").replace("Bearer ", "");
    const session = store.findSession(token);
    return session ? store.findUser(session.userId) : null;
}

app.post("/api/signup", (request, response) => {
    const { username = "", displayName = "", password = "", password2 = "" } = request.body || {};
    if (tooManyAttempts(request.ip)) return response.json({ error: "Too many tries. Wait a minute." });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return response.json({ error: "Your username needs 3-20 letters, numbers or _." });
    const name = cleanText(displayName, { maxLength: 40 });
    if (name.length < 1 || name.length > 20) return response.json({ error: "Your display name needs 1-20 characters." });
    if (isReservedName(name)) return response.json({ error: "That display name is reserved. Pick another one." });
    if (password.length < 6) return response.json({ error: "Your password needs at least 6 characters." });
    if (password !== password2) return response.json({ error: "The passwords are not the same." });
    if (store.findUserByName(username)) return response.json({ error: "That username is taken." });

    const salt = crypto.randomBytes(16).toString("hex");
    const user = store.addUser({ username, displayName: name, salt, hash: hashPassword(password, salt), created: Date.now() });
    response.json({ token: newSession(user.id), displayName: user.displayName, username: user.username });
});

app.post("/api/login", (request, response) => {
    const { username = "", password = "" } = request.body || {};
    if (tooManyAttempts(request.ip)) return response.json({ error: "Too many tries. Wait a minute." });
    const user = store.findUserByName(String(username));
    if (!user || !checkPassword(user, String(password))) return response.json({ error: "Wrong username or password." });
    response.json({ token: newSession(user.id), displayName: user.displayName, username: user.username });
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

    const saves = [];
    for (let slot = 1; slot <= config.saveSlots; slot++) {
        const save = store.loadSave(user.id, slot);
        if (save) {
            saves.push({ slot, day: save.day, time: times[save.timeIndex], area: islandNames[save.island] || save.island, playtime: save.playtime || 0 });
        } else {
            saves.push({ slot, day: null });
        }
    }

    const friends = store.getAccount(user.id).friends.map(friend => {
        return { name: friend.name, online: activeGames.has(friend.id) };
    });

    response.json({
        displayName: user.displayName,
        username: user.username,
        lastSlot: store.getAccount(user.id).lastSlot,
        saves,
        friends,
        online: onlineCount(),
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
    social.islandChanged(user.id, getSave(user.id, slot).island);

    socket.on("act", (message, answer) => {
        if (typeof answer !== "function") return;
        const action = actions[message && message.type];
        if (!action) return answer({ error: "Unknown action." });

        const save = getSave(user.id, slot);
        const copy = structuredClone(save);

        const others = new Map();
        const ctx = {
            userId: user.id,
            displayName: user.displayName,
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
    });
});

setInterval(() => {
    for (const [userId, game] of activeGames) {
        getSave(userId, game.slot);
    }
}, 10 * 1000);

httpServer.listen(config.port, () => console.log("Game server running on port " + config.port));

export default app;