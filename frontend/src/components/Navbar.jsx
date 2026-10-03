import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { Landmark, Compass, MapPin, Calculator, FileCheck, PhoneCall, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Landmark },
    { to: '/#recommender', label: t('nav.finder'), icon: Compass },
    { to: '/partners', label: t('nav.locator'), icon: MapPin },
    { to: '/guide', label: t('nav.guidance'), icon: FileCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-slate-800 text-white backdrop-blur-md shadow-md">
      {/* Tricolor Top Bar */}
      <div className="gov-tricolor-bar w-full" />

      {/* Top micro-bar for national announcement */}
      <div className="hidden sm:flex justify-between items-center px-4 sm:px-8 py-1 bg-slate-950 text-[11px] text-slate-400 border-b border-slate-800/80">
        <span className="flex items-center gap-1.5 font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {t('nav.nationalPortal')} • NSFDC & NBCFDC Concessional Windows
        </span>
        <span className="flex items-center gap-1.5 text-saffron-400 font-semibold">
          <PhoneCall className="w-3 h-3" />
          {t('nav.helpdesk')}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-saffron-600 via-amber-500 to-emerald-600 p-0.5 shadow-glow flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Landmark className="w-5 h-5 sm:w-6 sm:h-6 text-saffron-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-saffron-400 transition-colors">
                  {t('nav.title')}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                  SC Credit
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {t('nav.subtitle')}
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-slate-800 text-saffron-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-75" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Controls: Language Switcher + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98 px-4 pt-3 pb-5 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-base font-medium rounded-lg ${
                  isActive
                    ? 'bg-slate-800 text-saffron-400 font-semibold'
                    : 'text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-5 h-5 text-saffron-400" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
