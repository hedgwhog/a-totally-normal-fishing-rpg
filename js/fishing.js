import { openEvent, setEventText, closeEvent } from "./dialogue.js";
import { isKey, keyHint, isListening } from "./keybinds.js";
import { getStat } from "./gear.js";
import { boostMultiplier } from "./itemBag.js";

export function startFishing(type) {
    return new Promise(resolve => {
        const barWidths = Array.isArray(type.barWidth) ? type.barWidth : Array(type.bars || 1).fill(type.barWidth);
        const barCount = barWidths.length;
        const zoneSize = Math.max(1, type.zone + getStat("zoneBonus", 0));

        const bars = barWidths.map(width => {
            const bar = { width: width, catchZone: Math.min(width - 1, zoneSize), fishDirection: -1 };
            bar.zoneStart = randomZoneStart(bar);
            return bar;
        });

        let activeBar = 0;
        let round = 1;
        let hits = 0;
        let position = 0;
        let direction = 1;
        let finished = false;
        let rewinds = getStat("rewind", 0);
        const focus = getStat("slowBar", 0);
        const focusWithTrinket = boostMultiplier("focus") > 1 ? Math.max(focus * 2, focus + 5) : focus;
        const lineSpeed = type.speed + focusWithTrinket;

        const fishDelay = type.fishSpeed * boostMultiplier("slow-fish");

        const temptation = Math.min(50, getStat("temptation", 0));
        const pastRounds = [];
        let lineTimer;
        let fishTimer;

        function randomZoneStart(bar) {
            return Math.floor(Math.random() * (bar.width - bar.catchZone + 1));
        }

        function switchBar(barNumber) {
            activeBar = barNumber;
            position = Math.min(position, bars[activeBar].width - 1);
        }

        function draw() {
            let text = "Click the button or press" + keyHint("reel") + " to reel.\n\nYou'll catch the fish after " + type.hits + " hits in " + type.rounds + " rounds.\n";
            text += "Round " + round + "/" + type.rounds + ", hits: " + hits;
            if (rewinds > 0) text += ", rewinds left: " + rewinds;
            let barText = "";
            bars.forEach((bar, barNumber) => {
                let line = "";
                for (let spot = 0; spot < bar.width; spot++) {
                    if (barNumber === activeBar && spot === position) line += "|";
                    else if (spot >= bar.zoneStart && spot < bar.zoneStart + bar.catchZone) line += "=";
                    else line += "-";
                }
                const marker = (barCount > 1 && barNumber === activeBar) ? "> " : "  ";
                barText += marker + "[" + line + "]\n";
            });
            setEventText(text, barText);
        }

        function moveLine() {
            const width = bars[activeBar].width;
            position += direction;
            if (position <= 0) {
                position = 0;
                direction = 1;
            }
            if (position >= width - 1) {
                position = width - 1;
                direction = -1;
            }
            draw();
            lineTimer = setTimeout(moveLine, lineSpeed);
        }

        function moveFish() {
            bars.forEach(bar => {
                const next = bar.zoneStart + bar.fishDirection;
                if (next < 0 || next > bar.width - bar.catchZone) bar.fishDirection = -bar.fishDirection;
                bar.zoneStart += bar.fishDirection;
            });
            draw();
            fishTimer = setTimeout(moveFish, nextFishDelay());
        }

        function touchingFish() {
            const bar = bars[activeBar];
            return position >= bar.zoneStart && position < bar.zoneStart + bar.catchZone;
        }

        function nextFishDelay() {
            if (temptation > 0 && touchingFish()) return fishDelay / (1 - temptation / 100);
            return fishDelay;
        }

        function stop() {
            finished = true;
            clearTimeout(lineTimer);
            clearTimeout(fishTimer);
            window.removeEventListener("keydown", spacebarReel);
            closeEvent();
            resolve(hits >= type.hits);
        }

        function reel() {
            if (finished) return;
            const bar = bars[activeBar];
            const hit = position >= bar.zoneStart && position < bar.zoneStart + bar.catchZone;
            if (hit) hits++;

            const caught = hits >= type.hits;
            const noChanceLeft = hits + (type.rounds - round) < type.hits && rewinds === 0;
            if (round === type.rounds || caught || noChanceLeft) {
                stop();
                return;
            }
            pastRounds.push({ hit: hit, bar: activeBar });
            round++;
            bar.zoneStart = randomZoneStart(bar);
            if (hit) switchBar((activeBar + 1) % barCount);
            draw();
        }

        function rewind() {
            if (finished || rewinds === 0 || pastRounds.length === 0) return;
            const lastRound = pastRounds.pop();
            if (lastRound.hit) hits--;
            switchBar(lastRound.bar);
            round--;
            rewinds--;
            bars[activeBar].zoneStart = randomZoneStart(bars[activeBar]);
            draw();
        }

        function spacebarReel(event) {
            if (!isKey(event, "reel") || event.repeat || isListening()) return;
            event.preventDefault();
            if (document.activeElement) document.activeElement.blur();
            reel();
        }

        const buttons = [["Click here to reel", reel]];
        if (rewinds > 0) buttons.push(["Rewind", rewind]);
        openEvent("", buttons);
        window.addEventListener("keydown", spacebarReel);
        draw();

        lineTimer = setTimeout(moveLine, lineSpeed);
        if (type.fishSpeed > 0) fishTimer = setTimeout(moveFish, nextFishDelay());
    });
}
