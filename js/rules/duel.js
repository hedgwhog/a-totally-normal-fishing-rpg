export function bounce(elapsed, stepMs, width, start, direction) {
    if (width <= 1 || stepMs <= 0) return start;
    const steps = Math.floor(elapsed / stepMs);
    const cycle = 2 * (width - 1);
    const phase = direction > 0 ? start : (cycle - start) % cycle;
    const place = (phase + steps) % cycle;
    return place <= width - 1 ? place : cycle - place;
}

export function positions(round, player, elapsed) {
    const zone = Math.max(1, Math.min(round.width - 1, round.zone + player.zoneBonus));
    const line = bounce(elapsed, round.lineSpeed + player.focus, round.width, 0, 1);
    const fishStart = Math.min(round.fishStart, round.width - zone);
    const fish = bounce(elapsed, round.fishSpeed, round.width - zone + 1, fishStart, round.fishDirection);
    return { line, fish, zone };
}

export function isHit(round, player, elapsed) {
    const { line, fish, zone } = positions(round, player, elapsed);
    return line >= fish && line < fish + zone;
}
