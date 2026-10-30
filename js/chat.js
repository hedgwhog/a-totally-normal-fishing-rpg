import { connect } from "./net.js";
import { islandNames } from "./data/islands.js";

const socket = connect("chat");

function el(id) {
    return document.getElementById(id);
}

let me = null;
let iceServers = [];
let relayOnly = false;
let blocked = [];
let lastPlayers = [];
let voiceWarned = false;

function showError(text) {
    el("chatError").textContent = text || "";
}

function addText(box, text, className) {
    const line = document.createElement("div");
    if (className) line.className = className;
    line.textContent = text;
    box.appendChild(line);
    return line;
}

function addButton(box, label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", action);
    box.appendChild(button);
    return button;
}

socket.on("connect_error", error => {
    hangUp();
    if (error.message === "Open the game first.") {
        showError("Waiting for the game to connect...");
        setTimeout(() => socket.connect(), 3000);
        return;
    }
    if (socket.active) {
        showError("Lost the connection to the server. Trying again...");
        return;
    }
    showError(error.message + " (close this window and open the chat again from the game)");
});

socket.on("disconnect", () => {
    if (myRoom || peers.size > 0) showError("The connection was lost, so you left voice.");
    hangUp();
});
socket.on("game:closed", message => showError(message));

function showTab(id) {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab.id === id));
    document.querySelectorAll(".tabs button").forEach(button => button.classList.toggle("active", button.dataset.tab === id));
}
document.querySelectorAll(".tabs button").forEach(button => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
});
showTab("tabChat");

function showMessage(message) {
    if (blocked.some(player => player.id === message.userId)) return;
    const box = el("messages");
    const line = document.createElement("div");
    line.className = "message";
    line.dataset.user = message.userId;
    const time = new Date(message.time).toLocaleString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });

    const name = document.createElement("b");
    name.textContent = message.name + ":";
    line.append(time + " ", name, message.text);
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
}

socket.on("area:enter", data => {
    me = data.me;
    iceServers = data.iceServers;
    relayOnly = Boolean(data.relayOnly);
    el("roomSize").max = data.voiceRoomMaxSize;
    el("roomName").maxLength = data.voiceNameLength;
    el("roomPassword").maxLength = data.voicePasswordLength;
    el("area").textContent = "Chat: " + (islandNames[data.island] || data.island);
    el("messages").innerHTML = "";
    data.messages.forEach(showMessage);
    leaveVoice();
});

socket.on("chat:message", showMessage);

el("chatForm").addEventListener("submit", async event => {
    event.preventDefault();
    const text = el("chatInput").value.trim();
    if (!text) return;
    const result = await socket.emitWithAck("chat:send", text);
    if (result.error) return showError(result.error);
    showError("");
    el("chatInput").value = "";
    cooldown(5);
});

function cooldown(seconds) {
    const button = el("sendButton");
    button.disabled = true;
    button.textContent = seconds + "s";
    if (seconds > 1) {
        setTimeout(() => cooldown(seconds - 1), 1000);
        return;
    }
    setTimeout(() => {
        button.disabled = false;
        button.textContent = "Send";
    }, 1000);
}

socket.on("area:update", ({ players, voice }) => {
    lastPlayers = players;
    showPlayers();
    showVoiceRooms(voice);
});

function showPlayers() {
    const list = el("players");
    list.innerHTML = "";
    if (lastPlayers.length === 0) addText(list, "Nobody is active here right now.", "muted");

    for (const player of lastPlayers) {
        const row = document.createElement("div");
        row.className = "row line";
        let label = player.name;
        if (player.inVoice) label += " (in voice)";
        if (me && player.id === me.id) label += " (you)";
        addText(row, label);

        if (!me || player.id !== me.id) {
            const buttons = document.createElement("span");
            const isBlocked = blocked.some(other => other.id === player.id);
            if (player.active && !isBlocked) {
                addButton(buttons, "Trade", () => invite("trade", player));
                addButton(buttons, "Duel", () => invite("duel", player));
                addButton(buttons, "Friend", () => invite("friend", player));
            }
            if (isBlocked) addButton(buttons, "Unblock", () => setBlocked(player, false));
            else addButton(buttons, "Block", () => setBlocked(player, true));
            row.appendChild(buttons);
        }
        list.appendChild(row);
    }
}

async function setBlocked(player, block) {
    if (block) {
        const sure = confirm("Block " + player.name + "?\n\nYou won't see their messages, they can't invite you or send you letters, "
            + "and you won't be in the same voice room. If you're friends, that ends too.\nThey are not told that you blocked them.");
        if (!sure) return;
    }
    const result = await socket.emitWithAck("block:set", { id: player.id, block });
    if (result.error) showError(result.error);
    else if (block) showError(player.name + " is blocked.");
    else showError(player.name + " is unblocked.");
}

socket.on("block:list", list => {
    blocked = list;
    el("messages").querySelectorAll(".message").forEach(line => {
        if (blocked.some(player => player.id === Number(line.dataset.user))) line.remove();
    });
    showPlayers();

    const box = el("blockedList");
    box.innerHTML = "";
    if (blocked.length === 0) addText(box, "You haven't blocked anyone.", "muted");
    for (const player of blocked) {
        const row = document.createElement("div");
        row.className = "row line";
        addText(row, player.name);
        addButton(row, "Unblock", () => setBlocked(player, false));
        box.appendChild(row);
    }
});

async function invite(type, player) {
    const result = await socket.emitWithAck("invite:send", { type, to: player.id });
    if (result.error) showError(result.error);
    else if (type === "friend") showError("Friend request sent to " + player.name + ".");
    else showError("Invite sent to " + player.name + ".");
}

function addInvite(fill) {
    const row = document.createElement("div");
    row.className = "row invite";
    fill(row);
    el("invites").appendChild(row);
    return row;
}

socket.on("invite:new", ({ id, type, fromName }) => {
    addInvite(row => {
        if (type === "friend") addText(row, fromName + " wants to be friends.");
        else addText(row, fromName + " wants to " + type + ".");
        const buttons = document.createElement("span");
        addButton(buttons, "Accept", async () => {
            row.remove();
            const result = await socket.emitWithAck("invite:answer", { id, accept: true });
            if (result.error) showError(result.error);
        });
        addButton(buttons, "Decline", () => {
            row.remove();
            socket.emitWithAck("invite:answer", { id, accept: false });
        });
        row.appendChild(buttons);
    });
});

socket.on("invite:declined", ({ type, name }) => {
    if (type === "friend") showError(name + " declined your friend request.");
    else showError(name + " declined your " + type + ".");
});

socket.on("friend:added", ({ name }) => {
    addInvite(row => {
        addText(row, "You and " + name + " are friends now! Send them a letter (Mail in the game).");
        addButton(row, "OK", () => row.remove());
    });
});

socket.on("invite:ready", ({ type, id }) => {
    addInvite(row => {
        addText(row, "The " + type + " is ready!");
        addButton(row, "Open " + type, () => {
            let size = "width=460,height=520";
            if (type === "duel") size = "width=640,height=500";
            window.open(type + ".html?id=" + id, type + id, size);
            row.remove();
        });
    });
});

let myRoom = null;
let lastRooms = [];
let microphone = null;
let muted = false;
const peers = new Map();
let audioContext = null;
let microphoneAnalyser = null;

const icons = {
    talking: "<|))",
    quiet: "<|  ",
    muted: "<|x ",
};

function showVoiceRooms(rooms) {
    lastRooms = rooms;
    checkMyRoom(rooms);
    const list = el("voiceRooms");
    list.innerHTML = "";
    if (rooms.length === 0) addText(list, "No rooms here yet. Make one below.", "muted");

    for (const room of rooms) {
        const box = document.createElement("div");
        box.className = "line";

        const row = document.createElement("div");
        row.className = "row";
        let label = room.name + " (" + room.members.length + "/" + room.maxSize + ")";
        if (room.closed) label += " [closed]";
        addText(row, label);
        const isMine = myRoom && myRoom.id === room.id;
        if (!isMine && room.members.length < room.maxSize) addButton(row, "Join", () => joinRoom(room));
        box.appendChild(row);

        for (const member of room.members) {
            const line = document.createElement("div");
            line.className = "voiceMember";
            const icon = document.createElement("span");
            icon.className = "voiceIcon";
            icon.dataset.id = member.id;
            icon.dataset.muted = member.muted ? "yes" : "no";
            icon.textContent = member.muted ? icons.muted : icons.quiet;
            line.append(icon, " " + member.name);
            if (member.id === socket.id) line.append(" (you)");
            if (member.muted) line.append(" (muted)");
            box.appendChild(line);
        }
        list.appendChild(box);
    }
}

function checkMyRoom(rooms) {
    if (!myRoom) {
        for (const id of [...peers.keys()]) closePeer(id);
        return;
    }
    const mine = rooms.find(room => room.id === myRoom.id);
    const stillIn = mine && mine.members.some(member => member.id === socket.id);
    if (!stillIn) {
        hangUp();
        showError("You're no longer in that voice room.");
        return;
    }
    for (const id of [...peers.keys()]) {
        if (!mine.members.some(member => member.id === id)) closePeer(id);
    }
}

function voiceWarning() {
    if (voiceWarned) return true;
    let warning = "Voice chat isn't recorded, but it goes directly between the players in the room.\n\n"
        + "The game doesn't show it, but players in the room receive your IP address to connect, "
        + "and someone with technical knowledge can find it.\n\nJoin voice?";
    if (relayOnly) {
        warning = "Voice chat isn't recorded. It goes through a relay server, so other players don't see your IP address.\n\nJoin voice?";
    }
    if (!confirm(warning)) return false;
    voiceWarned = true;
    return true;
}

function makeAnalyser(stream) {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    return analyser;
}

function isTalking(analyser) {
    if (!analyser) return false;
    const samples = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(samples);
    let total = 0;
    for (const sample of samples) {
        const wave = (sample - 128) / 128;
        total += wave * wave;
    }
    return Math.sqrt(total / samples.length) > 0.03;
}

setInterval(() => {
    document.querySelectorAll(".voiceIcon").forEach(icon => {
        if (icon.dataset.muted === "yes") return;
        let analyser = null;
        if (icon.dataset.id === socket.id) {
            if (!muted) analyser = microphoneAnalyser;
        } else if (peers.has(icon.dataset.id)) {
            analyser = peers.get(icon.dataset.id).analyser;
        }
        icon.textContent = isTalking(analyser) ? icons.talking : icons.quiet;
    });
}, 150);

async function startMicrophone() {
    if (microphone) return true;
    try {
        microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneAnalyser = makeAnalyser(microphone);
        return true;
    } catch {
        showError("No microphone access. Allow the microphone for this site to use voice.");
        return false;
    }
}

function enterRoom(result) {
    if (result.error) return showError(result.error);
    showError("");
    myRoom = result.room;
    muted = false;
    el("muteButton").textContent = "Mute";
    el("voiceControls").style.display = "flex";
    el("voiceStatus").textContent = "In: " + myRoom.name;
    showVoiceRooms(lastRooms);
    for (const peer of result.peers) callPeer(peer.id, true);
}

async function joinRoom(room) {
    if (!voiceWarning()) return;
    let password = "";
    if (room.closed) {
        password = prompt("This room is closed. Password:");
        if (password === null) return;
    }
    if (!await startMicrophone()) return;
    leaveVoice(false);
    const result = await socket.emitWithAck("voice:join", { id: room.id, password });
    enterRoom(result);
}

el("roomClosed").addEventListener("change", () => {
    el("roomPasswordRow").style.display = el("roomClosed").checked ? "flex" : "none";
});

el("voiceCreate").addEventListener("submit", async event => {
    event.preventDefault();
    if (!voiceWarning()) return;
    if (!await startMicrophone()) return;
    leaveVoice(false);
    const result = await socket.emitWithAck("voice:create", {
        name: el("roomName").value,
        maxSize: Number(el("roomSize").value),
        closed: el("roomClosed").checked,
        password: el("roomPassword").value,
    });
    enterRoom(result);
});

function callPeer(id, startsCall) {
    const connection = new RTCPeerConnection({ iceServers, iceTransportPolicy: relayOnly ? "relay" : "all" });
    microphone.getTracks().forEach(track => connection.addTrack(track, microphone));

    const audio = document.createElement("audio");
    audio.autoplay = true;
    el("voiceAudio").appendChild(audio);

    const peer = { connection, audio, analyser: null, waitingCandidates: [], queue: Promise.resolve() };
    peers.set(id, peer);

    connection.ontrack = event => {
        audio.srcObject = event.streams[0];
        audio.play().catch(() => showError("Click anywhere in this window to hear the voice chat."));
        peer.analyser = makeAnalyser(event.streams[0]);
    };
    connection.onicecandidate = event => {
        if (event.candidate) socket.emit("voice:signal", { to: id, data: { candidate: event.candidate } });
    };
    connection.onconnectionstatechange = () => {
        if (connection.connectionState === "failed") {
            showError("Voice couldn't connect to a player. Your networks probably block a direct connection: a TURN server is needed (see config.js).");
            closePeer(id);
        }
        if (connection.connectionState === "closed") closePeer(id);
    };

    if (startsCall) {
        peer.queue = peer.queue.then(async () => {
            await connection.setLocalDescription(await connection.createOffer());
            socket.emit("voice:signal", { to: id, data: { description: connection.localDescription } });
        });
    }
    return peer;
}

async function handleSignal(peer, from, data) {
    const connection = peer.connection;
    if (data.description) {
        await connection.setRemoteDescription(data.description);
        for (const candidate of peer.waitingCandidates) {
            await connection.addIceCandidate(candidate);
        }
        peer.waitingCandidates = [];
        if (data.description.type === "offer") {
            await connection.setLocalDescription(await connection.createAnswer());
            socket.emit("voice:signal", { to: from, data: { description: connection.localDescription } });
        }
    } else if (data.candidate) {
        if (connection.remoteDescription) await connection.addIceCandidate(data.candidate);
        else peer.waitingCandidates.push(data.candidate);
    }
}

socket.on("voice:signal", ({ from, data }) => {
    if (!myRoom) return;
    const peer = peers.get(from) || callPeer(from, false);
    peer.queue = peer.queue
        .then(() => handleSignal(peer, from, data))
        .catch(() => {});
});

document.addEventListener("click", () => {
    if (audioContext && audioContext.state === "suspended") audioContext.resume();
    el("voiceAudio").querySelectorAll("audio").forEach(audio => audio.play().catch(() => {}));
});

function closePeer(id) {
    const peer = peers.get(id);
    if (!peer) return;
    peers.delete(id);
    peer.connection.close();
    peer.audio.srcObject = null;
    peer.audio.remove();
}

socket.on("voice:peerLeft", ({ id }) => closePeer(id));

function stopMicrophone() {
    if (!microphone) return;
    microphone.getTracks().forEach(track => track.stop());
    microphone = null;
    microphoneAnalyser = null;
}

socket.on("voice:kicked", () => {
    hangUp();
    showError("You left the voice room, because you blocked someone in it.");
});

function leaveVoice(tellServer = true) {
    if (tellServer && myRoom) socket.emit("voice:leave");
    for (const id of [...peers.keys()]) closePeer(id);
    myRoom = null;
    muted = false;
    el("muteButton").textContent = "Mute";
    el("voiceControls").style.display = "none";
    if (tellServer) stopMicrophone();
}

function hangUp() {
    leaveVoice(false);
    stopMicrophone();
}

el("leaveVoice").addEventListener("click", () => leaveVoice());
el("muteButton").addEventListener("click", () => {
    muted = !muted;
    if (microphone) microphone.getAudioTracks().forEach(track => track.enabled = !muted);
    el("muteButton").textContent = muted ? "Unmute" : "Mute";
    socket.emit("voice:mute", muted);
});