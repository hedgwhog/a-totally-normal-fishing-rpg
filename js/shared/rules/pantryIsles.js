// When things in the Pantry Isles are open, and small helpers. Used by the game and the server.
import { restaurants, marketDays, capitalShop, trains, islandQuests } from "../data/areas/pantryIsles.js";

export const isMarketOpen = (time, day) => (time === "morning" || time === "afternoon")
    && day % (marketDays.open + marketDays.closed) < marketDays.open;

export const isCapitalShopOpen = time => capitalShop.open.includes(time);

export const findRestaurant = id => restaurants.find(restaurant => restaurant.id === id);

export const isRestaurantOpen = (restaurant, time, day) => restaurant.open.includes(time) && !(restaurant.closed && restaurant.closed(day));

// what a restaurant still needs from you: { itemId: amount }
export function stillNeeded(save, restaurant) {
    const given = (save.pantry && save.pantry.restaurants[restaurant.id]) || { given: {} };
    const need = {};
    for (const [id, amount] of Object.entries(restaurant.ingredients)) {
        const left = amount - (given.given[id] || 0);
        if (left > 0) need[id] = left;
    }
    return need;
}

export const restaurantDone = (save, restaurant) => Boolean(save.pantry && save.pantry.restaurants[restaurant.id] && save.pantry.restaurants[restaurant.id].done);

export const trainLineOf = island => trains.lines.find(line => line.island === island);
export const findTrainLine = id => trains.lines.find(line => line.id === id);

// where the train of a line is, by the time of day
// { at: "capital" | island } or { from, to } when it's on its way
export function trainPosition(line, time) {
    if (time === trains.fromCapital) return { from: "capital", to: line.island };
    if (time === trains.arriveIsland) return { at: line.island };
    if (time === trains.fromIsland) return { from: line.island, to: "capital" };
    return { at: "capital" };
}

export const islandQuestDone = (save, island) => Boolean(save.pantry && save.pantry.quests[island]);
export { islandQuests };
