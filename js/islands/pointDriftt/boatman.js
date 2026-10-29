import { boatman as numbers } from "../../data/pointDriftt.js";
import { lines } from "../../data/dialogue.js";
import { getEquipped } from "../../gear.js";
import { getCoins } from "../../wallet.js";
import { act } from "../../state.js";
import { travel } from "../../travel.js";
import { say, ask } from "../../dialogue.js";
import { coinsText } from "../../helpers.js";

const boatmanName = "boatman";

async function talkToBoatman() {
    const values = { price: coinsText(numbers.tripPrice), days: numbers.travelDays };
    const sail = "Sail out (" + values.price + ")";
    const answer = await ask(lines.boatman.askTrip, [sail, "Not now"], boatmanName, values);
    if (answer !== sail) return say(lines.boatman.notNow, boatmanName, values);
    if (!(getEquipped("Rod").waters || []).includes("hadal")) return say(lines.boatman.wrongRod, boatmanName, values);
    if (getCoins() < numbers.tripPrice) return say(lines.boatman.noCoins, boatmanName, values);

    await say(lines.boatman.leaving, boatmanName, values);
    const result = await travel("Sailing north to the Hadal Deep", () => act("boatman.trip"));
    if (result.error) return say(result.error);
    await say(lines.boatman.arrived, boatmanName, values);
}

export const boatman = {
    button: "boatman",
    isOpen: () => true,
    open: talkToBoatman,
};