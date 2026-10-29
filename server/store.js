import fs from "node:fs";
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

const sessionsFile = path.join(dataDir, "sessions.json");
let sessions = readJson(sessionsFile, {});

export function addSession(token, userId) {
    sessions[token] = { userId, expires: Date.now() + config.sessionDays * 24 * 60 * 60 * 1000 };
    writeJson(sessionsFile, sessions);
}

export function findSession(token) {
    const session = sessions[token];
    if (!session || session.expires < Date.now()) return null;
    return session;
}

export function removeSession(token) {
    delete sessions[token];
    writeJson(sessionsFile, sessions);
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

export function recentMessages(island, amount = 50) {
    const recent = messages.filter(message => message.island === island && Date.now() - message.time < config.chatKeepMs);
    return recent.slice(-amount);
}
