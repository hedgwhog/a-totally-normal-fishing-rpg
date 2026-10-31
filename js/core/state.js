let state = null;
let session = null;
let socket = null;
const listeners = [];

export function getState() {
    return state;
}

export function getSession() {
    return session;
}

export function onState(listener) {
    listeners.push(listener);
}

let clockOffset = 0;
function syncClock(next) {
    if (next && next.serverTime) clockOffset = next.serverTime - Date.now();
}

export function serverNow() {
    return Date.now() + clockOffset;
}

function setState(next) {
    syncClock(next);
    const previous = state;
    state = next;
    listeners.forEach(listener => listener(state, previous));
}

export function startState(gameSocket, info, firstState) {
    socket = gameSocket;
    session = info;
    state = firstState;
    syncClock(firstState);
    socket.on("state", setState);
}

export async function act(type, data = {}) {
    try {
        const result = await socket.timeout(10000).emitWithAck("act", { type, data });
        if (result.state) setState(result.state);
        return result;
    } catch {
        return { error: "No connection to the server. Check your internet and try again." };
    }
}

export async function resetSave() {
    try {
        await socket.timeout(10000).emitWithAck("resetSave", {});
    } catch {
    }
}

export function localKey(name) {
    return "u:" + session.username + ":save:" + session.slot + ":" + name;
}
