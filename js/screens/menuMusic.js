// The music of the title, log in and save screens (ost/menu-ost.ogg, or .mp3). The game's own music is in core/audio.js.
// It has its own volume (the slider in the top right of the start screen), separate from the setting in the game.
// Browsers only allow music after your first click or key press, so it starts then.
import { musicFile, useBackupOnError } from "../core/musicFiles.js";

const track = "menu-ost"; // ost/menu-ost.ogg and ost/menu-ost.mp3
const volumeKey = "menuOstVolume";
const player = new Audio();
player.loop = true;
player.preload = "auto";
let playing = false;
useBackupOnError(player, () => {
    if (playing) player.play().catch(() => {});
});

function volume() {
    const saved = Number(localStorage.getItem(volumeKey) ?? "0.5");
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
}

const slider = document.getElementById("menuVolumeSlider");
if (slider) {
    slider.value = volume();
    slider.addEventListener("input", () => {
        localStorage.setItem(volumeKey, slider.value);
        player.volume = volume();
    });
}

function unlock() {
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
    if (playing) player.play().catch(() => {});
}

export function playMenuMusic() {
    playing = true;
    player.src = musicFile(track);
    player.volume = volume();
    player.play().catch(() => {
        document.addEventListener("pointerdown", unlock);
        document.addEventListener("keydown", unlock);
    });
}

export function stopMenuMusic() {
    playing = false;
    player.pause();
}
