import { allFish } from "./data/fish.js";
import { getFishAmount } from "./fishBag.js";
import { loadObject, save } from "./save.js";

let log = loadObject("saveFishLog");

for (const type of allFish) {
    if (!log[type.id] && getFishAmount(type.id) > 0) log[type.id] = getFishAmount(type.id);
}
save("saveFishLog", log);

export function timesCaught(id) {
    return log[id] || 0;
}

export function isDiscovered(id) {
    return timesCaught(id) > 0;
}

export function logCatch(id) {
    const isNew = !isDiscovered(id);
    log[id] = timesCaught(id) + 1;
    save("saveFishLog", log);
    document.dispatchEvent(new Event("fishLogChanged"));
    return isNew;
}
