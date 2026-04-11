// splash.js — handles the welcome screen logic

(function () {
    // Build animated road dashes
    const dashContainer = document.getElementById('dashes');
    for (let i = 0; i < 24; i++) {
        const d = document.createElement('div');
        d.className = 'dash';
        dashContainer.appendChild(d);
    }

    // Quick-tag clicks
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const query = tag.getAttribute('data-query');
            document.getElementById('splash-search').value = query;
            enterApp(query);
        });
    });

    // Enter button
    document.getElementById('enter-btn').addEventListener('click', () => {
        const query = document.getElementById('splash-search').value.trim();
        enterApp(query);
    });

    // Also enter on pressing Enter in the search box
    document.getElementById('splash-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            enterApp(e.target.value.trim());
        }
    });

    function enterApp(query = '') {
        const splash = document.getElementById('splash');
        const app    = document.getElementById('main-app');

        // Animate splash out
        splash.classList.add('splash-exit');

        setTimeout(() => {
            splash.style.display = 'none';
            app.classList.remove('hidden');

            // Pre-fill the main search bar and trigger filter
            if (query) {
                const searchInput = document.getElementById('searchInput');
                searchInput.value = query;
                // Dispatch input event so app.js search listener picks it up
                searchInput.dispatchEvent(new Event('input'));
            }

            // Re-init lucide icons for the main app
            lucide.createIcons();
        }, 420);
    }
})();