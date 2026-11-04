import { isKey, isListening, defaultKeys, keyHint } from "./keybinds.js";
import { equipSlot } from "../player/gear.js";
import { openPopup, closePopup } from "./ui.js";

const backpack = document.getElementById("inventoryBackpack");

function busy() {
    return document.getElementById("nextFish").disabled;
}

window.addEventListener("keydown", event => {
    if (event.repeat || isListening() || busy()) return;
    if (event.target.closest("input, textarea, select")) return;

    // Sleep and Rest: the same as clicking their button (only when the button is there and can be used)
    for (const [action, id] of [["sleep", "nextDay"], ["rest", "rest"]]) {
        if (!isKey(event, action)) continue;
        const button = document.getElementById(id);
        if (button && !button.disabled && button.offsetParent !== null) {
            event.preventDefault();
            button.click();
        }
        return;
    }

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

// shows the key on the Sleep and Rest buttons ("Sleep [Q]"), also after changing it in the settings
function showKeyHints() {
    document.getElementById("nextDay").textContent = "Sleep" + keyHint("sleep");
    document.getElementById("rest").textContent = "Rest" + keyHint("rest");
}
showKeyHints();
window.addEventListener("keybindsChanged", showKeyHints);
