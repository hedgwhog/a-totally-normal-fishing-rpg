import { sellFish } from "../../fishBag.js";
import { isFishmongerOpen } from "../../rules/schedule.js";

export const fishmonger = {
    button: "sellFish",
    isOpen: time => isFishmongerOpen(time),
    open: sellFish,
};
