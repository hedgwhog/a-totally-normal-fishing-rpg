import { allGear, starterGear } from "../data/gear.js";
import { resonances } from "../data/resonances.js";

export const slots = ["Hat", "Cloak", "Rod"];

export function resolveGear(saved) {
    if (!saved) return null;
    const base = allGear.find(gear => gear.id === saved.id);
    return base ? { ...base, resonances: saved.resonances || [] } : null;
}

export function equippedGear(save, slot) {
    return resolveGear(save.equipped[slot]) || { ...starterGear[slot], resonances: [] };
}

export function getResonances(gear) {
    return (gear.resonances || []).filter(rodResonance => resonances[rodResonance.id]);
}

export function getStat(save, name, base, waters = []) {
    let total = 0;
    let found = false;
    const add = amount => {
        if (!amount) return;
        total += amount;
        found = true;
    };
    for (const slot of slots) {
        const gear = equippedGear(save, slot);
        add(gear.stats && gear.stats[name]);
        for (const water of waters) add(gear.waterStats && gear.waterStats[water] && gear.waterStats[water][name]);
        for (const rodResonance of getResonances(gear)) {
            if (resonances[rodResonance.id].stat === name) add(resonances[rodResonance.id].perLevel * rodResonance.level);
        }
    }
    return found ? total : base;
}

export const boostMultiplier = (save, boost) => (save.boosts[boost] > 0 ? 2 : 1);

export function hasGear(save, id) {
    return slots.some(slot => save.equipped[slot] && save.equipped[slot].id === id) || save.backpack.some(gear => gear.id === id);
}

export function round1(number) {
    return Math.round(number * 10) / 10;
}
