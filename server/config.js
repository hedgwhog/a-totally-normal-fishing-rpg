import { fileURLToPath } from "node:url";
export const config = {
    port: process.env.PORT || 3000,     // the port for local testing
    dataDir: process.env.DATA_DIR || fileURLToPath(new URL("../data/", import.meta.url)),     // where accounts, saves and chat messages are stored. Keep this outside public_html
    saveSlots: 3,     // every account has this many saves

    // chat
    chatCooldownMs: 5000, // 1 message per 5 seconds
    chatMaxLength: 200, // characters per message
    chatKeepMs: 18 * 60 * 60 * 1000, // messages are deleted after 18 hours
    activeForMs: 15 * 60 * 1000, // you can be challenged/traded for 15 minutes after your last message
    inviteCooldownMs: 3000, // 1 invite per 3 seconds
    maxFriends: 100, // friends per account
    maxBlocked: 200, // blocked players per account
    
    // voice: players make their own rooms (open, or closed with a password)
    voiceRoomsPerArea: 12, // max rooms in one area at the same time
    voiceRoomMaxSize: 6, // the most players a room can have
    voiceNameLength: 24, // characters in a room name
    voicePasswordLength: 30, // characters in a room password
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    sessionDays: 30, // how long you stay logged in

    // stun/turn servers for voice. stun is free. Add a turn server here:
    // { urls: "turn:your-turn-server:3478", username: "...", credential: "..." }
    // Safety: true = voice only goes through your turn server (add one to iceServers above first!).
    // Then players never see each other's IP address, only the TURN server's.
    // If you turn this on, also change the voice part of the privacy policy in game.html.
    voiceRelayOnly: false,
};
