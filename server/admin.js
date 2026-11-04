// The admin panel (in the start screen, js/admin.js). Only accounts in data/admins.json can use it.
// Every action is written to the moderation log (data/modlog.json).
import { config } from "./config.js";
import * as store from "./store.js";
import * as moderation from "./moderation.js";
import { ageOf } from "../js/shared/rules/age.js";
import { gameRules, legal } from "../js/shared/data/legal.js";
import { titles as allTitles } from "../js/shared/data/titles.js";
import * as titles from "./titles.js";

export function setupAdmin(app, { io, userFromRequest, kickUser, social, onlineCount }) {
    // every admin request: logged in, and an admin
    function adminOf(request, response) {
        const user = userFromRequest(request);
        if (!user || !moderation.isAdmin(user)) {
            response.status(403).json({ error: "Only admins can do this." });
            return null;
        }
        return user;
    }

    function findTarget(query) {
        const text = String(query || "").trim();
        if (!text) return null;
        if (/^#\d+$/.test(text)) return store.findUser(Number(text.slice(1)));
        return store.findUserByName(text) || store.findUsersByDisplayName(text)[0] || null;
    }

    function playerInfo(user) {
        const account = store.getAccount(user.id);
        const restrictions = Object.keys(moderation.restrictionKinds)
            .map(kind => moderation.activeRestriction(user.id, kind)).filter(Boolean);
        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            created: user.created,
            age: ageOf(user.birthDate),
            restrictions,
            warnings: (account.moderation && account.moderation.warnings) || [],
            messages: store.lastMessagesOf(user.id),
            reports: moderation.reportsAbout(user.id),
            titles: titles.ownedTitles(user.id),
        };
    }

    app.get("/api/admin/overview", (request, response) => {
        if (!adminOf(request, response)) return;
        response.json({
            reports: moderation.allReports().slice(0, 200),
            log: moderation.recentLog(),
            notice: moderation.activeNotice(),
            online: onlineCount(),
            rules: gameRules,
            titles: allTitles,
        });
    });

    app.get("/api/admin/player", (request, response) => {
        if (!adminOf(request, response)) return;
        const user = findTarget(request.query.q);
        if (!user) return response.json({ error: "No player found. Search by username, display name, or #id." });
        response.json({ player: playerInfo(user) });
    });

    // { target: id, action, kind, minutes, rule, reason, reportId }
    app.post("/api/admin/act", (request, response) => {
        const admin = adminOf(request, response);
        if (!admin) return;
        const body = request.body || {};
        const target = store.findUser(Number(body.target));
        if (!target) return response.json({ error: "That player doesn't exist anymore." });
        if (target.id === admin.id) return response.json({ error: "You can't moderate yourself." });
        try {
            const entry = moderation.moderate({ ...body, admin, target }); // admin and target last: body.target is only an id
            const record = moderation.activeRestriction(target.id, body.action);
            if (body.action === "ban" || body.action === "timeout") {
                // the game closes; the start screen then shows what happened, why and until when
                kickUser(target.id, "An admin closed your game. You'll see why on the start screen.");
            } else if (body.action === "chatMute") {
                // shown in their chat window right away (if it's open), and on the start screen
                social.chatMuted(target.id, moderation.restrictionMessage(record));
            } else if (body.action === "deleteAccount") {
                kickUser(target.id, "Your account was deleted by an admin. Reason: " + entry.reason + "\nQuestions? Email " + legal.email + ".");
                store.deleteUser(target.id, config.saveSlots);
            }
            response.json({ entry });
        } catch (error) {
            response.json({ error: error.message });
        }
    });

    app.post("/api/admin/report/resolve", (request, response) => {
        const admin = adminOf(request, response);
        if (!admin) return;
        try {
            const report = moderation.resolveReport(String((request.body || {}).id), admin, (request.body || {}).note || "No action needed");
            moderation.logOther(admin, "resolveReport", { reportId: report.id, targetName: report.targetName, reason: report.note });
            response.json({ report });
        } catch (error) {
            response.json({ error: error.message });
        }
    });

    app.post("/api/admin/message/delete", (request, response) => {
        const admin = adminOf(request, response);
        if (!admin) return;
        const message = store.findMessage((request.body || {}).id);
        if (!message || !store.removeMessage(message.id)) return response.json({ error: "That message is already gone." });
        social.messageRemoved(message);
        moderation.logOther(admin, "deleteMessage", { targetId: message.userId, targetName: message.name, reason: message.text });
        response.json({});
    });

    // give or take a staff title (Developer, OST Producer, Moderator). Admins can give themselves one too.
    app.post("/api/admin/title", (request, response) => {
        const admin = adminOf(request, response);
        if (!admin) return;
        const { target, title, give } = request.body || {};
        const user = store.findUser(Number(target));
        if (!user) return response.json({ error: "That player doesn't exist anymore." });
        try {
            titles.setStaffTitle(user.id, String(title), Boolean(give));
            moderation.logOther(admin, give ? "giveTitle" : "takeTitle", { targetId: user.id, targetName: user.displayName + " (" + user.username + ")", reason: String(title) });
            response.json({});
        } catch (error) {
            response.json({ error: error.message });
        }
    });

    // Everything stored about a player, in one file: for when someone asks for a copy of their data (GDPR).
    // Not included: the password hash (it's useless to them, and should stay secret).
    app.get("/api/admin/export", (request, response) => {
        const admin = adminOf(request, response);
        if (!admin) return;
        const user = store.findUser(Number(request.query.id));
        if (!user) return response.status(404).json({ error: "That player doesn't exist anymore." });
        const { hash, salt, ...account } = user;
        const saves = {};
        for (let slot = 1; slot <= config.saveSlots; slot++) {
            const save = store.loadSave(user.id, slot);
            if (save) {
                const { friends, blocked, inbox, ...progress } = save; // these are in "accountData" already
                saves["save " + slot] = progress;
            }
        }
        const data = {
            exported: new Date().toISOString(),
            account,
            accountData: store.getAccount(user.id), // friends, blocked players, letters, moderation, titles
            saves,
            chatMessages: store.lastMessagesOf(user.id, Infinity),
            reportsMadeByThem: moderation.allReports().filter(report => report.reporterId === user.id),
            reportsAboutThem: moderation.reportsAbout(user.id),
            moderationLog: moderation.recentLog(Infinity).filter(entry => entry.targetId === user.id),
        };
        moderation.logOther(admin, "exportData", { targetId: user.id, targetName: user.displayName + " (" + user.username + ")", reason: "" });
        response.setHeader("Content-Disposition", "attachment; filename=\"data-" + user.username + ".json\"");
        response.json(data);
    });

    // the emergency notice: shown right away to everyone online, and to everyone who logs in while it's active
    app.post("/api/admin/notice", (request, response) => {
        const admin = adminOf(request, response);
        if (!admin) return;
        try {
            const notice = moderation.setNotice(admin, request.body || {});
            io.emit("notice", notice);
            response.json({ notice });
        } catch (error) {
            response.json({ error: error.message });
        }
    });

    app.post("/api/admin/notice/clear", (request, response) => {
        const admin = adminOf(request, response);
        if (!admin) return;
        moderation.clearNotice(admin);
        response.json({});
    });
}
