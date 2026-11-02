import { backpackUpgrades } from "../shared/data/merchant.js";
import { loadObject, save } from "./save.js";

// one keybind per backpack slot
const maxSlots = Math.max(2, ...backpackUpgrades.map(upgrade => upgrade.slots));

export const defaultKeys = {
    continue: "Enter",
    back: "Backspace",
    reel: "Space",
    backpack: "Tab",
};
export const keyNames = {
    continue: "Continue dialogue",
    back: "Previous line",
    reel: "Reel (fishing)",
    backpack: "Open backpack",
};
for (let index = 1; index <= maxSlots; index++) {
    defaultKeys["slot" + index] = "Digit" + index;
    keyNames["slot" + index] = "Equip backpack slot " + index;
}

let keys = { ...defaultKeys, ...loadObject("saveKeybinds") };

export function getKey(action) {
    return keys[action];
}

export function isKey(event, action) {
    if (!keys[action]) return false;
    if (event.code === keys[action]) return true;
    return action === "continue" && keys[action] === "Enter" && event.code === "NumpadEnter";
}

export function setKey(action, code) {
    for (const other of Object.keys(keys)) {
        if (keys[other] === code) keys[other] = null;
    }
    keys[action] = code;
    save("saveKeybinds", keys);
}

export function resetKeys() {
    keys = { ...defaultKeys };
    save("saveKeybinds", keys);
}

// a readable name for a key codes
export function keyLabel(code) {
    if (!code) return "none";
    return code.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Arrow/, "").replace(/^Numpad/, "Num ");
}

// put it in brackets, if that action has a key
export function keyHint(action) {
    return keys[action] ? " [" + keyLabel(keys[action]) + "]" : "";
}

let listening = false;
export function isListening() {
    return listening;
}
export function setListening(value) {
    listening = value;
}
