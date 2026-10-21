'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../context/AppContext';
import { 
  Radio, 
  MapPin, 
  MessageSquare, 
  Tent, 
  Wifi, 
  WifiOff,
  Bluetooth, 
  ShieldCheck, 
  Lock, 
  Send, 
  AlertTriangle, 
  HeartPulse, 
  Droplet, 
  LifeBuoy, 
  Compass, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Bell,
  Trees,
  CheckSquare,
  Package,
  Home,
  User,
  RotateCcw,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Bot,
  Sliders,
  LayoutDashboard,
  UserCheck,
  KeyRound,
  Boxes,
  FileSearch,
  Truck,
  Moon,
  Sun,
  Palette
} from 'lucide-react';
import { submitReportAction, sendMessageAction, fetchMessages, queryGeminiAI } from '../lib/api';

// Dynamically import Leaflet map with ssr: false
const MobileOfflineMap = dynamic(() => import('../components/MobileOfflineMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-[#E5EDD8] flex flex-col items-center justify-center p-6 text-[#2D4A22] font-mono text-xs text-center space-y-2">
      <div className="w-6 h-6 rounded-full border-2 border-[#2D4A22] border-t-transparent animate-spin" />
      <span>Loading Topographic Disaster Grid...</span>
    </div>
  )
});

// Dynamically import ReliefOS Native Java Android App
const ReliefOSJavaApp = dynamic(() => import('../components/ReliefOSJavaApp'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-700 font-mono text-xs text-center space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      <span>Starting ReliefOS Native Android Engine (BLE Mesh)...</span>
    </div>
  )
});

const DEFAULT_USER_LOCATION = {
  lat: 24.8620,
  lng: 67.0340,
  label: 'Sector Delta 9 (Flooded Lowland)'
};

const NEARBY_VOLUNTEERS = [
  {
    id: 'vol-3',
    name: 'Fatima Noor',
    role: 'Triage Scout & Field Responder',
    lat: 24.8632,
    lng: 67.0352,
    distanceMeters: 120,
    distanceText: '120m away',
    status: 'on_duty',
    battery: '94%',
    bleSignal: '-58 dBm (Direct Range)'
  },
  {
    id: 'vol-1',
    name: 'Sara Khan',
    role: 'Field Volunteer & Scout',
    lat: 24.8650,
    lng: 67.0320,
    distanceMeters: 340,
    distanceText: '340m away',
    status: 'on_duty',
    battery: '85%',
    bleSignal: '-72 dBm (Moderate)'
  }
];

const NEARBY_CAMPS = [
  {
    id: 'camp-3',
    name: 'Camp 3 (Khanpur Valley)',
    valley: 'Khanpur Valley',
    residents: 1240,
    lat: 24.858,
    lng: 67.042,
    distanceMeters: 450,
    distanceText: '450m away',
    walkTime: '12 min walk',
    bearing: 'Southeast (135°)',
    occupancy: 1240,
    capacity: 1500,
    status: 'active',
    supplies: {
      water: '320 / 500 L (64%)',
      food: '480 / 800 kg (60%)',
      medical: '12 / 50 kits (24%)'
    }
  },
  {
    id: 'camp-1',
    name: 'Camp 1 (Central Stadium)',
    valley: 'North Sector',
    residents: 980,
    lat: 24.869,
    lng: 67.028,
    distanceMeters: 850,
    distanceText: '850m away',
    walkTime: '22 min walk',
    bearing: 'Northwest (315°)',
    occupancy: 980,
    capacity: 1200,
    status: 'active',
    supplies: {
      water: '650 / 800 L (81%)',
      food: '710 / 900 kg (78%)',
      medical: '35 / 50 kits (70%)'
    }
  },
  {
    id: 'camp-7',
    name: 'Camp 7 (Coastal High School)',
    valley: 'South Ridge',
    residents: 620,
    lat: 24.845,
    lng: 67.025,
    distanceMeters: 1400,
    distanceText: '1.4 km away',
    walkTime: '35 min walk',
    bearing: 'South (180°)',
    occupancy: 620,
    capacity: 650,
    status: 'near_full',
    supplies: {
      water: '120 / 600 L (20%)',
      food: '180 / 500 kg (36%)',
      medical: '8 / 40 kits (20%)'
    }
  }
];

export default function AffectedUserMobileApp() {
  const appContext = useApp() || {};
  const { 
    user, 
    role, 
    setIsAuthModalOpen, 
    theme, 
    toggleTheme, 
    themeAccent, 
    changeThemeAccent, 
    cycleThemeAccent, 
    isOnline, 
    setIsOnline, 
    logout
  } = appContext;
  const router = useRouter();

  // Interface Mode: 'native_android' (ReliefOS Java App) vs 'citizen_hub' (Extended Citizen Hub & Portals)
  const [appMode, setAppMode] = useState('native_android');
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'requests' | 'services' | 'map' | 'portals'
  const [hasWifi, setHasWifi] = useState(false); // Default: No Wi-Fi (Disaster scenario)
  const [mobileToMobileEnabled, setMobileToMobileEnabled] = useState(true); // Option: Travel Mobile-to-Mobile
  const [isFramedView, setIsFramedView] = useState(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState(NEARBY_VOLUNTEERS[0]);
  const [selectedCamp, setSelectedCamp] = useState(NEARBY_CAMPS[0]);
  const [showEncryptedPayload, setShowEncryptedPayload] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState(null);

  // Gemini 2.5 Flash Predictive Intelligence State
  const [aiForecast, setAiForecast] = useState(
    'Gemini AI Logistics Assessment: Water reserves (64%) will hit critical 15% threshold in 14.5 hours under 1,240 resident intake. Priority dispatch: 1,500L tanker from Depo North by 07:30.'
  );
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);

  const handleGenerateAiForecast = async () => {
    setIsGeneratingForecast(true);
    showToast('Querying Gemini 2.5 Flash logistics model...');
    const res = await queryGeminiAI({
      prompt: 'Analyze Camp 3 status: 1240 residents, Water 320/500L, Food 480/800kg, Medical 12/50 kits. Predict depletion times and give 2 concrete logistics recommendations.',
      task: 'camp_forecast',
      context: { camp: 'Camp 3', valley: 'Khanpur Valley', residents: 1240 }
    });
    if (res?.response) {
      setAiForecast(res.response);
      showToast('Gemini AI Forecast updated!');
    }
    setIsGeneratingForecast(false);
  };

  // Persistent Message thread state
  const [messages, setMessages] = useState([
    {
      id: 'msg-seed-1',
      sender: 'user',
      text: 'Water entered ground floor near Sector Delta 9, emergency boat requested for 4 citizens.',
      category: 'Rescue Needed',
      timestamp: '18:02',
      status: 'relayed_hq',
      hopRoute: 'Your Phone → Peer Mobile (14m) → Fatima Noor → HQ',
      encryptedHash: '0x4f82a9...d4c1 (AES-GCM-256)',
      recipient: 'Fatima Noor'
    },
    {
      id: 'msg-seed-2',
      sender: 'volunteer',
      volunteerName: 'Fatima Noor (Volunteer)',
      text: 'Copy that! Received your packet via 2-hop mobile relay. Rescue boat en route from Camp 3.',
      timestamp: '18:05',
      status: 'delivered'
    }
  ]);

  // Load messages from persistent storage on mount & keep thread reactive across tabs
  React.useEffect(() => {
    const syncThread = async () => {
      try {
        const msgs = await fetchMessages();
        if (Array.isArray(msgs) && msgs.length > 0) {
          setMessages(msgs);
          return;
        }
      } catch {}
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('reliefos_db_messages');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
          } catch {}
        }
      }
    };

    syncThread();

    const handleSync = () => syncThread();
    if (typeof window !== 'undefined') {
      window.addEventListener('reliefos_db_sync', handleSync);
      window.addEventListener('storage', handleSync);
    }
    const poller = setInterval(syncThread, 3000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('reliefos_db_sync', handleSync);
        window.removeEventListener('storage', handleSync);
      }
      clearInterval(poller);
    };
  }, []);

  const showToast = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  // One-tap quick SOS handler
  const handleQuickSOS = async (title, emergencyText, urgencyLevel = 'critical') => {
    setIsSending(true);
    const isMesh = !hasWifi && mobileToMobileEnabled;

    const newMsg = {
      id: `sos-${Date.now()}`,
      sender: 'user',
      text: `[EMERGENCY SOS: ${title}] ${emergencyText}`,
      category: title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isMesh ? 'ble_sent' : 'relayed_hq',
      hopRoute: isMesh ? `Your Phone → Peer Mobile (14m) → ${selectedVolunteer?.name || 'Fatima Noor'} → HQ` : 'Direct Cloud Upload',
      encryptedHash: `0x${Math.random().toString(16).substring(2, 10)}... (AES-GCM-256 / ECDH P-256)`,
      recipient: selectedVolunteer?.name || 'Fatima Noor'
    };

    setMessages(prev => {
      const updated = [newMsg, ...prev.filter(m => m.id !== newMsg.id)];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('reliefos_db_messages', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });

    // Query Gemini 2.5 Flash for immediate survival and first-aid instructions
    queryGeminiAI({
      prompt: `Emergency distress reported: ${title}. Resident notes: "${emergencyText}". Provide 2 immediate survival or first-aid actions for the resident while rescue teams navigate the mesh.`,
      task: 'citizen_advisor',
      context: { camp: 'Camp 3 (Khanpur Valley)', residents: 1240 }
    }).then(aiRes => {
      if (aiRes?.response) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-advice-${Date.now()}`,
            sender: 'gemini_ai',
            volunteerName: 'Gemini 2.5 Flash Emergency Advisor',
            text: aiRes.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAiAdvisor: true,
            model: aiRes.model || 'gemini-2.5-flash'
          }
        ]);
      }
    }).catch(err => {
      console.warn('Gemini advisor error:', err);
    });

    // Transmit Citizen SOS directly to ReliefOS backend DB and Volunteers
    try {
      await sendMessageAction({
        text: `[EMERGENCY SOS: ${title}] ${emergencyText}`,
        category: title,
        sender: 'citizen',
        senderName: 'Citizen Mobile (Sector Delta 9)',
        recipientId: selectedVolunteer?.id || 'vol-3',
        recipientName: selectedVolunteer?.name || 'Sara Khan',
        hopRoute: isMesh ? 'Your Phone → Peer Mobile (14m) → Volunteer Mobile → HQ' : 'Direct Cloud Upload',
        urgency: urgencyLevel
      });
    } catch (apiErr) {
      console.warn('API error sending message:', apiErr);
    }

    if (isMesh) {
      showToast('No Wi-Fi: Traveling mobile-to-mobile via Bluetooth P2P...');

      // Hop 1: Sent to nearby peer mobile
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'ble_sent' } : m));
        showToast('Hop 1: Delivered to nearby citizen phone (Samsung A54, 14m)');
      }, 1200);

      // Hop 2: Delivered to responder phone
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'volunteer_delivered' } : m));
        showToast(`Hop 2: Received by Volunteer Mobile (${selectedVolunteer.name})`);
      }, 2400);

      // Hop 3: Volunteer device syncs to central HQ
      setTimeout(async () => {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'relayed_hq' } : m));
        try {
          await submitReportAction({
            areaId: 'area-c',
            text: `[CITIZEN SOS MOBILE-TO-MOBILE] ${emergencyText} (Relayed by Volunteer ${selectedVolunteer.name})`,
            source: 'citizen_mobile_ble',
            extracted: {
              urgency: urgencyLevel,
              assistanceNeeded: title
            }
          });
          showToast('Relayed via Mesh to ReliefOS Central HQ!');
        } catch (err) {
          console.warn('Backend sync queued offline:', err);
        }
      }, 4000);
    } else {
      showToast('Wi-Fi Connected: Dispatching direct to ReliefOS HQ...');
      try {
        await submitReportAction({
          areaId: 'area-c',
          text: `[CITIZEN SOS DIRECT] ${emergencyText}`,
          source: 'citizen_mobile_cellular',
          extracted: {
            urgency: urgencyLevel,
            assistanceNeeded: title
          }
        });
        showToast('Report received by Central Coordinator & Volunteer!');
      } catch (err) {
        console.warn('API error:', err);
      }
    }

    setIsSending(false);
  };

  const handleSendCustomChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    const text = chatInput.trim();
    setChatInput('');
    handleQuickSOS('Citizen Message', text, 'high');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#162711] via-[#223A1A] to-[#2D4A22] text-[#1A251B] flex flex-col items-center justify-start p-2 sm:p-4 select-none">
      
      {/* Top Navigation & Simulator Controls */}
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between px-3 py-2 bg-[#233A1A]/95 border border-[#3B602D] rounded-xl text-xs font-mono text-[#D1DEC9] mb-3 shadow-md backdrop-blur-xs gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link 
            href="/" 
            title="Return to Incident Command Center Dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#182C13] hover:bg-[#2D4A22] text-white border border-[#436D34]/50 transition-colors font-bold"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Command HQ</span>
            <span className="sm:hidden">HQ</span>
          </Link>

          <Link 
            href="/volunteer" 
            title="Open Volunteer Field Responder Portal"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#182C13] hover:bg-[#2D4A22] text-white border border-[#436D34]/50 transition-colors font-bold"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Volunteer Portal</span>
          </Link>

          <Link 
            href="/camp-manager" 
            title="Open Camp Operations & Logistics Portal"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#182C13] hover:bg-[#2D4A22] text-white border border-[#436D34]/50 transition-colors font-bold"
          >
            <Tent className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Camp Ops</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen && setIsAuthModalOpen(true)}
            title="Open Clearance Settings & Role Authentication Modal"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#182C13] hover:bg-[#2D4A22] text-white border border-[#436D34]/50 transition-colors font-bold"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Settings</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher: Android Java App vs Citizen Hub */}
          <div className="flex items-center bg-[#182C13] p-1 rounded-lg border border-[#436D34]/60">
            <button
              type="button"
              onClick={() => setAppMode('native_android')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                appMode === 'native_android'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Java App</span>
            </button>
            <button
              type="button"
              onClick={() => setAppMode('citizen_hub')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                appMode === 'citizen_hub'
                  ? 'bg-gradient-to-r from-[#2D4A22] to-[#436D34] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Citizen Hub</span>
            </button>
          </div>

          {/* Framed View Toggle */}
          <button
            onClick={() => setIsFramedView(!isFramedView)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-[#233F1B] via-[#2D4A22] to-[#385F2C] text-white border border-[#436D34]/60 hover:brightness-110 transition-all shadow-xs font-bold"
          >
            {isFramedView ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            <span className="hidden sm:inline">{isFramedView ? 'Full Screen' : 'Device Frame'}</span>
          </button>

          {/* Toggle Online / Offline Mesh Simulation */}
          <button
            onClick={() => setHasWifi(!hasWifi)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition-all shadow-xs ${
              !hasWifi
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
            }`}
            title="Click to toggle Network simulation (Wi-Fi vs No Wi-Fi Mobile-to-Mobile)"
          >
            {!hasWifi ? (
              <>
                <Smartphone className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>NO WI-FI (BLE MESH)</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>WI-FI CONNECTED</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Mobile Application Chassis */}
      <div className={`w-full citizen-mobile-app ${isFramedView ? 'max-w-[400px] h-[870px] rounded-[48px] border-[10px] border-[#1E2E1A] shadow-2xl shadow-black/60 ring-1 ring-[#3D6130]' : 'h-screen max-w-full rounded-none border-none'} bg-[#F8FAFC] flex flex-col overflow-hidden relative transition-all`}>
        
        {/* Mobile Phone Status Bar */}
        <div className="w-full flex items-center justify-between px-7 pt-3 pb-1 bg-slate-900 text-white text-[11px] font-sans font-bold select-none flex-shrink-0" style={{ color: '#ffffff' }}>
          <span style={{ color: '#ffffff' }}>9:41</span>
          <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5" style={{ color: '#ffffff' }}>
            <Bluetooth className={`w-3 h-3 ${!hasWifi ? 'text-amber-300' : 'text-slate-400'}`} />
            <Radio className="w-3 h-3 text-white" />
            <span style={{ color: '#ffffff' }}>98%</span>
          </div>
        </div>

        {/* NATIVE ANDROID JAVA SCREEN VS CITIZEN HUB */}
        {appMode === 'native_android' ? (
          <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col bg-[#F8FAFC]">
            <ReliefOSJavaApp onSwitchToHub={() => setAppMode('citizen_hub')} />
          </div>
        ) : (
          <>
            {/* Forest Green Gradient Header (#1C3315 -> #2D4A22 -> #3E6630) */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#1C3315] via-[#2D4A22] to-[#3E6630] flex items-center justify-between flex-shrink-0 border-b border-[#436D34]/40 shadow-xs relative">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Trees className="w-4 h-4 text-[#2D4A22]" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-black text-white leading-tight" style={{ color: '#ffffff' }}>ReliefOS</div>
                  <div className="text-[10px] font-semibold text-[#D1DEC9] leading-tight" style={{ color: '#D1DEC9' }}>Camp Resident</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch back to Android Native Screen */}
                <button
                  type="button"
                  onClick={() => setAppMode('native_android')}
                  className="px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Android App</span>
                </button>

                {/* Bell with Notification Badge */}
                <div className="relative cursor-pointer">
                  <Bell className="w-4 h-4 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8.5px] font-bold text-white flex items-center justify-center shadow-xs" style={{ color: '#ffffff' }}>
                    1
                  </span>
                </div>
              </div>
            </div>

        {/* NETWORK STATUS BANNER (WI-FI VS MOBILE-TO-MOBILE) */}
        <div className={`px-3.5 py-1.5 border-b flex items-center justify-between text-[11px] flex-shrink-0 ${
          !hasWifi ? 'bg-[#FEF3C7] border-[#FDE68A]' : 'bg-[#DCFCE7] border-[#BBF7D0]'
        }`}>
          <div className="flex items-center gap-1.5 font-semibold">
            {!hasWifi ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#92400E]" />
                <span className="text-[#92400E] font-bold">No Wi-Fi — Mobile-to-Mobile Relay Active</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#15803D]" />
                <span className="text-[#15803D] font-bold">Wi-Fi Connected — Direct Cloud Upload</span>
              </>
            )}
          </div>
          <button
            onClick={() => setHasWifi(!hasWifi)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-white text-[10px] font-bold transition-all shadow-xs ${
              !hasWifi ? 'bg-gradient-to-r from-[#203918] via-[#2D4A22] to-[#385F2C] hover:brightness-110' : 'bg-gradient-to-r from-[#14532D] to-[#15803D] hover:brightness-110'
            }`}
            style={{ color: '#ffffff' }}
          >
            {!hasWifi ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            <span style={{ color: '#ffffff' }}>{!hasWifi ? 'Enable Wi-Fi' : 'Simulate No Wi-Fi'}</span>
          </button>
        </div>

        {/* Toast Alert Pop-up with Crystal Clear High Contrast */}
        {notification && (
          <div 
            className="mobile-toast absolute top-28 left-4 right-4 z-50 p-3 rounded-xl bg-[#14260F] text-white text-xs font-bold shadow-2xl border-2 border-emerald-400 flex items-center gap-2.5 animate-bounce"
            style={{ backgroundColor: '#14260F', color: '#ffffff', borderColor: '#34d399' }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="flex-1 text-white font-bold tracking-wide" style={{ color: '#ffffff' }}>{notification}</span>
          </div>
        )}

        {/* Main Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto bg-[#F4F5EB] p-3 space-y-3">

          {/* ======================================================== */}
          {/* TAB 1: HOME (CAMP RESIDENT OVERVIEW - SCREEN 3) */}
          {/* ======================================================== */}
          {activeTab === 'home' && (
            <div className="space-y-3">
              
              {/* MOBILE-TO-MOBILE OPTION & HOP VISUALIZER */}
              <div className={`p-3 rounded-2xl border shadow-xs transition-colors ${
                !hasWifi ? 'bg-[#FEF3C7] border-[#FDE68A]' : 'bg-white border-[#E4E7D7]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!hasWifi ? (
                      <Smartphone className="w-4 h-4 text-[#92400E]" strokeWidth={2.5} />
                    ) : (
                      <Wifi className="w-4 h-4 text-[#15803D]" strokeWidth={2.5} />
                    )}
                    <div>
                      <div className={`text-xs font-black ${!hasWifi ? 'text-[#92400E]' : 'text-[#1A251B]'}`}>
                        {!hasWifi ? 'Mobile-to-Mobile Relay Mode (No Wi-Fi)' : 'Wi-Fi Cloud Mode'}
                      </div>
                      <div className="text-[10px] text-[#576356]">
                        {!hasWifi 
                          ? 'Active: Messages hop phone-to-phone via BLE radio (3 nearby phones in range)' 
                          : 'Standby: Direct Wi-Fi connection active'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setMobileToMobileEnabled(!mobileToMobileEnabled)}
                    className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                      mobileToMobileEnabled ? 'bg-gradient-to-r from-[#203918] to-[#385F2C] justify-end shadow-xs' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Live Hop Route Visual Diagram */}
                {!hasWifi && mobileToMobileEnabled && (
                  <div className="mt-2.5 pt-2 border-t border-[#FDE68A] space-y-1.5">
                    <div className="text-[9px] font-extrabold text-[#92400E] tracking-wider uppercase">
                      Offline Message Hop Route:
                    </div>
                    <div className="flex items-center justify-between text-[8.5px] font-bold text-[#1A251B] bg-white/70 p-2 rounded-xl border border-[#FDE68A]">
                      <div className="flex flex-col items-center gap-0.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#2D4A22]" />
                        <span>Your Mobile</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#8F9B8C]" />
                      <div className="flex flex-col items-center gap-0.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#92400E]" />
                        <span>Peer Phone (14m)</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#8F9B8C]" />
                      <div className="flex flex-col items-center gap-0.5">
                        <User className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>Responder</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#8F9B8C]" />
                      <div className="flex flex-col items-center gap-0.5">
                        <Radio className="w-3.5 h-3.5 text-[#2D4A22]" />
                        <span>HQ Gateway</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Camp Hero Card from User Screenshot */}
              <div className="bg-white rounded-2xl border border-[#E4E7D7] p-3.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E8EFE5] border border-[#D1DEC9] flex items-center justify-center">
                    <Tent className="w-6 h-6 text-[#2D4A22]" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#1A251B]">Camp 3</span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[9.5px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                        Active
                      </span>
                    </div>
                    <div className="text-xs text-[#576356] font-medium mt-0.5">Khanpur Valley</div>
                    <div className="text-[10.5px] text-[#8F9B8C]">1,240 residents</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8F9B8C]" />
                </div>
              </div>

              {/* GEMINI 2.5 FLASH PREDICTIVE INTELLIGENCE CARD */}
              <div className="bg-gradient-to-br from-[#FAFBF8] to-[#F4F7EF] rounded-2xl border border-[#3E6630]/30 p-3.5 shadow-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E7D7]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#2D4A22]" />
                    <span className="text-xs font-black text-[#1A251B]">Gemini 2.5 Flash Disaster Copilot</span>
                  </div>
                  <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Live AI
                  </span>
                </div>

                <div className="text-[11.5px] text-[#1A251B] leading-relaxed">
                  {aiForecast}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleGenerateAiForecast}
                    disabled={isGeneratingForecast}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#203918] via-[#2D4A22] to-[#385F2C] text-white text-[10.5px] font-bold hover:brightness-110 shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingForecast ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingForecast ? 'Querying Gemini...' : 'Refresh AI Forecast'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('requests')}
                    className="py-1.5 px-3 rounded-xl bg-[#E8EFE5] border border-[#3D6130]/40 text-[#2D4A22] text-[10.5px] font-bold hover:bg-[#DCE6D7] transition-colors"
                  >
                    Ask AI Advisor
                  </button>
                </div>
              </div>

              {/* Camp Status Overview Progress Section */}
              <div className="bg-white rounded-2xl border border-[#E4E7D7] p-3.5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#F0F2E9]">
                  <span className="text-xs font-black text-[#1A251B]">Camp Status Overview</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#15803D]">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    <span>Live Updates</span>
                  </div>
                </div>

                {/* Water Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Droplet className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-[#1A251B]">Water</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-[#576356]">320 / 500 L</span>
                      <span className="font-bold text-[#1A251B]">64%</span>
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Low Stock
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#E9EBE0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#2E7D32] rounded-full" style={{ width: '64%' }} />
                  </div>
                </div>

                {/* Food Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Package className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-[#1A251B]">Food</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-[#576356]">480 / 800 kg</span>
                      <span className="font-bold text-[#1A251B]">60%</span>
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Low Stock
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#E9EBE0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#2E7D32] rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>

                {/* Medical Goods Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                        <HeartPulse className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-[#1A251B]">Medical Goods</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-[#576356]">12 / 50 kits</span>
                      <span className="font-bold text-[#1A251B]">24%</span>
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Low Stock
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#E9EBE0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#DC2626] rounded-full" style={{ width: '24%' }} />
                  </div>
                </div>
              </div>

              {/* Service Status Tracker */}
              <div className="bg-white rounded-2xl border border-[#E4E7D7] p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#F0F2E9]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D4A22]" strokeWidth={2.5} />
                    <span className="text-xs font-black text-[#1A251B]">Service Status Tracker</span>
                  </div>
                  <span className="text-[10px] text-[#576356]">Allocated Resources</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#F5F6F0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Droplet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A251B]">Water</div>
                      <div className="text-[10px] text-[#576356]">500 L allocated</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> Received
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#F5F6F0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A251B]">Food</div>
                      <div className="text-[10px] text-[#576356]">800 kg allocated</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> Received
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#F5F6F0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                      <HeartPulse className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A251B]">Medical Kits</div>
                      <div className="text-[10px] text-[#576356]">50 kits allocated</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    Pending
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#E8EFE5] flex items-center justify-center text-[#2D4A22]">
                      <Home className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A251B]">Shelter</div>
                      <div className="text-[10px] text-[#576356]">12 tents allocated</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>

              {/* STICKY CRIMSON RED SOS BANNER FROM SCREENSHOT */}
              <button
                onClick={() => setActiveTab('requests')}
                disabled={isSending}
                className="w-full py-3 px-4 rounded-2xl bg-[#DC2626] text-white flex flex-col items-center justify-center shadow-md hover:bg-red-700 transition-colors active:scale-98"
                style={{ backgroundColor: '#DC2626', color: '#ffffff' }}
              >
                <div className="flex items-center gap-2 text-sm font-black tracking-wide" style={{ color: '#ffffff' }}>
                  <AlertTriangle className="w-4 h-4 text-white" strokeWidth={2.5} />
                  <span style={{ color: '#ffffff' }}>SOS / Request</span>
                </div>
                <div className="text-[10px] text-red-100 font-medium" style={{ color: '#FEE2E2' }}>
                  Emergency Help · Tap to notify nearest team
                </div>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REQUESTS (EMERGENCY SOS & MOBILE-TO-MOBILE CHAT) */}
          {/* ======================================================== */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              
              {/* Mobile-to-Mobile Option Card */}
              <div className={`p-3 rounded-2xl border shadow-xs ${
                !hasWifi ? 'bg-[#FEF3C7] border-[#FDE68A]' : 'bg-white border-[#E4E7D7]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!hasWifi ? (
                      <Smartphone className="w-4 h-4 text-[#92400E]" strokeWidth={2.5} />
                    ) : (
                      <Wifi className="w-4 h-4 text-[#15803D]" strokeWidth={2.5} />
                    )}
                    <div>
                      <div className="text-xs font-black text-[#1A251B]">
                        {!hasWifi ? 'Mobile-to-Mobile P2P Hop Active' : 'Wi-Fi Cloud Mode'}
                      </div>
                      <div className="text-[10px] text-[#576356]">
                        {!hasWifi 
                          ? 'No Wi-Fi: Messages hop across phones within ~30m until reaching HQ' 
                          : 'Direct cloud connection active'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setHasWifi(!hasWifi)}
                    className="text-[10px] font-bold text-[#2D4A22] underline cursor-pointer"
                  >
                    {!hasWifi ? 'Test Wi-Fi' : 'Test No Wi-Fi'}
                  </button>
                </div>
              </div>

              {/* Quick One-Tap Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickSOS('Medical Aid', 'Trauma treatment or insulin cold-storage urgently needed.')}
                  className="p-3 rounded-2xl bg-white border border-[#E4E7D7] text-left hover:border-red-500 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <HeartPulse className="w-5 h-5 text-red-600" />
                    <span className="text-[8.5px] font-bold text-red-600 bg-red-50 px-1 rounded">CRITICAL</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A251B]">Medical Help</div>
                  <div className="text-[10px] text-[#576356]">Trauma / Insulin</div>
                </button>

                <button
                  onClick={() => handleQuickSOS('Rescue Needed', 'Trapped on ground floor due to rising floodwaters.')}
                  className="p-3 rounded-2xl bg-white border border-[#E4E7D7] text-left hover:border-purple-500 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <LifeBuoy className="w-5 h-5 text-purple-600" />
                    <span className="text-[8.5px] font-bold text-purple-600 bg-purple-50 px-1 rounded">URGENT</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A251B]">Rescue Needed</div>
                  <div className="text-[10px] text-[#576356]">Trapped / Debris</div>
                </button>

                <button
                  onClick={() => handleQuickSOS('Clean Water', 'Drinking water exhausted for 12 individuals including infants.')}
                  className="p-3 rounded-2xl bg-white border border-[#E4E7D7] text-left hover:border-blue-500 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Droplet className="w-5 h-5 text-blue-600" />
                    <span className="text-[8.5px] font-bold text-blue-600 bg-blue-50 px-1 rounded">SUPPLY</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A251B]">Clean Water</div>
                  <div className="text-[10px] text-[#576356]">Rations Depleted</div>
                </button>

                <button
                  onClick={() => handleQuickSOS('Evacuation Boat', 'Submerged road access, boat required for evacuation.')}
                  className="p-3 rounded-2xl bg-white border border-[#E4E7D7] text-left hover:border-emerald-500 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Navigation className="w-5 h-5 text-emerald-600" />
                    <span className="text-[8.5px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">BOAT</span>
                  </div>
                  <div className="text-xs font-bold text-[#1A251B]">Evacuation Boat</div>
                  <div className="text-[10px] text-[#576356]">Flooding Level 2</div>
                </button>
              </div>

              {/* Chat Thread */}
              <div className="bg-white rounded-2xl border border-[#E4E7D7] p-3 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#F0F2E9]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A251B]">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>E2EE Mesh Direct Transmission</span>
                  </div>
                  <button 
                    onClick={() => setShowEncryptedPayload(!showEncryptedPayload)}
                    className="text-[10px] text-[#576356] hover:text-[#2D4A22] flex items-center gap-1 font-mono"
                  >
                    {showEncryptedPayload ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showEncryptedPayload ? 'Hide' : 'Inspect'} AES</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {messages.map((m) => {
                    const isUser = m.sender === 'user';
                    const isAi = m.isAiAdvisor;

                    if (isAi) {
                      return (
                        <div 
                          key={m.id}
                          className="p-2.5 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-[#F4F9F2] to-[#FAFDF9] text-xs leading-relaxed mr-4 shadow-xs"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#2D4A22]" />
                            <span>Gemini 2.5 Flash Emergency Guidance</span>
                            <span className="text-[9px] text-[#576356] ml-auto font-mono">{m.timestamp}</span>
                          </div>
                          <div className="text-[#1A251B] font-medium whitespace-pre-line leading-relaxed">{m.text}</div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={m.id} 
                        className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                          isUser 
                            ? 'bg-[#FAFBF8] border-[#D1DEC9] ml-6' 
                            : 'bg-white border-[#E4E7D7] mr-6'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9.5px] text-[#576356] mb-1 font-mono">
                          <span className="font-bold text-[#2D4A22]">{isUser ? `You → ${m.recipient}` : m.volunteerName}</span>
                          <span>{m.timestamp}</span>
                        </div>
                        <div className="text-[#1A251B] font-medium">{m.text}</div>
                        
                        {/* Hop Route Display */}
                        {m.hopRoute && (
                          <div className="mt-1 text-[9px] font-semibold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A]">
                            Route: {m.hopRoute}
                          </div>
                        )}

                        {showEncryptedPayload && m.encryptedHash && (
                          <div className="mt-1 text-[8.5px] text-emerald-700 bg-[#E8EFE5] p-1 rounded font-mono">
                            Cipher: {m.encryptedHash}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendCustomChat} className="flex items-center gap-2 pt-2 border-t border-[#F0F2E9]">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Encrypted message to ${selectedVolunteer.name.split(' ')[0]}...`}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#F4F5EB] border border-[#E4E7D7] text-xs text-[#1A251B] placeholder-[#8F9B8C] focus:outline-none focus:border-[#2D4A22]"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSending}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-[#203918] via-[#2D4A22] to-[#385F2C] text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-xs disabled:opacity-50 transition-all flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SERVICES (CAMP RESIDENT SUPPLIES & DIRECTORY) */}
          {/* ======================================================== */}
          {activeTab === 'services' && (
            <div className="space-y-2.5">
              
              {/* GEMINI AI CAMP MATCHMAKER */}
              <div className="bg-[#FAFBF8] p-3 rounded-2xl border border-[#3E6630]/30 shadow-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#2D4A22] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-black text-[#1A251B]">Gemini AI Shelter Matchmaker</div>
                  <div className="text-[10px] text-[#576356] leading-relaxed mt-0.5">
                    Based on current Khanpur flood vectors, Camp 1 (Central Stadium) offers the safest elevated corridor with 410 open slots and 24/7 on-site doctor coverage.
                  </div>
                </div>
              </div>

              <div className="text-xs font-black text-[#576356] tracking-wide px-1">
                VERIFIED RELIEF SHELTERS
              </div>

              {NEARBY_CAMPS.map(camp => (
                <div key={camp.id} className="bg-white p-3.5 rounded-2xl border border-[#E4E7D7] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-[#1A251B]">{camp.name}</div>
                      <div className="text-[10px] text-emerald-700 font-bold font-mono">
                        {camp.distanceText} · {camp.walkTime} · {camp.bearing}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#203918] via-[#2D4A22] to-[#385F2C] text-white text-[10px] font-bold hover:brightness-110 shadow-xs"
                    >
                      Show on Map
                    </button>
                  </div>
                  <div className="text-[10px] text-[#576356] flex items-center gap-2">
                    <span>Occupancy: {camp.occupancy} / {camp.capacity} residents</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: MAP (LIVE RADAR BEACON & SHELTERS) */}
          {/* ======================================================== */}
          {activeTab === 'map' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-[#E4E7D7] p-2.5 shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#1A251B]">
                  <Compass className="w-4 h-4 text-[#2D4A22]" />
                  <span>Sector Delta 9 Live Radar</span>
                </div>
                <span className="text-[10px] text-[#576356] font-mono">Accuracy: 3m</span>
              </div>

              <div className="h-96 w-full rounded-2xl border border-[#E4E7D7] overflow-hidden relative shadow-xs">
                <MobileOfflineMap 
                  userLocation={DEFAULT_USER_LOCATION} 
                  volunteers={NEARBY_VOLUNTEERS}
                  camps={NEARBY_CAMPS}
                />
              </div>

              <div className="bg-white rounded-2xl border border-[#E4E7D7] p-3 shadow-xs text-xs space-y-2">
                <div className="font-bold text-[#1A251B]">Nearest Active Shelter:</div>
                <div className="flex items-center justify-between text-[11px] text-[#576356]">
                  <span>{NEARBY_CAMPS[0].name}</span>
                  <span className="font-bold text-emerald-700">{NEARBY_CAMPS[0].distanceText} (Bearing {NEARBY_CAMPS[0].bearing})</span>
                </div>
              </div>

              {/* GEMINI AI DARK ZONE & RECON CARD */}
              <div className="bg-white rounded-2xl border border-[#3E6630]/30 p-3 shadow-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#1A251B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#2D4A22]" />
                  <span>Gemini AI Tactical Recon Assessment</span>
                </div>
                <div className="text-[10.5px] text-[#576356] leading-relaxed">
                  Delta 9 silence ratio is 0.68. Predicted isolated pockets: 3 clusters along river bend. Recommended drone search heading: 45° Northeast toward railway bridge.
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PORTALS & DISASTER SETTINGS HUB */}
          {/* ======================================================== */}
          {activeTab === 'portals' && (
            <div className="space-y-3 pb-2">
              
              {/* CURRENT ACTIVE IDENTITY & CLEARANCE CARD */}
              <div className="bg-white rounded-2xl border border-[#D5DCB8] p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#576356]">
                    Active Session Mode
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F0DC] text-[#2D4A22] border border-[#CBD8BA]">
                    {user ? `${user.role.toUpperCase()}` : 'CIVILIAN MODE'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1C3315] via-[#2D4A22] to-[#3E6630] flex items-center justify-center text-white font-black text-sm shadow-sm">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CZ'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">
                      {user?.name || 'Affected Resident / Citizen'}
                    </div>
                    <div className="text-[10.5px] text-slate-500 truncate font-mono">
                      {user?.email || 'Sector Delta 9 (Lowland Floods)'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen && setIsAuthModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#1C3315] via-[#2D4A22] to-[#385F2C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>Switch Clearance Profile / Login</span>
                </button>
              </div>

              {/* OPERATIONAL PORTALS DIRECT JUMP SECTION */}
              <div className="bg-white rounded-2xl border border-[#E4E7D7] p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#2D4A22]" />
                    <span>ReliefOS Dashboards & Portals</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">1-Click Access</span>
                </div>

                <div className="space-y-1.5">
                  {/* 1. Volunteer Portal */}
                  <Link
                    href="/volunteer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Volunteer Responder Portal</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-emerald-200 text-emerald-800 font-bold">FIELD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Assigned duties, citizen SOS feed, offline mesh triage
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* 2. Command HQ Dashboard */}
                  <Link
                    href="/"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-red-200/60 bg-red-50/50 hover:bg-red-100/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>HQ Incident Command Center</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-red-200 text-red-800 font-bold">ADMIN</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Dark Zone disparity map, AI briefing & resource dispatch
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-red-700 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* 3. Camp Manager Operations */}
                  <Link
                    href="/camp-manager"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200/60 bg-amber-50/50 hover:bg-amber-100/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                        <Tent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Camp Operations & Logistics</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-amber-200 text-amber-800 font-bold">CAMP MGR</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Refugee intake registry, water deficit alerts & ration burn rate
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* 4. Resources & Relief Hubs */}
                  <Link
                    href="/resources"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200/60 bg-blue-50/50 hover:bg-blue-100/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900">
                          Regional Stock Inventory
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Capacity bars across 4 regional disaster relief depots
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-700 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* 5. Distress Triage */}
                  <Link
                    href="/triage"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-purple-200/60 bg-purple-50/50 hover:bg-purple-100/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                        <FileSearch className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900">
                          Distress Report Triage
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Automated entity extraction and Gemini 2.5 Flash classification
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-700 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* SYSTEM PREFERENCES & CONTROLS */}
              <div className="bg-white rounded-2xl border border-[#E4E7D7] p-3 shadow-xs space-y-2.5 text-xs">
                <span className="font-black text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#2D4A22]" />
                  <span>Display & Network Controls</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTheme && toggleTheme()}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2 text-left font-bold text-slate-800 transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    <div className="text-[11px] leading-tight">
                      <div>Theme Mode</div>
                      <span className="text-[10px] font-normal text-slate-500 capitalize">{theme || 'light'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => cycleThemeAccent && cycleThemeAccent()}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2 text-left font-bold text-slate-800 transition-colors"
                  >
                    <Palette className="w-4 h-4 text-emerald-600" />
                    <div className="text-[11px] leading-tight">
                      <div>Color Accent</div>
                      <span className="text-[10px] font-normal text-slate-500 uppercase">{themeAccent || 'red'}</span>
                    </div>
                  </button>
                </div>

                {/* Local Database persistence badge */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Local SQLite Backend:</span>
                  <span className="font-mono text-emerald-700 font-bold">reliefos.db (Ready)</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* 5-Tab Bottom Navigation Bar (Home | Requests | Services | Map | Portals) */}
        <div className="h-14 bg-[#F5F6ED] border-t border-[#E2E6D5] flex items-center justify-around px-1 flex-shrink-0">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              activeTab === 'home' ? 'text-[#2D4A22]' : 'text-[#7B8776]'
            }`}
          >
            <Home className="w-4 h-4" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              activeTab === 'requests' ? 'text-[#DC2626]' : 'text-[#7B8776]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" strokeWidth={activeTab === 'requests' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Requests</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              activeTab === 'services' ? 'text-[#2D4A22]' : 'text-[#7B8776]'
            }`}
          >
            <CheckSquare className="w-4 h-4" strokeWidth={activeTab === 'services' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Services</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              activeTab === 'map' ? 'text-[#2D4A22]' : 'text-[#7B8776]'
            }`}
          >
            <MapPin className="w-4 h-4" strokeWidth={activeTab === 'map' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Map</span>
          </button>

          <button
            id="tab-portals-settings"
            onClick={() => setActiveTab('portals')}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              activeTab === 'portals' ? 'text-[#2D4A22]' : 'text-[#7B8776]'
            }`}
          >
            <Sliders className="w-4 h-4" strokeWidth={activeTab === 'portals' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Portals</span>
          </button>
        </div>
          </>
        )}

      </div>

    </div>
  );
}
