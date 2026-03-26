const CONTRAST_TARGETS = Object.freeze({
    WHITE: 5.47,
    PAIR: 4.85,
});

// Color conversion tools ===================================================

function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return {
        r: (n >> 16) & 255,
        g: (n >> 8) & 255,
        b: n & 255,
    };
}

function rgbToHex({r, g, b}) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl({r, g, b}) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {h, s, l};
}

function hslToRgb({h, s, l}) {
    function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    if (s === 0) {
        const v = Math.round(l * 255);
        return {r: v, g: v, b: v};
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
        r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
}

// Contrast calculation ==============================================

/**
 * Computes the relative luminance of an RGB color (WCAG 2.1).
 *
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {number} Luminance in the [0, 1] range.
 */
function luminance({r, g, b}) {
    const linearize = v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Computes the WCAG 2.1 contrast ratio between two RGB colors.
 *
 * @param {{ r: number, g: number, b: number }} c1
 * @param {{ r: number, g: number, b: number }} c2
 * @returns {number} Contrast ratio in the [1, 21] range.
 */
function contrast(c1, c2) {
    const l1 = luminance(c1);
    const l2 = luminance(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Finds the lightness value that brings the contrast between the color (h, s, l)
 * and a reference color as close as possible to the target ratio.
 *
 * The search iterates over lightness values in [minL, 1], keeping hue and
 * saturation fixed. Use `minL = 0` (default) to search the full range.
 *
 * Note: when computing color-2, `minL` should be set to color-1's lightness
 * to ensure color-2 is always lighter than color-1 (i.e. suitable as a background).
 *
 * @param {number} h - Hue in [0, 1].
 * @param {number} s - Saturation in [0, 1].
 * @param {number} targetContrast - Desired WCAG contrast ratio.
 * @param {{ r: number, g: number, b: number }} referenceRgb - Color to contrast against.
 * @param {number} [minL=0] - Minimum lightness to start the search from.
 * @returns {{ h: number, s: number, l: number }}
 */
function findLightnessForContrast(h, s, targetContrast, referenceRgb, minL = 0) {
    let best = null;
    let bestDiff = Infinity;

    for (let l = minL; l <= 1; l += 0.001) {
        const rgb = hslToRgb({h, s, l});
        const diff = Math.abs(contrast(rgb, referenceRgb) - targetContrast);
        if (diff < bestDiff) {
            bestDiff = diff;
            best = {h, s, l};
        }
    }

    return best;
}

// URL parameter parsing ========================================================

/**
 * Reads and validates the `color1` hex param from URL search params.
 *
 * @param {URLSearchParams} params
 * @returns {string|null} Color in "rrggbb" format, or null if absent or invalid.
 */
function getColor1(params) {
    const value = params.get('color1')?.trim();
    return /^[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

/**
 * Reads and validates the `color2` hex param from URL search params.
 *
 * @param {URLSearchParams} params
 * @returns {string|null} Color in "rrggbb" format, or null if absent or invalid.
 */
function getColor2(params) {
    const value = params.get('color2')?.trim();
    return /^[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

// Theme palette computation ====================================================

/**
 * Computes the final color1 and color2 custom property values (following expected contrast values).
 *
 * @param {string} targetColor1 - Hex color driving color-1
 * @param {string} targetColor2 - Hex color driving color-2
 * @returns {{ color1: string, color2: string }} Final hex values
 */
function buildThemeColors(targetColor1, targetColor2) {
    const {h: h1, s: s1} = rgbToHsl(hexToRgb(targetColor1));
    const white = Object.freeze({r: 255, g: 255, b: 255});
    const color1Hsl = findLightnessForContrast(h1, s1, CONTRAST_TARGETS.WHITE, white);
    const color1Rgb = hslToRgb(color1Hsl);

    const {h: h2, s: s2} = rgbToHsl(hexToRgb(targetColor2));
    const color2Hsl = findLightnessForContrast(h2, s2, CONTRAST_TARGETS.PAIR, color1Rgb, color1Hsl.l);
    const color2Rgb = hslToRgb(color2Hsl);

    return {color1: rgbToHex(color1Rgb), color2: rgbToHex(color2Rgb)};
}

// ===================================================================================================================

/**
 * Reads color1 and color2 from the URL search params and applies the computed (following predefined contrasts) theme
 * palette via CSS vars
 */
function main() {
    const params = new URLSearchParams(window.location.search);

    const targetColor1 = getColor1(params);
    if (!targetColor1) return;

    const targetColor2 = getColor2(params) ?? targetColor1;

    const {color1, color2} = buildThemeColors(targetColor1, targetColor2);

    document.documentElement.style.setProperty('--color-1', color1);
    document.documentElement.style.setProperty('--color-2', color2);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}