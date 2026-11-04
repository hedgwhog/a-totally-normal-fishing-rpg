// Moderation: admins, restrictions (bans, timeouts, chat timeouts), reports, the moderation log,
// the emergency notice, and cleaning up old data. Everything private is stored in the data folder:
//   data/admins.json   { "admins": ["username"] }   who can use the admin panel (the Admin button on the start screen)
//   data/reports.json  reports from players
//   data/modlog.json   every moderation action
//   data/notice.json   the emergency notice that's shown right now (if any)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";
import * as store from "./store.js";
import { legal, ruleText } from "../js/shared/data/legal.js";

const dataDir = path.resolve(config.dataDir);
const fileOf = name => path.join(dataDir, name);
const day = 24 * 60 * 60 * 1000;

function readJson(name, fallback) {
    try {
        return JSON.parse(fs.readFileSync(fileOf(name), "utf8"));
    } catch {
        return fallback;
    }
}

function writeJson(name, data) {
    const file = fileOf(name);
    fs.writeFileSync(file + ".tmp", JSON.stringify(data, null, 1));
    fs.renameSync(file + ".tmp", file);
}

const newId = () => crypto.randomBytes(6).toString("hex");

// ---------- Admins ----------
// the first time: hedgwhog is the admin (change or add usernames in data/admins.json)
if (!fs.existsSync(fileOf("admins.json"))) writeJson("admins.json", { admins: ["hedgwhog"] });

export function isAdmin(user) {
    if (!user) return false;
    const admins = readJson("admins.json", { admins: [] }).admins || [];
    return admins.some(name => String(name).toLowerCase() === user.username.toLowerCase());
}

// ---------- IP addresses ----------
// Only used in memory, to slow down bots and password guessing (server.js). Never stored, never banned.
const loopback = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

// The visitor's IP. On cPanel the game runs behind the web server, so the real address is in X-Forwarded-For.
// That header is only trusted when the connection comes from the web server on the same machine.
export function clientIp(remoteAddress, headers) {
    const forwarded = String((headers && headers["x-forwarded-for"]) || "").split(",")[0].trim();
    if (config.trustProxy && forwarded && (!remoteAddress || loopback.includes(remoteAddress))) return forwarded;
    return remoteAddress || "";
}

// ---------- Restrictions ----------
// kinds: "ban" (can't play), "timeout" (can't play for a while), "chatMute" (can't use the chat for a while)
export const restrictionKinds = {
    ban: "banned",
    timeout: "timed out",
    chatMute: "timed out from the chat",
};

function moderationOf(userId) {
    const account = store.getAccount(userId);
    account.moderation ??= { warnings: [] };
    return account.moderation;
}

// the active restriction of a kind, or null. until: null means permanent (only bans).
export function activeRestriction(userId, kind) {
    const record = moderationOf(userId)[kind];
    if (!record) return null;
    if (record.until !== null && record.until <= Date.now()) return null;
    return record;
}

// the restriction that stops someone from playing (ban first)
export const playBlock = userId => activeRestriction(userId, "ban") || activeRestriction(userId, "timeout");

const dateText = time => new Date(time).toISOString().slice(0, 16).replace("T", " ") + " (UTC)";

// the message a player sees: what, why, under which rule, until when, and how to appeal
// Every part has a fallback, so a missing value can never show up as "undefined" in the message.
export function restrictionMessage(record) {
    let text = "You are " + (restrictionKinds[record.kind] || "restricted");
    if (record.until === null) text += " permanently.";
    else if (Number.isFinite(record.until)) text += " until " + dateText(record.until) + ".";
    else text += ".";
    text += "\nReason: " + (record.reason || "no reason given") + "\n" + ruleText(record.rule) + ".";
    text += "\nThink this is a mistake? Email " + legal.email + ".";
    return text;
}

// Messages for the start screen (the menu), shown once: new warnings, and a new chat timeout.
// Bans and timeouts are shown there too, every time (server.js: "blocked"), since they stop you from playing.
export function menuMessages(userId) {
    const moderation = moderationOf(userId);
    const messages = [];
    for (const warning of moderation.warnings || []) {
        if (warning.seen) continue;
        warning.seen = true;
        messages.push("Warning from the admins.\nReason: " + (warning.reason || "no reason given") + "\n" + ruleText(warning.rule)
            + ".\nThink this is a mistake? Email " + legal.email + ".");
    }
    const mute = activeRestriction(userId, "chatMute");
    if (mute && !mute.shown) {
        mute.shown = true;
        messages.push(restrictionMessage(mute));
    }
    if (messages.length) store.saveAccounts();
    return messages;
}

// ---------- Moderation log ----------
let modlog = readJson("modlog.json", []);

function log(entry) {
    modlog.push({ id: newId(), time: Date.now(), ...entry });
    writeJson("modlog.json", modlog);
}

export const recentLog = (amount = 200) => modlog.slice(-amount).reverse();

// ---------- Actions by admins ----------
// action: "warn", "chatMute", "timeout", "ban", "lift" (lifts kind), "deleteAccount"
// minutes: how long (bans without minutes are permanent)
export function moderate({ admin, target, action, kind, minutes, rule, reason, reportId }) {
    reason = String(reason || "").trim().slice(0, 500);
    if (!reason) throw new Error("Write a reason. The player sees it.");
    const moderation = moderationOf(target.id);
    const entry = { admin: admin.username, action, targetId: target.id, targetName: target.displayName + " (" + target.username + ")", rule: Number(rule) || 0, reason, reportId: reportId || null };

    if (action === "warn") {
        moderation.warnings.push({ time: Date.now(), rule: entry.rule, reason, seen: false });
    } else if (action === "chatMute" || action === "timeout" || action === "ban") {
        const length = Number(minutes);
        const permanent = action === "ban" && !(length > 0);
        if (!permanent && !(length > 0)) throw new Error("Choose how long.");
        const record = { kind: action, until: permanent ? null : Date.now() + length * 60000, rule: entry.rule, reason, by: admin.username, at: Date.now() };
        moderation[action] = record;
        entry.until = record.until;
    } else if (action === "lift") {
        if (!restrictionKinds[kind]) throw new Error("Lift what?");
        delete moderation[kind];
        entry.kind = kind;
    } else if (action !== "deleteAccount") {
        throw new Error("Unknown action.");
    }
    store.saveAccounts();
    log(entry);
    if (reportId) resolveReport(reportId, admin, "Action: " + action);
    return entry;
}

export function logOther(admin, action, details) {
    log({ admin: admin.username, action, ...details });
}

// ---------- Reports ----------
let reports = readJson("reports.json", []);
const reportTimes = new Map();

// message: a chat message, or letter: a letter from the reporter's inbox
export function addReport({ reporter, target, message, letter, rule, details }) {
    const recent = (reportTimes.get(reporter.id) || []).filter(time => Date.now() - time < 10 * 60000);
    if (recent.length >= config.reportsPer10Minutes) throw new Error("You sent a lot of reports. Wait a few minutes.");
    recent.push(Date.now());
    reportTimes.set(reporter.id, recent);

    const report = {
        id: newId(), time: Date.now(), status: "open",
        reporterId: reporter.id, reporterName: reporter.displayName + " (" + reporter.username + ")",
        targetId: target.id, targetName: target.displayName + " (" + target.username + ")",
        rule: Number(rule) || 0, details: String(details || "").trim().slice(0, 500),
        message: message ? { id: message.id, text: message.text, time: message.time, island: message.island } : null,
        letter: letter ? { text: letter.text, sentAt: letter.sentAt, fromTown: letter.fromTown } : null,
        // the chat around the message, so the admin sees what happened (kept with the report)
        context: message ? store.messagesAround(message).map(other => ({ name: other.name, userId: other.userId, text: other.text, time: other.time })) : [],
    };
    reports.push(report);
    writeJson("reports.json", reports);
    return report;
}

export function resolveReport(id, admin, note) {
    const report = reports.find(item => item.id === id);
    if (!report) throw new Error("That report doesn't exist.");
    report.status = "resolved";
    report.resolvedBy = admin.username;
    report.resolvedAt = Date.now();
    report.note = String(note || "").slice(0, 500);
    writeJson("reports.json", reports);
    return report;
}

export const allReports = () => [...reports].reverse();
export const reportsAbout = userId => reports.filter(report => report.targetId === userId).reverse();

// ---------- The emergency notice ----------
// shown right away to everyone online (game, chat, trade, duel and start screen), and to everyone who logs in while it's active
let notice = readJson("notice.json", null);

export function setNotice(admin, { title, text, hours }) {
    title = String(title || "").trim().slice(0, 100);
    text = String(text || "").trim().slice(0, 2000);
    if (!title || !text) throw new Error("A notice needs a title and a message.");
    const length = Number(hours) > 0 ? Number(hours) : 24;
    notice = { id: newId(), title, text, time: Date.now(), until: Date.now() + length * 3600000 };
    writeJson("notice.json", notice);
    log({ admin: admin.username, action: "notice", reason: title });
    return notice;
}

export function clearNotice(admin) {
    notice = null;
    writeJson("notice.json", null);
    log({ admin: admin.username, action: "clearNotice", reason: "" });
}

export const activeNotice = () => (notice && notice.until > Date.now() ? notice : null);

// ---------- Cleaning up (retention, see the privacy policy) ----------
function cleanUp() {
    const now = Date.now();
    const reportCount = reports.length;
    reports = reports.filter(report => report.status === "open" || now - report.resolvedAt < config.reportKeepDays * day);
    if (reports.length !== reportCount) writeJson("reports.json", reports);

    const logCount = modlog.length;
    modlog = modlog.filter(entry => now - entry.time < config.modlogKeepDays * day);
    if (modlog.length !== logCount) writeJson("modlog.json", modlog);

    // IP addresses aren't stored anymore: remove any left from an older version
    let changed = false;
    for (const account of Object.values(store.allAccounts())) {
        if (account.ipHash || account.ipSeen) {
            delete account.ipHash;
            delete account.ipSeen;
            changed = true;
        }
    }
    if (changed) store.saveAccounts();
    for (const name of ["ipbans.json", "secret.json"]) fs.rmSync(fileOf(name), { force: true });
}
cleanUp();
setInterval(cleanUp, 60 * 60 * 1000).unref();
