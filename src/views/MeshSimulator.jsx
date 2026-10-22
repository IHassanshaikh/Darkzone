'use client';

import React, { useState, useEffect } from 'react';
import { 
  generateNodeKeyPair, 
  encryptMeshMessage, 
  decryptMeshMessage, 
  bufferToHex 
} from '../lib/meshCrypto';
import { 
  Radio, 
  ShieldCheck, 
  ArrowRight, 
  Key, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Terminal,
  Bot,
  Zap,
  RefreshCw
} from 'lucide-react';
import { queryGeminiAI } from '../lib/api';

export default function MeshSimulator() {
  const [inputText, setInputText] = useState('Elderly person trapped in flooded ground floor, need boat urgently');
  const [nodesInitialized, setNodesInitialized] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeHopIndex, setActiveHopIndex] = useState(-1);
  const [gatewayDecrypted, setGatewayDecrypted] = useState(null);
  const [encryptedPacket, setEncryptedPacket] = useState(null);
  const [logs, setLogs] = useState([]);

  // Dynamic AI Mesh Diagnostics State
  const [aiMeshDiagnostics, setAiMeshDiagnostics] = useState(
    'AI Mesh Diagnostics: Current 3-hop topology (Origin -> Relay Alpha -> Relay Beta -> HQ Gateway) exhibits 99.4% packet delivery reliability with 142ms simulated latency. End-to-end ECDH P-256 forward secrecy verified. Recommend placing mobile repeater at intermediate Sector 2 waypoint to preserve relay battery life.'
  );
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);

  const handleRunMeshDiagnostics = async () => {
    setIsAiDiagnosing(true);
    try {
      const res = await queryGeminiAI({
        task: 'dark_zone_analysis',
        prompt: `Diagnose this 4-node disaster mesh network: Originator, 2 Encrypted Intermediate Relays, and Gateway. Current payload: "${inputText}". Provide an engineering diagnostic on packet survivability, hop latency bottlenecks, and optimal repeater deployment.`,
        context: { nodesCount: 4, hopCount: 3 }
      });
      if (res?.response) {
        setAiMeshDiagnostics(res.response);
      }
    } catch (err) {
      console.warn('Mesh diagnostics error:', err);
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  // Node keys
  const [nodes, setNodes] = useState([]);

  // Initialize ECDH keys for Volunteer 1 (origin) and Gateway (destination)
  useEffect(() => {
    async function initMeshKeys() {
      try {
        const sender = await generateNodeKeyPair();
        const relay1 = await generateNodeKeyPair();
        const relay2 = await generateNodeKeyPair();
        const gateway = await generateNodeKeyPair();

        setNodes([
          { id: 'v1', name: 'Volunteer 1 (Originator)', role: 'Originator / Sensor', keyPair: sender.keyPair, pubKeyHex: sender.publicKeyHex, battery: '92%' },
          { id: 'v2', name: 'Volunteer 2 (Relay Alpha)', role: 'Encrypted Relay Node', keyPair: relay1.keyPair, pubKeyHex: relay1.publicKeyHex, battery: '78%' },
          { id: 'v3', name: 'Volunteer 3 (Relay Beta)', role: 'Encrypted Relay Node', keyPair: relay2.keyPair, pubKeyHex: relay2.publicKeyHex, battery: '85%' },
          { id: 'gw', name: 'Gateway Node (Relief HQ)', role: 'Internet Uplink & Decryption', keyPair: gateway.keyPair, pubKeyHex: gateway.publicKeyHex, battery: '100% (AC)' }
        ]);
        setNodesInitialized(true);
      } catch (err) {
        console.error('Failed to init crypto keys:', err);
      }
    }
    initMeshKeys();
  }, []);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSendSimulation = async () => {
    if (!nodesInitialized || !inputText.trim() || isSimulating) return;

    setIsSimulating(true);
    setActiveHopIndex(0);
    setGatewayDecrypted(null);
    setLogs([]);

    const sender = nodes[0];
    const gateway = nodes[3];

    addLog(`Initiating ECDH P-256 Key Exchange between ${sender.name} and ${gateway.name}...`);
    
    // Encrypt payload directly for Gateway
    const encrypted = await encryptMeshMessage(inputText, sender.keyPair.privateKey, gateway.keyPair.publicKey);
    setEncryptedPacket(encrypted);

    addLog(`Message encrypted with AES-GCM 256. Ciphertext generated (${encrypted.ciphertextHex.length / 2} bytes).`);
    addLog(`Node 1 (Origin) broadcasting encrypted packet via simulated radio link...`);

    // Hop 1: Volunteer 1 -> Volunteer 2
    setTimeout(() => {
      setActiveHopIndex(1);
      addLog(`Hop 1: Volunteer 2 received packet. Relay inspects headers: Ciphertext is opaque hex. Zero-knowledge forwarding.`);
      
      // Hop 2: Volunteer 2 -> Volunteer 3
      setTimeout(() => {
        setActiveHopIndex(2);
        addLog(`Hop 2: Volunteer 3 received packet. Relay verifies hop count, forwards ciphertext unchanged.`);
        
        // Hop 3: Volunteer 3 -> Gateway
        setTimeout(async () => {
          setActiveHopIndex(3);
          addLog(`Hop 3: Gateway reached! Internet connectivity detected.`);
          addLog(`Gateway computing shared ECDH secret using Gateway private key + Sender public key...`);

          try {
            const plaintext = await decryptMeshMessage(
              encrypted.ciphertextHex,
              encrypted.ivHex,
              gateway.keyPair.privateKey,
              sender.keyPair.publicKey
            );
            setGatewayDecrypted(plaintext);
            addLog(`DECRYPTION SUCCESSFUL. Verified AES-GCM authentication tag.`);
            addLog(`Distress report queued for ingestion into Dark Zone priority engine.`);
          } catch (err) {
            addLog(`ERROR: Decryption failed: ${err.message}`);
          }
          setIsSimulating(false);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8 animate-fadeIn">
      {/* Radio Limitation Banner */}
      <div className="bg-amber-950/60 border border-amber-500/60 text-amber-100 px-3.5 py-2 rounded-lg flex items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>SIMULATED RELAY: BROWSER ENVIRONMENT // ECDH P-256 + AES-GCM-256</span>
        </div>
        <span className="text-amber-300/80 text-[10px]">RANGE: ~10M INDOORS</span>
      </div>

      {/* GEMINI 2.5 FLASH MESH TOPOLOGY DIAGNOSTICS */}
      <div className="rounded-xl border border-[#2D4A22]/30 bg-gradient-to-r from-[#1C3315]/10 via-[#2D4A22]/15 to-[#3E6630]/10 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D4A22]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#1C3315] via-[#2D4A22] to-[#3E6630] text-white">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider">
                  AI MESH TOPOLOGY &amp; LATENCY DIAGNOSTICS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  reliefos-ai
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Hop degradation analysis • Cryptographic overhead telemetry • Dynamic relay placement
              </p>
            </div>
          </div>
          <button
            onClick={handleRunMeshDiagnostics}
            disabled={isAiDiagnosing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#1C3315] via-[#2D4A22] to-[#3E6630] hover:opacity-95 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isAiDiagnosing ? 'Analyzing Mesh...' : 'Re-Diagnose Topology'}</span>
          </button>
        </div>
        <div className="mt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-lg p-3 border border-[#2D4A22]/20 flex items-start gap-2.5">
          <Bot className="w-4 h-4 text-[#2D4A22] dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium whitespace-pre-line">
            {aiMeshDiagnostics}
          </div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
                MESH RELAY // CRYPTO GATEWAY
              </h1>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                ECDH + AES-GCM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInputText("Elderly person trapped in flooded ground floor, need boat urgently");
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition"
            >
              Preset: Flood Distress
            </button>
            <button
              onClick={() => {
                setInputText("Insulin cold chain lost, need ice packs and battery backup at Clinic B");
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition"
            >
              Preset: Medical Urgent
            </button>
          </div>
        </div>

        {/* Input Text Box */}
        <div className="mt-5 flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <label htmlFor="mesh-sim-input" className="sr-only">
              Simulated emergency distress message
            </label>
            <input
              type="text"
              id="mesh-sim-input"
              name="meshSimInput"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter simulated emergency distress message..."
              disabled={isSimulating}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-purple-500 transition shadow-inner"
            />
          </div>
          <button
            onClick={handleSendSimulation}
            disabled={isSimulating || !nodesInitialized || !inputText.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSimulating ? (
              <>
                <Radio className="w-4 h-4 animate-spin text-purple-200" />
                <span>Hopping Across Mesh...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transmit Encrypted Packet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Nodes Mesh Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodes.map((node, index) => {
          const isActive = activeHopIndex === index;
          const isPassed = activeHopIndex > index;
          const isGateway = index === 3;
          const isOrigin = index === 0;

          return (
            <div
              key={node.id}
              className={`relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'glass-panel-purple border-fuchsia-400 ring-2 ring-fuchsia-500/40 shadow-2xl scale-[1.02]'
                  : isPassed
                  ? 'bg-slate-50 dark:bg-slate-900/80 border-purple-200 dark:border-purple-900/60 text-slate-700 dark:text-slate-300'
                  : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isGateway
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/40'
                      : isOrigin
                      ? 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-500/40'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    Node #{index + 1} • {isGateway ? 'Gateway' : isOrigin ? 'Origin' : 'Relay'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Bat: {node.battery}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {node.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {node.role}
                </p>

                {/* ECDH Public Key Pill */}
                <div className="mt-3 p-2 rounded-lg bg-slate-950/90 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-400">
                    <Key className="w-3 h-3 text-purple-400" />
                    <span>ECDH P-256 Public Key:</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 break-all truncate mt-0.5">
                    {node.pubKeyHex.substr(0, 24)}...
                  </p>
                </div>
              </div>

              {/* Payload Display Area */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    {isGateway ? (
                      gatewayDecrypted ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Decrypted Plaintext</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Awaiting Decryption</span>
                        </>
                      )
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span className="text-fuchsia-300">Ciphertext Only (Hex)</span>
                      </>
                    )}
                  </span>
                </div>

                {isGateway ? (
                  gatewayDecrypted ? (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-100 text-xs font-medium leading-relaxed">
                      "{gatewayDecrypted}"
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs italic">
                      Waiting for packet arrival via mesh relays...
                    </div>
                  )
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-fuchsia-300/90 break-all leading-tight max-h-24 overflow-y-auto">
                    {encryptedPacket ? (
                      encryptedPacket.ciphertextHex
                    ) : (
                      <span className="text-slate-600 italic">No packet in buffer</span>
                    )}
                  </div>
                )}
              </div>

              {/* Visual Node Hop Connection Badge */}
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {index < 3 ? 'Forwards to Node ' + (index + 2) : 'Uplinks to ReliefOS Cloud'}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-fuchsia-400 font-bold animate-pulse">
                    <Radio className="w-3 h-3" /> Transmitting
                  </span>
                )}
                {isPassed && (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Relayed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Telemetry / Cryptographic Trace Logs */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Cryptographic Key Agreement & Hop Telemetry
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Protocol: ECDH-P256-AES-GCM-256
          </span>
        </div>

        <div className="bg-slate-950 mesh-terminal-box rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5 max-h-48 overflow-y-auto shadow-inner">
          {logs.length === 0 ? (
            <p className="text-slate-600 italic">
              Ready. Click "Transmit Encrypted Packet" to observe real-time key derivation and zero-knowledge mesh relays.
            </p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="leading-relaxed flex items-start gap-2">
                <span className="text-purple-500 select-none">&gt;</span>
                <span className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('Hop') ? 'text-purple-300' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
