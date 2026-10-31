import { allGear, marketplaceGear, storeGear, findGear } from "../data/gear.js";
import { lostGearPercent } from "../data/merchant.js";

const ownShop = {};
marketplaceGear.forEach(gear => ownShop[gear.id] = "freshwaterHaven");
storeGear.forEach(gear => ownShop[gear.id] = "pointDriftt");

export function shopOf(save, id) {
    const sold = save.soldGear || {};
    return sold[id] || ownShop[id] || null;
}

export function shopStock(save, shop) {
    return allGear.filter(gear => shopOf(save, gear.id) === shop);
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

export function lostGearPrice(gear) {
    return Math.round(gear.sellValue * lostGearPercent / 100 * 10) / 10;
}

export { findGear };