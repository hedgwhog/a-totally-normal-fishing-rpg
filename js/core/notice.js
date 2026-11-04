// A popup over everything: the emergency notice from the admins (a data breach, maintenance, ...),
// and moderation messages (warnings, timeouts, bans). Works in every window (game, chat, trade, duel, start screen).
// A notice is shown once per browser: after "OK" it doesn't come back (until the admins send a new one).
const seenKey = "seenNotices";

function seen() {
    try {
        return JSON.parse(localStorage.getItem(seenKey)) || [];
    } catch {
        return [];
    }
}

let queue = Promise.resolve();

// shows one popup at a time. Resolves when the player presses OK.
export function showPopup(title, text) {
    queue = queue.then(() => new Promise(resolve => {
        const cover = document.createElement("div");
        cover.className = "noticeCover";
        Object.assign(cover.style, {
            position: "fixed", inset: "0", zIndex: "10000", display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0, 0, 0, 0.45)",
        });
        const box = document.createElement("div");
        box.setAttribute("role", "alertdialog");
        Object.assign(box.style, {
            background: "white", color: "black", border: "2px solid black", padding: "14px 18px", maxWidth: "460px",
            width: "calc(100% - 40px)", maxHeight: "80vh", overflowY: "auto", fontFamily: "inherit", boxSizing: "border-box",
        });
        const heading = document.createElement("h3");
        heading.textContent = title || "Message";
        heading.style.margin = "0 0 8px 0";
        const body = document.createElement("p");
        body.textContent = text == null ? "" : String(text); // never "undefined"
        Object.assign(body.style, { whiteSpace: "pre-wrap", margin: "0 0 12px 0", fontSize: "13px" });
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "OK";
        button.addEventListener("click", () => {
            cover.remove();
            resolve();
        });
        box.append(heading, body, button);
        cover.appendChild(box);
        document.body.appendChild(cover);
        button.focus();
    }));
    return queue;
}

// the emergency notice: only once per notice
export function showNotice(notice) {
    if (!notice || seen().includes(notice.id)) return Promise.resolve();
    localStorage.setItem(seenKey, JSON.stringify([...seen(), notice.id].slice(-20)));
    return showPopup(notice.title, notice.text);
}

// listen on a socket for notices and moderation messages
export function listenForNotices(socket) {
    socket.on("notice", showNotice);
    socket.on("moderation:message", text => showPopup("Message from the admins", text));
}
