// The Blue Line Cooperation office in a town: every ferry line that stops here. Boarding, and buying route charts.
// The first Line Tuna trip from Freshwater Haven to the Capital is with Nikki, and the mayor pays (see niece.js).
import { routeChartPrice, chartName } from "../../shared/data/transport.js";
import { linesAt, nextDeparture, destinations } from "../../shared/rules/transport.js";
import { mayorRewards } from "../../shared/data/areas/pantryIsles.js";
import { islandNames } from "../../shared/data/islands.js";
import { lines } from "../../shared/data/dialogue.js";
import { getState, act } from "../../core/state.js";
import { getCoins } from "../../player/wallet.js";
import { travel } from "../../screens/travel.js";
import { say, ask, fill } from "../../core/dialogue.js";
import { coinsText } from "../../core/helpers.js";
import { tellAboutNikki } from "../freshwaterHaven/niece.js";

const clerk = "ferryClerk";
const talk = lines.ferryClerk;

const isNikkiTrip = (line, trip) => {
    const pantry = getState().pantry;
    return line.id === "tuna" && pantry && !pantry.boarded && getState().island === "freshwaterHaven" && trip.town === "capital";
};

function lineInfo(line, here) {
    const save = getState();
    const departure = nextDeparture(line, save, here);
    const wait = departure - save.day;
    return fill(talk.lineInfo, {
        line: line.name,
        place: line.stops.filter(stop => stop.town !== here).map(stop => islandNames[stop.town]).join(", "),
        day: departure,
        when: wait === 0 ? "today" : wait === 1 ? "tomorrow" : "in " + wait + " days",
        price: coinsText(line.ticket),
        days: line.legs[0],
    });
}

async function board(line, trip) {
    const here = getState().island;
    const to = islandNames[trip.town];
    let reward = null;
    if (isNikkiTrip(line, trip)) {
        const labels = mayorRewards.map(option => option.label);
        const answer = await ask(lines.niece.atFerry, [...labels, "Not yet"], "mayor");
        reward = mayorRewards.find(option => option.label === answer);
        if (!reward) return say(lines.niece.notYet, "mayor");
        await say(lines.niece.goodbye);
    } else if (getCoins() < line.ticket * trip.legs) {
        return say(talk.noCoins, clerk, { price: coinsText(line.ticket * trip.legs) });
    }
    const result = await travel("The " + line.name + " sails to " + to,
        () => act("transport.board", { line: line.id, to: trip.town, reward: reward && reward.id }),
        { kind: line.kind, days: trip.days, from: islandNames[here], to });
    if (result.error) return say(result.error);
    if (!reward) await say(talk.arrived, clerk, { days: trip.days, place: to, line: line.name });
}

async function visitOffice() {
    if (getState().island === "freshwaterHaven") await tellAboutNikki();
    const save = getState();
    const here = save.island;
    const hereLines = linesAt(here, save);
    const info = hereLines.map(line => lineInfo(line, here)).join("\n\n");

    const options = [];
    for (const line of hereLines) {
        for (const trip of destinations(line, save, here)) {
            const price = isNikkiTrip(line, trip) ? "the mayor pays" : coinsText(line.ticket * trip.legs);
            options.push({ label: "Board " + line.name + " to " + islandNames[trip.town] + " (" + price + ")", run: () => board(line, trip) });
        }
    }
    const boarding = options.length > 0;
    for (const line of hereLines) {
        if (save.charts.includes(line.id)) continue;
        options.push({ label: "Buy the " + chartName(line) + " (" + coinsText(routeChartPrice) + ")", run: () => buyChart(line) });
    }
    options.push({ label: "Leave", run: () => (boarding ? say(talk.notNow, clerk) : null) });

    const question = talk.welcome + "\n\n" + info + "\n\n" + (boarding ? talk.askBoard : fill(talk.notToday[0], { chartPrice: coinsText(routeChartPrice) }));
    const answer = await ask(question, options.map(option => option.label), clerk);
    await options.find(option => option.label === answer).run();
}

async function buyChart(line) {
    const result = await act("transport.buyChart", { line: line.id });
    if (result.error) return say(result.error);
    return say(talk.chartBought, clerk, { chart: chartName(line) });
}

export function transportOffice(button) {
    return {
        button,
        isOpen: (time, day, save) => linesAt(save.island, save).length > 0,
        open: visitOffice,
    };
}