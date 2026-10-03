import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api/client';
import {
  MapPin,
  Navigation,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Filter,
  Layers,
  Search,
  Activity,
  X,
  Sparkles
} from 'lucide-react';

// Fix Leaflet's default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Custom colored SVG pin markers
const createCustomIcon = (type) => {
  let color = '#ea580c'; // default orange/saffron
  let label = 'SCA';

  if (type === 'PSB') {
    color = '#2563eb'; // blue
    label = 'PSB';
  } else if (type === 'RRB') {
    color = '#16a34a'; // green
    label = 'RRB';
  } else if (type === 'NBFC-MFI') {
    color = '#9333ea'; // purple
    label = 'MFI';
  }

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="34" height="44">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="18" cy="18" r="11" fill="#ffffff"/>
      <text x="18" y="22" font-size="9" font-family="sans-serif" font-weight="bold" fill="${color}" text-anchor="middle">${label}</text>
    </svg>
  `;

  return L.divIcon({
    html: svgString,
    className: 'custom-partner-marker',
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40]
  });
};

// Component to dynamically re-center Leaflet map
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 12, { animate: true });
      setTimeout(() => map.invalidateSize(), 300);
    }
  }, [center, zoom, map]);
  return null;
}

export default function PartnerMap({ selectedSchemeName, onPartnerSelected }) {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  // Map state
  const [coords, setCoords] = useState({ lat: 28.63, lng: 77.22 }); // Default Delhi
  const [activeCity, setActiveCity] = useState('Delhi');
  const [cityList, setCityList] = useState(['Delhi', 'Lucknow', 'Mumbai', 'Jaipur', 'Bhopal', 'Patna']);
  const [partnerType, setPartnerType] = useState('');
  const [schemeFilter, setSchemeFilter] = useState(selectedSchemeName || '');
  const [radiusKm, setRadiusKm] = useState(50);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Schemes metadata state
  const [allSchemes, setAllSchemes] = useState([]);
  const [selectedSchemeRecord, setSelectedSchemeRecord] = useState(null);

  // Data state
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePartner, setActivePartner] = useState(null);

  // Pre-configured city coordinates
  const cityCoordinates = {
    'Delhi': { lat: 28.6315, lng: 77.2167 },
    'Lucknow': { lat: 26.8467, lng: 80.9462 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Bhopal': { lat: 23.2599, lng: 77.4126 },
    'Patna': { lat: 25.6093, lng: 85.1376 },
    'Gurugram': { lat: 28.4595, lng: 77.0266 }
  };

  // Sync selectedSchemeName if passed from parent
  useEffect(() => {
    if (selectedSchemeName) {
      setSchemeFilter(selectedSchemeName);
    }
  }, [selectedSchemeName]);

  // Load verified schemes to power the agency-filter engine
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const list = await api.getSchemes();
        setAllSchemes(list || []);
      } catch (err) {
        console.error('Failed to fetch schemes in PartnerMap:', err);
      }
    };
    fetchSchemes();
  }, []);

  // Sync selectedSchemeRecord whenever schemeFilter or allSchemes changes
  useEffect(() => {
    if (schemeFilter && allSchemes.length > 0) {
      const match = allSchemes.find(
        (s) => (s.schemeName || s.name) === schemeFilter || s._id === schemeFilter
      );
      setSelectedSchemeRecord(match || null);
    } else {
      setSelectedSchemeRecord(null);
    }
  }, [schemeFilter, allSchemes]);

  // Load cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const list = await api.getCities();
        if (list && list.length > 0) {
          setCityList(list);
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      }
    };
    fetchCities();
  }, []);

  // Fetch partners with current filter parameters
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const params = {
          lat: coords.lat,
          lng: coords.lng,
          radiusKm: radiusKm || undefined
        };
        if (partnerType) params.type = partnerType;
        if (schemeFilter) params.scheme = schemeFilter;

        const data = await api.getPartners(params);
        setPartners(data || []);
      } catch (err) {
        console.error('Failed to fetch partners:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [coords, partnerType, schemeFilter, radiusKm]);

  // Filter partners by channelizingAgencies of the selected scheme if active
  const authorizedAgencies = selectedSchemeRecord?.channelizingAgencies || [];

  const displayedPartners = partners.filter((p) => {
    if (authorizedAgencies.length > 0) {
      return authorizedAgencies.includes(p.type);
    }
    return true;
  });

  // Use Browser Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setCoords({ lat: userLat, lng: userLng });
        setActiveCity('Current Location');
        setIsLocating(false);
        setLocationStatus('Centered on your live location');
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setIsLocating(false);
        setLocationStatus('Location permission denied. Defaulted to city center.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // City Selector Change
  const handleCityChange = (city) => {
    setActiveCity(city);
    if (cityCoordinates[city]) {
      setCoords(cityCoordinates[city]);
      setLocationStatus(`Centered on ${city}`);
    }
  };

  const clearSchemeFilter = () => {
    setSchemeFilter('');
    setSelectedSchemeRecord(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white border-b border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-saffron-400 text-xs font-bold uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4" />
              Interactive Geo-Spatial Network
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t('locator.title')}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              {t('locator.subtitle')}
            </p>
          </div>

          {/* Quick Geolocation CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              id="geo-locate-btn"
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="px-4 py-2.5 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-saffron-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              {t('locator.searchNearMe')}
            </button>

            {/* City Quick Dropdown */}
            <select
              id="city-select-dropdown"
              value={activeCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-saffron-500"
            >
              {cityList.map((c) => (
                <option key={c} value={c}>
                  📍 {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {locationStatus && (
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {locationStatus}
          </p>
        )}
      </div>

      {/* NSFDC Authorized Channel Agency Active Banner */}
      {selectedSchemeRecord && (
        <div className="bg-saffron-50 border-b border-saffron-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-saffron-600" />
              {t('locator.filteredByScheme')}
            </span>
            <span className="font-extrabold text-saffron-900">
              {isHindi && selectedSchemeRecord.nameHi ? selectedSchemeRecord.nameHi : (selectedSchemeRecord.schemeName || selectedSchemeRecord.name)}
            </span>
            {authorizedAgencies.length > 0 && (
              <span className="text-slate-600">
                ({t('locator.authorizedAgencyTypes')} <strong>{authorizedAgencies.join(', ')}</strong>)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={clearSchemeFilter}
            className="text-xs font-bold text-saffron-700 hover:text-saffron-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto hover:underline"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('locator.clearSchemeFilter')}</span>
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Partner Type Filter */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            {t('locator.filterType')}
          </label>
          <select
            id="partner-type-filter"
            value={partnerType}
            onChange={(e) => setPartnerType(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
          >
            <option value="">{t('locator.allTypes')}</option>
            <option value="SCA">{t('locator.sca')}</option>
            <option value="PSB">{t('locator.psb')}</option>
            <option value="RRB">{t('locator.rrb')}</option>
            <option value="NBFC-MFI">{t('locator.nbfc')}</option>
          </select>
        </div>

        {/* Scheme Filter */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            {t('locator.filterScheme')}
          </label>
          <select
            id="partner-scheme-filter"
            value={schemeFilter}
            onChange={(e) => setSchemeFilter(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
          >
            <option value="">All Authorized Schemes</option>
            {allSchemes.map((s) => {
              const sName = s.schemeName || s.name;
              const sDisplay = isHindi && s.nameHi ? s.nameHi : sName;
              return (
                <option key={s._id || sName} value={sName}>
                  {sDisplay}
                </option>
              );
            })}
          </select>
        </div>

        {/* Radius Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-slate-700">{t('locator.radius')}</span>
            <span className="font-bold text-saffron-700">{radiusKm} km</span>
          </div>
          <input
            id="radius-slider"
            type="range"
            min="10"
            max="150"
            step="10"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-saffron-600"
          />
        </div>

        {/* Partner Count Badge */}
        <div className="flex items-end justify-start sm:justify-end">
          <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-900">{displayedPartners.length}</span>
            <span className="text-slate-500">Authorized Partners</span>
          </div>
        </div>
      </div>

      {/* Main Map & Partner List Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 h-[560px]">
        {/* Left Col: Partner Cards Scrollable List */}
        <div className="lg:col-span-5 h-full overflow-y-auto p-4 space-y-3 bg-slate-50/50 border-r border-slate-200">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Loading partner branches...
            </div>
          ) : displayedPartners.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                {t('locator.noPartnersFound')}
              </p>
              <button
                type="button"
                onClick={() => setRadiusKm(150)}
                className="mt-2 text-xs text-saffron-600 font-bold underline"
              >
                Expand radius to 150 km
              </button>
            </div>
          ) : (
            displayedPartners.map((partner) => {
              const isSelected = activePartner?._id === partner._id;
              return (
                <div
                  key={partner._id}
                  onClick={() => {
                    setActivePartner(partner);
                    if (partner.location?.lat && partner.location?.lng) {
                      setCoords({ lat: partner.location.lat, lng: partner.location.lng });
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-saffron-500 shadow-md ring-1 ring-saffron-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {partner.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      partner.type === 'SCA'
                        ? 'bg-amber-100 text-amber-800'
                        : partner.type === 'PSB'
                        ? 'bg-blue-100 text-blue-800'
                        : partner.type === 'RRB'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {partner.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                    {partner.address}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    {partner.distanceKm !== null && (
                      <span className="font-bold text-saffron-700 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {partner.distanceKm} km away
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      {t('locator.lowNpa')}
                    </span>

                    <span className="text-slate-600">
                      Fund Cap: {partner.fundUtilizationPercent}%
                    </span>
                  </div>

                  {/* Contact & Actions */}
                  <div className="flex items-center justify-between mt-3 pt-2">
                    <a
                      href={`tel:${partner.contact}`}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3.5 h-3.5 text-saffron-600" />
                      {partner.contact}
                    </a>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${partner.location?.lat},${partner.location?.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-saffron-600 hover:text-saffron-700 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Leaflet OpenStreetMap View */}
        <div className="lg:col-span-7 h-full relative z-0">
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={11}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={[coords.lat, coords.lng]} zoom={12} />

            {/* Partner Pins */}
            {displayedPartners.map((p) => {
              if (!p.location?.lat || !p.location?.lng) return null;
              return (
                <Marker
                  key={p._id}
                  position={[p.location.lat, p.location.lng]}
                  icon={createCustomIcon(p.type)}
                >
                  <Popup>
                    <div className="p-3 max-w-[280px] text-xs font-sans">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-800">
                          {p.type}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mb-2">{p.address}</p>

                      <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg text-emerald-800 font-medium text-[10px] mb-2 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Status: Healthy (Low NPA) • Fund: {p.fundUtilizationPercent}%
                      </div>

                      {p.distanceKm !== null && (
                        <p className="text-saffron-700 font-bold mb-1">
                          📍 {p.distanceKm} km from selected center
                        </p>
                      )}

                      <p className="text-slate-700 font-semibold mb-1">
                        📞 {p.contact}
                      </p>

                      {p.schemesHandled && p.schemesHandled.length > 0 && (
                        <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                          <strong>Schemes:</strong> {p.schemesHandled.slice(0, 2).join(', ')}
                          {p.schemesHandled.length > 2 && ` +${p.schemesHandled.length - 2} more`}
                        </div>
                      )}

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${p.location.lat},${p.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2.5 block text-center py-1 px-2 bg-saffron-600 text-white rounded font-bold text-[11px] hover:bg-saffron-700"
                      >
                        Navigate on Google Maps &rarr;
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
