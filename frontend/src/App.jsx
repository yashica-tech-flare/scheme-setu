import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Results from './pages/Results';
import PartnerLocator from './pages/PartnerLocator';
import Guide from './pages/Guide';
import Track from './pages/Track';
import AdminTrack from './pages/AdminTrack';

export default function App() {
  const { i18n } = useTranslation();

  // Sync document direction (RTL/LTR) and html lang attribute dynamically
  useEffect(() => {
    const isRtl = ['ur', 'ks', 'sd'].includes(i18n.language);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<Results />} />
            <Route path="/partners" element={<PartnerLocator />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/track" element={<Track />} />
            <Route path="/admin/track" element={<AdminTrack />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
