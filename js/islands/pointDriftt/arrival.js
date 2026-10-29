import { contract, boatman } from "../../data/pointDriftt.js";
import { lines } from "../../data/dialogue.js";
import { getState, onState, act } from "../../state.js";
import { say, whenFree } from "../../dialogue.js";
import { whenIntroSeen } from "../../intro.js";
import { handlePendingGear } from "../../gear.js";
import { coinsText } from "../../helpers.js";

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
