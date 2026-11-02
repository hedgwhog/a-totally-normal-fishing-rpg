// The music files are in ost/, in two formats: Opus (.ogg, small) and MP3 (.mp3, the backup).
// Browsers that can play Opus get the .ogg, the others the .mp3. If an .ogg fails to load anyway
// (some Safari versions say they can play it, but can't), the player switches to the .mp3 by itself,
// and from then on every track is played as .mp3.
// A track is named without its extension: "night-ost" means ost/night-ost.ogg and ost/night-ost.mp3.
const probe = document.createElement("audio");
let opus = probe.canPlayType('audio/ogg; codecs="opus"') !== "";

export function musicFile(name) {
    return "ost/" + name + (opus ? ".ogg" : ".mp3");
}

// call once for every player: when an .ogg can't be played, it plays the .mp3 of the same track
export function useBackupOnError(player, onSwitched) {
    player.addEventListener("error", () => {
        const src = player.getAttribute("src") || "";
        if (!src.endsWith(".ogg")) return;
        opus = false;
        player.src = src.replace(/\.ogg$/, ".mp3");
        player.load();
        onSwitched();
    });
}
