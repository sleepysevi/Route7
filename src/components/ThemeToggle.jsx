import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleTheme(event) {
    const root = document.documentElement;
    const nextDark = !root.classList.contains('dark');

    const applyTheme = () => {
      root.classList.toggle('dark', nextDark);
      setDark(nextDark);
    };

    // Graceful fallback for browsers without View Transitions.
    if (!document.startViewTransition) {
      applyTheme();
      return;
    }

    // Respect users who opt out of motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme();
      return;
    }

    const { clientX, clientY } = event;
    const radius = Math.hypot(
      Math.max(clientX, window.innerWidth - clientX),
      Math.max(clientY, window.innerHeight - clientY)
    );

    const transition = document.startViewTransition(applyTheme);

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${clientX}px ${clientY}px)`,
            `circle(${radius}px at ${clientX}px ${clientY}px)`,
          ],
        },
        {
          duration: 550,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-black/10 bg-black/[0.03] text-slate-600 transition-colors hover:bg-black/[0.06] hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
