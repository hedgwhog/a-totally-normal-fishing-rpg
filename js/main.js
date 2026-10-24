import "./ui.js";
import "./settings.js";
import "./audio.js";
import "./wallet.js";
import "./resonance.js";
import "./gear.js";
import "./itemBag.js";
import "./fishBag.js";
import "./map.js";
import "./fishLog.js";
import "./catalogue.js";
import "./actions.js";
import "./islands/freshwaterHaven/index.js";
import "./islands/pointDriftt/index.js";
import { refreshTime } from "./time.js";

localStorage.removeItem("saveAffinity"); // affinity was removed in update 0.8

refreshTime(); 
