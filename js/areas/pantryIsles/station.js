// The highway train stations. The trains are free: from the Capital to the islands in the morning (arrive in the
// afternoon), from the islands to the Capital in the evening (arrive at night). Trackers show a line on your map.
import { trains } from "../../shared/data/areas/pantryIsles.js";
import { islandNames } from "../../shared/data/islands.js";
import { lines } from "../../shared/data/dialogue.js";
import { trainLineOf } from "../../shared/rules/pantryIsles.js";
import { getState, act } from "../../core/state.js";
import { getTime } from "../../core/time.js";
import { say, pick } from "../../core/dialogue.js";
import { openPanel, redrawPanel } from "../../core/panel.js";
import { closePopup } from "../../core/ui.js";
import { travel } from "../../screens/travel.js";
import { addButton, coinsText } from "../../core/helpers.js";
import { addCategory, addNote } from "./shopRows.js";

const conductor = "conductor";

function showStation(box, here, greeting) {
    const save = getState();
    addNote(box, "Conductor Rails: \"" + greeting + "\"");

    addCategory(box, "Trains (free)");
    if (here === "capital") {
        addNote(box, lines.conductor.fromCapital);
        for (const line of trains.lines) {
            const button = addButton(box, "Ride the " + line.name + " to " + islandNames[line.island], () => ride(line.island));
            if (getTime() !== trains.fromCapital) button.title = "Only in the " + trains.fromCapital;
        }
        if (getTime() !== trains.fromCapital) addNote(box, "No train leaves right now. Come back in the " + trains.fromCapital + ".");
    } else {
        addNote(box, lines.conductor.fromIsland);
        addButton(box, "Ride the " + trainLineOf(here).name + " to the Capital", () => ride("capital"));
        if (getTime() !== trains.fromIsland) addNote(box, "No train leaves right now. Come back in the " + trains.fromIsland + ".");
    }

    addCategory(box, "Trackers (" + coinsText(trains.trackerPrice) + ")");
    addNote(box, "A tracker shows the line and where its train is on your map.");
    const hereLines = here === "capital" ? trains.lines : [trainLineOf(here)];
    for (const line of hereLines) {
        if (save.pantry && save.pantry.trackers.includes(line.id)) addNote(box, line.name + ": you have this tracker.");
        else addButton(box, "Buy the tracker of the " + line.name, () => buyTracker(line));
    }
}

async function ride(to) {
    const here = getState().island;
    const leaves = here === "capital" ? trains.fromCapital : trains.fromIsland;
    if (getTime() !== leaves) return say("This train leaves in the " + leaves + ". It's " + getTime() + " now.", conductor);
    closePopup("panelDisplay");
    const result = await travel("The highway train rides to " + islandNames[to], () => act("train.ride", { to }),
        { kind: "train", from: islandNames[here], to: islandNames[to] });
    if (result.error) return say(result.error);
}

async function buyTracker(line) {
    const result = await act("train.buyTracker", { line: line.id });
    if (result.error) return say(result.error);
    await say(pick(lines.conductor.trackerBought), conductor);
    redrawPanel();
}

export function trainStation(here, button) {
    return {
        button,
        open() {
            const greeting = pick(lines.conductor.greeting);
            openPanel({ title: "Highway train station", note: "Trains leave the Capital in the morning, and the islands in the evening.",
                render: box => showStation(box, here, greeting) });
        },
    };
}
