/**
 * Extracts job title from URL search params.
 *
 * @param {URLSearchParams} params
 * @returns {string|null} Customized job title
 */
function getJobTitle(params) {
    const value = params.get('jobTitle')?.trim();
    return value || null;
}

/**
 * Replace job title part of <title> by the given jobTitle
 * @param {string} jobTitle
 */
function updateDocumentTitle(jobTitle) {
    const el = document.getElementById('document-title');
    if (!el) return;

    el.textContent = `CV de Julien Gillard - ${jobTitle}`;
}

/**
 * Replace job title <p> by the given jobTitle
 * @param {string} jobTitle
 */
function updateJobTitle(jobTitle) {
    const el = document.getElementById('job-title');

    if (!el) return;

    el.textContent = jobTitle;
}

// =====================================================================================================================
function main() {
    const params = new URLSearchParams(window.location.search);

    const jobTitle = getJobTitle(params);
    if (!jobTitle) return;

    updateDocumentTitle(jobTitle);
    updateJobTitle(jobTitle)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}