
name: lighting-advanced
description: "Advanced lighting: 5-step mixed-light matching, Kelvin+tint metering, dominant practical rule, CRI vs TLCI, dimming drift, portable LED blending."
tags: [lighting, mixed-light, practical, kelvin, tint]

# Advanced Lighting

5600K key + 2800K practical = two worlds in one frame; grade cannot fix it — match before you shoot. Kelvin ≠ spectrum: same Kelvin, different spectral distributions; practicals carry tint axes Kelvin cannot solve (fluorescent green, tungsten warmth).

## Five-step mixed-light match
1. Meter the practical (Kelvin + tint — Kelvin-only meters are insufficient; the tint axis is green/magenta).
2. Set a bi-colour LED to the measured Kelvin.
3. Meter the LED against the practical reading.
4. Correct the tint with ±green gel.
5. Through-camera verification with the monitor white-balanced to the practical — eyes lie under mixed light; re-verify after every change (lamp moves, dimming, bulb swaps, daylight shifts, long days).

## Gel decision tree
- Tint shift (fluorescent green) → minus-green gel.
- Beyond bi-colour range (<2700K) → stack CTO on the warmest setting.
- Coloured practicals (neon/coloured bulbs) → gel the practical or RGBWW; bi-colour only manages white balance in neutral areas.
- Emergency fallback: lock white balance to the practical's nominal Kelvin and match by monitor — but tint is invisible to the eye; get a meter.

## Dominant practical rule
Match the most prominent/motivating practical. For secondary conflicts: swap in colour-corrected bulbs, gel the shade, or exclude from frame — a compromise between two mismatched practicals fails in every frame.

## Drift and measurement discipline
- Measure at the working intensity, not full power: cheap LEDs bias at low output; dimmed tungsten warms.
- CRI vs TLCI: CRI is human-eye rendering, TLCI is camera rendering — use TLCI for video decisions.
- Portable LED = ambient extension: match the window/lamp colour temp, enlarge the source (softbox or white-wall bounce), add only 0.3-1 stop over ambient or the environment feel dies.
- Practical-first aesthetics (Hou Hsiao-hsien): lamps enhance and complete the practical logic so the audience believes "it was always this bright".

## AI generation application
- Encode lighting parameters in prompts: "key light upper left, warm 5600K, shadows to the right"; name the practical sources visible in frame.
- Never defer cheap-LED green/magenta drift to a post "unify" pass — fix on set (or state the light logic in the prompt so generation matches).