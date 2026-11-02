// Every island has a local who wants its hardest fish. Bring one, and you get a map piece of the island.
import { islandQuests } from "../../shared/data/areas/pantryIsles.js";
import { allFish } from "../../shared/data/fish.js";
import { lines } from "../../shared/data/dialogue.js";
import { islandQuestDone } from "../../shared/rules/pantryIsles.js";
import { getState, act } from "../../core/state.js";
import { say, askYesNo, pick } from "../../core/dialogue.js";

async function visit(island) {
    const quest = islandQuests[island];
    const talk = lines[quest.giver];
    const fish = allFish.find(type => type.id === quest.fish);
    if (islandQuestDone(getState(), island)) return say(pick(talk.after), quest.giver);
    if (!(getState().fish[fish.id] > 0)) return say(talk.ask, "", { fish: fish.name });
    if (!await askYesNo("Give your " + fish.name + " to them?", quest.giver)) return;
    const result = await act("pantryQuest.give");
    if (result.error) return say(result.error);
    await say(talk.done, "", { fish: fish.name });
    await say("You got a map piece of the island!");
}

export function islandQuest(island, button) {
    return { button, open: () => visit(island) };
}
