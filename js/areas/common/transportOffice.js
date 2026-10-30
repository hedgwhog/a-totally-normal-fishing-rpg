// The office of a transport line at one of its stops. boarding, and buying the route chart.
import { findLine, routeChartPrice, chartName } from "../../shared/data/transport.js";
import { isRunning, nextDeparture, destinations } from "../../shared/rules/transport.js";
import { islandNames } from "../../shared/data/islands.js";
import { lines } from "../../shared/data/dialogue.js";
import { getState, act } from "../../core/state.js";
import { getCoins } from "../../player/wallet.js";
import { travel } from "../../screens/travel.js";
import { say, ask } from "../../core/dialogue.js";
import { coinsText } from "../../core/helpers.js";

async function visitOffice(line) {
    const save = getState();
    const here = save.island;
    const talk = lines[line.clerk];
    const trips = destinations(line, save, here);
    const departure = nextDeparture(line, save, here);
    const values = {
        line: line.name,
        price: coinsText(line.ticket),
        chart: chartName(line),
        chartPrice: coinsText(routeChartPrice),
        day: departure,
        wait: departure - save.day,
        place: line.stops.filter(stop => stop.town !== here).map(stop => islandNames[stop.town]).join(", "),
        days: trips[0] ? trips[0].days : line.legs[0],
    };

    const choices = [];
    const boardChoices = trips.map(trip => [
        "Board to " + islandNames[trip.town] + " (" + coinsText(line.ticket * trip.legs) + ")", trip,
    ]);
    boardChoices.forEach(([label]) => choices.push(label));
    const chartChoice = "Buy the route chart (" + values.chartPrice + ")";
    if (!save.charts.includes(line.id)) choices.push(chartChoice);
    choices.push("Leave");

    const question = trips.length ? talk.askBoard : talk.notToday;
    const answer = await ask(Array.isArray(question) ? question[0] : question, choices, line.clerk, values);

    if (answer === chartChoice) {
        const result = await act("transport.buyChart", { line: line.id });
        if (result.error) return say(result.error);
        return say(talk.chartBought, line.clerk, values);
    }
    const picked = boardChoices.find(([label]) => label === answer);
    if (!picked) return say(talk.notNow, line.clerk, values);
    const trip = picked[1];
    if (getCoins() < line.ticket * trip.legs) return say(talk.noCoins, line.clerk, values);

    const to = islandNames[trip.town];
    const result = await travel("The " + line.name + " sails to " + to, () => act("transport.board", { line: line.id, to: trip.town }),
        { kind: line.kind, days: trip.days, from: islandNames[here], to });
    if (result.error) return say(result.error);
    await say(talk.arrived, line.clerk, { ...values, days: trip.days, place: to });
}

export function transportOffice(button, lineId) {
    const line = findLine(lineId);
    return {
        button,
        isOpen: (time, day, save) => isRunning(line, save),
        open: () => visitOffice(line),
    };
}
