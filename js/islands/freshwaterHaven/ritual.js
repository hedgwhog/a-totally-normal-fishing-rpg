import { charmCloak } from "../../data/gear.js";
import { mapPieces } from "../../data/mapPieces.js";
import { getDay, nextTime, onTimeChange } from "../../time.js";
import { getIsland } from "../../islands.js";
import { giveGear } from "../../gear.js";
import { addItems } from "../../itemBag.js";
import { addMapPiece } from "../../map.js";
import { startFishing } from "../../fishing.js";
import { say, ask } from "../../dialogue.js";
import { loadObject, save } from "../../save.js";

const keeper = "Ritual keeper"; // the name above their dialogue
const ritualEvery = 21;

const theCharm = { name: "The charm", zone: 2, speed: 28, rounds: 12, hits: 12, barWidth: [16, 12, 14], fishSpeed: 120 };
const mapPiece = mapPieces.find(piece => piece.source === "ritual" && piece.island === "freshwaterHaven");

// if the ritual got beaten, no more ritual and announcement.
let ritual = { beaten: false, attemptedDay: null, announcedDay: null, ...loadObject("saveRitual") };

function saveRitual() {
    save("saveRitual", ritual);
}

export function isRitualDay(day) {
    return !ritual.beaten && day % ritualEvery === 0;
}

onTimeChange((time, day) => {
    if (time !== "morning" || !isRitualDay(day) || ritual.announcedDay === day || getIsland() !== "freshwaterHaven") return;
    ritual.announcedDay = day;
    saveRitual();
    say([
        "Bells ring all over Freshwater Haven. Today is the annual ritual!",
        "Everyone is heading to the dock, so everything else on the island is closed today.",
    ]);
});

async function attemptRitual() {
    await say([
        { who: "", text: "The whole island has gathered at the dock." },
        { who: keeper, text: "Every 29 days we cast for The charm. Nobody has ever pulled it up. Not once." },
        { who: keeper, text: "Every fisher gets ONE attempt. No second tries, no excuses." },
    ]);

    const answer = await ask("Will you take your one attempt?", ["Cast your line", "Not yet"], keeper);
    if (answer !== "Cast your line") {
        await say("The ritual lasts all day. Come back when you're ready.", keeper);
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
        await say([
            { who: "", text: "The charm, you managed to actually get it." },
            { who: keeper, text: "After all these years someone finally did it!" },
            { who: "", text: "You got the charm, a Charm cloak and a piece of a map!" },
        ]);
        await giveGear(charmCloak); // if your backpack is full, you choose what to drop
    } else {
        await say([
            { who: "", text: "Your line comes back up. Empty." },
            { who: keeper, text: "Nobody catches it. That's why it's a ritual. See you in 29 days." },
        ]);
    }
    nextTime();
}

export const annualRitual = {
    button: "ritual",
    isOpen: (time, day) => isRitualDay(day) && time !== "night" && ritual.attemptedDay !== day,
    open: attemptRitual,
};
