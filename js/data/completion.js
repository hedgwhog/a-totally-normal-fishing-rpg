import { fishByIsland } from "./fish.js";
import { mapTiles } from "./world.js";
import { researcherRounds, mayor } from "./quests.js";
import { backpackUpgrades } from "./merchant.js";
import { contract, lockers, station } from "./pointDriftt.js";

const share = (have, total) => (total > 0 ? Math.min(1, have / total) : 1);
const done = yes => (yes ? 1 : 0);

const fishFound = (save, island) => share((fishByIsland[island] || []).filter(type => save.fishLog[type.id]).length, (fishByIsland[island] || []).length);
const tilesFound = (save, island) => {
    const tiles = mapTiles.filter(tile => tile.island === island);
    return share(tiles.filter(tile => save.map.includes(tile.id)).length, tiles.length);
};

export const areaTasks = {
    freshwaterHaven: [
        { name: "Catch every fish in Freshwater Haven", progress: save => fishFound(save, "freshwaterHaven") },
        { name: "Find every map piece of Freshwater Haven", progress: save => tilesFound(save, "freshwaterHaven") },
        { name: "Help the ichthyologist with all her requests", progress: save => share(save.researcher.round - 1, researcherRounds.length) },
        { name: "Help the tavern 5 times", progress: save => share(save.tavernHelped || 0, mayor.tavernHelps) },
        { name: "Donate to the town", progress: save => done(save.mayor && save.mayor.donated) },
        { name: "Claim the carrier pigeon", progress: save => done(save.bird) },
        { name: "Beat the annual ritual", progress: save => done(save.ritual.beaten) },
        { name: "Hear your fortune", progress: save => done(save.fortune.done) },
        { name: "Get the biggest backpack", progress: save => share(save.backpackSize - 2, Math.max(...backpackUpgrades.map(upgrade => upgrade.slots)) - 2) },
    ],
    pointDriftt: [
        { name: "Arrive at Point Driftt", progress: save => done((save.visited || []).includes("pointDriftt")) },
        { name: "Catch every fish of Point Driftt", progress: save => fishFound(save, "pointDriftt") },
        { name: "Find every map piece of Point Driftt", progress: save => tilesFound(save, "pointDriftt") },
        { name: "Finish the contract", progress: save => share(save.driftt ? save.driftt.delivered : 0, contract.hadalFishWanted) },
        { name: "Buy every storage locker", progress: save => share((save.lockers || []).length, lockers.prices.length) },
        { name: "Upgrade the resonance station", progress: save => share(save.driftt ? save.driftt.rankResonations : 0, station.rodsWanted) },
    ],
    hadalDeep: [
        { name: "Catch every hadal fish", progress: save => fishFound(save, "hadalDeep") },
        { name: "Find the map of the Hadal Deep", progress: save => tilesFound(save, "hadalDeep") },
    ],
};
