import { backpackUpgrades } from "./data/merchant.js";
import { loadObject, save } from "./save.js";

// one keybind per backpack slot, for the biggest backpack you can get
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
for (let n = 1; n <= maxSlots; n++) {
    defaultKeys["slot" + n] = "Digit" + n;
    keyNames["slot" + n] = "Equip backpack slot " + n;
}

let keys = { ...defaultKeys, ...loadObject("saveKeybinds") };

export function getKey(action) {
    return keys[action];
}

export function isKey(event, action) {
    if (!keys[action]) return false;
    if (event.code === keys[action]) return true;
    return action === "continue" && keys[action] === "Enter" && event.code === "NumpadEnter"; // both Enter keys work
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

export function keyLabel(code) {
    if (!code) return "none";
    return code.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Arrow/, "").replace(/^Numpad/, "Num ");
}

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
