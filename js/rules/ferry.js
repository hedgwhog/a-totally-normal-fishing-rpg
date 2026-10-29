import { ferry } from "../data/ferry.js";

const cycleDays = ferry.waitAtPointDriftt + ferry.travelDays + ferry.waitAtFreshwaterHaven + ferry.travelDays;

const leavesAfter = {
    pointDriftt: ferry.waitAtPointDriftt,
    freshwaterHaven: ferry.waitAtPointDriftt + ferry.travelDays + ferry.waitAtFreshwaterHaven,
};

export function ferryOpen(save) {
    return Boolean(save.driftt && save.driftt.doneDay !== undefined && save.driftt.doneDay !== null);
}

export function otherPort(port) {
    if (port === "pointDriftt") return "freshwaterHaven";
    return "pointDriftt";
}

export function nextDeparture(startDay, day, port) {
    const daysSinceStart = day - startDay;
    const cycleStart = startDay + Math.floor(daysSinceStart / cycleDays) * cycleDays;
    let departure = cycleStart + leavesAfter[port];
    if (departure < day) departure += cycleDays;
    return departure;
}