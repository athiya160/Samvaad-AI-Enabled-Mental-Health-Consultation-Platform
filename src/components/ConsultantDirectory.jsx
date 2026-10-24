import React, { useState } from 'react';
import { CONSULTANTS, SPECIALTY_FILTERS, LANGUAGE_FILTERS } from '../data/consultants';
import { Star, MapPin, Clock, Video, Phone, MessageSquare, ShieldCheck, CheckCircle2, Filter, Info, Stethoscope, Sparkles, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ConsultantDirectory({ onSelectDoctor, prefilledSummary }) {
  const { language, t } = useLanguage();
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConsultants = CONSULTANTS.filter(doc => {
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || doc.specialties.includes(selectedSpecialty);
    const matchesLang = selectedLanguage === 'All Languages' || doc.languages.includes(selectedLanguage);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || (
      doc.name.toLowerCase().includes(query) ||
      doc.title.toLowerCase().includes(query) ||
      doc.location.toLowerCase().includes(query) ||
      doc.specialties.some(s => s.toLowerCase().includes(query)) ||
      doc.languages.some(l => l.toLowerCase().includes(query))
    );
    return matchesSpecialty && matchesLang && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs font-bold mb-3 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{language === 'kn' ? 'ಪರಿಶೀಲಿತ ತಜ್ಞರ ಜಾಲ' : 'Pan-India Affordable Care Network'}</span>
        </div>
        
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {t('consultantsHeading')}
        </h2>
        
        <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed font-normal">
          {t('consultantsSubheading')}
        </p>

        {/* Demo data notice banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-slate-600 inline-flex items-center gap-2.5 shadow-2xs text-left">
          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            {language === 'kn' 
              ? 'ಪ್ರಸ್ತುತಿ ಮಾದರಿ: ಡಾ. ಅಲನ್ ಅವರ ಕಲ್ಪನೆಯಂತೆ ಕೈಗೆಟುಕುವ ಬೆಲೆಯ (< ₹500) ಮಾದರಿಯನ್ನು ತೋರಿಸಲು ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.'
              : 'Illustrative Network Directory: Demonstrating the pan-India subsidized tele-consultation model (< ₹500) designed for Dr. Alan’s initiative.'}
          </span>
        </div>

        {prefilledSummary && (
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-emerald-950 inline-flex items-center gap-2.5 shadow-2xs text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">
              {language === 'kn' 
                ? 'ನಿಮ್ಮ AI ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ ಸಿದ್ಧವಾಗಿದೆ. ವೈದ್ಯರ ಸಮಾಲೋಚನೆಯ ವೇಳೆ ಹಂಚಿಕೊಳ್ಳಬಹುದು.' 
                : 'Your AI reflection summary is ready and can be shared with your chosen specialist during intake.'}
            </span>
          </div>
        )}
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-soft-sm border border-stone-200 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'kn' ? 'ಫಿಲ್ಟರ್‌ಗಳು:' : 'Filters:'}</span>
          </div>

          {/* Live Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'kn' ? 'ವೈದ್ಯರ ಹೆಸರು, ತಜ್ಞತೆ, ನಗರ...' : 'Search doctor, specialty, city...'}
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-slate-800 bg-stone-50 focus:bg-white focus:outline-none focus:border-sage-500 shadow-2xs placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Specialty Dropdown */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-slate-700 bg-stone-50 focus:outline-none focus:border-sage-500 cursor-pointer shadow-2xs"
          >
            {SPECIALTY_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'All Specialties' ? (language === 'kn' ? 'ಎಲ್ಲಾ ವಿಭಾಗಗಳು' : s) : s}
              </option>
            ))}
          </select>

          {/* Language Dropdown */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-slate-700 bg-stone-50 focus:outline-none focus:border-sage-500 cursor-pointer shadow-2xs"
          >
            {LANGUAGE_FILTERS.map((l) => (
              <option key={l} value={l}>
                {l === 'All Languages' ? (language === 'kn' ? 'ಎಲ್ಲಾ ಭಾಷೆಗಳು' : l) : l}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {language === 'kn' ? (
            <span><strong className="font-black text-slate-900">{filteredConsultants.length}</strong> ತಜ್ಞರು ಲಭ್ಯವಿದ್ದಾರೆ (&lt; ₹500)</span>
          ) : (
            <span>Showing <strong className="font-black text-slate-900">{filteredConsultants.length}</strong> specialists under ₹500</span>
          )}
        </div>
      </div>

      {/* Consultants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredConsultants.map((doc) => (
          <div
            key={doc.id}
            className={`bg-white/95 rounded-3xl p-6 sm:p-7 border transition-all duration-200 hover:shadow-soft-xl hover:-translate-y-1 relative flex flex-col justify-between ${
              doc.featured
                ? 'border-emerald-300 shadow-soft-md ring-1 ring-emerald-300/40'
                : 'border-stone-200 shadow-soft-sm'
            }`}
          >
            {doc.featured ? (
              <span className="absolute -top-3 left-6 bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-soft-sm">
                {t('drAlanTag')}
              </span>
            ) : (
              <span className="absolute -top-3 left-6 bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                {language === 'kn' ? 'ಅಖಿಲ ಭಾರತ ತಜ್ಞರ ಮಾದರಿ' : 'Pan-India Specialist Demo'}
              </span>
            )}

            <div>
              <div className="flex items-start gap-4 mb-4 pt-1">
                {/* Dignified Clinical Avatar Badge (No stock photos) */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-100 border-2 border-emerald-200/90 flex flex-col items-center justify-center flex-shrink-0 shadow-soft-sm relative">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-emerald-700">
                    <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-slate-700 mt-1 uppercase tracking-wider font-mono">
                    {doc.name.replace('Dr. ', '').replace('(Demo Profile)', '').trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-lg text-slate-900 truncate">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-lg shadow-2xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{doc.rating}</span>
                      <span className="text-[10px] text-amber-700 font-normal">({doc.reviewCount})</span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-emerald-800 mt-0.5">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.qualification} • {doc.experience}</p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{doc.location}</span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {language === 'kn' ? 'ಭಾಷೆಗಳು:' : 'Languages:'}
                </span>
                {doc.languages.map(lang => (
                  <span
                    key={lang}
                    className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold ${
                      lang === 'Kannada' 
                        ? 'bg-amber-100/80 text-amber-950 font-bold border border-amber-200' 
                        : 'bg-stone-100 text-slate-700 border border-stone-200/60'
                    }`}
                  >
                    {lang === 'Kannada' ? (language === 'kn' ? 'ಕನ್ನಡ' : 'Kannada') : lang}
                  </span>
                ))}
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed font-normal">
                {doc.bio}
              </p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {doc.specialties.map(spec => (
                  <span key={spec} className="text-[11px] bg-stone-50 border border-stone-200 text-slate-600 px-2.5 py-0.5 rounded-md font-medium">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Row: Pricing by Mode & Booking Button */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {language === 'kn' ? 'ಪಾರದರ್ಶಕ ನಿಗದಿತ ಶುಲ್ಕ (< ₹500)' : 'Transparent Standardized Rates (< ₹500)'}
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-700 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200 font-medium">
                    <MessageSquare className="w-3 h-3 text-slate-400" /> {language === 'kn' ? 'ಚಾಟ್:' : 'Chat:'} ₹{doc.pricing.chat}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-700 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200 font-medium">
                    <Phone className="w-3 h-3 text-slate-400" /> {language === 'kn' ? 'ಆಡಿಯೋ:' : 'Audio:'} ₹{doc.pricing.audio}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">
                    <Video className="w-3 h-3 text-emerald-600" /> {language === 'kn' ? 'ವಿಡಿಯೋ:' : 'Video:'} ₹{doc.pricing.video}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectDoctor(doc)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm shadow-soft-md shadow-sage-900/15 hover:shadow-glow-sage transition-all duration-150 cursor-pointer whitespace-nowrap"
              >
                {t('bookConsultation')}
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
