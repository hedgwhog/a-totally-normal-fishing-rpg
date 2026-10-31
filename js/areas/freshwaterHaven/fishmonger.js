import { sellFish } from "../../player/fishBag.js";
import { isFishmongerOpen } from "../../shared/rules/schedule.js";

export const fishmonger = {
    button: "sellFish",
    isOpen: time => isFishmongerOpen(time),
    open: sellFish,
};
