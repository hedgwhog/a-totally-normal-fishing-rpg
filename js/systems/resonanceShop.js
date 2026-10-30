import { roman } from "../shared/data/resonances.js";
import { getEquipped, getBackpack, resonanceText, getResonances } from "../player/gear.js";
import { getResonance } from "../player/resonance.js";
import { getCoins } from "../player/wallet.js";
import { act } from "../core/state.js";
import { say, askYesNo } from "../core/dialogue.js";
import { addText, addButton, formatNumber, coinsText } from "../core/helpers.js";

export function resonanceShop(options) {
    const box = options.box;
    let chosenRod = null;

    function rodOf(choice) {
        if (choice === "equipped") return getEquipped("Rod");
        return getBackpack()[choice];
    }

    function show() {
        box.innerHTML = "";
        if (options.top) options.top(box);
        addText(box, "You have " + formatNumber(getResonance()) + " resonance and " + coinsText(getCoins()) + ".");

        if (chosenRod === null || !rodOf(chosenRod)) {
            chosenRod = null;
            addText(box, "Choose the rod you want to resonate:");
            addButton(box, getEquipped("Rod").name + " (equipped) | " + resonanceText(getEquipped("Rod")), () => chooseRod("equipped"));
            getBackpack().forEach((gear, index) => {
                if (gear.slot === "Rod") addButton(box, gear.name + " (backpack) | " + resonanceText(gear), () => chooseRod(index));
            });
            return;
        }

        const rod = rodOf(chosenRod);
        addText(box, "Rod: " + rod.name + " | " + resonanceText(rod));
        addText(box, "Choose a rank:");
        options.levels().forEach(level => {
            addButton(box, "Rank " + roman[level.level] + " | " + level.cost + " resonance", () => resonateRod(level));
        });
        addButton(box, "Dissonance | " + coinsText(options.dissonanceCost), dissonance);
        addButton(box, "Back", () => chooseRod(null));
    }

    function chooseRod(choice) {
        chosenRod = choice;
        show();
    }

    async function resonateRod(level) {
        const rod = rodOf(chosenRod);
        if (getResonances(rod).length > 0) return say("This rod already has " + resonanceText(rod) + ".\nUse dissonance on it first.");
        if (getResonance() < level.cost) return say("You need " + level.cost + " resonance for rank " + roman[level.level] + ".");
        const result = await act(options.resonateAction, { rod: chosenRod, rank: level.level });
        if (result.error) return say(result.error);
        show();
        await say("Your rod starts to glow...\n\nIt got " + resonanceText(rodOf(chosenRod)) + "!");
        if (options.afterResonate) await options.afterResonate(result);
        show();
    }

    async function dissonance() {
        const rod = rodOf(chosenRod);
        if (getResonances(rod).length === 0) return say("This rod has no resonances to remove.");
        if (getCoins() < options.dissonanceCost) return say("You need " + coinsText(options.dissonanceCost) + " for dissonance.");
        if (!await askYesNo("Remove " + resonanceText(rod) + " for " + coinsText(options.dissonanceCost) + "?")) return;
        const result = await act(options.dissonanceAction, { rod: chosenRod });
        if (result.error) return say(result.error);
        show();
    }

    return {
        open() {
            chosenRod = null;
            if (options.onOpen) options.onOpen();
            show();
        },
    };
}
