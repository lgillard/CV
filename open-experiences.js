/**
 * Open experiences script
 *
 * Opens <details> elements annotated with [data-xp-id] when the URL contains
 * the corresponding param "xp_{id}=open".
 *
 * HTML annotation example:
 *   <details data-xp-id="kiplin">...</details>
 *   → opened by: ?xp_kiplin=open
 */

/**
 * Extracts the IDs of experiences to open from URL search params.
 * A details is opened when its param value equals "open".
 *
 * @param {URLSearchParams} params
 * @returns {Set<string>} Set of IDs to open.
 */
function getXpIdsToOpen(params) {
    const ids = new Set();
    for (const [key, value] of params.entries()) {
        if (value !== 'open') continue;
        const match = key.match(/^xp_(.+)$/);
        if (match) ids.add(match[1]);
    }
    return ids;
}

/**
 * Opens a <details> element.
 *
 * @param {HTMLDetailsElement} detailsEl
 */
function openExperience(detailsEl) {
    detailsEl.setAttribute('open', '');
}

// =====================================================================================================================
function main() {
    const params = new URLSearchParams(window.location.search);
    const idsToOpen = getXpIdsToOpen(params);
    if (idsToOpen.size === 0) return;

    document
        .querySelectorAll('[data-xp-id]')
        .forEach(el => {
            if (idsToOpen.has(el.dataset.xpId)) {
                openExperience(el);
            }
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}