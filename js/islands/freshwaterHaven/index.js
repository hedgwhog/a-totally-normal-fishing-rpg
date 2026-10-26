// all the events for freshwater haven
import { addEvent } from "../../islands.js";
import { marketplace } from "./marketplace.js";
import { fishmonger } from "./fishmonger.js";
import { ichthyologist } from "./researcher.js";
import { resonanceAltar } from "./resonanceAltar.js";
import { ramlaris } from "./ramlaris.js";
import { travelingMerchant } from "./merchant.js";
import { annualRitual, isRitualDay } from "./ritual.js";
import { tavern } from "./tavern.js";
import { fortuneTeller } from "./fortuneTeller.js";

const island = "freshwaterHaven";

// the ritual day makes it so all other events are closed
function closedOnRitualDay(event) {
    return {
        ...event,
        isOpen: (time, day) => !isRitualDay(day) && event.isOpen(time, day),
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
