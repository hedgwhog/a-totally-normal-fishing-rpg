// The Pantry Isles: the Capital, Heathland, Tableland and Mangal. The numbers are in shared/data/areas/pantryIsles.js
import { addEvent } from "../areas.js";
import { transportOffice } from "../common/transportOffice.js";
import { restaurants } from "../../shared/data/areas/pantryIsles.js";
import { restaurantEvent, restaurantButton } from "./restaurants.js";
import { capitalShopEvent } from "./capitalShop.js";
import { resonanceLibrary } from "./library.js";
import { trainStation } from "./station.js";
import { localMarket, marketFishBuyer } from "./market.js";
import { islandQuest } from "./islandQuest.js";
import "./arrival.js";

// every restaurant gets its own button in the Capital, below the other places. Made here, so a new restaurant
// needs no change in game.html. The list scrolls when many restaurants are open at once.
const capitalEvents = document.querySelector("#capital .event-list");
for (const restaurant of restaurants) {
    if (!capitalEvents || document.getElementById(restaurantButton(restaurant))) continue;
    const button = document.createElement("button");
    button.id = restaurantButton(restaurant);
    button.textContent = restaurant.name;
    capitalEvents.appendChild(button);
}
for (const restaurant of restaurants) addEvent("capital", restaurantEvent(restaurant));
addEvent("capital", capitalShopEvent);
addEvent("capital", resonanceLibrary);
addEvent("capital", trainStation("capital", "capitalStation"));
addEvent("capital", transportOffice("ferryCapital"));

for (const [island, name] of [["heathland", "Heathland"], ["tableland", "Tableland"], ["mangal", "Mangal"]]) {
    addEvent(island, localMarket(island, "market" + name));
    addEvent(island, marketFishBuyer(island, "sellFish" + name));
    addEvent(island, islandQuest(island, "quest" + name));
    addEvent(island, trainStation(island, "station" + name));
}