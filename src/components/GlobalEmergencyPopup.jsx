'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { 
  Radio, 
  AlertTriangle, 
  Package, 
  Truck, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ShieldAlert,
  Navigation
} from 'lucide-react';

export default function GlobalEmergencyPopup() {
  const { activeAlert, dismissAlert, setRole } = useApp();
  const router = useRouter();

  if (!activeAlert) return null;

  const isSos = activeAlert.type === 'sos_message';
  const isReq = activeAlert.type === 'resource_requisition';
  const isReqApproved = activeAlert.type === 'requisition_approved';

  const handleNavigate = () => {
    if (isSos) {
      router.push('/volunteer');
    } else if (isReq) {
      router.push('/camp-manager');
    } else if (isReqApproved) {
      router.push('/volunteer');
    } else if (activeAlert.link) {
      router.push(activeAlert.link);
    }
    dismissAlert(activeAlert.id);
  };

  return (
    <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[99999] max-w-md w-[calc(100vw-2rem)] animate-slideDown shadow-2xl">
      <div className={`rounded-xl border backdrop-blur-xl p-4 transition-all ${
        isSos 
          ? 'bg-slate-950/95 border-red-500/80 shadow-red-950/50 text-white' 
          : isReq 
          ? 'bg-slate-950/95 border-amber-500/80 shadow-amber-950/50 text-white'
          : 'bg-slate-950/95 border-emerald-500/80 shadow-emerald-950/50 text-white'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg relative ${
              isSos ? 'bg-red-950/80 text-red-400' : isReq ? 'bg-amber-950/80 text-amber-400' : 'bg-emerald-950/80 text-emerald-400'
            }`}>
              {isSos && <Radio className="w-5 h-5 animate-pulse" />}
              {isReq && <Package className="w-5 h-5 animate-bounce" />}
              {isReqApproved && <CheckCircle2 className="w-5 h-5" />}
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                isSos ? 'bg-red-500 animate-ping' : isReq ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isSos ? 'bg-red-500/20 text-red-300 border border-red-500/40' : isReq ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isSos ? 'CITIZEN SOS DISPATCH' : isReq ? 'FIELD RESOURCE REQUISITION' : 'CAMP CONVOY DISPATCH'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold font-mono text-white mt-1">
                {activeAlert.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => dismissAlert(activeAlert.id)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <p className="mt-2.5 text-xs text-slate-200 leading-relaxed font-sans font-medium">
          {activeAlert.message}
        </p>

        {/* Actions */}
        <div className="mt-3.5 flex items-center justify-end gap-2">
          <button
            onClick={() => dismissAlert(activeAlert.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Acknowledge
          </button>
          <button
            onClick={handleNavigate}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-white shadow-md transition-all ${
              isSos 
                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/40' 
                : isReq 
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
            }`}
          >
            <span>{isSos ? 'Open Volunteer Screen' : isReq ? 'Inspect in Camp Manager' : 'View Duties'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
