import { ghost } from "../data/ghost.js";
import { findGear } from "../data/gear.js";
import { buyPrice, ownsGear } from "./shops.js";

export { ghost };

const round1 = number => Math.round(number * 10) / 10;

// what a piece of lost gear costs: days, and value (coins and/or resonance)
export function ghostPrice(gear) {
    const worth = buyPrice(gear);
    return {
        days: Math.max(1, Math.ceil(worth / ghost.coinsPerDay)),
        value: round1(worth * ghost.valuePercent / 100),
    };
}

// the lost gear the ghost has for you
export function ghostStock(save) {
    return (save.lostGear || []).filter(id => findGear(id) && !ownsGear(save, id));
}

export const isGhostDay = day => day % ghost.every === 0;
