import { addEvent } from "../areas.js";
import { researchFacility } from "./research.js";
import { boatman } from "./boatman.js";
import { storageLockers } from "./lockers.js";
import { resonanceStation } from "./station.js";
import { inconvenienceStore, storeFishBuyer } from "./store.js";
import "./arrival.js";
import { transportOffice } from "../common/transportOffice.js";

const island = "pointDriftt";

addEvent(island, researchFacility);
addEvent(island, boatman);
addEvent(island, storageLockers);
addEvent(island, resonanceStation);
addEvent(island, inconvenienceStore);
addEvent(island, storeFishBuyer);
addEvent(island, transportOffice("ferryPointDriftt", "ffc"));