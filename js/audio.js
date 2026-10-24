import { getOstVolume, onVolumeChange } from "./settings.js";

// the track for which time of day
const tracks = {
    morning: "ost/night-ost.wav",
    afternoon: "ost/night-ost.wav",
    evening: "ost/night-ost.wav",
    night: "ost/night-ost.wav",
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

player.addEventListener("error", () => {
    console.warn("Could not load the music file:", currentTrack);
});

// some browser fixes due to block
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
        player.src = track;
    }
    if (player.paused) tryPlay();
}

export function refreshMusic() {
    if (!currentTrack) return;
    player.pause();
    player.src = currentTrack;
    player.load();
    tryPlay();
}

document.getElementById("audioRefreshBtn").addEventListener("click", refreshMusic);
