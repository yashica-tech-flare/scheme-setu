import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ResultsCard from '../components/ResultsCard';
import EMISlider from '../components/EMISlider';
import GuidancePanel from '../components/GuidancePanel';
import { api } from '../api/client';
import {
  Award,
  Sparkles,
  ArrowLeft,
  Calculator,
  MapPin,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Info
} from 'lucide-react';

export default function Results() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [inputData, setInputData] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Try to get results from React Router state
    if (location.state?.results) {
      setResults(location.state.results);
      setInputData(location.state.input);
      if (location.state.results.length > 0) {
        setSelectedScheme(location.state.results[0]);
      }
      return;
    }

    // 2. Try to get from sessionStorage
    const cachedResults = sessionStorage.getItem('scheme_setu_results');
    const cachedInput = sessionStorage.getItem('scheme_setu_input');

    if (cachedResults && cachedInput) {
      try {
        const parsedResults = JSON.parse(cachedResults);
        const parsedInput = JSON.parse(cachedInput);
        setResults(parsedResults);
        setInputData(parsedInput);
        if (parsedResults.length > 0) {
          setSelectedScheme(parsedResults[0]);
        }
        return;
      } catch (e) {
        console.warn('Failed parsing stored results:', e);
      }
    }

    // 3. Fallback: Run default recommendation for ₹1.4L small business
    const fetchDefault = async () => {
      try {
        setLoading(true);
        const defaultInput = {
          income: 250000,
          projectCost: 140000,
          projectType: 'small_business',
          isEducation: false,
          gender: 'female'
        };
        const data = await api.getRecommendations(defaultInput);
        setResults(data);
        setInputData(defaultInput);
        if (data.length > 0) {
          setSelectedScheme(data[0]);
        }
      } catch (err) {
        console.error('Error fetching fallback recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDefault();
  }, [location.state]);

  const handleSchemeSelect = (scheme) => {
    setSelectedScheme(scheme);
    // Smooth scroll to EMI section
    const emiSection = document.getElementById('emi-section');
    if (emiSection) {
      emiSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            to="/#recommender"
            className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-600 hover:text-saffron-700 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('results.recheck')}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('results.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('results.subtitle')}
            {inputData && ` • Family Income: ₹${inputData.income?.toLocaleString('en-IN')} | Project Need: ₹${inputData.projectCost?.toLocaleString('en-IN')}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/partners"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-saffron-400" />
            {t('locator.title')}
          </Link>
        </div>
      </div>

      {/* Persistent Defensible Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-300/80 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
        <Info className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Official Governance Note:</strong> {t('results.aiDisclaimer')}
        </p>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-saffron-600" />
          <p className="text-sm font-medium">Matching eligible concessional schemes against NSFDC rules...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">
            {t('results.noSchemesFound')}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Please adjust your project cost or verify that family income is within the ₹5 Lakh threshold.
          </p>
          <Link
            to="/#recommender"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-saffron-600 text-white font-bold text-xs"
          >
            {t('results.recheck')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((scheme, idx) => (
            <ResultsCard
              key={scheme._id || idx}
              scheme={scheme}
              onSelectForEMI={handleSchemeSelect}
            />
          ))}
        </div>
      )}

      {/* Embedded Live Scheme-Aware EMI Simulator */}
      <div id="emi-section" className="pt-6">
        <EMISlider initialScheme={selectedScheme} />
      </div>

      {/* Document Guidance & Sanction Roadmap */}
      <div>
        <GuidancePanel scheme={selectedScheme} />
      </div>
    </div>
  );
}
