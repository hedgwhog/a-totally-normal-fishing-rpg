// Arriving in the Capital with Nikki: she tells you about the islands, and gives you her map of the Capital.
import { lines } from "../../shared/data/dialogue.js";
import { getState, onState, act } from "../../core/state.js";
import { say, whenFree } from "../../core/dialogue.js";
import { whenIntroSeen } from "../../screens/intro.js";

let running = false;

const noScene = () => new Promise(resolve => {
    const check = () => (document.querySelector(".scene") ? setTimeout(check, 250) : resolve());
    check();
});

async function meetNikki() {
    const save = getState();
    if (running || !save.pantry || !save.pantry.boarded || save.pantry.nikki || save.island !== "capital") return;
    running = true;
    try {
        await whenIntroSeen();
        await noScene();
        await whenFree(300);
        await say(lines.nikkiArrival);
        const result = await act("pantry.nikki");
        if (!result.error) await say("You got the map of the Capital!");
    } finally {
        running = false;
    }
}

onState(meetNikki);
meetNikki();
