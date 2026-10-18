import React, { useState, useEffect, useRef } from 'react';
import { generateGatewayKeyPair, encryptMessage, decryptMessage } from '../lib/meshCrypto.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOP_DELAY_MS = 700; // ms between each animated hop

const NODE_DEFS = [
  {
    id: 'v1',
    label: 'Volunteer 1',
    role: 'Originator · Field',
    icon: '📡',
    color: 'sky',
  },
  {
    id: 'v2',
    label: 'Volunteer 2',
    role: 'Relay · Ciphertext only',
    icon: '🔁',
    color: 'slate',
  },
  {
    id: 'v3',
    label: 'Volunteer 3',
    role: 'Relay · Ciphertext only',
    icon: '🔁',
    color: 'slate',
  },
  {
    id: 'gw',
    label: 'Gateway',
    role: 'Decrypt · Uplink',
    icon: '🛰️',
    color: 'violet',
  },
];

// Animation step → which node is "active" (receiving / processing)
// Step 0 = idle, 1 = V1 encrypting, 2 = V2 relaying, 3 = V3 relaying, 4 = GW decrypting, 5 = done
const TOTAL_STEPS = 5;

// ─── Colour helpers ───────────────────────────────────────────────────────────

function nodeClasses(nodeIndex, activeStep, done) {
  if (done && nodeIndex < 3) {
    return 'border-emerald-300 bg-emerald-50 shadow-sm';
  }
  if (done && nodeIndex === 3) {
    return 'border-violet-400 bg-violet-50 ring-2 ring-violet-300 shadow-md';
  }
  const step = nodeIndex + 1; // step when this node is active
  if (activeStep === step) {
    if (nodeIndex === 3) return 'border-violet-400 bg-violet-50 ring-2 ring-violet-300 shadow-md animate-pulse';
    return 'border-sky-400 bg-sky-50 ring-2 ring-sky-300 shadow-md animate-pulse';
  }
  if (activeStep > step) {
    return 'border-emerald-300 bg-emerald-50 shadow-sm';
  }
  return 'border-[#E2E8F0] bg-white shadow-2xs opacity-60';
}

// ─── Arrow component ──────────────────────────────────────────────────────────

function Arrow({ active, done }) {
  const color = done ? '#10B981' : active ? '#0EA5E9' : '#CBD5E1';
  return (
    <div className="hidden sm:flex items-center justify-center w-8 shrink-0">
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
        <line x1="0" y1="12" x2="24" y2="12" stroke={color} strokeWidth="2.5"
          strokeDasharray={active ? '4 3' : 'none'}
          style={active ? { animation: 'dash 0.8s linear infinite' } : {}} />
        <polygon points="24,6 32,12 24,18" fill={color} />
      </svg>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MeshSimulatorPage() {
  const [message, setMessage] = useState('Critical medicine needed: Camp B urgent');
  const [step, setStep] = useState(0);   // 0 idle … 5 done
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Crypto artefacts
  const gatewayRef = useRef(null); // { keyPair, publicKeyB64 }
  const [packet, setPacket] = useState(null); // { ciphertextB64, ivB64, senderPublicKeyB64 }
  const [decrypted, setDecrypted] = useState('');

  // Display snippets per node
  const [nodePayloads, setNodePayloads] = useState(['', '', '', '']);

  // Initialise Gateway key pair once on mount
  useEffect(() => {
    generateGatewayKeyPair()
      .then((gw) => { gatewayRef.current = gw; })
      .catch(() => setError('Web Crypto not available in this browser.'));
  }, []);

  // ── Reset ──
  const handleReset = () => {
    setStep(0);
    setBusy(false);
    setError('');
    setPacket(null);
    setDecrypted('');
    setNodePayloads(['', '', '', '']);
    // Re-generate gateway key pair
    generateGatewayKeyPair()
      .then((gw) => { gatewayRef.current = gw; })
      .catch(() => setError('Web Crypto not available in this browser.'));
  };

  // ── Encrypt and send ──
  const handleSend = async () => {
    if (!message.trim()) return;
    if (!gatewayRef.current) { setError('Gateway key not ready yet.'); return; }
    setBusy(true);
    setError('');
    setStep(0);
    setDecrypted('');
    setNodePayloads(['', '', '', '']);

    try {
      // Real ECDH P-256 + AES-GCM encryption
      const pkt = await encryptMessage(message, gatewayRef.current.publicKeyB64);
      setPacket(pkt);

      const cipherTextB64 = pkt.ciphertextB64;

      // Animate hop by hop
      // Step 1: V1 encrypts → holds ciphertext
      await delay(HOP_DELAY_MS);
      setStep(1);
      setNodePayloads([cipherTextB64, '', '', '']);

      // Step 2: V2 relay
      await delay(HOP_DELAY_MS);
      setStep(2);
      setNodePayloads([cipherTextB64, cipherTextB64, '', '']);

      // Step 3: V3 relay
      await delay(HOP_DELAY_MS);
      setStep(3);
      setNodePayloads([cipherTextB64, cipherTextB64, cipherTextB64, '']);

      // Step 4: Gateway decrypts
      await delay(HOP_DELAY_MS);
      setStep(4);
      const plain = await decryptMessage(pkt, gatewayRef.current.keyPair);
      setDecrypted(plain);
      setNodePayloads([cipherTextB64, cipherTextB64, cipherTextB64, plain]);

      // Step 5: done
      await delay(200);
      setStep(5);
    } catch (err) {
      setError(`Crypto error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const done = step === TOTAL_STEPS;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">
          Mesh Simulator
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          End-to-end encrypted multi-hop relay simulation using Web Crypto.
        </p>
      </div>

      {/* ── Permanent amber banner ── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-2xs">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p className="text-xs font-medium leading-relaxed">
          Simulated demo. Real mesh needs a native app (Bluetooth range is often about 10 m indoors).
        </p>
      </div>

      {/* ── Crypto labels ── */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Encryption: real (Web Crypto, ECDH P-256 + AES-GCM)
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Radio: simulated
        </span>
      </div>

      {/* ── Message input ── */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
        <label htmlFor="mesh-message" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
          Message
        </label>
        <textarea
          id="mesh-message"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={busy}
          placeholder="Type a field message…"
          className="w-full rounded-lg border border-[#E2E8F0] bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none disabled:opacity-50"
        />
        <div className="flex gap-2 justify-end">
          <button
            id="mesh-reset"
            type="button"
            onClick={handleReset}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Reset
          </button>
          <button
            id="mesh-send"
            type="button"
            onClick={handleSend}
            disabled={busy || !message.trim()}
            className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            {busy ? 'Sending…' : 'Encrypt and send'}
          </button>
        </div>
        {error && (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        )}
      </div>

      {/* ── 4-node hop chain ── */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Hop chain</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0">
          {NODE_DEFS.map((node, i) => {
            const nodeStep = i + 1;
            const isActive = step === nodeStep;
            const isPassed = step > nodeStep || done;
            const isRelay = i === 1 || i === 2;
            const isGateway = i === 3;
            const payload = nodePayloads[i];

            return (
              <React.Fragment key={node.id}>
                {/* Node card */}
                <div
                  className={`flex-1 rounded-xl border p-4 transition-all duration-500 ${nodeClasses(i, step, done)}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{node.icon}</span>
                    {isActive && (
                      <span className="rounded-full bg-sky-100 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        {isGateway ? 'Decrypting' : isRelay ? 'Relaying' : 'Encrypting'}
                      </span>
                    )}
                    {isPassed && !isActive && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isGateway
                          ? 'bg-violet-100 border border-violet-200 text-violet-700'
                          : 'bg-emerald-100 border border-emerald-200 text-emerald-700'
                      }`}>
                        {isGateway ? 'Decrypted' : 'Relayed'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-[#0F172A]">{node.label}</h4>
                  <p className="text-[11px] text-slate-500">{node.role}</p>

                  {/* Payload box */}
                  <div className={`mt-3 rounded-lg border p-2 text-[10px] font-mono break-all leading-relaxed min-h-[44px] transition-all ${
                    isGateway && done
                      ? 'border-violet-200 bg-violet-50 text-violet-900'
                      : payload
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}>
                    {!payload && !isActive && (
                      <span className="italic text-slate-400">Waiting…</span>
                    )}
                    {isActive && !payload && (
                      <span className="italic">{isGateway ? 'Decrypting…' : 'Encrypting…'}</span>
                    )}
                    {payload && (
                      <>
                        {isGateway && done ? (
                          <>
                            <span className="block text-[9px] font-bold text-violet-500 mb-1 not-italic">
                              Decrypted message
                            </span>
                            <span className="text-violet-900 font-bold not-italic">"{payload}"</span>
                          </>
                        ) : (
                          <>
                            <span className="block text-[9px] font-bold text-amber-600 mb-1 not-italic">
                              Ciphertext only
                            </span>
                            {payload}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow between nodes */}
                {i < 3 && (
                  <Arrow
                    active={step === nodeStep}
                    done={step > nodeStep || done}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Full ciphertext details (shown once encryption done) ── */}
      {packet && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Packet details (relay nodes see only this)
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { label: 'Ciphertext (AES-GCM)', value: packet.ciphertextB64, color: 'amber' },
              { label: 'IV (12-byte random)', value: packet.ivB64, color: 'sky' },
              { label: "Sender's ephemeral public key", value: packet.senderPublicKeyB64, color: 'slate' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-lg border border-${color}-200 bg-${color}-50 p-2`}>
                <p className={`text-[10px] font-bold text-${color}-700 mb-1`}>{label}</p>
                <p className="text-[9px] font-mono break-all text-slate-700 leading-relaxed">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Decryption result (shown at Gateway) ── */}
      {done && decrypted && (
        <div className="rounded-2xl border border-violet-300 bg-violet-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🛰️</span>
            <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">
              Gateway — decrypted message
            </p>
          </div>
          <p className="text-base font-bold text-violet-900">"{decrypted}"</p>
          <p className="text-[11px] text-violet-600 mt-2">
            Decrypted using ECDH-derived AES-256-GCM key. Gateway private key never left this device.
          </p>
        </div>
      )}

      {/* ── Inline keyframes for dashed arrow animation ── */}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -14; }
        }
      `}</style>
    </div>
  );
}

// ─── Tiny async delay helper ──────────────────────────────────────────────────
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
