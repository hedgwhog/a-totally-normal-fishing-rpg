import { allGear, marketplaceGear, storeGear, findGear } from "../data/gear.js";

const ownShop = {};
marketplaceGear.forEach(gear => ownShop[gear.id] = "freshwaterHaven");
storeGear.forEach(gear => ownShop[gear.id] = "pointDriftt");

export function shopOf(save, id) {
    const sold = save.soldGear || {};
    return sold[id] || ownShop[id] || null;
}

// gear you have: worn, in your backpack, in a locker, or waiting to be picked up
export function ownsGear(save, id) {
    const worn = Object.values(save.equipped || {}).some(gear => gear && gear.id === id);
    const stored = [...(save.backpack || []), ...(save.lockers || [])].some(gear => gear && gear.id === id);
    return worn || stored || save.pendingGear === id;
}

// Every piece of gear is sold once: gear you own isn't in any shop. Sell it, and it shows up again.
export function shopStock(save, shop) {
    return allGear.filter(gear => shopOf(save, gear.id) === shop && !ownsGear(save, gear.id));
}

export function buyPrice(gear) {
    return gear.price || gear.sellValue || 0;
}

export function isResold(save, id, shop) {
    return (save.soldGear || {})[id] === shop && ownShop[id] !== shop;
}

export function hasOwnShop(id) {
    return Boolean(ownShop[id]);
}

export { findGear };