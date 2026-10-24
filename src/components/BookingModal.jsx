import React, { useState } from 'react';
import { X, CheckCircle, Video, Phone, MessageSquare, Calendar, Clock, FileText, ShieldCheck, IndianRupee, Stethoscope, Eye, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'canvas-confetti';

export default function BookingModal({ doctor, prefilledSummary, onClose, onConfirmBooking }) {
  const { language } = useLanguage();
  const [mode, setMode] = useState('video'); // 'chat' | 'audio' | 'video'
  const [selectedDate, setSelectedDate] = useState('Today, Oct 19');
  const [selectedSlot, setSelectedSlot] = useState('4:30 PM - 5:15 PM');
  const [attachSummary, setAttachSummary] = useState(!!prefilledSummary);
  const [patientName, setPatientName] = useState('Rahul K. (or Anonymous)');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isReviewingSummary, setIsReviewingSummary] = useState(false);
  const [patientClarification, setPatientClarification] = useState('');

  if (!doctor) return null;

  const currentPrice = doctor.pricing[mode];
  const isPsychiatrist = doctor.title.toLowerCase().includes('psychiatrist');

  const summaryToReview = prefilledSummary?.clinicianSummary || prefilledSummary?.clinicalDossier || prefilledSummary;

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    
    const appointmentData = {
      id: `APT-${Math.floor(10000 + Math.random() * 90000)}`,
      doctorName: doctor.name,
      doctorId: doctor.id,
      patientName,
      patientPhone,
      mode,
      date: selectedDate,
      time: selectedSlot,
      price: currentPrice,
      hasSummaryAttached: attachSummary,
      summaryData: attachSummary ? {
        clinicalDossier: {
          ...summaryToReview,
          patientClarification: patientClarification || summaryToReview?.patientClarification,
          patientReviewConfirmed: true
        }
      } : null,
      status: 'Confirmed'
    };

    onConfirmBooking(appointmentData);
    setBookingConfirmed(true);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full my-auto p-6 sm:p-8 shadow-soft-xl border border-stone-200 relative animate-fade-in max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {bookingConfirmed ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-soft-sm">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              {language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಕಾಯ್ದಿರಿಸುವಿಕೆ (ಡೆಮೊ ಮಾತ್ರ)' : 'Simulated Booking (Demo Only)'}
            </h3>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-medium max-w-sm mx-auto text-left leading-relaxed shadow-2xs">
              <strong>{language === 'kn' ? 'ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾದರಿ ಸೂಚನೆ:' : 'Interactive Prototype Notice:'}</strong>{' '}
              {language === 'kn'
                ? 'ಯಾವುದೇ ನೈಜ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲಾಗಿಲ್ಲ ಮತ್ತು ಶುಲ್ಕವನ್ನು ಕಡಿತಗೊಳಿಸಲಾಗಿಲ್ಲ. ರೋಗಿಗಳು ಹೇಗೆ ಸಮಾಲೋಚನೆಗಳನ್ನು ಕಾಯ್ದಿರಿಸುತ್ತಾರೆ ಮತ್ತು ತಮ್ಮ AI ಸಾರಾಂಶವನ್ನು ವೈದ್ಯರಿಗೆ ಜೋಡಿಸುತ್ತಾರೆ ಎಂಬುದನ್ನು ತೋರಿಸುವ ಮಾದರಿ ಇದಾಗಿದೆ.'
                : 'No real appointment was booked, no payment was deducted, and no consultant was contacted. This simulates how patients confirm sessions and attach their pre-consultation reflection summary.'}
            </div>

            <p className="text-xs text-slate-600 max-w-sm mx-auto font-normal">
              {language === 'kn' ? 'ಆಯ್ಕೆಮಾಡಿದ ಸಮಯ:' : 'Simulated slot:'}{' '}
              <span className="font-bold text-slate-900">{doctor.name}</span>{' '}
              {language === 'kn' ? 'ದಿನಾಂಕ' : 'on'}{' '}
              <span className="font-bold text-slate-900">{selectedDate} ({selectedSlot})</span>.
            </p>

            {attachSummary && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-semibold max-w-sm mx-auto">
                {language === 'kn'
                  ? `✓ ${doctor.name} ಅವರಿಗೆ AI ಸಮಾಲೋಚನೆ ಪೂರ್ವ ಸಾರಾಂಶವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಲಗತ್ತಿಸಲಾಗಿದೆ.`
                  : `✓ AI Pre-Consultation Summary successfully attached for ${doctor.name}.`}
              </div>
            )}

            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-bold text-sm shadow-soft-md shadow-sage-900/20 transition-all cursor-pointer"
              >
                {language === 'kn' ? 'ಡೆಮೊಗೆ ಹಿಂತಿರುಗಿ' : 'Return to Demo'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header with Doctor snippet */}
            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-stone-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-100 border-2 border-emerald-200/90 flex flex-col items-center justify-center flex-shrink-0 shadow-soft-sm">
                <Stethoscope className="w-5 h-5 text-emerald-700" />
                <span className="text-[10px] font-black text-slate-700 mt-0.5 uppercase tracking-wider font-mono">
                  {doctor.name.replace('Dr. ', '').replace('(Demo Profile)', '').trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">{doctor.name}</h3>
                <p className="text-xs text-slate-600 font-medium">{doctor.title} • {doctor.qualification}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                    {language === 'kn' ? 'ರಿಯಾಯಿತಿ ದರ (< ₹500)' : 'Subsidized Rate (< ₹500)'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-stone-100 px-2 py-0.5 rounded-full">
                    {isPsychiatrist ? 'Psychiatrist (Medical)' : 'Psychologist (Therapy)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Prototype Demo Banner (Priority 4) */}
            <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-amber-950 text-xs mb-3 flex items-start gap-2 shadow-2xs">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>Interactive Prototype Demo:</strong> Simulated booking flow illustrating affordable tele-consultation (&lt; ₹500) and pre-consultation summary attachment. No real payment is processed, and no real doctor is contacted. Consultation is entirely optional.
              </p>
            </div>

            {/* Role Distinction Notice (Section 11) */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-slate-600 text-[11px] mb-4 flex items-start gap-2 shadow-2xs">
              <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isPsychiatrist
                  ? "Psychiatrist: Medical doctor specializing in psychiatric evaluation, medical assessment, and treatment planning."
                  : "Psychologist: Specialist in psychotherapy, counseling, CBT, and emotional coping strategies."}
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs font-normal">
              
              {/* Consultation Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಮಾದರಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select Consultation Mode'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('chat')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-soft-sm ${
                      mode === 'chat'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-soft-md ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:bg-stone-50 text-slate-600'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-slate-700" />
                    <span className="font-semibold">{language === 'kn' ? 'ಚಾಟ್' : 'Chat'}</span>
                    <span className="font-black text-emerald-800 text-xs">₹{doctor.pricing.chat}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('audio')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-soft-sm ${
                      mode === 'audio'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-soft-md ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:bg-stone-50 text-slate-600'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-slate-700" />
                    <span className="font-semibold">{language === 'kn' ? 'ಆಡಿಯೋ ಕರೆ' : 'Audio Call'}</span>
                    <span className="font-black text-emerald-800 text-xs">₹{doctor.pricing.audio}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('video')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-soft-sm ${
                      mode === 'video'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-soft-md ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:bg-stone-50 text-slate-600'
                    }`}
                  >
                    <Video className="w-4 h-4 text-emerald-700" />
                    <span className="font-semibold">{language === 'kn' ? 'ವಿಡಿಯೋ ಕರೆ' : 'Video Session'}</span>
                    <span className="font-black text-emerald-800 text-xs">₹{doctor.pricing.video}</span>
                  </button>
                </div>
              </div>

              {/* Slot & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {language === 'kn' ? 'ದಿನಾಂಕ' : 'Date'}
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-slate-800 font-semibold shadow-2xs"
                  >
                    <option value="Today, Oct 19">{language === 'kn' ? 'ಇಂದು, ಅಕ್ಟೋಬರ್ 19' : 'Today, Oct 19'}</option>
                    <option value="Tomorrow, Oct 20">{language === 'kn' ? 'ನಾಳೆ, ಅಕ್ಟೋಬರ್ 20' : 'Tomorrow, Oct 20'}</option>
                    <option value="Wednesday, Oct 21">{language === 'kn' ? 'ಬುಧವಾರ, ಅಕ್ಟೋಬರ್ 21' : 'Wednesday, Oct 21'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {language === 'kn' ? 'ಸಮಯಾವಧಿ' : 'Time Slot'}
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-slate-800 font-semibold shadow-2xs"
                  >
                    <option value="4:30 PM - 5:15 PM">4:30 PM - 5:15 PM</option>
                    <option value="6:00 PM - 6:45 PM">6:00 PM - 6:45 PM</option>
                    <option value="8:15 PM - 9:00 PM">8:15 PM - 9:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {language === 'kn' ? 'ನಿಮ್ಮ ಹೆಸರು ಅಥವಾ ಅಡ್ಡಹೆಸರು (Alias)' : 'Your Name or Preferred Alias'}
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                    placeholder={language === 'kn' ? 'ಉದಾ: ರಾಹುಲ್ ಕೆ. ಅಥವಾ ಕಾಮ್ ಸೀಡರ್' : 'e.g. Rahul K. or Calm Cedar'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಲಿಂಕ್‌ಗಾಗಿ WhatsApp / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'WhatsApp / Phone for Consultation Link'}
                  </label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-sage-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Explicit Consent to Share Pre-Consultation Summary (Section 11) */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                <div className="mb-2">
                  <span className="font-bold text-slate-900 block text-xs">
                    {language === 'kn'
                      ? 'ನಿಮ್ಮ AI ಸಮಾಲೋಚನೆ ಪೂರ್ವ ಸಾರಾಂಶವನ್ನು ನಿಮ್ಮ ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಬೇಕೇ?'
                      : 'Share your AI-prepared pre-consultation summary with your clinician?'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={attachSummary}
                      onChange={(e) => setAttachSummary(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block text-xs">
                        {language === 'kn'
                          ? `ಹೌದು, ನನ್ನ ಸಾರಾಂಶವನ್ನು ಡಾ. ${doctor.name.replace('Dr. ', '')} ಅವರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ`
                          : `Yes, share my summary with ${doctor.name}`}
                      </span>
                      <span className="text-slate-600 text-[11px] leading-relaxed block mt-0.5">
                        {language === 'kn'
                          ? 'ವೈದ್ಯರಿಗೆ ಮುಂಚಿತವಾಗಿ ನಿಮ್ಮ ಕಾಳಜಿಗಳ ಬಗ್ಗೆ ತಿಳಿಯಲು ಸಹಾಯಕವಾಗುತ್ತದೆ. ಹಂಚಿಕೊಳ್ಳದಿದ್ದರೆ ಯಾವುದೇ ಸಾರಾಂಶ ರವಾನೆಯಾಗುವುದಿಲ್ಲ.'
                          : 'Provides preliminary context to your clinician before your session. If unchecked, no summary will be shared or displayed in the clinician dashboard.'}
                      </span>
                    </div>
                  </label>

                  {summaryToReview && (
                    <button
                      type="button"
                      onClick={() => setIsReviewingSummary(true)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-50 cursor-pointer flex-shrink-0"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Review</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 flex items-center justify-between shadow-soft-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                    {language === 'kn' ? 'ಒಟ್ಟು ರಿಯಾಯಿತಿ ಶುಲ್ಕ (ಮಾದರಿ)' : 'Total Subsidized Fee (Simulated)'}
                  </span>
                  <div className="text-xs text-emerald-950 font-semibold">
                    {language === 'kn' ? 'ಸಾಮಾನ್ಯ ₹1,500 ದರದಿಂದ ರಿಯಾಯಿತಿ:' : 'Standard ₹1,500 rate subsidized to:'}
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-900 flex items-center">
                  <IndianRupee className="w-5 h-5" />
                  <span>{currentPrice}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-black text-sm shadow-soft-md shadow-sage-900/20 hover:shadow-glow-sage transition-all cursor-pointer"
              >
                {language === 'kn' ? `ಮಾದರಿ ಸಮಾಲೋಚನೆ ಕಾಯ್ದಿರಿಸಿ (₹${currentPrice} ಡೆಮೊ)` : `Confirm Simulated Appointment (₹${currentPrice} Demo)`}
              </button>

            </form>
          </div>
        )}

        {/* Modal Sub-view: Review Summary before sharing (Section 11) */}
        {isReviewingSummary && summaryToReview && (
          <div className="fixed inset-0 z-60 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-soft-xl border border-stone-200 relative my-auto max-h-[88vh] overflow-y-auto">
              <button
                onClick={() => setIsReviewingSummary(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h4 className="font-bold text-sm text-slate-900 mb-1">
                Summary Preview Before Consenting to Share
              </h4>
              <p className="text-[11px] text-slate-500 mb-4">
                This is the preliminary context the doctor will receive prior to your session.
              </p>

              <div className="space-y-3 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <span className="font-bold text-slate-700 block">Chief Concerns:</span>
                  <p className="text-slate-800 mt-0.5">
                    "{summaryToReview.section1_PresentingComplaints || summaryToReview.chiefComplaint || 'Discussion in chat'}"
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block">Present Problem:</span>
                  <p className="text-slate-800 mt-0.5">
                    {summaryToReview.section2_HistoryOfPresentProblem || summaryToReview.durationAndOnset}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block">Reported Impact:</span>
                  <p className="text-slate-800 mt-0.5">
                    Work: {summaryToReview.section5_DailyFunctioningImpact?.workStudy || 'Reported'} | Sleep: {summaryToReview.section5_DailyFunctioningImpact?.sleep || 'Reported'}
                  </p>
                </div>
              </div>

              {/* Patient Corrections & Clarifications Section */}
              <div className="mt-3 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <span className="font-bold text-xs text-slate-800 block mb-1">
                  {language === 'kn' ? 'ತಿದ್ದುಪಡಿ ಅಥವಾ ಸ್ಪಷ್ಟನೆಗಳು (ಐಚ್ಛಿಕ):' : 'Edit / Add Corrections & Clarifications (Optional):'}
                </span>
                <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                  {language === 'kn'
                    ? 'ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳುವ ಮೊದಲು ನಿಮ್ಮದೇ ಆದ ಯಾವುದೇ ತಿದ್ದುಪಡಿ ಅಥವಾ ಹೆಚ್ಚುವರಿ ವಿವರಗಳನ್ನು ಸೇರಿಸಬಹುದು.'
                    : 'You can correct or add specific context for the clinician before authorizing sharing.'}
                </p>
                <textarea
                  value={patientClarification}
                  onChange={(e) => setPatientClarification(e.target.value)}
                  placeholder="e.g. Please note that my sleep issues started 3 weeks ago after project deadlines; no previous psychiatric history."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs focus:border-sage-500 focus:outline-none"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {patientClarification ? '✓ Corrections added to summary' : 'Reviewing preliminary context'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsReviewingSummary(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
                >
                  Save Corrections & Return
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
