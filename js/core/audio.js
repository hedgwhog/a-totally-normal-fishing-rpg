import { getOstVolume, onVolumeChange } from "./settings.js";
import { musicFile, useBackupOnError } from "./musicFiles.js";

// the track for every time of day: a name in ost/, without the extension (see musicFiles.js)
const tracks = {
    morning: "night-ost",
    afternoon: "night-ost",
    evening: "night-ost",
    night: "night-ost",
};

const player = new Audio();
player.loop = true;
player.preload = "auto";
player.volume = getOstVolume();

let currentTrack = null;
let waitingForClick = false;

onVolumeChange(volume => {
    player.volume = volume;
});

useBackupOnError(player, () => tryPlay());
player.addEventListener("error", () => {
    if (!(player.getAttribute("src") || "").endsWith(".ogg")) console.warn("Could not load the music file:", player.getAttribute("src"));
});

function tryPlay() {
    if (!currentTrack) return;
    player.play().catch(() => {
        if (waitingForClick) return;
        waitingForClick = true;
        const unlock = () => {
            waitingForClick = false;
            document.removeEventListener("pointerdown", unlock);
            document.removeEventListener("keydown", unlock);
            tryPlay();
        };
        document.addEventListener("pointerdown", unlock);
        document.addEventListener("keydown", unlock);
    });
}

export function playMusicFor(time) {
    const track = tracks[time] || null;

    if (!track) {
        currentTrack = null;
        player.pause();
        return;
    }

    if (track !== currentTrack) {
        currentTrack = track;
        player.src = musicFile(track);
    }
    if (player.paused) tryPlay();
}

export function refreshMusic() {
    if (!currentTrack) return;
    player.pause();
    player.src = musicFile(currentTrack);
    player.load();
    tryPlay();
}

document.getElementById("audioRefreshBtn").addEventListener("click", refreshMusic);
