// When you're back in Freshwater Haven after Point Driftt, Mayor Navi asks you to bring his niece Nikki
// to the Pantry Isles. He waits at the Blue Line Cooperation office (transportOffice.js), and pays the trip.
import { lines } from "../../shared/data/dialogue.js";
import { findLine } from "../../shared/data/transport.js";
import { nextDeparture } from "../../shared/rules/transport.js";
import { getState, onState, act } from "../../core/state.js";
import { say, whenFree } from "../../core/dialogue.js";
import { whenIntroSeen } from "../../screens/intro.js";

let running = false;

// the mayor's story about Nikki. Plays by itself when you're in Freshwater Haven, but also when you talk to
// the mayor or visit the ferry office, in case it didn't (so every save can get to the Pantry Isles)
let telling = null;
export function tellAboutNikki() {
    const save = getState();
    if (!save.pantry || save.pantry.told) return Promise.resolve();
    telling ??= (async () => {
        await say(lines.niece.ask, "", { day: nextDeparture(findLine("tuna"), save, "freshwaterHaven") });
        await act("pantry.told");
    })().finally(() => telling = null);
    return telling;
}

async function askToBringNikki() {
    const save = getState();
    if (running || !save.pantry || save.pantry.told || save.island !== "freshwaterHaven") return;
    running = true;
    try {
        await whenIntroSeen();
        await whenFree();
        const now = getState();
        if (!now.pantry || now.pantry.told || now.island !== "freshwaterHaven") return;
        await tellAboutNikki();
    } finally {
        running = false;
    }
}

onState(askToBringNikki);
askToBringNikki();