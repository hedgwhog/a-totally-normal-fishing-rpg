// The restaurants of the Capital. Every restaurant is its own place, with a button that only shows while it's open.
// Bring the ingredients they need (from the local markets), and you get coins (sometimes a map piece),
// and you can buy their dish. The restaurants are in data/areas/pantryIsles.js: add one there, and it shows up here.
import { restaurants } from "../../shared/data/areas/pantryIsles.js";
import { findItem } from "../../shared/data/items.js";
import { isRestaurantOpen, stillNeeded, restaurantDone } from "../../shared/rules/pantryIsles.js";
import { getState, act } from "../../core/state.js";
import { getTime, getDay } from "../../core/time.js";
import { say } from "../../core/dialogue.js";
import { openPanel, redrawPanel } from "../../core/panel.js";
import { getItemAmount } from "../../player/itemBag.js";
import { getCoins } from "../../player/wallet.js";
import { addButton, coinsText } from "../../core/helpers.js";
import { addCategory, addNote } from "./shopRows.js";

const and = list => (list.length > 1 ? list.slice(0, -1).join(", ") + " & " + list[list.length - 1] : list[0]);
const timesText = list => (list.length === 4 ? "day and night" : and(list.map(time => (time === "night" ? "at night" : "in the " + time))));
const ingredientText = need => Object.entries(need).map(([id, amount]) => amount + "x " + findItem(id).name).join(", ");

function showRestaurant(box, restaurant) {
    const save = getState();
    const dish = findItem(restaurant.dish);
    addNote(box, restaurant.owner + ": \"" + restaurant.greeting + "\"");

    if (!isRestaurantOpen(restaurant, getTime(), getDay())) {
        addNote(box, restaurant.name + " just closed.");
        return;
    }

    if (restaurantDone(save, restaurant)) {
        addCategory(box, "Menu");
        addNote(box, dish.name + ": " + dish.info);
        addButton(box, "Buy a " + dish.name + " (" + coinsText(dish.price) + ")", () => buyDish(restaurant, dish));
        addNote(box, "You have " + getItemAmount(dish.id) + ". Only the Capital shop buys delicacies.");
        return;
    }

    addCategory(box, "Ingredients they still need");
    for (const [id, amount] of Object.entries(stillNeeded(save, restaurant))) {
        addNote(box, amount + "x " + findItem(id).name + " (you have " + getItemAmount(id) + ")");
    }
    const reward = coinsText(restaurant.reward.coins || 0) + (restaurant.reward.tile ? " and a map piece" : "");
    addNote(box, "Reward: " + reward + ". After that, you can buy their " + dish.name + ".");
    addNote(box, "You buy ingredients at the local markets of the islands. You can bring them a few at a time.");
    addButton(box, "Give the ingredients you have", () => give(restaurant));
}

async function give(restaurant) {
    const result = await act("restaurant.give", { id: restaurant.id });
    if (result.error) return say(result.error);
    let text = restaurant.owner + ": \"Thank you! " + ingredientText(result.given) + ", wonderful.\"";
    if (result.done) {
        text += "\n\nThat's everything they needed! You got " + coinsText(restaurant.reward.coins || 0)
            + (result.mapPiece ? " and a map piece" : "") + ".\nYou can buy their " + findItem(restaurant.dish).name + " now.";
    }
    await say(text);
    redrawPanel();
}

async function buyDish(restaurant, dish) {
    if (getCoins() < dish.price) return say("You need " + coinsText(dish.price) + " for a " + dish.name + ".");
    const result = await act("restaurant.buy", { id: restaurant.id });
    if (result.error) return say(result.error);
}

// the button id of a restaurant (the buttons are made in index.js)
export const restaurantButton = restaurant => "restaurant-" + restaurant.id;

export function restaurantEvent(restaurant) {
    return {
        button: restaurantButton(restaurant),
        isOpen: (time, day) => isRestaurantOpen(restaurant, time, day),
        open: () => openPanel({
            title: restaurant.name,
            note: "Open " + timesText(restaurant.open) + (restaurant.closed ? ", not every day" : "") + ".",
            render: box => showRestaurant(box, restaurant),
        }),
    };
}