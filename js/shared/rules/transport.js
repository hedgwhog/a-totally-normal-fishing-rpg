// Where every transport line is on a given day. Used by the game (office, map) and the server (boarding).

import { transportLines } from "../data/transport.js";

// the stops in the order the ship visits them, with the leg after each visit
export function visits(line) {
    const stops = line.stops.map((stop, index) => ({ ...stop, index }));
    if (line.pattern === "loop") return stops.map((stop, i) => ({ ...stop, leg: line.legs[i] }));
    const there = stops.map((stop, i) => ({ ...stop, leg: line.legs[i] }));
    const back = stops.slice(1, -1).reverse().map(stop => ({ ...stop, leg: line.legs[stop.index - 1] }));
    there[there.length - 1].leg = line.legs[stops.length - 2];
    return [...there, ...back];
}

export function cycleDays(line) {
    return visits(line).reduce((sum, visit) => sum + visit.wait + visit.leg, 0);
}

export function isRunning(line, save) {
    return line.startDay(save) != null;
}

export function linesAt(town, save) {
    return transportLines.filter(line => isRunning(line, save) && line.stops.some(stop => stop.town === town));
}

// Where the ship is at a moment (day can have a fraction, for the time of day).
// docked:    { docked: true, town, departs }               departs = the day it leaves
// traveling: { docked: false, from, to, progress, arrives } progress = 0..1
export function linePosition(line, save, moment = save.day + save.timeIndex / 4) {
    const start = line.startDay(save);
    if (start == null) return null;
    const list = visits(line);
    const cycle = cycleDays(line);
    const round = Math.floor((moment - start) / cycle);
    let time = start + round * cycle;
    for (let i = 0; i < list.length; i++) {
        const visit = list[i];
        const departs = time + visit.wait;
        if (moment < departs + 1) return { docked: true, town: visit.town, departs, visit: i };
        const arrives = departs + visit.leg;
        if (moment < arrives) {
            return { docked: false, from: visit.town, to: list[(i + 1) % list.length].town, progress: (moment - departs) / visit.leg, arrives, visit: i };
        }
        time = arrives;
    }
    return { docked: true, town: list[0].town, departs: time + list[0].wait, visit: 0 };
}

// The next day the ship leaves from this town (today counts)
export function nextDeparture(line, save, town) {
    const start = line.startDay(save);
    if (start == null) return null;
    const list = visits(line);
    const cycle = cycleDays(line);
    let time = start + Math.max(0, Math.floor((save.day - start) / cycle) - 1) * cycle;
    for (let guard = 0; guard < list.length * 3; guard++) {
        const visit = list[guard % list.length];
        const departs = time + visit.wait;
        if (visit.town === town && departs >= save.day) return departs;
        time = departs + visit.leg;
    }
    return null;
}

// Where you can ride to when boarding at this town today: every stop until the ship is back here.
// [{ town, legs, days }]  days = from today until you arrive (waits at stops in between included)
export function destinations(line, save, town) {
    const list = visits(line);
    const position = linePosition(line, save, save.day);
    if (!position || !position.docked || position.town !== town || position.departs !== save.day) return [];
    const result = [];
    let days = 0;
    let legs = 0;
    for (let step = 0; step < list.length - 1; step++) {
        const here = list[(position.visit + step) % list.length];
        const next = list[(position.visit + step + 1) % list.length];
        days += here.leg + (step > 0 ? here.wait : 0);
        legs++;
        if (next.town === town) break;
        if (!result.some(stop => stop.town === next.town)) result.push({ town: next.town, legs, days });
    }
    return result;
}
