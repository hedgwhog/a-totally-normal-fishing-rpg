// the time when the fishmonger shows up
import { sellFish } from "../../fishBag.js";

export const fishmonger = {
    button: "sellFish",
    isOpen: time => time === "morning",
    open: sellFish,
};
