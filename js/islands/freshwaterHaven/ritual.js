import { ritual as numbers } from "../../data/quests.js";
import { isRitualDay, isRitualOpen } from "../../rules/schedule.js";
import { onTimeChange } from "../../time.js";
import { getIsland } from "../../islands.js";
import { getState, act, localKey } from "../../state.js";
import { handlePendingGear } from "../../gear.js";
import { startFishing } from "../../fishing.js";
import { say, ask } from "../../dialogue.js";
import { lines } from "../../data/dialogue.js";

const keeper = "keeper";

onTimeChange((time, day) => {
    const key = localKey("ritualAnnounced");
    if (time !== "morning" || !isRitualDay(getState(), day) || localStorage.getItem(key) === String(day) || getIsland() !== "freshwaterHaven") return;
    localStorage.setItem(key, day);
    say(lines.keeper.announcement);
});

async function attemptRitual() {
    const values = { every: numbers.every };
    await say(lines.keeper.intro, keeper, values);

    const answer = await ask(lines.keeper.askAttempt, ["Cast your line", "Not yet"], keeper, values);
    if (answer !== "Cast your line") return say(lines.keeper.notReady, keeper, values);

    const start = await act("ritual.start");
    if (start.error) return say(start.error);
    const caught = await startFishing(numbers.charm);
    const result = await act("ritual.finish", { caught });
    if (result.error) return say(result.error);

    if (result.caught) {
        await say(lines.keeper.win, keeper, values);
        await handlePendingGear();
    } else {
        await say(lines.keeper.lose, keeper, values);
    }
}

export const annualRitual = {
    button: "ritual",
    isOpen: (time, day, save) => isRitualOpen(save, time, day),
    open: attemptRitual,
};
