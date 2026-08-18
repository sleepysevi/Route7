import React, { useState } from 'react';
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

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 2400);
  };

  // Called when exiting splash screen
  const handleEnterApp = (initialQuery = '') => {
    setShowSplash(false);
    setCurrentTab('routes');
    if (initialQuery) {
      setRouteSearchQuery(initialQuery);
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
    <div className="flex min-h-screen flex-col bg-[#0b0c10] text-slate-100 selection:bg-[#ff4757] selection:text-white">
      {/* Toast Notification Container */}
      <Toast message={toastMessage} type={toastType} />

      {/* Splash Screen */}
      {showSplash ? (
        <Splash onEnter={handleEnterApp} />
      ) : (
        <>
          {/* Top Sticky Glassmorphic Navbar */}
          <Navbar
            currentTab={currentTab}
            onTabChange={handleTabChange}
            onOpenAbout={() => setIsAboutOpen(true)}
          />

          {/* Main Workspace Container */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {currentTab === 'routes' && (
              <RoutesTab
                routes={routesData}
                searchQuery={routeSearchQuery}
                onSearchChange={setRouteSearchQuery}
                selectedRoute={selectedRoute}
                onSelectRoute={setSelectedRoute}
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
          </main>

          {/* App Footer */}
          <footer className="border-t border-white/10 bg-[#090a0e] py-8 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-6xl px-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="font-['Syne',sans-serif] text-sm font-bold text-white">
                  Route<span className="text-[#ffbe0b]">7</span>
                </span>
              </div>
              <p>
                Made by a fellow commuter <strong className="text-slate-400">sleepysevi</strong>.
              </p>
              <div className="flex justify-center gap-4 pt-1 text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setIsAboutOpen(true)}
                  className="hover:text-white"
                >
                  Transit Guide
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleTabChange('hotlines')}
                  className="hover:text-white"
                >
                  Emergency Hotlines
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowSplash(true)}
                  className="hover:text-white"
                >
                  Godspeed
                </button>
              </div>
            </div>
          </footer>

          {/* About / Guide Modal */}
          <AboutModal
            isOpen={isAboutOpen}
            onClose={() => setIsAboutOpen(false)}
          />
        </>
      )}
    </div>
  );
}
