import { charmCloak } from "../../data/gear.js";
import { mapPieces } from "../../data/mapPieces.js";
import { getDay, nextTime, onTimeChange } from "../../time.js";
import { getIsland } from "../../islands.js";
import { giveGear } from "../../gear.js";
import { addItems } from "../../itemBag.js";
import { addMapPiece } from "../../map.js";
import { startFishing } from "../../fishing.js";
import { say, ask } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";
import { loadObject, save } from "../../save.js";

const keeper = "keeper"; 
const ritualEvery = 19;

const theCharm = { name: "The charm", zone: 2, speed: 28, rounds: 12, hits: 12, barWidth: [17, 13, 15], fishSpeed: 115 };
const mapPiece = mapPieces.find(piece => piece.source === "ritual" && piece.island === "freshwaterHaven");

// if the ritual got beaten, no more ritual and announcement.
let ritual = { beaten: false, attemptedDay: null, announcedDay: null, ...loadObject("saveRitual") };

function saveRitual() {
    save("saveRitual", ritual);
}

export function ritualAttended() {
    return ritual.attemptedDay !== null || ritual.beaten;
}

export function isRitualDay(day) {
    return !ritual.beaten && day % ritualEvery === 0;
}

onTimeChange((time, day) => {
    if (time !== "morning" || !isRitualDay(day) || ritual.announcedDay === day || getIsland() !== "freshwaterHaven") return;
    ritual.announcedDay = day;
    saveRitual();
    say(lines.keeper.announcement);
});

async function attemptRitual() {
    const values = { every: ritualEvery };
    await say(lines.keeper.intro, keeper, values);

    const answer = await ask(lines.keeper.askAttempt, ["Cast your line", "Not yet"], keeper, values);
    if (answer !== "Cast your line") {
        await say(lines.keeper.notReady, keeper, values);
        return;
    }

    ritual.attemptedDay = getDay();
    saveRitual();

    const caught = await startFishing(theCharm);

    if (caught) {
        ritual.beaten = true;
        saveRitual();
        addItems("theCharm");
        addMapPiece(mapPiece.id);
        await say(lines.keeper.win, keeper, values);
        await giveGear(charmCloak); // if your backpack is full, you choose what to drop
    } else {
        await say(lines.keeper.lose, keeper, values);
    }
    nextTime();
}

export const annualRitual = {
    button: "ritual",
    isOpen: (time, day) => isRitualDay(day) && time !== "night" && ritual.attemptedDay !== day,
    open: attemptRitual,
};
