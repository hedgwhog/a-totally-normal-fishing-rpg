import { fishByIsland, allFish, fishTimes, isSellable } from "../js/shared/data/fish.js";
import { items, findItem } from "../js/shared/data/items.js";
import { charmCloak, luckRod, allGear, deepRod, findGear, isStarterGear } from "../js/shared/data/gear.js";
import { resonances, roman } from "../js/shared/data/resonances.js";
import { mapTiles, findTile, towns } from "../js/shared/data/world.js";
import { birds } from "../js/shared/data/birds.js";
import { tileDistance, townOf, flightMs, discoverableTiles } from "../js/shared/rules/birds.js";
import { backpackUpgrades, merchantStock, merchantBuyPercent } from "../js/shared/data/merchant.js";
import { researcherRounds, rareFish, tavern, ritual, ramlaris, altar, marketplace, fortuneTeller, mayor } from "../js/shared/data/quests.js";
import { contract, boatman, lockers, station, store } from "../js/shared/data/areas/pointDriftt.js";
import * as schedule from "../js/shared/rules/schedule.js";
import { shopStock, buyPrice, hasOwnShop, lostGearPrice } from "../js/shared/rules/shops.js";
import { findLine, routeChartPrice } from "../js/shared/data/transport.js";
import { isRunning, destinations } from "../js/shared/rules/transport.js";
import { cleanText, isReservedName } from "../js/shared/rules/text.js";
import { equippedGear, resolveGear, getStat, getResonances, boostMultiplier, hasGear, round1, slots } from "../js/shared/rules/stats.js";

// This is what I call the file of straight doom
// Just for clarity, i got really no clue how this really works. I just know it runs the game on CPanel.
// Ill look into it though, but I think it is about actions ingame

class GameError extends Error {}
export function fail(message) {
    throw new GameError(message);
}
export { GameError };

const random = list => list[Math.floor(Math.random() * list.length)];
const fishList = fishByIsland.freshwaterHaven;
const findFish = id => allFish.find(type => type.id === id);

export function newSave() {
    return {
        day: 1, timeIndex: 0, island: "freshwaterHaven",
        coins: 0, resonance: 0,
        fish: {}, fishLog: {}, items: {}, boosts: {},
        equipped: { Hat: { id: "oldHat" }, Cloak: { id: "oldCloak" }, Rod: { id: "oldRod" } },
        backpack: [], backpackSize: 2,
        map: [],
        bird: null,
        friends: [],
        blocked: [],
        visited: ["freshwaterHaven"],
        charts: [],        // route charts you own (transport line ids)
        inbox: [],
        news: [],
        mayor: { met: false, donated: false },
        tavernHelped: 0,
        researcher: null,
        tavern: { period: null, fishId: null, delivered: false },
        ritual: { beaten: false, attemptedDay: null },
        ramlaris: { arrivalDay: null },
        merchant: { day: null, stock: {} },
        fortune: { done: false, gone: false },
        pendingGear: null,
        pending: null,
        playtime: 0,
        introSeen: false,
        driftt: null,
        lockers: [],
        soldGear: {},
        lostGear: [],
    };
}

export function refresh(save) {
    if (!save.researcher) save.researcher = researcherQuest(1);
    updateOldSave(save);
    visitTown(save);

    const period = schedule.tavernPeriod(save.day);
    if (save.tavern.period !== period) save.tavern = { period, fishId: random(fishList).id, delivered: false };

    if (schedule.isMerchantHere("morning", save.day) && save.merchant.day !== save.day) {
        const stock = {};
        for (const [id, [least, most]] of Object.entries(merchantStock)) stock[id] = least + Math.floor(Math.random() * (most - least + 1));
        save.merchant = { day: save.day, stock };
    }
    return save;
}

function updateOldSave(save) {
    save.map = [...new Set(save.map)].filter(id => findTile(id));
    if (save.bird === undefined) save.bird = null;
    save.friends ??= [];
    save.blocked ??= [];
    save.visited ??= ["freshwaterHaven"];
    save.charts ??= [];
    save.inbox ??= [];
    save.news ??= [];
    save.mayor ??= { met: false, donated: false };
    save.tavernHelped ??= 0;
    save.introSeen ??= true;
    save.driftt ??= null;
    save.lockers ??= [];
    save.soldGear ??= {};
    save.lostGear ??= [];
    if (save.visited.includes("pointDriftt") && !save.driftt) startDriftt(save);
    if (save.visited.includes("pointDriftt")) save.ramlaris.sailed = true;
    if (save.driftt && save.driftt.delivered >= contract.hadalFishWanted && save.driftt.doneDay === undefined) save.driftt.doneDay = save.day;
}

function startDriftt(save) {
    save.driftt = { introduced: false, delivered: 0, rankResonations: 0 };
    if (!hasGear(save, deepRod.id) && save.pendingGear !== deepRod.id) giveGear(save, deepRod.id);
}

function visitTown(save) {
    if (!save.visited.includes(save.island)) save.visited.push(save.island);
    for (const tile of mapTiles) {
        if (tile.visit && tile.island === save.island && !save.map.includes(tile.id)) save.map.push(tile.id);
    }
}

export function deliverBirds(save, now = Date.now()) {
    if (!save || !save.news) return false;
    let changed = false;

    const job = save.bird && save.bird.job;
    if (job && now >= job.backAt) {
        if (job.type === "discover") {
            if (!save.map.includes(job.tile)) save.map.push(job.tile);
            save.news.push({ type: "discovered", tile: job.tile, from: job.from });
        } else {
            save.news.push({ type: "delivered", toName: job.toName });
        }
        save.bird.job = null;
        changed = true;
    }

    for (const letter of save.inbox) {
        if (letter.delivered || now < letter.arrivesAt) continue;
        letter.delivered = true;
        giveGifts(save, letter.gifts);
        save.news.push({ type: "letter", letterId: letter.id, fromName: letter.fromName, gifts: letter.gifts });
        changed = true;
    }
    return changed;
}

function giveGifts(save, gifts) {
    save.coins = round1(save.coins + gifts.coins);
    save.resonance = round1(save.resonance + gifts.resonance);
    for (const [id, amount] of Object.entries(gifts.items)) addItem(save, id, amount);
}

function needBird(save) {
    if (!save.bird) fail("You don't have a carrier pigeon yet. Mayor Navi might know something about that.");
}

function needIdleBird(save) {
    needBird(save);
    if (save.bird.job) fail(save.bird.name + " is still out flying.");
}

function checkGifts(save, input) {
    const coins = round1(Number(input && input.coins) || 0);
    const resonance = round1(Number(input && input.resonance) || 0);
    if (!(coins >= 0) || coins > save.coins) fail("You don't have that many coins.");
    if (!(resonance >= 0) || resonance > save.resonance) fail("You don't have that much resonance.");
    const items = {};
    for (const [id, value] of Object.entries((input && input.items) || {})) {
        const item = findItem(id);
        if (!item || !birds.giftCategories.includes(item.category)) fail("Your pigeon can't carry that.");
        const amount = wholeNumber(value, 999);
        if (amount > (save.items[id] || 0)) fail("You don't have that many " + item.name + ".");
        if (amount > 0) items[id] = amount;
    }
    return { coins, resonance, items };
}

const newLetterId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const time = save => schedule.timeOf(save);

function nextTime(save) {
    if (time(save) === "night") return nextDay(save);
    save.timeIndex++;
}

function nextDay(save) {
    save.day++;
    save.timeIndex = 0;
    refresh(save);
}

function passDays(save, days) {
    const timeIndex = save.timeIndex;
    for (let count = 0; count < days; count++) nextDay(save);
    save.timeIndex = timeIndex;
}

function loseGear(save, saved) {
    if (!saved || isStarterGear(saved.id) || hasOwnShop(saved.id)) return;
    if (!save.lostGear.includes(saved.id)) save.lostGear.push(saved.id);
}

function pay(save, coins) {
    if (save.coins < coins) fail("You need " + coins + " coins for that.");
    save.coins = round1(save.coins - coins);
}

function addItem(save, id, amount = 1) {
    save.items[id] = (save.items[id] || 0) + amount;
}

function takeItem(save, id, amount = 1) {
    if ((save.items[id] || 0) < amount) fail("You don't have enough of that.");
    save.items[id] -= amount;
}

function wholeNumber(value, max = 9999) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0 || number > max) fail("That's not a valid amount.");
    return number;
}

function inHaven(save, allowRitualDay = false) {
    if (save.island !== "freshwaterHaven") fail("You're not on Freshwater Haven.");
    if (!allowRitualDay && schedule.isRitualDay(save, save.day)) fail("Everyone is at the ritual today.");
}

function giveGear(save, id) {
    if (save.backpack.length < save.backpackSize) save.backpack.push({ id });
    else save.pendingGear = id;
}

function researcherQuest(round) {
    const quest = researcherRounds[round - 1];
    if (!quest) return { round, wanted: [] };
    const pool = fishList.filter(type => type.waters.some(water => quest.waters.includes(water)) && !rareFish.includes(type.id));
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map(type => type.id);
    const extra = quest.extra || [];
    return { round, wanted: [...extra, ...picked] };
}

function findRod(save, rod) {
    if (rod === "equipped") return save.equipped.Rod;
    const gear = save.backpack[wholeNumber(rod, 100)];
    if (!gear || !allGear.find(item => item.id === gear.id && item.slot === "Rod")) fail("That's not a rod.");
    return gear;
}

function rollResonances(level) {
    const rolled = [];
    let extraChance = 1;
    while (Math.random() < extraChance) {
        const options = Object.keys(resonances).filter(id => (resonances[id].minRank || 1) <= level.level && !rolled.some(picked => picked.id === id));
        if (options.length === 0) break;
        let roll = Math.random() * options.reduce((sum, id) => sum + resonances[id].chance, 0);
        let id = options[options.length - 1];
        for (const option of options) {
            roll -= resonances[option].chance;
            if (roll < 0) { id = option; break; }
        }
        let resonanceLevel = 1;
        const levelUp = level.levelUpChance * (resonances[id].levelUp || 1);
        while (resonanceLevel < resonances[id].maxLevel && Math.random() < levelUp / resonanceLevel) resonanceLevel++;
        rolled.push({ id, level: resonanceLevel });
        extraChance = rolled.length === 1 ? level.extraChance : extraChance / 2;
    }
    return rolled;
}

const isBound = saved => Boolean(saved && findGear(saved.id) && findGear(saved.id).bound);

function buyGearFrom(save, shop, id) {
    const gear = shopStock(save, shop).find(item => item.id === id);
    if (!gear) fail("That's not for sale.");
    if (hasGear(save, gear.id)) fail("You already own the " + gear.name + ".");
    if (save.backpack.length >= save.backpackSize) fail("Your backpack is full, you can't buy the " + gear.name + ".");
    pay(save, buyPrice(gear));
    save.backpack.push({ id: gear.id });
    delete save.soldGear[gear.id];
}

function sellGearTo(save, shop, slot, percent) {
    const index = wholeNumber(slot, 100);
    const saved = save.backpack[index];
    if (!saved) fail("That backpack slot is empty.");
    const gear = findGear(saved.id);
    if (gear.bound) fail("You can't sell the " + gear.name + ". It belongs to the research facility.");
    const price = gear.sellValue || round1((gear.price || 0) * percent / 100);
    save.backpack.splice(index, 1);
    save.coins = round1(save.coins + price);
    if (!isStarterGear(gear.id)) save.soldGear[gear.id] = shop;
    return price;
}

function sellFish(save, selected = {}) {
    let total = 0;
    for (const [id, value] of Object.entries(selected)) {
        const type = findFish(id);
        const amount = wholeNumber(value);
        if (!type || amount > (save.fish[id] || 0)) fail("You don't have those fish.");
        if (amount > 0 && !isSellable(type)) fail("Nobody has ever seen a " + type.name + " before. Nobody wants to buy it.");
        total = round1(total + amount * type.price);
    }
    if (total === 0) fail("Select the fish you want to sell with + and - first.");
    for (const [id, amount] of Object.entries(selected)) save.fish[id] -= Number(amount);
    save.coins = round1(save.coins + total);
    return total;
}

function inDriftt(save) {
    if (save.island !== "pointDriftt") fail("You're not on Point Driftt.");
    if (!save.driftt) fail("Nobody here knows you yet.");
}

function notOnTrip(save) {
    if (save.island === "hadalDeep") fail("You're on Kaya's boat. Cast your line, he won't wait forever.");
}

const canFishHadal = save => (equippedGear(save, "Rod").waters || []).includes("hadal");

function pickFish(save, canCatch, waters) {
    const luck = getStat(save, "luck", 0, waters);
    const trinket = boostMultiplier(save, "luck");
    const weights = canCatch.map(type => {
        const weight = type.chance * (1 + luck * type.rarity);
        return Math.max(0, type.rarity > 0 ? weight * trinket : weight);
    });
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < canCatch.length; index++) {
        roll -= weights[index];
        if (roll < 0) return canCatch[index];
    }
    return canCatch[canCatch.length - 1];
}

const fastestCatch = type => type.hits * 150;

function finishCatch(save, data, kind) {
    const pending = save.pending;
    if (!pending || pending.kind !== kind) fail("You're not fishing right now.");
    save.pending = null;
    const type = kind === "ritual" ? ritual.charm : findFish(pending.fishId);
    return Boolean(data.caught) && Date.now() - pending.started >= fastestCatch(type);
}

export const actions = {

    "time.rest"(save) {
        notOnTrip(save);
        if (time(save) === "night") fail("It's night. Resting won't help, you should go to sleep.");
        nextTime(save);
        return {};
    },

    "time.sleep"(save) {
        notOnTrip(save);
        if (time(save) !== "evening" && time(save) !== "night") fail("You can't sleep during the day, get back to work.");
        nextDay(save);
        return {};
    },

    "fish.start"(save) {
        if (save.pending && save.pending.kind === "fish") return { fishId: save.pending.fishId };
        const rod = equippedGear(save, "Rod");
        const waters = rod.waters || [];
        const fishHere = fishByIsland[save.island] || [];
        const reachable = fishHere.filter(type => type.waters.some(water => waters.includes(water)));
        const canCatch = reachable.filter(type => fishTimes(type).includes(time(save)));
        if (canCatch.length === 0) {
            const reason = fishHere.length === 0 ? "quiet" : time(save) === "night" ? "night" : reachable.length > 0 ? "notNow" : "cantCatch";
            return { none: reason, rod: rod.name };
        }
        const type = pickFish(save, canCatch, waters);
        save.pending = { kind: "fish", fishId: type.id, started: Date.now() };
        return { fishId: type.id };
    },

    "fish.finish"(save, data) {
        const fishId = save.pending && save.pending.fishId;
        const caught = finishCatch(save, data, "fish");
        const result = { caught, fishId, drops: [], mapPiece: false, newSpecies: false };

        if (caught) {
            const type = findFish(fishId);
            save.fish[fishId] = (save.fish[fishId] || 0) + 1;
            result.newSpecies = !save.fishLog[fishId];
            save.fishLog[fishId] = (save.fishLog[fishId] || 0) + 1;

            result.resonance = round1(type.resonance * boostMultiplier(save, "resonance") + getStat(save, "resonity", 0));
            save.resonance = round1(save.resonance + result.resonance);
            for (const boost of Object.keys(save.boosts)) if (save.boosts[boost] > 0) save.boosts[boost]--;

            for (const item of items) {
                if (item.fishChance && Math.random() * 100 < item.fishChance) {
                    addItem(save, item.id);
                    result.drops.push(item.name);
                }
            }
            for (const piece of mapTiles) {
                if (piece.source === "fishing" && piece.island === save.island && !save.map.includes(piece.id) && Math.random() * 100 < piece.chance) {
                    save.map.push(piece.id);
                    result.mapPiece = true;
                }
            }
        }
        nextTime(save);
        if (save.island === "hadalDeep") {
            passDays(save, boatman.travelDays);
            save.island = "pointDriftt";
            visitTown(save);
            result.tripOver = true;
        }
        return result;
    },

    "item.use"(save, data) {
        const item = findItem(data.id);
        if (!item || !(item.boost || item.resonance)) fail("You can't use that.");
        takeItem(save, item.id);
        if (item.boost) save.boosts[item.boost] = (save.boosts[item.boost] || 0) + item.catches;
        if (item.resonance) save.resonance = round1(save.resonance + item.resonance);
        return {};
    },

    "gear.equip"(save, data) {
        const index = wholeNumber(data.index, 100);
        const gear = save.backpack[index];
        if (!gear) fail("That backpack slot is empty.");
        const slot = allGear.find(item => item.id === gear.id).slot;
        save.backpack.splice(index, 1);
        if (save.equipped[slot]) save.backpack.push(save.equipped[slot]);
        save.equipped[slot] = gear;
        return {};
    },

    "gear.resolvePending"(save, data) {
        if (!save.pendingGear) fail("There's nothing to pick up.");
        const gear = { id: save.pendingGear };
        if (save.backpack.length < save.backpackSize) {
            save.backpack.push(gear);
        } else if (data.drop === "equipped") {
            const slot = findGear(gear.id).slot;
            if (isBound(save.equipped[slot])) fail("You can't drop the " + findGear(save.equipped[slot].id).name + ". It belongs to the research facility.");
            loseGear(save, save.equipped[slot]);
            save.equipped[slot] = gear;
        } else {
            const index = wholeNumber(data.drop, 100);
            if (!save.backpack[index]) fail("That backpack slot is empty.");
            if (isBound(save.backpack[index])) fail("You can't drop the " + findGear(save.backpack[index].id).name + ". It belongs to the research facility.");
            loseGear(save, save.backpack[index]);
            save.backpack[index] = gear;
        }
        save.pendingGear = null;
        return {};
    },

    "marketplace.buyGear"(save, data) {
        inHaven(save);
        if (!schedule.isMarketplaceOpen(time(save), save.day)) fail("The marketplace is closed.");
        buyGearFrom(save, "freshwaterHaven", data.id);
        return {};
    },

    "marketplace.sellGear"(save, data) {
        inHaven(save);
        if (!schedule.isMarketplaceOpen(time(save), save.day)) fail("The marketplace is closed.");
        return { price: sellGearTo(save, "freshwaterHaven", data.index, marketplace.sellPercent) };
    },

    "marketplace.buySupply"(save, data) {
        inHaven(save);
        if (!schedule.isMarketplaceOpen(time(save), save.day)) fail("The marketplace is closed.");
        const item = findItem(data.id);
        if (!item || item.category !== "Supplies" || !item.price) fail("That's not for sale.");
        const amount = wholeNumber(data.amount, 999);
        if (amount === 0) fail("Choose how many you want to buy with + and - first.");
        pay(save, round1(item.price * amount));
        addItem(save, item.id, amount);
        return {};
    },

    "marketplace.buyMap"(save, data) {
        inHaven(save);
        if (!schedule.isMarketplaceOpen(time(save), save.day)) fail("The marketplace is closed.");
        const piece = mapTiles.find(piece => piece.id === data.id && piece.source === "marketplace");
        if (!piece) fail("That's not for sale.");
        if (save.map.includes(piece.id)) fail("That map piece is already on your map.");
        pay(save, piece.price);
        save.map.push(piece.id);
        return {};
    },

    "fishmonger.sell"(save, data) {
        inHaven(save);
        if (!schedule.isFishmongerOpen(time(save))) fail("Fishmonger Finn is only there in the morning.");
        return { price: sellFish(save, data.selected) };
    },

    "merchant.buyUpgrade"(save) {
        inHaven(save);
        if (!schedule.isMerchantHere(time(save), save.day)) fail("Monty isn't here.");
        const upgrade = backpackUpgrades.find(option => option.slots > save.backpackSize);
        if (!upgrade) fail("Your backpack can't get any bigger.");
        pay(save, upgrade.price);
        save.backpackSize = upgrade.slots;
        return { slots: upgrade.slots };
    },

    "merchant.buyLostGear"(save, data) {
        inHaven(save);
        if (!schedule.isMerchantHere(time(save), save.day)) fail("Monty isn't here.");
        const id = String(data.id);
        if (!save.lostGear.includes(id)) fail("Monty doesn't have that.");
        const gear = findGear(id);
        if (hasGear(save, id)) fail("You already own the " + gear.name + ".");
        if (save.backpack.length >= save.backpackSize) fail("Your backpack is full, you can't buy the " + gear.name + ".");
        pay(save, lostGearPrice(gear));
        save.backpack.push({ id });
        save.lostGear = save.lostGear.filter(lostId => lostId !== id);
        return {};
    },

    "merchant.buyItem"(save, data) {
        inHaven(save);
        if (!schedule.isMerchantHere(time(save), save.day)) fail("Monty isn't here.");
        const item = findItem(data.id);
        if (!item || !(save.merchant.stock[item.id] > 0)) fail("That's sold out.");
        pay(save, item.price);
        addItem(save, item.id);
        save.merchant.stock[item.id]--;
        return {};
    },

    "merchant.sellItem"(save, data) {
        inHaven(save);
        if (!schedule.isMerchantHere(time(save), save.day)) fail("Monty isn't here.");
        const item = findItem(data.id);
        if (!item || !(item.id in merchantStock)) fail("He doesn't buy that.");
        takeItem(save, item.id);
        const price = round1(item.price * merchantBuyPercent / 100);
        save.coins = round1(save.coins + price);
        return { price };
    },

    "altar.resonate"(save, data) {
        inHaven(save);
        if (!schedule.isAltarOpen(time(save), save.day)) fail("The resonance altar is closed.");
        const level = altar.levels.find(rank => rank.level === Number(data.rank));
        if (!level) fail("That rank doesn't exist.");
        const rod = findRod(save, data.rod);
        if (getResonances(rod).length > 0) fail("This rod already has resonances. Use dissonance on it first.");
        if (save.resonance < level.cost) fail("You need " + level.cost + " resonance for this rank.");
        save.resonance = round1(save.resonance - level.cost);
        rod.resonances = rollResonances(level);
        return { resonances: rod.resonances };
    },

    "altar.dissonance"(save, data) {
        inHaven(save);
        if (!schedule.isAltarOpen(time(save), save.day)) fail("The resonance altar is closed.");
        const rod = findRod(save, data.rod);
        if (getResonances(rod).length === 0) fail("This rod has no resonances to remove.");
        pay(save, altar.dissonanceCost);
        rod.resonances = [];
        return {};
    },

    "researcher.give"(save) {
        inHaven(save);
        const round = save.researcher.round;
        const quest = researcherRounds[round - 1];
        if (!quest) fail("She doesn't need any fish right now.");
        if (save.researcher.wanted.some(id => !(save.fish[id] > 0))) fail("You're missing some fish.");
        for (const id of save.researcher.wanted) save.fish[id]--;
        save.coins = round1(save.coins + quest.coins);
        save.resonance = round1(save.resonance + quest.resonance);
        save.researcher = researcherQuest(round + 1);
        const finished = !researcherRounds[round];
        if (finished && save.ramlaris.arrivalDay === null) save.ramlaris.arrivalDay = save.day + ramlaris.daysToArrive;
        return { round, coins: quest.coins, resonance: quest.resonance, phoneCall: finished };
    },

    "tavern.give"(save) {
        inHaven(save);
        if (!schedule.isTavernOpen(time(save))) fail("The tavern is closed in the morning.");
        if (save.tavern.delivered) fail("Pierre Crumble already has his fish.");
        const type = findFish(save.tavern.fishId);
        if (!(save.fish[type.id] > 0)) fail("You don't have a " + type.name + ".");
        save.fish[type.id]--;
        const coins = round1(type.price * tavern.coinMultiplier);
        const resonance = round1(type.resonance * tavern.resonanceMultiplier);
        const supply = random(items.filter(item => item.category === "Supplies"));
        save.coins = round1(save.coins + coins);
        save.resonance = round1(save.resonance + resonance);
        if (supply) addItem(save, supply.id);
        save.tavern.delivered = true;
        save.tavernHelped = (save.tavernHelped || 0) + 1;
        return { coins, resonance, supply: supply ? supply.id : null };
    },

    "fortune.give"(save) {
        inHaven(save);
        if (!schedule.isFortuneTellerHere(save, time(save)) || save.fortune.done) fail("Madame Crystal isn't here.");
        takeItem(save, fortuneTeller.trinket, fortuneTeller.trinketsWanted);
        giveGear(save, luckRod.id);
        save.fortune.done = true;
        return {};
    },

    "fortune.goodbye"(save) {
        if (!save.fortune.done) fail("She still has something to tell you.");
        save.fortune.gone = true;
        return {};
    },

    "ritual.start"(save) {
        inHaven(save, true);
        if (!schedule.isRitualOpen(save, time(save), save.day)) fail("There's no ritual right now.");
        save.ritual.attemptedDay = save.day;
        save.pending = { kind: "ritual", started: Date.now() };
        return {};
    },

    "ritual.finish"(save, data) {
        const caught = finishCatch(save, data, "ritual");
        if (caught) {
            save.ritual.beaten = true;
            addItem(save, "theCharm");
            const piece = mapTiles.find(piece => piece.source === "ritual" && piece.island === "freshwaterHaven");
            if (piece && !save.map.includes(piece.id)) save.map.push(piece.id);
            giveGear(save, charmCloak.id);
        }
        nextTime(save);
        return { caught };
    },

    "ramlaris.board"(save) {
        inHaven(save);
        if (!schedule.shipArrived(save, save.day)) fail("The Ramlaris isn't here.");
        if (Object.values(save.fish).some(amount => amount > 0)) fail("You can't board with fish.");
        for (const [id, amount] of Object.entries(ramlaris.payment)) {
            if ((save.items[id] || 0) < amount) fail("You're short on supplies.");
        }
        for (const [id, amount] of Object.entries(ramlaris.payment)) save.items[id] -= amount;
        save.ramlaris.sailed = true;
        save.island = "pointDriftt";
        visitTown(save);
        if (!save.driftt) startDriftt(save);
        return {};
    },

    "intro.seen"(save) {
        save.introSeen = true;
        return {};
    },

    "driftt.introduced"(save) {
        if (!save.driftt) fail("You're not on Point Driftt yet.");
        save.driftt.introduced = true;
        return {};
    },

    "research.give"(save, data) {
        inDriftt(save);
        const left = contract.hadalFishWanted - save.driftt.delivered;
        if (left <= 0) fail("Your contract is already done.");
        const type = findFish(data.id);
        if (!type || !type.waters.includes("hadal")) fail("They only need hadal fish.");
        const amount = wholeNumber(data.amount, 100);
        if (amount === 0) fail("Give at least 1 fish.");
        if (amount > (save.fish[type.id] || 0)) fail("You don't have that many " + type.name + ".");
        if (amount > left) fail("They only need " + left + " more.");
        save.fish[type.id] -= amount;
        save.driftt.delivered += amount;
        const done = save.driftt.delivered >= contract.hadalFishWanted;
        if (done && !save.map.includes("hadalDeep")) save.map.push("hadalDeep");
        if (done) save.driftt.doneDay = save.day;
        return { delivered: save.driftt.delivered, done };
    },

    "research.donate"(save, data) {
        inDriftt(save);
        if (save.driftt.delivered < contract.hadalFishWanted) fail("Finish your contract first.");
        const type = findFish(data.id);
        if (!type || !type.waters.includes("hadal")) fail("They only take hadal fish.");
        const amount = wholeNumber(data.amount, 999);
        if (amount === 0) fail("Donate at least 1 fish.");
        if (amount > (save.fish[type.id] || 0)) fail("You don't have that many " + type.name + ".");
        save.fish[type.id] -= amount;
        return { donated: amount };
    },

    "locker.buy"(save) {
        inDriftt(save);
        const price = lockers.prices[save.lockers.length];
        if (price === undefined) fail("You already have every locker.");
        pay(save, price);
        save.lockers.push(null);
        let mapPiece = false;
        if (save.lockers.length === 1 && !save.map.includes("pointDriftt")) {
            save.map.push("pointDriftt");
            mapPiece = true;
        }
        return { mapPiece };
    },

    "locker.store"(save, data) {
        inDriftt(save);
        const locker = wholeNumber(data.locker, 10);
        if (locker >= save.lockers.length) fail("You don't have that locker.");
        if (save.lockers[locker]) fail("That locker is full. Every locker holds 1 piece of gear.");
        const index = wholeNumber(data.index, 100);
        if (!save.backpack[index]) fail("That backpack slot is empty.");
        save.lockers[locker] = save.backpack.splice(index, 1)[0];
        return {};
    },

    "locker.take"(save, data) {
        inDriftt(save);
        const locker = wholeNumber(data.locker, 10);
        if (!save.lockers[locker]) fail("That locker is empty.");
        if (save.backpack.length >= save.backpackSize) fail("Your backpack is full.");
        save.backpack.push(save.lockers[locker]);
        save.lockers[locker] = null;
        return {};
    },

    "station.resonate"(save, data) {
        inDriftt(save);
        if (!schedule.isStationOpen(time(save))) fail("The resonance station is closed at night.");
        const upgraded = save.driftt.rankResonations >= station.rodsWanted;
        const levels = upgraded ? [...station.levels, station.upgradeLevel] : station.levels;
        const level = levels.find(rank => rank.level === Number(data.rank));
        if (!level) fail("That rank isn't available yet.");
        const rod = findRod(save, data.rod);
        if (getResonances(rod).length > 0) fail("This rod already has resonances. Use dissonance on it first.");
        if (save.resonance < level.cost) fail("You need " + level.cost + " resonance for this rank.");
        save.resonance = round1(save.resonance - level.cost);
        rod.resonances = rollResonances(level);
        let stationUpgraded = false;
        if (level.level === station.upgradeRank && !upgraded) {
            save.driftt.rankResonations++;
            stationUpgraded = save.driftt.rankResonations >= station.rodsWanted;
        }
        return { resonances: rod.resonances, stationUpgraded };
    },

    "station.dissonance"(save, data) {
        inDriftt(save);
        if (!schedule.isStationOpen(time(save))) fail("The resonance station is closed at night.");
        const rod = findRod(save, data.rod);
        if (getResonances(rod).length === 0) fail("This rod has no resonances to remove.");
        pay(save, station.dissonanceCost);
        rod.resonances = [];
        return {};
    },

    "store.sellFish"(save, data) {
        inDriftt(save);
        if (!schedule.isStoreOpen(time(save), save.day)) fail("The inconvenience store is closed.");
        return { price: sellFish(save, data.selected) };
    },

    "store.buyGear"(save, data) {
        inDriftt(save);
        if (!schedule.isStoreOpen(time(save), save.day)) fail("The inconvenience store is closed.");
        buyGearFrom(save, "pointDriftt", data.id);
        return {};
    },

    "store.sellGear"(save, data) {
        inDriftt(save);
        if (!schedule.isStoreOpen(time(save), save.day)) fail("The inconvenience store is closed.");
        return { price: sellGearTo(save, "pointDriftt", data.index, store.sellPercent) };
    },

    "store.buySupply"(save, data) {
        inDriftt(save);
        if (!schedule.isStoreOpen(time(save), save.day)) fail("The inconvenience store is closed.");
        const item = findItem(data.id);
        const forSale = [...store.supplies, ...store.bottles];
        if (!item || !forSale.includes(item.id)) fail("That's not for sale.");
        const amount = wholeNumber(data.amount, 999);
        if (amount === 0) fail("Choose how many you want to buy with + and - first.");
        pay(save, round1(item.price * store.supplyMultiplier * amount));
        addItem(save, item.id, amount);
        return {};
    },

    "boatman.trip"(save) {
        inDriftt(save);
        if (save.pending) fail("Finish what you're doing first.");
        if (!canFishHadal(save)) fail("Your rod can't reach hadal waters. Equip your deep fishing rod first.");
        pay(save, boatman.tripPrice);
        passDays(save, boatman.travelDays);
        save.island = "hadalDeep";
        visitTown(save);
        return {};
    },

    "hadal.return"(save) {
        if (save.island !== "hadalDeep") fail("You're not on a trip.");
        if (save.pending) fail("Reel in your line first.");
        passDays(save, boatman.travelDays);
        save.island = "pointDriftt";
        visitTown(save);
        return {};
    },

    // data: { line, to }
    "transport.board"(save, data) {
        const line = findLine(data.line);
        if (!line || !line.stops.some(stop => stop.town === save.island)) fail("That line doesn't stop here.");
        if (!isRunning(line, save)) fail("The " + line.name + " isn't running yet.");
        if (save.pending) fail("Finish what you're doing first.");
        const trip = destinations(line, save, save.island).find(stop => stop.town === data.to);
        if (!trip) fail("The " + line.name + " doesn't leave for there today.");
        pay(save, line.ticket * trip.legs);
        passDays(save, trip.days);
        save.timeIndex = 0;
        save.island = trip.town;
        visitTown(save);
        return { days: trip.days };
    },

    "transport.buyChart"(save, data) {
        const line = findLine(data.line);
        if (!line || !line.stops.some(stop => stop.town === save.island) || !isRunning(line, save)) fail("You can't buy that chart here.");
        if (save.charts.includes(line.id)) fail("You already have this route chart.");
        pay(save, routeChartPrice);
        save.charts.push(line.id);
        return {};
    },

    "mayor.met"(save) {
        save.mayor.met = true;
        return {};
    },

    "mayor.donate"(save) {
        inHaven(save);
        if (save.mayor.donated) fail("You already donated. The town thanks you!");
        pay(save, mayor.donation);
        save.mayor.donated = true;
        return {};
    },

    "mayor.claim"(save) {
        inHaven(save);
        if (save.bird) fail("You already have a carrier pigeon.");
        if (save.tavernHelped < mayor.tavernHelps || !save.mayor.donated) fail("Mayor Navi still needs your help first.");
        save.bird = { name: birds.defaultName, job: null };
        return {};
    },

    "bird.rename"(save, data) {
        needBird(save);
        const name = cleanText(data.name, { maxLength: 40 });
        if (name.length < 1 || name.length > birds.maxNameLength) fail("A name needs 1-" + birds.maxNameLength + " characters.");
        if (isReservedName(name)) fail("That name is reserved. Pick another one.");
        save.bird.name = name;
        return {};
    },

    "bird.discover"(save) {
        needIdleBird(save);
        const town = townOf(save.island);
        if (!town) fail("Your pigeon can only fly out from a town.");
        const options = discoverableTiles(save);
        if (options.length === 0) fail(save.bird.name + " has found all the waters it can reach from here.");
        takeItem(save, birds.food, birds.discoverFood);
        const tile = random(options);
        const now = Date.now();
        const tripMs = 2 * flightMs(tileDistance(town, tile));
        save.bird.job = { type: "discover", tile: tile.id, from: save.island, leftAt: now, backAt: now + tripMs };
        return {};
    },

    "mail.send"(save, data, ctx) {
        needIdleBird(save);
        const friend = save.friends.find(friend => friend.id === Number(data.to));
        if (!friend) fail("You can only send letters to your friends.");
        if (String(data.text || "").length > birds.maxLetterLength + 50) fail("Your letter is too long (" + birds.maxLetterLength + " characters max).");
        const text = cleanText(data.text, { newLines: true, maxLines: 12, maxLength: birds.maxLetterLength });
        if (!text) fail("Write something first.");
        const from = townOf(save.island);
        if (!from) fail("Your pigeon can only fly out from a town.");
        if ((save.items[birds.food] || 0) < birds.mailFood) fail("Your pigeon needs " + birds.mailFood + " birdfood for this trip.");
        const gifts = checkGifts(save, data.gifts);

        const other = ctx.loadOther(friend.id);
        if (!other) fail(friend.name + " doesn't have a save anymore.");
        const isBlocked = (other.blocked || []).some(player => player.id === ctx.userId) || save.blocked.some(player => player.id === friend.id);
        if (isBlocked || !other.friends.some(friend => friend.id === ctx.userId)) fail(friend.name + " isn't your friend anymore.");
        const to = townOf(other.island) || towns.freshwaterHaven;

        takeItem(save, birds.food, birds.mailFood);
        save.coins = round1(save.coins - gifts.coins);
        save.resonance = round1(save.resonance - gifts.resonance);
        for (const [id, amount] of Object.entries(gifts.items)) save.items[id] -= amount;

        const now = Date.now();
        const tiles = tileDistance(from, to);
        const arrivesAt = now + flightMs(tiles);
        const backAt = now + 2 * flightMs(tiles);
        other.inbox.push({ id: newLetterId(), fromId: ctx.userId, fromName: ctx.displayName, fromTown: save.island, text, gifts, sentAt: now, arrivesAt, delivered: false });
        while (other.inbox.length > birds.inboxSize && other.inbox.some(letter => letter.delivered)) {
            other.inbox.splice(other.inbox.findIndex(letter => letter.delivered), 1);
        }
        save.bird.job = { type: "mail", toId: friend.id, toName: friend.name, leftAt: now, arrivesAt, backAt };
        return {};
    },

    "mail.delete"(save, data) {
        const index = save.inbox.findIndex(letter => letter.id === data.id && letter.delivered);
        if (index === -1) fail("That letter is already gone.");
        save.inbox.splice(index, 1);
        return {};
    },

    "news.seen"(save, data) {
        save.news.splice(0, wholeNumber(data.count, 1000));
        return {};
    },

    "friends.remove"(save, data, ctx) {
        const id = Number(data.id);
        if (!save.friends.some(friend => friend.id === id)) fail("That player isn't your friend.");
        save.friends = save.friends.filter(friend => friend.id !== id);
        const other = ctx.loadOther(id);
        if (other) other.friends = other.friends.filter(friend => friend.id !== ctx.userId);
        return {};
    },
};

export function publicSave(save) {
    const { pending, ...rest } = save;
    let bird = rest.bird;
    if (bird && bird.job) {
        const job = { type: bird.job.type, toName: bird.job.toName };
        bird = { ...bird, job };
    }
    const inbox = (rest.inbox || []).filter(letter => letter.delivered);
    return { ...rest, bird, inbox, fishing: Boolean(pending), serverTime: Date.now() };
}

export function addFriend(save, id, name) {
    if (!save.friends.some(friend => friend.id === id)) save.friends.push({ id, name });
}

export function blockedBetween(saveA, idA, saveB, idB) {
    return (saveA.blocked || []).some(player => player.id === idB) || (saveB.blocked || []).some(player => player.id === idA);
}

function rodLabel(gear) {
    const list = getResonances(gear).map(rodResonance => resonances[rodResonance.id].name + " " + roman[rodResonance.level]);
    if (list.length === 0) return gear.name + " | No resonance";
    return gear.name + " | " + list.join(", ");
}

export function duelRods(save) {
    const rods = [{ key: "equipped", name: rodLabel(equippedGear(save, "Rod")) }];
    save.backpack.forEach((saved, slot) => {
        const gear = resolveGear(saved);
        if (gear && gear.slot === "Rod") rods.push({ key: slot, name: rodLabel(gear) });
    });
    return rods;
}

export function duelStats(save, rodKey = "equipped") {
    let used = save;
    if (rodKey !== "equipped") {
        const gear = save.backpack[rodKey];
        if (!resolveGear(gear) || resolveGear(gear).slot !== "Rod") fail("You don't have that fishing rod anymore.");
        used = { ...save, equipped: { ...save.equipped, Rod: gear } };
    }
    return { focus: getStat(used, "slowBar", 0), zoneBonus: getStat(used, "zoneBonus", 0) };
}

export { slots };