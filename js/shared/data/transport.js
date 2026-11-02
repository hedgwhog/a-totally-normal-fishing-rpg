// Ferry lines of the Blue Line Cooperation (named after fish). Used by the game and the server.
// (The highway trains of the Pantry Isles work differently, they are in data/areas/pantryIsles.js)
//
// stops:   in order. wait = days docked at that stop (the ship leaves on the last of those days)
// legs:    travel days between stop 1 and 2, 2 and 3, ... (a loop also has the leg back to stop 1)
// pattern: "backAndForth" = A > B > C > B > A ...    "loop" = A > B > C > A ...
// ticket:  coins per leg you ride
// startDay(save): the day the line starts running for this player (null = not running yet).
//          On that day the ship is docked at the first stop.
// waypoints (optional): { "fromTown>toTown": [[column, row], ...] } in world characters, to force a route.
//          Without it, the map finds the shortest route that keeps away from coasts.

export const routeChartPrice = 50;

export const transportLines = [
    {
        id: "ffc", // the id stays "ffc", old saves have route charts with it
        name: "Line Marlin",
        company: "Blue Line Cooperation",
        kind: "ferry",
        clerk: "ferryClerk",
        ticket: 190,
        pattern: "backAndForth",
        stops: [
            { town: "pointDriftt", wait: 8 },
            { town: "freshwaterHaven", wait: 8 },
        ],
        legs: [11],
        startDay: save => (save.driftt && save.driftt.doneDay != null ? save.driftt.doneDay : null),
    },
    {
        id: "tuna",
        name: "Line Tuna",
        company: "Blue Line Cooperation",
        kind: "ferry",
        clerk: "ferryClerk",
        ticket: 170,
        pattern: "backAndForth",
        stops: [
            { town: "freshwaterHaven", wait: 11 },
            { town: "capital", wait: 11 },
        ],
        legs: [7],
        // starts when the mayor asks you to bring Nikki (the first time you're in Freshwater Haven after Point Driftt)
        startDay: save => (save.pantry ? save.pantry.lineStart : null),
    },
];

export function findLine(id) {
    return transportLines.find(line => line.id === id);
}

export const chartName = line => "Route chart | " + line.name;
