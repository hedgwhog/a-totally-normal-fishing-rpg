import { contract, boatman } from "../../shared/data/areas/pointDriftt.js";
import { lines } from "../../shared/data/dialogue.js";
import { getState, onState, act } from "../../core/state.js";
import { say, whenFree } from "../../core/dialogue.js";
import { whenIntroSeen } from "../../screens/intro.js";
import { handlePendingGear } from "../../player/gear.js";
import { coinsText } from "../../core/helpers.js";

let running = false;

async function playArrival() {
    const save = getState();
    if (running || !save.driftt || save.driftt.introduced || save.island !== "pointDriftt") return;
    running = true;
    await whenIntroSeen();
    await whenFree();
    await say(lines.drifttArrival, "", { fish: contract.hadalFishWanted, price: coinsText(boatman.tripPrice) });
    await act("driftt.introduced");
    await handlePendingGear();
    running = false;
}

onState(playArrival);
playArrival();
