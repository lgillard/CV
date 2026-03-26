/**
 * Highlight elements script
 *
 * Highlights elements annotated with [data-highlight-keys] when their key
 * matches an active URL search param (value === "1").
 *
 * Behaviour depends on the element tag:
 *   - <span> : the element is replaced by a <strong> (attributes and content are preserved)
 *   - other  : the element's content is wrapped in a <strong> child
 *
 * HTML annotation examples:
 *   <li data-highlight-keys="php">PHP</li>
 *   <li data-highlight-keys="php symfony">PHP / Symfony</li>
 *   <li><span data-highlight-keys="php">PHP</span> / Symfony</li>
 */

/**
 * Determines if element should be highlighted (based on its data-highlight-keys attribute and the active keys set).
 *
 * @param {HTMLElement} el
 * @param {Set<string>} activeKeys
 * @returns {boolean}
 */
function shouldHighlight(el, activeKeys) {
    const raw = el.dataset.highlightKeys ?? '';
    return raw
        .trim()
        .split(/\s+/) // Attribute may contain multiple keys separated by spaces (exp: "xxx yyy")
        .some(key => activeKeys.has(key.toLowerCase()));
}

/**
 * Highlights targeted element.
 * - If the element is a <span>: replaces it with a <strong> (same attributes, same content).
 * - Otherwise: wraps its content in a <strong> child.
 *
 * @param {HTMLElement} targetElmt
 */
function highlightElement(targetElmt) {
    if (targetElmt.tagName === 'SPAN') {
        // Replace the <span> itself with a <strong>, preserving attributes and content
        const strong = document.createElement('strong');

        for (const { name, value } of targetElmt.attributes) {
            strong.setAttribute(name, value);
        }

        while (targetElmt.firstChild) {
            strong.appendChild(targetElmt.firstChild);
        }

        targetElmt.replaceWith(strong);
    } else {
        // Prevent double-wrapping
        if (targetElmt.querySelector('strong[data-highlighted]')) return;

        // Wrap content in a <strong> child
        const strong = document.createElement('strong');
        strong.dataset.highlighted = '';

        while (targetElmt.firstChild) {
            strong.appendChild(targetElmt.firstChild);
        }
        targetElmt.appendChild(strong);
    }
}

/**
 * Extracts active keys from URL search params.
 * A key is considered active when its value is "1".
 *
 * @param {URLSearchParams} params
 * @returns {Set<string>} Set of active keys, lowercased.
 */
function getActiveKeys(params) {
    const active = new Set();
    for (const [key, value] of params.entries()) {
        if (value === '1') {
            active.add(key.toLowerCase());
        }
    }
    return active;
}

// =====================================================================================================================
function main() {
    const params = new URLSearchParams(window.location.search);

    const activeKeys = getActiveKeys(params);
    if (activeKeys.size === 0) return;

    // Highlights matching elements in the document
    document
        .querySelectorAll('[data-highlight-keys]')
        .forEach(el => {
            if (shouldHighlight(el, activeKeys)) {
                highlightElement(el);
            }
        });
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}