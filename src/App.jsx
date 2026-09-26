import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Splash from './components/Splash';
import RoutesTab from './components/RoutesTab';
import DictTab from './components/DictTab';
import SpotsTab from './components/SpotsTab';
import HotlinesTab from './components/HotlinesTab';
import AboutModal from './components/AboutModal';
import Toast from './components/Toast';
import routesData from '../data/routes.json';
import dictData from '../data/dictionary.json';
import spotsData from '../data/spots.json';
import { ROUTE_COORDS } from '../data/route-coords.js';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState('routes');
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [enterOrigin, setEnterOrigin] = useState({ x: 0, y: 0, radius: 2000 });
  const [isIrisEntering, setIsIrisEntering] = useState(false);
  const [showAllRoutes, setShowAllRoutes] = useState(false);

  // Keyboard shortcut listener ('?' to toggle guide)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || e.target?.isContentEditable) {
        return;
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsAboutOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 2400);
  };

  // Called when exiting splash screen
  const handleEnterApp = (initialQuery = '', origin) => {
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const radius = Math.max(
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y),
    );
    setEnterOrigin({ x, y, radius });
    setIsIrisEntering(true);
    window.setTimeout(() => setIsIrisEntering(false), 720);
    setShowSplash(false);
    setCurrentTab('routes');
    if (initialQuery) {
      setRouteSearchQuery(initialQuery);
      showToast(`Starting with ${initialQuery}`);
    }
  };

  // Switch tab safely
  const handleTabChange = (tabId) => {
    setCurrentTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When clicking a jeepney route code badge inside a spot card
  const handleSelectJeepneyRoute = (routeCode) => {
    const matched = routesData.find((r) => r.code === routeCode);
    setCurrentTab('routes');
    setRouteSearchQuery(routeCode);
    if (matched) {
      setSelectedRoute(matched);
    }
    showToast(`Jumped to route ${routeCode}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-canvas text-ink selection:bg-primary selection:text-white">
      {/* Toast Notification Container */}
      <Toast message={toastMessage} type={toastType} />

      {/* Splash Screen */}
      {showSplash ? (
        <Splash onEnter={handleEnterApp} onOpenAbout={() => setIsAboutOpen(true)} />
      ) : (
        <motion.div
          className="flex min-h-screen w-full min-w-0 flex-col"
        >
          {/* Top Sticky Glassmorphic Navbar */}
          <Navbar
            currentTab={currentTab}
            onTabChange={handleTabChange}
          />

          {/* Main Workspace Container */}
          <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentTab}
                  initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.8 }}
                  animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
                  exit={{ clipPath: 'inset(0 0 0 100%)', opacity: 0.8 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {currentTab === 'routes' && (
                    <RoutesTab
                      routes={routesData}
                      searchQuery={routeSearchQuery}
                      onSearchChange={setRouteSearchQuery}
                      selectedRoute={selectedRoute}
                      onSelectRoute={setSelectedRoute}
                onShowAllRoutesChange={setShowAllRoutes}
                    />
                  )}

                  {currentTab === 'dict' && (
                    <DictTab dictionary={dictData} onToast={showToast} />
                  )}

                  {currentTab === 'spots' && (
                    <SpotsTab
                      spots={spotsData}
                      onSelectJeepneyRoute={handleSelectJeepneyRoute}
                    />
                  )}

                  {currentTab === 'hotlines' && <HotlinesTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* App Footer */}
          <motion.footer
            initial={{ opacity: 0.72, y: 20 }}
            animate={{
              opacity: showAllRoutes ? 1 : 0.72,
              y: showAllRoutes ? 0 : 20,
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-line bg-canvas-deep py-8 text-center text-xs text-dim"
          >
            <div className="mx-auto max-w-6xl px-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="font-['Syne',sans-serif] text-sm font-bold text-ink">
                  Route<span className="text-accent-ink">7</span>
                </span>
              </div>
              <p>
                Made by a fellow commuter <strong className="text-muted">sleepysevi</strong>.
              </p>
              <div className="flex justify-center gap-4 pt-1 text-[11px] text-muted">
                <button
                  type="button"
                  onClick={() => setIsAboutOpen(true)}
                  className="hover:text-ink"
                >
                  Transit Guide
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleTabChange('hotlines')}
                  className="hover:text-ink"
                >
                  Emergency Hotlines
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowSplash(true)}
                  className="hover:text-ink"
                >
                  Godspeed
                </button>
              </div>
            </div>
          </motion.footer>

        </motion.div>
      )}

      {/* Retracting iris curtain. The app stays unclipped underneath it. */}
      {isIrisEntering && (
        <motion.div
          initial={{ clipPath: `circle(${enterOrigin.radius}px at ${enterOrigin.x}px ${enterOrigin.y}px)` }}
          animate={{ clipPath: `circle(0px at ${enterOrigin.x}px ${enterOrigin.y}px)` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-0 z-[60] bg-canvas"
          aria-hidden="true"
        />
      )}

      {/* About / Guide Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

    </div>
  );
}
