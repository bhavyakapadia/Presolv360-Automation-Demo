
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, ChevronLeft, CheckCircle2, Loader2, MessageSquare, Briefcase, Users, Scale, Phone, Mail, X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { FormData, StakeholderType, ServiceTrack, UrgencyLevel, SheetPayload } from './types';
import FormLayout from './components/FormLayout';
import { generateSmartSummary } from './services/geminiService';

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz5yO59g3BMYW2F2Mvpd8GI8BE0XgQnn3s-Zw3T-fX0ZZrgvO6FRXyXy-x4RBKSOs97/exec';

const formatINR = (value: string) => {
  const numericValue = value.replace(/[^0-9]/g, '');
  if (!numericValue) return '';
  return new Intl.NumberFormat('en-IN').format(parseInt(numericValue));
};

const ProcessingVisual = () => {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <motion.path
          d="M 20,50 L 50,20 M 20,50 L 50,80 M 50,20 L 80,50 M 50,80 L 80,50 M 50,20 L 50,80 M 20,50 L 80,50"
          fill="none"
          stroke="#005082"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />
        {[
          "M 20,50 L 50,20", "M 20,50 L 50,80", "M 50,20 L 80,50", 
          "M 50,80 L 80,50", "M 50,20 L 50,80", "M 20,50 L 80,50"
        ].map((path, i) => (
          <motion.path
            key={`flow-${i}`}
            d={path}
            fill="none"
            stroke="#FFB04C"
            strokeWidth="1"
            strokeDasharray="2, 10"
            animate={{
              strokeDashoffset: [0, -24],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.3
            }}
          />
        ))}
        {[
          { x: 20, y: 50 },
          { x: 50, y: 20 },
          { x: 50, y: 80 },
          { x: 80, y: 50 },
          { x: 50, y: 50 }
        ].map((node, i) => (
          <g key={`node-${i}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="3"
              fill={i === 4 ? "#FFB04C" : "#005082"}
              animate={{
                r: i === 4 ? [3, 5, 3] : [2, 3, 2],
                fillOpacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4
              }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="6"
              fill="none"
              stroke={i === 4 ? "#FFB04C" : "#005082"}
              strokeWidth="0.5"
              animate={{
                r: [6, 12, 6],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4
              }}
            />
          </g>
        ))}
      </svg>
      <motion.div
        className="absolute w-24 h-24 border-2 border-[#FFB04C]/20 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          rotate: 360,
          borderColor: ["rgba(255, 176, 76, 0.2)", "rgba(255, 176, 76, 0.5)", "rgba(255, 176, 76, 0.2)"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [step, setStep] = useState<number>(1);

  const [formData, setFormData] = useState<FormData>({
    stakeholderType: '',
    serviceTrack: '',
    petitionerName: '',
    respondentName: '',
    claimAmount: '',
    description: '',
    urgency: '',
    deadlineDetails: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [displayClaimAmount, setDisplayClaimAmount] = useState(() => formatINR(formData.claimAmount));

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setFieldTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleClaimAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setDisplayClaimAmount(formatINR(rawValue));
    updateField('claimAmount', rawValue);
  };

  const resetForm = () => {
    const emptyForm = {
      stakeholderType: '',
      serviceTrack: '',
      petitionerName: '',
      respondentName: '',
      claimAmount: '',
      description: '',
      urgency: '',
      deadlineDetails: '',
    };
    setFormData(emptyForm as FormData);
    setDisplayClaimAmount('');
    setTouched({});
    setStep(1);
    setSuccess(false);
  };

  const nextStep = () => {
    if (step === 1) setTouched(prev => ({ ...prev, stakeholderType: true, serviceTrack: true }));
    if (step === 2) setTouched(prev => ({ ...prev, petitionerName: true, respondentName: true }));
    
    if ((step === 1 && isStep1Valid) || (step === 2 && isStep2Valid)) {
      setStep(s => Math.min(s + 1, 3));
    }
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setTouched(prev => ({ ...prev, claimAmount: true, description: true, urgency: true }));
    if (!isStep3Valid) return;

    setLoading(true);
    try {
      const smartSummary = await generateSmartSummary(formData);
      
      const payload: SheetPayload = {
        petitionerName: formData.petitionerName,
        respondentName: formData.respondentName,
        claimValue: formData.claimAmount,
        description: formData.description,
        urgencyLevel: formData.urgency,
        stakeholderType: formData.stakeholderType,
        requestedService: formData.serviceTrack,
        deadlineDetails: formData.deadlineDetails,
        smartSummary: smartSummary
      };

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      await new Promise(r => setTimeout(r, 3000));
      setSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error processing filing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = !!(formData.stakeholderType && formData.serviceTrack);
  const isStep2Valid = !!(formData.petitionerName && formData.respondentName);
  const isStep3Valid = !!(formData.claimAmount && formData.description && formData.urgency);

  const getFieldError = (field: keyof FormData) => {
    if (!touched[field]) return null;
    if (!formData[field]) return "This field is required";
    return null;
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F3F7FA]">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full ps-card p-12 text-center space-y-6"
        >
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-[#005082]">Dispute Filed Successfully</h2>
          <p className="text-slate-500 leading-relaxed font-medium">Your case has been recorded. Our legal coordinators will review and contact you within 24 business hours.</p>
          <button 
            onClick={resetForm}
            className="w-full py-4 ps-button-blue rounded-xl font-bold shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            Start New Filing <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F7FA]">
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-60 floating-blob" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-50 rounded-full blur-[80px] opacity-40 floating-blob" style={{ animationDelay: '2s' }} />

      <header className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#005082] rounded flex items-center justify-center">
            <Scale className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-[#005082]">PRESOLV<span className="text-[#FFB04C]">360</span></span>
            <span className="text-[8px] tracking-[0.2em] font-bold text-slate-400">RESOLVE & EVOLVE</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSupport(true)}
            className="ps-button-orange text-xs font-bold px-5 py-2.5 rounded-full uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
          >
            Support
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSupport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSupport(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="ps-card w-full max-w-sm p-8 space-y-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowSupport(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-[#005082]">Case Support</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#005082]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Dial</p>
                    <p className="text-sm font-bold text-slate-700">+91 8447728708</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-[#FFB04C]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institutional Support</p>
                    <p className="text-sm font-bold text-slate-700">info@presolv360.com</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 relative">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-4xl font-extrabold text-[#005082] tracking-tight">Dispute Filing Portal</h1>
            <p className="text-slate-500 font-medium">Intelligent intake for accelerated dispute resolution.</p>
          </div>

          <div className="flex items-center justify-center mb-12 gap-2 px-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all ${
                  s === step ? 'bg-[#005082] text-white' : s < step ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`h-1 w-16 rounded-full ${s < step ? 'bg-[#005082]' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="ps-card p-8 md:p-12 relative overflow-hidden">
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                >
                  <ProcessingVisual />
                  <div className="mt-8 space-y-3">
                    <motion.h3 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-bold text-[#005082]"
                    >
                      Processing in Progress
                    </motion.h3>
                    <p className="text-slate-500 text-sm font-medium">Analyzing case disclosures and mapping legal parameters...</p>
                    <p className="text-[#FFB04C] text-[10px] font-bold uppercase tracking-[0.2em]">Authenticating Secure Payload</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <FormLayout key="st1" title="Service Selection" subtitle="Define your stakeholder class and resolution track.">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        Stakeholder Class *
                        {getFieldError('stakeholderType') && <span className="text-red-500 flex items-center gap-1 normal-case font-medium tracking-normal animate-pulse"><AlertCircle className="w-3 h-3"/> Select class</span>}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { id: 'Individual', icon: Users },
                          { id: 'Enterprise/Lender', icon: Briefcase },
                          { id: 'Neutral', icon: Scale }
                        ].map(({id, icon: Icon}) => (
                          <motion.button
                            key={id}
                            whileHover={{ scale: 1.03, y: -4, borderColor: formData.stakeholderType === id ? '#005082' : '#cbd5e1' }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            onClick={() => {
                              updateField('stakeholderType', id);
                              setFieldTouched('stakeholderType');
                            }}
                            className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all duration-200 ${
                              formData.stakeholderType === id 
                              ? 'border-[#005082] bg-blue-50/50 text-[#005082] shadow-lg shadow-blue-900/5' 
                              : touched.stakeholderType && !formData.stakeholderType
                                ? 'border-red-200 bg-red-50/50 text-red-500'
                                : 'border-slate-100 bg-white text-slate-500 hover:shadow-sm'
                            }`}
                          >
                            <Icon className="w-7 h-7" />
                            <span className="text-xs font-bold">{id}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        Resolution Track *
                        {getFieldError('serviceTrack') && <span className="text-red-500 flex items-center gap-1 normal-case font-medium tracking-normal animate-pulse"><AlertCircle className="w-3 h-3"/> Select track</span>}
                      </p>
                      <div className={`flex p-1 rounded-full transition-all ${touched.serviceTrack && !formData.serviceTrack ? 'bg-red-50 border border-red-100' : 'bg-slate-100'}`}>
                        {['Negotiation', 'Mediation', 'Arbitration'].map((track) => (
                          <button
                            key={track}
                            onClick={() => {
                              updateField('serviceTrack', track);
                              setFieldTouched('serviceTrack');
                            }}
                            className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${
                              formData.serviceTrack === track 
                              ? 'bg-white text-[#005082] shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700 active:scale-95'
                            }`}
                          >
                            {track}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </FormLayout>
              )}

              {step === 2 && (
                <FormLayout key="st2" title="Entity Verification" subtitle="Enter the legal designations for the parties involved.">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase">Petitioner Name *</label>
                        {getFieldError('petitionerName') && <span className="text-red-500 text-[10px] font-bold animate-pulse">REQUIRED</span>}
                      </div>
                      <input 
                        placeholder="Legal Entity or Individual Name"
                        value={formData.petitionerName}
                        onBlur={() => setFieldTouched('petitionerName')}
                        onChange={(e) => updateField('petitionerName', e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-slate-800 input-focus outline-none transition-all ${
                          touched.petitionerName && !formData.petitionerName ? 'border-red-300 bg-red-50' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase">Respondent Name *</label>
                        {getFieldError('respondentName') && <span className="text-red-500 text-[10px] font-bold animate-pulse">REQUIRED</span>}
                      </div>
                      <input 
                        placeholder="Counter-party Legal Name"
                        value={formData.respondentName}
                        onBlur={() => setFieldTouched('respondentName')}
                        onChange={(e) => updateField('respondentName', e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-slate-800 input-focus outline-none transition-all ${
                          touched.respondentName && !formData.respondentName ? 'border-red-300 bg-red-50' : 'border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </FormLayout>
              )}

              {step === 3 && (
                <FormLayout key="st3" title="Case Disclosures" subtitle="Specify financial parameters and factual details.">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-500 uppercase">Total Claim Amount (INR) *</label>
                          {getFieldError('claimAmount') && <span className="text-red-500 text-[10px] font-bold animate-pulse">REQUIRED</span>}
                        </div>
                        <input 
                          type="text"
                          placeholder="e.g. 7,00,000"
                          value={displayClaimAmount}
                          onBlur={() => setFieldTouched('claimAmount')}
                          onChange={handleClaimAmountChange}
                          className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-slate-800 input-focus outline-none font-medium transition-all ${
                            touched.claimAmount && !formData.claimAmount ? 'border-red-300 bg-red-50' : 'border-slate-200'
                          }`}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-500 uppercase">Urgency Level *</label>
                          {getFieldError('urgency') && <span className="text-red-500 text-[10px] font-bold animate-pulse">REQUIRED</span>}
                        </div>
                        <select 
                          value={formData.urgency}
                          onBlur={() => setFieldTouched('urgency')}
                          onChange={(e) => updateField('urgency', e.target.value)}
                          className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-slate-800 input-focus outline-none appearance-none font-medium transition-all ${
                            touched.urgency && !formData.urgency ? 'border-red-300 bg-red-50' : 'border-slate-200'
                          }`}
                        >
                          <option value="">Select Priority</option>
                          <option value="Low">Standard (30 days)</option>
                          <option value="Medium">Urgent (14 days)</option>
                          <option value="High">Critical (7 days)</option>
                          <option value="Immediate Action Required">Immediate Action</option>
                        </select>
                      </div>
                    </div>
                    
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Deadline Details (Optional)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
                        <div className="relative">
                           <input 
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-800 input-focus outline-none text-xs"
                            onChange={(e) => {
                              const date = e.target.value;
                              const currentDetails = formData.deadlineDetails.split(' | ')[1] || '';
                              updateField('deadlineDetails', date + (currentDetails ? ` | ${currentDetails}` : ''));
                            }}
                          />
                        </div>
                        <input 
                          placeholder="Or type specific details (e.g. Court date...)"
                          value={formData.deadlineDetails.includes(' | ') ? formData.deadlineDetails.split(' | ')[1] : formData.deadlineDetails}
                          onChange={(e) => {
                            const text = e.target.value;
                            const currentDate = formData.deadlineDetails.split(' | ')[0] || '';
                            const hasDate = currentDate.match(/^\d{4}-\d{2}-\d{2}$/);
                            updateField('deadlineDetails', (hasDate ? currentDate + ' | ' : '') + text);
                          }}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-800 input-focus outline-none ${(formData.urgency === 'High' || formData.urgency === 'Immediate Action Required') ? 'border-orange-200 bg-orange-50/20' : ''}`}
                        />
                      </div>
                    </motion.div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase">Detailed Dispute Description *</label>
                        {getFieldError('description') && <span className="text-red-500 text-[10px] font-bold animate-pulse">REQUIRED</span>}
                      </div>
                      <textarea 
                        rows={4}
                        placeholder="Describe the nature of the conflict, core issues, and desired outcome..."
                        value={formData.description}
                        onBlur={() => setFieldTouched('description')}
                        onChange={(e) => updateField('description', e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-slate-800 input-focus outline-none resize-none transition-all ${
                          touched.description && !formData.description ? 'border-red-300 bg-red-50' : 'border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </FormLayout>
              )}
            </AnimatePresence>

            <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
              {step > 1 ? (
                <button onClick={prevStep} className="flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-[#005082] transition-colors active:scale-95">
                  <ChevronLeft className="w-4 h-4" /> BACK
                </button>
              ) : <div />}

              {step < 3 ? (
                <button 
                  onClick={nextStep}
                  className={`ps-button-blue px-10 py-4 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-[0.98] ${
                    !isStep1Valid && step === 1 || !isStep2Valid && step === 2 ? 'opacity-30 grayscale' : ''
                  }`}
                >
                  NEXT <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  className={`ps-button-blue px-12 py-4 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98] ${
                    !isStep3Valid || loading ? 'opacity-30' : ''
                  }`}
                >
                  COMPLETE FILING
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="p-10 bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex flex-col gap-1">
               <span className="text-lg font-extrabold text-[#005082]">PRESOLV<span className="text-[#FFB04C]">360</span></span>
               <p className="text-xs text-slate-400 font-medium max-w-[200px]">Empowering digital justice infrastructure through ODR technology.</p>
               <div className="mt-4 flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#005082] transition-colors">
                   <Phone className="w-3.5 h-3.5" /> +91 8447728708
                 </div>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#005082] transition-colors">
                   <Mail className="w-3.5 h-3.5" /> info@presolv360.com
                 </div>
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 leading-relaxed text-center max-w-4xl mx-auto italic">
              Presolve360 is not a law firm and does not provide legal advice. Our services are based on the ODR framework and institutional rules. Consultation with independent counsel is advised for legal specificities. No Attorney-Client relationship is established by this filing.
            </p>
            <p className="mt-4 text-center text-[10px] text-slate-400 font-bold">© 2025 Presolve360. Secure Institutional Portal.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
