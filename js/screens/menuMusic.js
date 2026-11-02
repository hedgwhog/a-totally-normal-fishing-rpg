// The music of the title, log in and save screens (ost/menu-ost.wav). The game's own music is in core/audio.js.
// Browsers only allow music after your first click or key press, so it starts then.
const track = "ost/menu-ost.wav";
const player = new Audio();
player.loop = true;
player.preload = "auto";
let playing = false;

function volume() {
    const saved = Number(localStorage.getItem("ostVolume") ?? "0.5");
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.5;
}

function unlock() {
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
    if (playing) player.play().catch(() => {});
}

export function playMenuMusic() {
    playing = true;
    player.src = track;
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
