import { isKey, isListening, defaultKeys } from "./keybinds.js";
import { equipSlot } from "../player/gear.js";
import { openPopup, closePopup } from "./ui.js";

const backpack = document.getElementById("inventoryBackpack");

function busy() {
    return document.getElementById("nextFish").disabled;
}

window.addEventListener("keydown", event => {
    if (event.repeat || isListening() || busy()) return;
    if (event.target.closest("input, textarea, select")) return;

    if (isKey(event, "backpack")) {
        event.preventDefault();
        if (getComputedStyle(backpack).display === "none") openPopup(backpack);
        else closePopup(backpack);
        return;
    }

    for (const action of Object.keys(defaultKeys)) {
        if (action.startsWith("slot") && isKey(event, action)) {
            event.preventDefault();
            equipSlot(parseInt(action.slice(4)) - 1);
            return;
        }
    }
});
