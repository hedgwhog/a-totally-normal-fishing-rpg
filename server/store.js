import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { config } from "./config.js";

const dataDir = path.resolve(config.dataDir);
const savesDir = path.join(dataDir, "saves");
fs.mkdirSync(savesDir, { recursive: true });

function writeJson(file, data) {
    const temp = file + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(data));
    fs.renameSync(temp, file);
}

function readJson(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return fallback;
    }
}

const usersFile = path.join(dataDir, "users.json");
const users = readJson(usersFile, []);

export function findUserByName(username) {
    return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

export function findUser(id) {
    return users.find(user => user.id === id);
}

export function addUser(user) {
    user.id = users.reduce((max, other) => Math.max(max, other.id), 0) + 1;
    users.push(user);
    writeJson(usersFile, users);
    return user;
}

// call after changing a user (display name, birth date, accepted terms)
export function saveUsers() {
    writeJson(usersFile, users);
}

export function allUsers() {
    return users;
}

export function findUsersByDisplayName(name) {
    const wanted = String(name).toLowerCase();
    return users.filter(user => user.displayName.toLowerCase() === wanted);
}

// Logins (sessions). Only a hash of every login token is stored, so a leaked sessions.json can't be used to log in.
const sessionsFile = path.join(dataDir, "sessions.json");
const tokenHash = token => crypto.createHash("sha256").update(String(token)).digest("hex");
let sessions = {};
{
    const saved = readJson(sessionsFile, {});
    if (saved.version === 2) {
        sessions = saved.sessions || {};
    } else {
        // an older file with readable tokens: hash them (everyone stays logged in)
        for (const [token, session] of Object.entries(saved)) sessions[tokenHash(token)] = session;
        writeSessions();
    }
}

function writeSessions() {
    for (const [hash, session] of Object.entries(sessions)) if (session.expires < Date.now()) delete sessions[hash];
    writeJson(sessionsFile, { version: 2, sessions });
}

export function addSession(token, userId) {
    sessions[tokenHash(token)] = { userId, expires: Date.now() + config.sessionDays * 24 * 60 * 60 * 1000 };
    writeSessions();
}

export function findSession(token) {
    const session = sessions[tokenHash(token)];
    if (!session || session.expires < Date.now()) return null;
    return session;
}

export function removeSession(token) {
    delete sessions[tokenHash(token)];
    writeSessions();
}

// logs an account out everywhere (keepToken: except this login, for example after changing the password)
export function removeSessionsOf(userId, keepToken = null) {
    const keep = keepToken ? tokenHash(keepToken) : null;
    for (const [hash, session] of Object.entries(sessions)) {
        if (session.userId === userId && hash !== keep) delete sessions[hash];
    }
    writeSessions();
}

const accountsFile = path.join(dataDir, "accounts.json");
const accounts = readJson(accountsFile, {});
const accountFields = ["friends", "blocked", "inbox"];

export function getAccount(userId) {
    if (!accounts[userId]) {
        accounts[userId] = { friends: [], blocked: [], inbox: [], lastSlot: 1 };
    }
    return accounts[userId];
}

function writeAccounts() {
    writeJson(accountsFile, accounts);
}

export function saveAccounts() {
    writeAccounts();
}

export function allAccounts() {
    return accounts;
}

// a new display name also shows in the friend and block lists of others
export function renameInAccounts(userId, name) {
    for (const account of Object.values(accounts)) {
        for (const list of [account.friends || [], account.blocked || []]) {
            for (const player of list) if (player.id === userId) player.name = name;
        }
    }
    writeAccounts();
}

export function setLastSlot(userId, slot) {
    getAccount(userId).lastSlot = slot;
    writeAccounts();
}

const saves = new Map();

function saveKey(userId, slot) {
    return userId + "-" + slot;
}

function saveFile(userId, slot) {
    return path.join(savesDir, saveKey(userId, slot) + ".json");
}

export function loadSave(userId, slot) {
    const key = saveKey(userId, slot);
    if (!saves.has(key)) {
        saves.set(key, readJson(saveFile(userId, slot), null));
    }
    const save = saves.get(key);
    if (!save) return null;

    const account = getAccount(userId);
    for (const field of accountFields) {
        save[field] = account[field];
    }
    return save;
}

export function writeSave(userId, slot, save) {
    const account = getAccount(userId);
    // A brand new save (the first one, or after deleting a save) starts with the account's friends, blocked players
    // and letters. Without this, its empty lists would overwrite the account's lists, and your friends would be gone.
    if (!saves.get(saveKey(userId, slot))) {
        for (const field of accountFields) save[field] = account[field];
    }
    const onDisk = { ...save };
    for (const field of accountFields) {
        if (save[field]) account[field] = save[field];
        delete onDisk[field];
    }
    writeAccounts();
    saves.set(saveKey(userId, slot), save);
    writeJson(saveFile(userId, slot), onDisk);
}

export function deleteSave(userId, slot) {
    saves.set(saveKey(userId, slot), null);
    fs.rmSync(saveFile(userId, slot), { force: true });
}

const chatFile = path.join(dataDir, "chat.json");
let messages = readJson(chatFile, []);

function pruneChat() {
    const before = messages.length;
    messages = messages.filter(message => Date.now() - message.time < config.chatKeepMs);
    if (messages.length !== before) writeJson(chatFile, messages);
}
pruneChat();
setInterval(pruneChat, 5 * 60 * 1000);

export function addMessage(message) {
    message.id = (messages.length ? messages[messages.length - 1].id : 0) + 1;
    messages.push(message);
    writeJson(chatFile, messages);
    return message;
}

export function findMessage(id) {
    return messages.find(message => message.id === Number(id)) || null;
}

// the messages around one message in the same area (for a report)
export function messagesAround(message, before = 10, after = 5) {
    const area = messages.filter(other => other.island === message.island);
    const index = area.findIndex(other => other.id === message.id);
    return area.slice(Math.max(0, index - before), index + after + 1);
}

export function lastMessagesOf(userId, amount = 20) {
    return messages.filter(message => message.userId === userId).slice(-amount);
}

export function removeMessage(id) {
    const before = messages.length;
    messages = messages.filter(message => message.id !== Number(id));
    if (messages.length !== before) writeJson(chatFile, messages);
    return messages.length !== before;
}

// everything of an account: user, sessions, saves, account (friends, letters, ...) and chat messages.
// Others lose this player from their friend and block lists.
export function deleteUser(userId, saveSlots) {
    const index = users.findIndex(user => user.id === userId);
    if (index >= 0) users.splice(index, 1);
    writeJson(usersFile, users);
    removeSessionsOf(userId);
    for (let slot = 1; slot <= saveSlots; slot++) deleteSave(userId, slot);
    delete accounts[userId];
    // removed in place: loaded saves share these lists with the account (see loadSave)
    const removeWhere = (list, test) => {
        for (let i = (list || []).length - 1; i >= 0; i--) if (test(list[i])) list.splice(i, 1);
    };
    for (const account of Object.values(accounts)) {
        removeWhere(account.friends, player => player.id === userId);
        removeWhere(account.blocked, player => player.id === userId);
        removeWhere(account.inbox, letter => letter.fromId === userId);
    }
    writeAccounts();
    messages = messages.filter(message => message.userId !== userId);
    writeJson(chatFile, messages);
}

export function recentMessages(island, amount = 50) {
    const recent = messages.filter(message => message.island === island && Date.now() - message.time < config.chatKeepMs);
    return recent.slice(-amount);
}
