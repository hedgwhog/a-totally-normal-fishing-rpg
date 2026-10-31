import { merchantEvery } from "../data/merchant.js";
import { ritual, tavern } from "../data/quests.js";

export const times = ["morning", "afternoon", "evening", "night"];

export const timeOf = save => times[save.timeIndex];

export const isRitualDay = (save, day) => !save.ritual.beaten && day % ritual.every === 0;
export const isRitualOpen = (save, time, day) => isRitualDay(save, day) && time !== "night" && save.ritual.attemptedDay !== day;
export const ritualAttended = save => save.ritual.attemptedDay !== null || save.ritual.beaten;

export const isMarketplaceOpen = (time, day) => time !== "night" && day % 7 < 2;
export const isAltarOpen = (time, day) => ["morning", "afternoon", "night"].includes(time) && day % 5 !== 0;
export const isMerchantHere = (time, day) => day % merchantEvery === 0 && time !== "night";
export const isFishmongerOpen = time => time === "morning";
export const isTavernOpen = time => time !== "morning";
export const isFortuneTellerHere = (save, time) => ritualAttended(save) && !save.fortune.gone && time === "evening";
export const shipArrived = (save, day) => save.ramlaris.arrivalDay !== null && !save.ramlaris.sailed && day >= save.ramlaris.arrivalDay;

export const isStationOpen = time => time !== "night";
export const isStoreOpen = (time, day) => time === "evening" && day % 2 === 0;

export const tavernPeriod = day => Math.floor((day - 1) / tavern.orderDays);
export const tavernLastDay = day => (tavernPeriod(day) + 1) * tavern.orderDays;