import crypto from "node:crypto";
import { config } from "./config.js";
import * as store from "./store.js";
import { findItem } from "../js/data/items.js";
import { duelDefaults, duelLimits, duelZone, stakeCategories } from "../js/data/duel.js";
import { isHit } from "../js/rules/duel.js";
import { round1 } from "../js/rules/stats.js";
import { duelStats, duelRods, addFriend, blockedBetween } from "./game.js";
import { cleanText } from "../js/rules/text.js";

// Also not really sure how this workers, surely it will be fine?

const newId = () => crypto.randomBytes(8).toString("hex");
const randomBetween = (least, most) => least + Math.floor(Math.random() * (most - least + 1));

export function setupSocial(io, { saveOf, storeSaveOf }) {
    const lastMessage = new Map();
    const lastInvite = new Map();
    const voiceRooms = new Map();
    const invites = new Map();
    const trades = new Map();
    const duels = new Map();

    function areaRoom(island) {
        return "area:" + island;
    }

    function socketsOfKind(kind) {
        return [...io.sockets.sockets.values()].filter(socket => socket.data.kind === kind);
    }

    function chatSocketsOf(userId) {
        return socketsOfKind("chat").filter(socket => socket.data.user.id === userId);
    }

    function voiceRoomOf(socket) {
        for (const room of voiceRooms.values()) {
            if (room.members.has(socket.id)) return room;
        }
        return null;
    }

    function isActive(userId) {
        const lastTime = lastMessage.get(userId) || 0;
        if (Date.now() - lastTime < config.activeForMs) return true;
        return chatSocketsOf(userId).some(socket => voiceRoomOf(socket));
    }

    function playersIn(island) {
        const players = new Map();
        for (const socket of socketsOfKind("chat")) {
            if (socket.data.island !== island) continue;
            if (!isActive(socket.data.user.id)) continue;
            const user = socket.data.user;
            players.set(user.id, {
                id: user.id,
                name: user.displayName,
                active: isActive(user.id),
                inVoice: Boolean(voiceRoomOf(socket)),
            });
        }
        return [...players.values()];
    }

    function voiceSummary(island) {
        const rooms = [];
        for (const room of voiceRooms.values()) {
            if (room.island !== island) continue;
            const names = [];
            for (const id of room.members) {
                const member = io.sockets.sockets.get(id);
                if (member) names.push(member.data.user.displayName);
            }
            rooms.push({ id: room.id, name: room.name, closed: room.closed, maxSize: room.maxSize, names });
        }
        return rooms;
    }

    function updateArea(island) {
        io.to(areaRoom(island)).emit("area:update", { players: playersIn(island), voice: voiceSummary(island) });
    }

    setInterval(() => {
        const islands = new Set(socketsOfKind("chat").map(socket => socket.data.island));
        for (const island of islands) {
            if (island) updateArea(island);
        }
    }, 60 * 1000);

    function leaveVoice(socket) {
        const room = voiceRoomOf(socket);
        if (!room) return;
        room.members.delete(socket.id);
        for (const id of room.members) io.to(id).emit("voice:peerLeft", { id: socket.id });
        if (room.members.size === 0) voiceRooms.delete(room.id);
    }

    function blockedIds(userId) {
        const list = saveOf(userId).blocked || [];
        return new Set(list.map(player => player.id));
    }

    function isBlocked(idA, idB) {
        return blockedBetween(saveOf(idA), idA, saveOf(idB), idB);
    }

    function sendBlockList(userId) {
        const list = saveOf(userId).blocked || [];
        for (const socket of chatSocketsOf(userId)) {
            socket.data.blocked = new Set(list.map(player => player.id));
            socket.emit("block:list", list);
        }
    }

    function enterArea(socket, island) {
        if (socket.data.island) {
            leaveVoice(socket);
            socket.leave(areaRoom(socket.data.island));
            updateArea(socket.data.island);
        }
        socket.data.island = island;
        socket.data.blocked = blockedIds(socket.data.user.id);
        socket.join(areaRoom(island));
        const messages = store.recentMessages(island).filter(message => !socket.data.blocked.has(message.userId));
        socket.emit("area:enter", {
            island,
            me: { id: socket.data.user.id, name: socket.data.user.displayName },
            messages,
            relayOnly: config.voiceRelayOnly,
            iceServers: config.iceServers,
            cooldownMs: config.chatCooldownMs,
            maxLength: config.chatMaxLength,
            voiceRoomMaxSize: config.voiceRoomMaxSize,
            voiceNameLength: config.voiceNameLength,
            voicePasswordLength: config.voicePasswordLength,
        });
        updateArea(island);
    }

    function joinVoiceRoom(socket, room) {
        if (room.members.size >= room.maxSize) return { error: "This room is full." };
        const others = [];
        for (const id of room.members) {
            const member = io.sockets.sockets.get(id);
            if (member) others.push(member);
        }
        if (others.some(member => isBlocked(socket.data.user.id, member.data.user.id))) {
            return { error: "You can't join this room right now. Try another room." };
        }
        const peers = others.map(member => ({ id: member.id, name: member.data.user.displayName }));
        room.members.add(socket.id);
        return { peers };
    }

    function checkOffer(save, offer) {
        const coins = round1(Number(offer && offer.coins) || 0);
        const resonance = round1(Number(offer && offer.resonance) || 0);
        if (coins < 0 || coins > save.coins) throw new Error("You don't have that many coins.");
        if (resonance < 0 || resonance > save.resonance) throw new Error("You don't have that much resonance.");
        const items = {};
        for (const [id, value] of Object.entries((offer && offer.items) || {})) {
            const amount = Number(value);
            const item = findItem(id);
            if (!item || !stakeCategories.includes(item.category)) throw new Error("You can't offer that.");
            if (!Number.isInteger(amount) || amount < 0 || amount > (save.items[id] || 0)) throw new Error("You don't have that many " + item.name + ".");
            if (amount > 0) items[id] = amount;
        }
        return { coins, resonance, items };
    }

    function takeOffer(save, offer) {
        save.coins = round1(save.coins - offer.coins);
        save.resonance = round1(save.resonance - offer.resonance);
        for (const [id, amount] of Object.entries(offer.items)) save.items[id] -= amount;
    }

    function giveOffer(save, offer) {
        save.coins = round1(save.coins + offer.coins);
        save.resonance = round1(save.resonance + offer.resonance);
        for (const [id, amount] of Object.entries(offer.items)) save.items[id] = (save.items[id] || 0) + amount;
    }

    function inventoryFor(save) {
        const items = {};
        for (const [id, amount] of Object.entries(save.items)) {
            const item = findItem(id);
            if (item && amount > 0 && stakeCategories.includes(item.category)) items[id] = amount;
        }
        return { coins: save.coins, resonance: save.resonance, items };
    }

    function connectChat(socket) {
        const { user } = socket.data;
        enterArea(socket, saveOf(user.id).island);
        socket.emit("block:list", saveOf(user.id).blocked || []);

        socket.on("chat:send", (text, answer) => {
            if (typeof answer !== "function") return;
            const wait = config.chatCooldownMs - (Date.now() - (lastMessage.get(user.id) || 0));
            if (wait > 0) return answer({ error: "Wait " + Math.ceil(wait / 1000) + " seconds before your next message." });
            const clean = cleanText(text, { maxLength: config.chatMaxLength });
            if (!clean) return answer({ error: "Type a message first." });
            lastMessage.set(user.id, Date.now());
            const message = store.addMessage({ island: socket.data.island, userId: user.id, name: user.displayName, text: clean, time: Date.now() });
            for (const other of socketsOfKind("chat")) {
                if (other.data.island !== socket.data.island) continue;
                if (other.data.blocked && other.data.blocked.has(user.id)) continue;
                other.emit("chat:message", message);
            }
            updateArea(socket.data.island);
            answer({});
        });

        socket.on("voice:create", (options, answer) => {
            if (typeof answer !== "function") return;
            const settings = options || {};
            const island = socket.data.island;
            const roomsHere = [...voiceRooms.values()].filter(room => room.island === island).length;
            if (roomsHere >= config.voiceRoomsPerArea) return answer({ error: "There are too many rooms here. Join one, or wait." });

            let name = cleanText(settings.name, { maxLength: config.voiceNameLength });
            if (!name) name = user.displayName + "'s room";
            const maxSize = Number(settings.maxSize);
            if (!(Number.isInteger(maxSize) && maxSize >= 2 && maxSize <= config.voiceRoomMaxSize)) {
                return answer({ error: "A room fits 2 to " + config.voiceRoomMaxSize + " players." });
            }
            const closed = Boolean(settings.closed);
            const password = String(settings.password || "");
            if (closed && (password.length < 1 || password.length > config.voicePasswordLength)) {
                return answer({ error: "A closed room needs a password of 1 to " + config.voicePasswordLength + " characters." });
            }

            leaveVoice(socket);
            const room = { id: newId(), island, name, closed, password: closed ? password : "", maxSize, members: new Set() };
            voiceRooms.set(room.id, room);
            const result = joinVoiceRoom(socket, room);
            updateArea(island);
            answer({ ...result, room: { id: room.id, name: room.name } });
        });

        socket.on("voice:join", (data, answer) => {
            if (typeof answer !== "function") return;
            const request = data || {};
            const room = voiceRooms.get(String(request.id));
            if (!room || room.island !== socket.data.island) return answer({ error: "That room doesn't exist anymore." });
            if (room.closed && String(request.password || "") !== room.password) return answer({ error: "Wrong password." });
            if (voiceRoomOf(socket) === room) return answer({ error: "You're already in this room." });

            leaveVoice(socket);
            const result = joinVoiceRoom(socket, room);
            updateArea(socket.data.island);
            answer({ ...result, room: { id: room.id, name: room.name } });
        });

        socket.on("voice:leave", () => {
            leaveVoice(socket);
            updateArea(socket.data.island);
        });

        socket.on("voice:signal", ({ to, data } = {}) => {
            const room = voiceRoomOf(socket);
            if (room && room.members.has(to)) io.to(to).emit("voice:signal", { from: socket.id, name: user.displayName, data });
        });

        socket.on("invite:send", ({ type, to } = {}, answer) => {
            if (typeof answer !== "function") return;
            if (type !== "trade" && type !== "duel" && type !== "friend") return answer({ error: "Unknown invite." });
            const target = playersIn(socket.data.island).find(player => player.id === Number(to));
            if (!target || target.id === user.id) return answer({ error: "That player isn't in your area." });
            if (!target.active) return answer({ error: target.name + " isn't active in the chat." });
            const wait = config.inviteCooldownMs - (Date.now() - (lastInvite.get(user.id) || 0));
            if (wait > 0) return answer({ error: "Wait " + Math.ceil(wait / 1000) + " seconds before your next invite." });
            if ([...invites.values()].some(openInvite => openInvite.from === user.id && openInvite.to === target.id && openInvite.type === type)) return answer({ error: "You already invited " + target.name + ". Wait for an answer." });
            if (isBlocked(user.id, target.id)) return answer({ error: target.name + " isn't available right now." });
            lastInvite.set(user.id, Date.now());
            if (type === "friend" && saveOf(user.id).friends.some(friend => friend.id === target.id)) return answer({ error: "You and " + target.name + " are already friends." });
            if (type === "friend" && saveOf(user.id).friends.length >= config.maxFriends) return answer({ error: "You have " + config.maxFriends + " friends already. Remove one in Mail > Friends first." });
            const invite = { id: newId(), type, from: user.id, fromName: user.displayName, to: target.id, island: socket.data.island, time: Date.now() };
            invites.set(invite.id, invite);
            for (const chatSocket of chatSocketsOf(target.id)) chatSocket.emit("invite:new", { id: invite.id, type, fromName: user.displayName });
            setTimeout(() => invites.delete(invite.id), 2 * 60 * 1000);
            answer({});
        });

        socket.on("invite:answer", ({ id, accept } = {}, answer) => {
            if (typeof answer !== "function") return;
            const invite = invites.get(id);
            if (!invite || invite.to !== user.id) return answer({ error: "This invite is gone." });
            invites.delete(id);
            const fromSockets = chatSocketsOf(invite.from);
            if (!accept) {
                for (const chatSocket of fromSockets) chatSocket.emit("invite:declined", { type: invite.type, name: user.displayName });
                return answer({});
            }
            if (invite.type === "friend") {
                const mine = saveOf(user.id);
                const theirs = saveOf(invite.from);
                if (blockedBetween(mine, user.id, theirs, invite.from)) return answer({ error: "This invite is gone." });
                addFriend(mine, invite.from, invite.fromName);
                addFriend(theirs, user.id, user.displayName);
                storeSaveOf(user.id, mine);
                storeSaveOf(invite.from, theirs);
                for (const chatSocket of fromSockets) chatSocket.emit("friend:added", { name: user.displayName });
                for (const chatSocket of chatSocketsOf(user.id)) chatSocket.emit("friend:added", { name: invite.fromName });
                return answer({});
            }
            if (!fromSockets.some(chatSocket => chatSocket.data.island === socket.data.island)) return answer({ error: "They're not in your area anymore." });
            const session = invite.type === "trade" ? newTrade(invite) : newDuel(invite);
            for (const chatSocket of [...fromSockets, ...chatSocketsOf(user.id)]) chatSocket.emit("invite:ready", { type: invite.type, id: session.id });
            answer({});
        });

        socket.on("block:set", ({ id, block } = {}, answer) => {
            if (typeof answer !== "function") return;
            const targetId = Number(id);
            const target = store.findUser(targetId);
            if (!target || targetId === user.id) return answer({ error: "That player doesn't exist." });
            const mine = saveOf(user.id);
            mine.blocked = (mine.blocked || []).filter(player => player.id !== targetId);
            if (block) {
                if (mine.blocked.length >= config.maxBlocked) return answer({ error: "Your block list is full. Unblock someone first." });
                mine.blocked.push({ id: targetId, name: target.displayName });
                mine.friends = mine.friends.filter(friend => friend.id !== targetId);
                const theirs = saveOf(targetId);
                if (theirs && theirs.friends.some(friend => friend.id === user.id)) {
                    theirs.friends = theirs.friends.filter(friend => friend.id !== user.id);
                    storeSaveOf(targetId, theirs);
                }
                for (const [inviteId, invite] of invites) {
                    if ((invite.from === user.id && invite.to === targetId) || (invite.from === targetId && invite.to === user.id)) invites.delete(inviteId);
                }
                const room = voiceRoomOf(socket);
                const targetInRoom = room && [...room.members].some(id => {
                    const member = io.sockets.sockets.get(id);
                    return member && member.data.user.id === targetId;
                });
                if (targetInRoom) {
                    leaveVoice(socket);
                    socket.emit("voice:kicked");
                }
            }
            storeSaveOf(user.id, mine);
            sendBlockList(user.id);
            updateArea(socket.data.island);
            answer({});
        });

        socket.on("disconnect", () => {
            leaveVoice(socket);
            if (socket.data.island) updateArea(socket.data.island);
        });
    }

    function newTrade(invite) {
        const trade = {
            id: newId(), island: invite.island, users: [invite.from, invite.to],
            offers: { [invite.from]: { coins: 0, resonance: 0, items: {} }, [invite.to]: { coins: 0, resonance: 0, items: {} } },
            confirmed: {}, done: false, cancelled: false,
        };
        trades.set(trade.id, trade);
        setTimeout(() => trades.delete(trade.id), 30 * 60 * 1000);
        return trade;
    }

    function sendTrade(trade) {
        for (const socket of io.sockets.sockets.values()) {
            if (socket.data.kind !== "trade" || socket.data.sessionId !== trade.id) continue;
            const me = socket.data.user.id;
            const other = trade.users.find(id => id !== me);
            socket.emit("trade:state", {
                me: socket.data.user.displayName,
                other: store.findUser(other).displayName,
                myOffer: trade.offers[me], theirOffer: trade.offers[other],
                iConfirmed: Boolean(trade.confirmed[me]), theyConfirmed: Boolean(trade.confirmed[other]),
                inventory: inventoryFor(saveOf(me)),
                done: trade.done, cancelled: trade.cancelled,
            });
        }
    }

    function connectTrade(socket) {
        const trade = trades.get(socket.data.sessionId);
        const me = socket.data.user.id;
        if (!trade || !trade.users.includes(me)) {
            socket.emit("trade:error", "This trade doesn't exist anymore.");
            return socket.disconnect();
        }
        sendTrade(trade);

        socket.on("trade:offer", (offer, answer) => {
            if (typeof answer !== "function" || trade.done || trade.cancelled) return;
            try {
                trade.offers[me] = checkOffer(saveOf(me), offer);
            } catch (error) {
                return answer({ error: error.message });
            }
            trade.confirmed = {};
            sendTrade(trade);
            answer({});
        });

        socket.on("trade:confirm", (data, answer) => {
            if (typeof answer !== "function" || trade.done || trade.cancelled) return;
            trade.confirmed[me] = true;
            if (trade.users.every(id => trade.confirmed[id])) {
                const [a, b] = trade.users;
                const saveA = structuredClone(saveOf(a));
                const saveB = structuredClone(saveOf(b));
                try {
                    if (saveA.island !== trade.island || saveB.island !== trade.island) throw new Error("You're not in the same area anymore.");
                    const offerA = checkOffer(saveA, trade.offers[a]);
                    const offerB = checkOffer(saveB, trade.offers[b]);
                    takeOffer(saveA, offerA); giveOffer(saveA, offerB);
                    takeOffer(saveB, offerB); giveOffer(saveB, offerA);
                } catch (error) {
                    trade.confirmed = {};
                    sendTrade(trade);
                    return answer({ error: error.message });
                }
                storeSaveOf(a, saveA);
                storeSaveOf(b, saveB);
                trade.done = true;
            }
            sendTrade(trade);
            answer({});
        });

        const cancel = () => {
            if (trade.done || trade.cancelled) return;
            trade.cancelled = true;
            sendTrade(trade);
        };
        socket.on("trade:cancel", cancel);
        socket.on("disconnect", cancel);
    }

    function newDuel(invite) {
        const duel = {
            id: newId(), island: invite.island, users: [invite.from, invite.to],
            settings: { ...duelDefaults },
            stakes: { [invite.from]: { coins: 0, resonance: 0, items: {} }, [invite.to]: { coins: 0, resonance: 0, items: {} } },
            ready: {}, phase: "setup", lives: {}, hits: {}, stats: {}, winner: null,
            rods: { [invite.from]: duelRods(saveOf(invite.from))[0], [invite.to]: duelRods(saveOf(invite.to))[0] },
            rounds: [], roundNo: {}, sentAt: {}, endsAt: 0, timer: null,
        };
        duels.set(duel.id, duel);
        setTimeout(() => duels.delete(duel.id), 60 * 60 * 1000);
        return duel;
    }

    function sendDuel(duel, event = "duel:state", extra = {}, onlyFor = null) {
        for (const socket of io.sockets.sockets.values()) {
            if (socket.data.kind !== "duel" || socket.data.sessionId !== duel.id) continue;
            const me = socket.data.user.id;
            if (onlyFor !== null && me !== onlyFor) continue;
            const other = duel.users.find(id => id !== me);
            socket.emit(event, {
                me: socket.data.user.displayName, other: store.findUser(other).displayName,
                phase: duel.phase, settings: duel.settings,
                myStake: duel.stakes[me], theirStake: duel.stakes[other],
                iReady: Boolean(duel.ready[me]), theyReady: Boolean(duel.ready[other]),
                myLives: duel.lives[me], theirLives: duel.lives[other],
                myHits: duel.hits[me], theirHits: duel.hits[other],
                myStats: duel.stats[me], roundNo: duel.roundNo[me],
                started: duel.endsAt > 0, timeLeftMs: duel.endsAt ? Math.max(0, duel.endsAt - Date.now()) : duel.settings.time * 1000,
                myRod: duel.rods[me], theirRod: duel.rods[other].name,
                rods: duel.phase === "setup" ? duelRods(saveOf(me)) : null,
                inventory: duel.phase === "setup" ? inventoryFor(saveOf(me)) : null,
                result: duel.phase === "done" ? (duel.winner === null ? "tie" : duel.winner === me ? "won" : "lost") : null,
                ...extra,
            });
        }
    }

    function clampSettings(input) {
        const clamp = (value, [least, most], fallback) => Math.min(most, Math.max(least, Math.round(Number(value)) || fallback));
        const wanted = { ...duelDefaults, ...input };
        const settings = {
            time: clamp(wanted.time, duelLimits.time, duelDefaults.time),
            lives: clamp(wanted.lives, duelLimits.lives, duelDefaults.lives),
            minLineSpeed: clamp(wanted.minLineSpeed, duelLimits.lineSpeed, duelDefaults.minLineSpeed),
            maxLineSpeed: clamp(wanted.maxLineSpeed, duelLimits.lineSpeed, duelDefaults.maxLineSpeed),
            minFishSpeed: clamp(wanted.minFishSpeed, duelLimits.fishSpeed, duelDefaults.minFishSpeed),
            maxFishSpeed: clamp(wanted.maxFishSpeed, duelLimits.fishSpeed, duelDefaults.maxFishSpeed),
            minWidth: clamp(wanted.minWidth, duelLimits.width, duelDefaults.minWidth),
            maxWidth: clamp(wanted.maxWidth, duelLimits.width, duelDefaults.maxWidth),
        };
        settings.maxLineSpeed = Math.max(settings.minLineSpeed, settings.maxLineSpeed);
        settings.maxFishSpeed = Math.max(settings.minFishSpeed, settings.maxFishSpeed);
        settings.maxWidth = Math.max(settings.minWidth, settings.maxWidth);
        return settings;
    }

    function roundFor(duel, roundNumber) {
        const settings = duel.settings;
        while (duel.rounds.length < roundNumber) {
            const width = randomBetween(settings.minWidth, settings.maxWidth);
            duel.rounds.push({
                width, zone: duelZone,
                lineSpeed: randomBetween(settings.minLineSpeed, settings.maxLineSpeed),
                fishSpeed: randomBetween(settings.minFishSpeed, settings.maxFishSpeed),
                fishStart: randomBetween(0, width - duelZone),
                fishDirection: Math.random() < 0.5 ? -1 : 1,
            });
        }
        return duel.rounds[roundNumber - 1];
    }

    function startDuel(duel) {
        if (duel.phase !== "playing") return;
        duel.endsAt = Date.now() + duel.settings.time * 1000;
        duel.timer = setTimeout(() => endDuel(duel), duel.settings.time * 1000 + 500);
        sendDuel(duel);
        for (const id of duel.users) sendBar(duel, id, null);
    }

    function sendBar(duel, id, lastHit) {
        duel.roundNo[id] = (duel.roundNo[id] || 0) + 1;
        duel.sentAt[id] = Date.now();
        sendDuel(duel, "duel:round", { round: roundFor(duel, duel.roundNo[id]), lastHit }, id);
    }

    function isDecided(duel) {
        const [a, b] = duel.users;
        const out = id => duel.lives[id] <= 0;
        return (out(a) && out(b)) || (out(a) && duel.hits[b] > duel.hits[a]) || (out(b) && duel.hits[a] > duel.hits[b]);
    }

    function endDuel(duel) {
        if (duel.phase !== "playing") return;
        clearTimeout(duel.timer);
        const [a, b] = duel.users;
        let winner = null;
        if (duel.hits[a] !== duel.hits[b]) winner = duel.hits[a] > duel.hits[b] ? a : b;
        else if (duel.lives[a] !== duel.lives[b]) winner = duel.lives[a] > duel.lives[b] ? a : b;
        finishDuel(duel, winner);
    }

    function finishDuel(duel, winner) {
        if (duel.phase !== "playing") return;
        clearTimeout(duel.timer);
        duel.phase = "done";
        duel.winner = winner;
        for (const id of duel.users) {
            const save = structuredClone(saveOf(id));
            if (winner === null) giveOffer(save, duel.stakes[id]);
            else if (winner === id) for (const stakeOwner of duel.users) giveOffer(save, duel.stakes[stakeOwner]);
            storeSaveOf(id, save);
        }
        sendDuel(duel);
    }

    function connectDuel(socket) {
        const duel = duels.get(socket.data.sessionId);
        const me = socket.data.user.id;
        if (!duel || !duel.users.includes(me)) {
            socket.emit("duel:error", "This duel doesn't exist anymore.");
            return socket.disconnect();
        }
        sendDuel(duel);

        socket.on("duel:settings", (settings, answer) => {
            if (typeof answer !== "function" || duel.phase !== "setup") return;
            duel.settings = clampSettings(settings);
            duel.ready = {};
            sendDuel(duel);
            answer({});
        });

        socket.on("duel:stake", (stake, answer) => {
            if (typeof answer !== "function" || duel.phase !== "setup") return;
            try {
                duel.stakes[me] = checkOffer(saveOf(me), stake);
            } catch (error) {
                return answer({ error: error.message });
            }
            duel.ready = {};
            sendDuel(duel);
            answer({});
        });

        socket.on("duel:rod", (key, answer) => {
            if (typeof answer !== "function" || duel.phase !== "setup") return;
            const rod = duelRods(saveOf(me)).find(option => String(option.key) === String(key));
            if (!rod) return answer({ error: "You don't have that fishing rod." });
            duel.rods[me] = rod;
            duel.ready = {};
            sendDuel(duel);
            answer({});
        });

        socket.on("duel:unready", (data, answer) => {
            if (typeof answer !== "function" || duel.phase !== "setup") return;
            duel.ready[me] = false;
            sendDuel(duel);
            answer({});
        });

        socket.on("duel:ready", (data, answer) => {
            if (typeof answer !== "function" || duel.phase !== "setup") return;
            duel.ready[me] = true;
            if (duel.users.every(id => duel.ready[id])) {
                const saves = {};
                const stats = {};
                try {
                    for (const id of duel.users) {
                        saves[id] = structuredClone(saveOf(id));
                        if (saves[id].island !== duel.island) throw new Error("You're not in the same area anymore.");
                        duel.stakes[id] = checkOffer(saves[id], duel.stakes[id]);
                        const rod = duelRods(saves[id]).find(option => option.key === duel.rods[id].key);
                        if (!rod || rod.name !== duel.rods[id].name) {
                            duel.rods[id] = duelRods(saves[id])[0];
                            throw new Error("Your fishing rods changed. Pick your rod again.");
                        }
                        stats[id] = duelStats(saves[id], rod.key);
                        takeOffer(saves[id], duel.stakes[id]);
                    }
                } catch (error) {
                    duel.ready = {};
                    sendDuel(duel);
                    return answer({ error: error.message });
                }
                for (const id of duel.users) {
                    storeSaveOf(id, saves[id]);
                    duel.lives[id] = duel.settings.lives;
                    duel.hits[id] = 0;
                    duel.stats[id] = stats[id];
                }
                duel.phase = "playing";
                sendDuel(duel);
                setTimeout(() => startDuel(duel), 1500);
            } else {
                sendDuel(duel);
            }
            answer({});
        });

        socket.on("duel:reel", ({ roundNo, elapsed } = {}) => {
            if (duel.phase !== "playing" || !duel.endsAt || duel.lives[me] <= 0 || roundNo !== duel.roundNo[me]) return;
            if (Date.now() > duel.endsAt + 500) return;
            const time = Number(elapsed);
            const possible = time >= 0 && time <= Date.now() - duel.sentAt[me] + 500;
            const hit = possible && isHit(roundFor(duel, roundNo), duel.stats[me], time);
            if (hit) duel.hits[me]++;
            else duel.lives[me]--;
            if (isDecided(duel)) return endDuel(duel);
            sendDuel(duel);
            if (duel.lives[me] > 0) sendBar(duel, me, hit);
        });

        const leave = () => {
            if (duel.phase === "setup") {
                duel.phase = "cancelled";
                sendDuel(duel);
            } else if (duel.phase === "playing") {
                finishDuel(duel, duel.users.find(id => id !== me));
            }
        };
        socket.on("duel:cancel", leave);
        socket.on("disconnect", leave);
    }

    return {
        connect(socket) {
            socket.data.sessionId = String(socket.handshake.auth.sessionId || "");
            if (socket.data.kind === "chat") connectChat(socket);
            else if (socket.data.kind === "trade") connectTrade(socket);
            else if (socket.data.kind === "duel") connectDuel(socket);
            else socket.disconnect();
        },
        islandChanged(userId, island) {
            for (const socket of chatSocketsOf(userId)) {
                if (socket.data.island !== island) enterArea(socket, island);
            }
        },
        playerLeft(userId) {
            for (const socket of io.sockets.sockets.values()) {
                if (socket.data.kind === "game" || socket.data.user.id !== userId) continue;
                socket.emit("game:closed", "The game closed, so this window stopped. Open it again from the game.");
                socket.disconnect(true);
            }
        },
    };
}
