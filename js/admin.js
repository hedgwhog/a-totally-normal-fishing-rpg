// The admin panel, in the start screen (the Admin button, only shown to admins). It's loaded the first time it's opened.
// The server checks every request (server/admin.js): only accounts in data/admins.json get data.
import { api, getToken } from "./core/net.js";

const el = id => document.getElementById(id);
let rules = [];
let titles = {};
let reports = [];
let currentPlayer = null;

const timeText = time => new Date(time).toLocaleString();
const ruleName = number => {
    const rule = rules.find(item => item.number === Number(number));
    return rule ? "Rule " + rule.number + ": " + rule.title : "no rule";
};

function add(box, tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    box.appendChild(element);
    return element;
}

function addButton(box, label, action) {
    const button = add(box, "button", label);
    button.type = "button";
    button.addEventListener("click", action);
    return button;
}

function showError(text) {
    el("adminError").textContent = text || "";
}

async function load() {
    const data = await api("/api/admin/overview");
    if (data.error) {
        el("adminMain").style.display = "none";
        return showError(data.error);
    }
    rules = data.rules;
    titles = data.titles || {};
    reports = data.reports;
    el("online").textContent = data.online + " playing now";
    showNotice(data.notice);
    showReports();
    showLog(data.log);
}

// ---------- Emergency notice ----------
function showNotice(notice) {
    const box = el("currentNotice");
    box.innerHTML = "";
    if (!notice) return add(box, "p", "No notice right now.", "muted");
    add(box, "p", "Active until " + timeText(notice.until) + ": " + notice.title);
    addButton(box, "Stop showing it to new logins", async () => {
        await api("/api/admin/notice/clear", {});
        load();
    });
}

el("noticeForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!confirm("Send this notice to EVERYONE right now?")) return;
    const result = await api("/api/admin/notice", { title: el("noticeTitle").value, text: el("noticeText").value, hours: Number(el("noticeHours").value) });
    if (result.error) return showError(result.error);
    showError("The notice was sent.");
    load();
});

// ---------- Reports ----------
function showReports() {
    const box = el("reports");
    box.innerHTML = "";
    const shown = reports.filter(report => el("showResolved").checked || report.status === "open");
    if (shown.length === 0) add(box, "p", "No open reports.", "muted");
    for (const report of shown) {
        const item = add(box, "div", undefined, "item " + report.status);
        add(item, "div", timeText(report.time) + " - " + report.status.toUpperCase());
        add(item, "div", "From " + report.reporterName + " about " + report.targetName);
        add(item, "div", ruleName(report.rule) + (report.details ? " - \"" + report.details + "\"" : ""));
        if (report.letter) {
            add(item, "div", "Letter, sent " + timeText(report.letter.sentAt) + ":\n" + report.letter.text, "context");
        }
        if (report.message) {
            const context = add(item, "div", undefined, "context");
            for (const line of report.context) {
                const isReported = line.time === report.message.time && line.text === report.message.text;
                add(context, "div", new Date(line.time).toLocaleTimeString() + " " + line.name + ": " + line.text, isReported ? "reported" : "");
            }
        }
        if (report.status === "resolved") {
            add(item, "div", "Handled by " + report.resolvedBy + ": " + (report.note || ""), "muted");
            continue;
        }
        const buttons = add(item, "div", undefined, "row");
        addButton(buttons, "Open player", () => openPlayer("#" + report.targetId, report.id));
        if (report.message) addButton(buttons, "Delete message", () => deleteMessage(report.message.id));
        addButton(buttons, "Handled (no action)", async () => {
            const note = prompt("Note (why no action is needed):", "No rule broken");
            if (note === null) return;
            const result = await api("/api/admin/report/resolve", { id: report.id, note });
            if (result.error) return showError(result.error);
            load();
        });
    }
}
el("showResolved").addEventListener("change", showReports);

async function deleteMessage(id) {
    if (!confirm("Delete this message for everyone?")) return;
    const result = await api("/api/admin/message/delete", { id });
    showError(result.error || "The message was deleted.");
    load();
    if (currentPlayer) openPlayer("#" + currentPlayer.id);
}

// ---------- Player ----------
el("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    openPlayer(el("searchInput").value);
});

async function openPlayer(query, reportId = null) {
    const result = await api("/api/admin/player?q=" + encodeURIComponent(query));
    const box = el("player");
    box.innerHTML = "";
    if (result.error) return add(box, "p", result.error, "error");
    const player = result.player;
    currentPlayer = player;
    add(box, "p", player.displayName + " (" + player.username + ", #" + player.id + ")");
    add(box, "p", "Age: " + (player.age ?? "unknown") + " - account made " + timeText(player.created), "muted");
    for (const restriction of player.restrictions) {
        add(box, "p", restriction.kind + " until " + (restriction.until ? timeText(restriction.until) : "forever") + " - " + ruleName(restriction.rule) + ": " + restriction.reason, "restriction");
    }
    if (player.warnings.length) add(box, "p", player.warnings.length + " warning(s): " + player.warnings.map(warning => warning.reason).join(" / "), "muted");

    // titles: staff titles can be given and taken here (the earned ones only show)
    const titleRow = add(box, "div", "Titles: " + (player.titles.map(id => (titles[id] ? titles[id].name : id)).join(", ") || "none") + " ", "row");
    for (const [id, title] of Object.entries(titles)) {
        if (!title.staff) continue;
        const has = player.titles.includes(id);
        addButton(titleRow, (has ? "Take " : "Give ") + title.name, async () => {
            const result = await api("/api/admin/title", { target: player.id, title: id, give: !has });
            if (result.error) return showError(result.error);
            openPlayer("#" + player.id);
            load();
        });
    }

    // a copy of all their data (when someone asks for it: GDPR)
    addButton(add(box, "div", undefined, "row"), "Export all data of this player (file)", () => exportData(player));

    add(box, "h3", "Recent chat messages");
    if (player.messages.length === 0) add(box, "p", "None (chat is kept 18 hours).", "muted");
    for (const message of player.messages) {
        const line = add(box, "div", timeText(message.time) + " [" + message.island + "] " + message.text + " ", "item");
        addButton(line, "Delete", () => deleteMessage(message.id));
    }
    add(box, "p", player.reports.length + " report(s) about this player.", "muted");

    // the action form
    add(box, "h3", "Take action");
    const form = add(box, "form", undefined, "column");
    const action = add(form, "select");
    for (const [value, label] of [["warn", "Warn"], ["chatMute", "Time out from the chat"], ["timeout", "Time out (can't play)"], ["ban", "Ban"], ["lift", "Lift a restriction"], ["deleteAccount", "Delete account (for example: under 13)"]]) {
        const option = add(action, "option", label);
        option.value = value;
    }
    const lengthRow = add(form, "label", "How long ", "row");
    const amount = add(lengthRow, "input");
    amount.type = "number";
    amount.min = "1";
    amount.value = "1";
    const unit = add(lengthRow, "select");
    for (const [value, label] of [[60, "hours"], [1440, "days"], [1, "minutes"]]) {
        const option = add(unit, "option", label);
        option.value = value;
    }
    const permanentRow = add(form, "label", "", "row");
    const permanent = add(permanentRow, "input");
    permanent.type = "checkbox";
    permanentRow.append(" Permanent (only for bans)");
    const liftRow = add(form, "label", "Lift ", "row");
    const lift = add(liftRow, "select");
    for (const [value, label] of [["chatMute", "chat timeout"], ["timeout", "timeout"], ["ban", "ban"]]) {
        const option = add(lift, "option", label);
        option.value = value;
    }
    const rule = add(form, "select");
    const noRule = add(rule, "option", "Which rule?");
    noRule.value = "0";
    for (const item of rules) {
        const option = add(rule, "option", item.number + ". " + item.title);
        option.value = item.number;
    }
    const reason = add(form, "textarea");
    reason.rows = 3;
    reason.maxLength = 500;
    reason.placeholder = "Reason. The player sees this, so be clear and calm.";
    const submit = add(form, "button", "Do it");
    submit.type = "submit";

    const update = () => {
        const kind = action.value;
        lengthRow.style.display = ["chatMute", "timeout", "ban"].includes(kind) && !(kind === "ban" && permanent.checked) ? "" : "none";
        permanentRow.style.display = kind === "ban" ? "" : "none";
        liftRow.style.display = kind === "lift" ? "" : "none";
    };
    action.addEventListener("change", update);
    permanent.addEventListener("change", update);
    update();

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const minutes = action.value === "ban" && permanent.checked ? 0 : Number(amount.value) * Number(unit.value);
        if (!confirm(action.options[action.selectedIndex].text + ": " + player.displayName + "?")) return;
        const result = await api("/api/admin/act", {
            target: player.id, action: action.value, kind: lift.value, minutes, rule: Number(rule.value),
            reason: reason.value, reportId,
        });
        if (result.error) return showError(result.error);
        showError("Done: " + action.options[action.selectedIndex].text + ".");
        load();
        if (action.value !== "deleteAccount") openPlayer("#" + player.id);
        else el("player").innerHTML = "";
    });
}

async function exportData(player) {
    const response = await fetch("/api/admin/export?id=" + player.id, { headers: { Authorization: "Bearer " + (getToken() || "") } });
    if (!response.ok) return showError("Couldn't export the data.");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(await response.blob());
    link.download = "data-" + player.username + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    showError("The data of " + player.displayName + " was downloaded. Send it to them by email.");
    load();
}

// ---------- Moderation log ----------
function showLog(log) {
    const box = el("log");
    box.innerHTML = "";
    if (log.length === 0) return add(box, "p", "Nothing yet.", "muted");
    const table = add(box, "table");
    const head = add(table, "tr");
    for (const title of ["When", "Admin", "Action", "Player", "Rule", "Reason", "Until"]) add(head, "th", title);
    for (const entry of log) {
        const row = add(table, "tr");
        add(row, "td", timeText(entry.time));
        add(row, "td", entry.admin);
        add(row, "td", entry.action + (entry.kind ? " (" + entry.kind + ")" : ""));
        add(row, "td", entry.targetName || "");
        add(row, "td", entry.rule ? String(entry.rule) : "");
        add(row, "td", entry.reason || "");
        add(row, "td", entry.until === null ? "forever" : entry.until ? timeText(entry.until) : "");
    }
}

// opens the panel with fresh data (js/main.js calls this when you press Admin)
export function showAdmin() {
    el("adminMain").style.display = "";
    showError("");
    el("player").innerHTML = "";
    currentPlayer = null;
    load();
}
