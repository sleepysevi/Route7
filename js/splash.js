// splash.js — handles the welcome screen logic (Modernized)

(function () {
    // Build animated road dashes
    const dashContainer = document.getElementById('dashes');
    for (let i = 0; i < 28; i++) {
        const d = document.createElement('div');
        d.className = 'dash';
        dashContainer.appendChild(d);
    }

    // Quick-tag clicks with haptic feedback simulation
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const query = tag.getAttribute('data-query');
            document.getElementById('splash-search').value = query;
            
            // Add a quick pulse effect
            tag.style.transform = 'scale(0.95)';
            setTimeout(() => {
                tag.style.transform = '';
                enterApp(query);
            }, 100);
        });
    });

    // Enter button with enhanced feedback
    const enterBtn = document.getElementById('enter-btn');
    enterBtn.addEventListener('click', () => {
        const query = document.getElementById('splash-search').value.trim();
        enterBtn.style.transform = 'scale(0.97)';
        setTimeout(() => {
            enterBtn.style.transform = '';
            enterApp(query);
        }, 100);
    });

    // Also enter on pressing Enter in the search box
    document.getElementById('splash-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            enterApp(e.target.value.trim());
        }
    });

    // Focus search on any key press (for quick typing)
    document.addEventListener('keydown', (e) => {
        const splash = document.getElementById('splash');
        const searchInput = document.getElementById('splash-search');
        
        // If splash is visible and key is a letter/number, focus the search
        if (splash.style.display !== 'none' && 
            !e.ctrlKey && !e.metaKey && !e.altKey &&
            e.key.length === 1 && document.activeElement !== searchInput) {
            searchInput.focus();
        }
    });

    function enterApp(query = '') {
        const splash = document.getElementById('splash');
        const app    = document.getElementById('main-app');

        // Animate splash out with a smooth transition
        splash.classList.add('splash-exit');

        setTimeout(() => {
            splash.style.display = 'none';
            app.classList.remove('hidden');
            
            // Add a subtle entrance animation to the app
            app.style.opacity = '0';
            app.style.transform = 'translateY(10px)';
            
            requestAnimationFrame(() => {
                app.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                app.style.opacity = '1';
                app.style.transform = 'translateY(0)';
            });

            // Pre-fill the main search bar and trigger filter
            if (query) {
                const searchInput = document.getElementById('searchInput');
                searchInput.value = query;
                // Dispatch input event so app.js search listener picks it up
                searchInput.dispatchEvent(new Event('input'));
            }

            // Re-init lucide icons for the main app (if available)
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 450);
    }
})();
