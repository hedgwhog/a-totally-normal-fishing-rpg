import { addEvent } from "../../islands.js";
import { marketplace } from "./marketplace.js";
import { fishmonger } from "./fishmonger.js";
import { ichthyologist } from "./researcher.js";
import { resonanceAltar } from "./resonanceAltar.js";
import { ramlaris } from "./ramlaris.js";
import { travelingMerchant } from "./merchant.js";
import { annualRitual } from "./ritual.js";
import { isRitualDay } from "../../rules/schedule.js";
import { tavern } from "./tavern.js";
import { fortuneTeller } from "./fortuneTeller.js";
import { mayor } from "./mayor.js";
import { ferryOffice } from "../ferry.js";

const island = "freshwaterHaven";

function closedOnRitualDay(event) {
    return {
        ...event,
        isOpen: (time, day, save) => !isRitualDay(save, day) && event.isOpen(time, day, save),
    };
}

addEvent(island, annualRitual);
addEvent(island, closedOnRitualDay(marketplace));
addEvent(island, closedOnRitualDay(ichthyologist));
addEvent(island, closedOnRitualDay(fishmonger));
addEvent(island, closedOnRitualDay(resonanceAltar));
addEvent(island, closedOnRitualDay(travelingMerchant));
addEvent(island, closedOnRitualDay(ramlaris));
addEvent(island, closedOnRitualDay(tavern));
addEvent(island, closedOnRitualDay(fortuneTeller));
addEvent(island, closedOnRitualDay({ ...mayor, isOpen: () => true }));
addEvent(island, ferryOffice("ferryHaven"));