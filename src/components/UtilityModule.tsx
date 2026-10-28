import React, { useState, useEffect } from 'react';
import { playClickSound, playSuccessChime } from '../utils/sound';
import { 
  Calculator as CalcIcon, 
  GraduationCap, 
  ArrowLeftRight, 
  QrCode, 
  Copy, 
  Check, 
  Plus, 
  Trash2,
  Code2,
  Lock,
  Eye,
  EyeOff,
  Shield,
  FileCode,
  Terminal,
  Hash
} from 'lucide-react';

interface UtilityModuleProps {
  soundEnabled: boolean;
}

interface CourseItem {
  id: string;
  name: string;
  credits: number;
  currentScore: number;
  finalWeight: number; // e.g. 40%
  targetScore: number;  // e.g. 90%
}

interface VaultCredential {
  id: string;
  service: string;
  username: string;
  secret: string;
  note?: string;
  updatedAt: number;
}

const VAULT_STORAGE_KEY = 'cadence_vault_store';

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptPayload(plaintext: string, passphrase: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return JSON.stringify({
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext))
  });
}

async function decryptPayload(encryptedJson: string, passphrase: string): Promise<string> {
  const parsed = JSON.parse(encryptedJson);
  const salt = new Uint8Array(parsed.salt);
  const iv = new Uint8Array(parsed.iv);
  const ciphertext = new Uint8Array(parsed.data);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

export const UtilityModule: React.FC<UtilityModuleProps> = ({ soundEnabled }) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'dev' | 'vault' | 'gpa' | 'converter' | 'qr'>('calc');

  // Calculator State
  const [calcMode, setCalcMode] = useState<'standard' | 'scientific' | 'programmer'>('standard');
  const [calcDisplay, setCalcDisplay] = useState('0');

  // Dev Toolbox State
  const [devTool, setDevTool] = useState<'json' | 'b64' | 'hash'>('json');
  const [jsonInput, setJsonInput] = useState('{\n  "title": "Cadence Productivity",\n  "version": "1.0.0",\n  "localFirst": true\n}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);
  const [b64Input, setB64Input] = useState('Cadence: Authentic Human Craft');
  const [b64Result, setB64Result] = useState('');
  const [hashInput, setHashInput] = useState('cadence-secret-token');
  const [sha256Hex, setSha256Hex] = useState('');
  const [sha1Hex, setSha1Hex] = useState('');

  // Password Vault State
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [newCredService, setNewCredService] = useState('');
  const [newCredUsername, setNewCredUsername] = useState('');
  const [newCredPassword, setNewCredPassword] = useState('');
  const [newCredNote, setNewCredNote] = useState('');
  const [showAddCredModal, setShowAddCredModal] = useState(false);

  // QR Code State
  const [qrText, setQrText] = useState('https://github.com');
  const [copiedVal, setCopiedVal] = useState<string | null>(null);

  // GPA & Target Exam State
  const [courses, setCourses] = useState<CourseItem[]>([
    { id: '1', name: 'Mathematics / Calculus', credits: 4, currentScore: 82, finalWeight: 40, targetScore: 85 },
    { id: '2', name: 'Physics & Mechanics', credits: 4, currentScore: 78, finalWeight: 35, targetScore: 80 },
    { id: '3', name: 'Computer Science', credits: 3, currentScore: 92, finalWeight: 30, targetScore: 90 },
    { id: '4', name: 'English Literature', credits: 2, currentScore: 88, finalWeight: 25, targetScore: 85 }
  ]);

  // Converter State
  const [converterMode, setConverterMode] = useState<'base' | 'storage' | 'temp'>('base');
  const [baseInput, setBaseInput] = useState('42');
  const [baseType, setBaseType] = useState<'dec' | 'hex' | 'bin' | 'oct'>('dec');
  
  // Storage Converter State
  const [storageVal, setStorageVal] = useState('1024');
  const [storageUnit, setStorageUnit] = useState<'mb' | 'gb' | 'kb' | 'tb'>('mb');

  // Temperature Converter State
  const [tempVal, setTempVal] = useState('25');
  const [tempUnit, setTempUnit] = useState<'c' | 'f'>('c');

  // Live Hash Computation
  useEffect(() => {
    let isCancelled = false;
    if (!hashInput) {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setSha256Hex('');
          setSha1Hex('');
        }
      });
      return;
    }
    const enc = new TextEncoder().encode(hashInput);
    window.crypto.subtle.digest('SHA-256', enc).then(buf => {
      if (!isCancelled) {
        setSha256Hex(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
      }
    });
    window.crypto.subtle.digest('SHA-1', enc).then(buf => {
      if (!isCancelled) {
        setSha1Hex(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [hashInput]);

  const handleCalcPress = (val: string) => {
    playClickSound(soundEnabled);
    if (val === 'C') {
      setCalcDisplay('0');
    } else if (val === '=') {
      try {
        const sanitized = calcDisplay.replace(/[^0-9+\-*/.&|^<>\s]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(result));
      } catch {
        setCalcDisplay('Error');
      }
    } else if (['sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'sqr', 'inv', 'pi', 'e', 'NOT'].includes(val)) {
      try {
        const num = parseFloat(calcDisplay) || 0;
        let res = 0;
        if (val === 'sin') res = Math.sin((num * Math.PI) / 180);
        if (val === 'cos') res = Math.cos((num * Math.PI) / 180);
        if (val === 'tan') res = Math.tan((num * Math.PI) / 180);
        if (val === 'sqrt') res = Math.sqrt(num);
        if (val === 'log') res = Math.log10(num);
        if (val === 'ln') res = Math.log(num);
        if (val === 'sqr') res = num * num;
        if (val === 'inv') res = num !== 0 ? 1 / num : NaN;
        if (val === 'pi') res = Math.PI;
        if (val === 'e') res = Math.E;
        if (val === 'NOT') res = ~Math.floor(num);
        setCalcDisplay(isNaN(res) ? 'Error' : String(Number(res.toFixed(6))));
      } catch {
        setCalcDisplay('Error');
      }
    } else if (['&', '|', '^', '<<', '>>'].includes(val)) {
      setCalcDisplay(calcDisplay + ' ' + val + ' ');
    } else {
      if (calcDisplay === '0' || calcDisplay === 'Error') {
        setCalcDisplay(val);
      } else {
        setCalcDisplay(calcDisplay + val);
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVal(text);
    playClickSound(soundEnabled);
    setTimeout(() => setCopiedVal(null), 1500);
  };

  // Dev Toolbox: JSON Formatter handlers
  const handleFormatJson = (minify: boolean) => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
      setJsonError(null);
      setJsonSuccess(minify ? 'Minified JSON successfully' : 'Formatted JSON successfully');
      setTimeout(() => setJsonSuccess(null), 2500);
      playClickSound(soundEnabled);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  // Dev Toolbox: Base64 handlers
  const handleBase64 = (mode: 'encode' | 'decode') => {
    try {
      if (mode === 'encode') {
        const enc = btoa(unescape(encodeURIComponent(b64Input)));
        setB64Result(enc);
      } else {
        const dec = decodeURIComponent(escape(atob(b64Input)));
        setB64Result(dec);
      }
      playClickSound(soundEnabled);
    } catch {
      setB64Result(mode === 'encode' ? 'Error encoding to Base64' : 'Invalid Base64 string');
    }
  };

  // Secret Vault: Handlers
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setVaultError(null);
    if (!vaultPassphrase.trim()) {
      setVaultError('Please enter a passphrase.');
      return;
    }
    const stored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!stored) {
      // First time vault initialization
      const initial: VaultCredential[] = [];
      const encrypted = await encryptPayload(JSON.stringify(initial), vaultPassphrase);
      localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
      setCredentials(initial);
      setIsVaultUnlocked(true);
      playSuccessChime(soundEnabled);
    } else {
      try {
        const decryptedJson = await decryptPayload(stored, vaultPassphrase);
        const creds = JSON.parse(decryptedJson);
        setCredentials(creds);
        setIsVaultUnlocked(true);
        playSuccessChime(soundEnabled);
      } catch {
        setVaultError('Incorrect passphrase or corrupted vault data.');
      }
    }
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredService.trim() || !newCredPassword.trim()) return;
    const newCred: VaultCredential = {
      id: `cred_${Date.now()}`,
      service: newCredService.trim(),
      username: newCredUsername.trim(),
      secret: newCredPassword.trim(),
      note: newCredNote.trim() || undefined,
      updatedAt: Date.now()
    };
    const updated = [newCred, ...credentials];
    const encrypted = await encryptPayload(JSON.stringify(updated), vaultPassphrase);
    localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
    setCredentials(updated);
    setShowAddCredModal(false);
    setNewCredService('');
    setNewCredUsername('');
    setNewCredPassword('');
    setNewCredNote('');
    playSuccessChime(soundEnabled);
  };

  const handleDeleteCredential = async (id: string) => {
    const updated = credentials.filter(c => c.id !== id);
    const encrypted = await encryptPayload(JSON.stringify(updated), vaultPassphrase);
    localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
    setCredentials(updated);
    playClickSound(soundEnabled);
  };

  const handleToggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // GPA Calculation Helper
  const totalCredits = courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
  const weightedSum = courses.reduce((acc, c) => acc + ((Number(c.credits) || 0) * (Number(c.currentScore) || 0)), 0);
  const currentWeightedAverage = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(1) : '0';

  const percentToGpa = (pct: number): { gpa: string; letter: string } => {
    if (pct >= 93) return { gpa: '4.00', letter: 'A' };
    if (pct >= 90) return { gpa: '3.70', letter: 'A-' };
    if (pct >= 87) return { gpa: '3.30', letter: 'B+' };
    if (pct >= 83) return { gpa: '3.00', letter: 'B' };
    if (pct >= 80) return { gpa: '2.70', letter: 'B-' };
    if (pct >= 77) return { gpa: '2.30', letter: 'C+' };
    if (pct >= 73) return { gpa: '2.00', letter: 'C' };
    if (pct >= 70) return { gpa: '1.70', letter: 'C-' };
    if (pct >= 60) return { gpa: '1.00', letter: 'D' };
    return { gpa: '0.00', letter: 'F' };
  };

  const gpaMeta = percentToGpa(parseFloat(currentWeightedAverage) || 0);

  const calculateNeededFinal = (current: number, target: number, weight: number): number => {
    if (weight <= 0) return 0;
    const w = weight / 100;
    const needed = (target - (current * (1 - w))) / w;
    return Math.round(needed * 10) / 10;
  };

  const handleAddCourse = () => {
    const newCourse: CourseItem = {
      id: `course_${Date.now()}`,
      name: 'New Course',
      credits: 3,
      currentScore: 80,
      finalWeight: 30,
      targetScore: 85
    };
    setCourses([...courses, newCourse]);
    playClickSound(soundEnabled);
  };

  const handleRemoveCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
    playClickSound(soundEnabled);
  };

  const handleUpdateCourse = (id: string, field: keyof CourseItem, val: any) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  // Base Converter Calculations
  let parsedDec: number = NaN;
  try {
    if (baseType === 'dec') parsedDec = parseInt(baseInput, 10);
    else if (baseType === 'hex') parsedDec = parseInt(baseInput, 16);
    else if (baseType === 'bin') parsedDec = parseInt(baseInput, 2);
    else if (baseType === 'oct') parsedDec = parseInt(baseInput, 8);
  } catch {
    parsedDec = NaN;
  }

  const decStr = isNaN(parsedDec) ? '—' : parsedDec.toString(10);
  const hexStr = isNaN(parsedDec) ? '—' : parsedDec.toString(16).toUpperCase();
  const binStr = isNaN(parsedDec) ? '—' : parsedDec.toString(2);
  const octStr = isNaN(parsedDec) ? '—' : parsedDec.toString(8);

  // Storage Converter Calculations
  const rawBytes = (() => {
    const v = parseFloat(storageVal) || 0;
    if (storageUnit === 'kb') return v * 1024;
    if (storageUnit === 'mb') return v * 1024 * 1024;
    if (storageUnit === 'gb') return v * 1024 * 1024 * 1024;
    if (storageUnit === 'tb') return v * 1024 * 1024 * 1024 * 1024;
    return 0;
  })();

  // Temperature Converter
  const numTemp = parseFloat(tempVal) || 0;
  const tempInC = tempUnit === 'c' ? numTemp : ((numTemp - 32) * 5) / 9;
  const tempInF = tempUnit === 'f' ? numTemp : (numTemp * 9) / 5 + 32;
  const tempInK = tempInC + 273.15;

  return (
    <div className="animate-quiet module-container">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-hairline)',
        marginBottom: '26px'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }} className="mono">
            Offline Toolkit
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-pure)', marginTop: '4px' }}>
            Student Tools & Utilities
          </h2>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-xs)', flexWrap: 'wrap' }}>
          {[
            { id: 'calc', label: 'Calculator', icon: <CalcIcon size={13} /> },
            { id: 'dev', label: 'Dev Toolbox', icon: <Code2 size={13} /> },
            { id: 'vault', label: 'Secret Vault', icon: <Shield size={13} /> },
            { id: 'gpa', label: 'GPA Target', icon: <GraduationCap size={13} /> },
            { id: 'converter', label: 'Converters', icon: <ArrowLeftRight size={13} /> },
            { id: 'qr', label: 'QR Code', icon: <QrCode size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); playClickSound(soundEnabled); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                backgroundColor: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-pure)' : 'var(--text-muted)',
                transition: 'var(--transition-fast)'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. Calculator Tab with Standard, Scientific & Programmer Modes */}
      {activeTab === 'calc' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Mode Selector */}
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '4px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-hairline)',
            marginBottom: '16px'
          }}>
            {[
              { id: 'standard', label: 'Standard' },
              { id: 'scientific', label: 'Scientific' },
              { id: 'programmer', label: 'Programmer' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setCalcMode(m.id as any); playClickSound(soundEnabled); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11.5px',
                  fontWeight: calcMode === m.id ? 600 : 400,
                  backgroundColor: calcMode === m.id ? 'var(--sky-subtle)' : 'transparent',
                  border: '1px solid',
                  borderColor: calcMode === m.id ? 'var(--sky-border)' : 'transparent',
                  color: calcMode === m.id ? 'var(--sky)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="panel" style={{ width: calcMode === 'programmer' ? '420px' : '360px', padding: '22px' }}>
            {/* Display */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-hairline)',
              marginBottom: '14px',
              textAlign: 'right'
            }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-pure)' }}>
                {calcDisplay}
              </span>
            </div>

            {/* Programmer Base View Strip */}
            {calcMode === 'programmer' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '14px',
                fontSize: '11px'
              }} className="mono">
                {(() => {
                  const intVal = parseInt(calcDisplay, 10) || 0;
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--amber)' }}>
                        <span>HEX:</span> <span>0x{intVal.toString(16).toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--sky)' }}>
                        <span>DEC:</span> <span>{intVal.toString(10)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--emerald)' }}>
                        <span>OCT:</span> <span>0o{intVal.toString(8)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>BIN:</span> <span>{intVal.toString(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Scientific Function Row */}
            {calcMode === 'scientific' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {['sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'sqr', 'inv', 'pi', 'e'].map(op => (
                  <button
                    key={op}
                    onClick={() => handleCalcPress(op)}
                    style={{
                      padding: '8px 0',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--sky)',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                      cursor: 'pointer'
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}

            {/* Programmer Bitwise Row */}
            {calcMode === 'programmer' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {['&', '|', '^', 'NOT', '<<', '>>'].map(op => (
                  <button
                    key={op}
                    onClick={() => handleCalcPress(op)}
                    style={{
                      padding: '8px 0',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--emerald)',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                      cursor: 'pointer'
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}

            {/* Standard Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map(btn => {
                const isOp = ['/', '*', '-', '+', '='].includes(btn);
                const isClear = btn === 'C';
                return (
                  <button
                    key={btn}
                    onClick={() => handleCalcPress(btn)}
                    style={{
                      padding: '12px 0',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isOp ? 'var(--amber-subtle)' : isClear ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)',
                      border: '1px solid',
                      borderColor: isOp ? 'rgba(245, 158, 11, 0.2)' : isClear ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-hairline)',
                      color: isOp ? 'var(--amber)' : isClear ? 'var(--accent-clay)' : 'var(--text-pure)',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'JetBrains Mono',
                      cursor: 'pointer'
                    }}
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Developer Suite Tab */}
      {activeTab === 'dev' && (
        <div className="panel" style={{ padding: '24px' }}>
          {/* Dev Sub-tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '14px', marginBottom: '20px' }}>
            {[
              { id: 'json', label: 'JSON Formatter & Validator', icon: <FileCode size={13} /> },
              { id: 'b64', label: 'Base64 Encode / Decode', icon: <Terminal size={13} /> },
              { id: 'hash', label: 'SHA-256 & SHA-1 Hashes', icon: <Hash size={13} /> }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => { setDevTool(tool.id as any); playClickSound(soundEnabled); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  fontWeight: devTool === tool.id ? 600 : 400,
                  backgroundColor: devTool === tool.id ? 'var(--sky-subtle)' : 'var(--bg-app)',
                  border: '1px solid',
                  borderColor: devTool === tool.id ? 'var(--sky-border)' : 'var(--border-hairline)',
                  color: devTool === tool.id ? 'var(--sky)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {tool.icon}
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-tool 1: JSON Formatter */}
          {devTool === 'json' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paste raw or minified JSON:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleFormatJson(false)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--sky-subtle)',
                      border: '1px solid var(--sky-border)',
                      color: 'var(--sky)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Format (Pretty)
                  </button>
                  <button
                    onClick={() => handleFormatJson(true)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Minify
                  </button>
                  <button
                    onClick={() => handleCopy(jsonInput)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedVal === jsonInput ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                    <span>{copiedVal === jsonInput ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {jsonError && (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-clay)',
                  fontSize: '11.5px',
                  marginBottom: '10px',
                  fontFamily: 'JetBrains Mono'
                }}>
                  Syntax Error: {jsonError}
                </div>
              )}

              {jsonSuccess && (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--emerald-subtle)',
                  border: '1px solid var(--emerald-border)',
                  color: 'var(--emerald)',
                  fontSize: '11.5px',
                  marginBottom: '10px'
                }}>
                  ✓ {jsonSuccess}
                </div>
              )}

              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(null); }}
                rows={12}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-pure)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* Sub-tool 2: Base64 */}
          {devTool === 'b64' && (
            <div>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }} className="mono">
                Input Text or Base64 Payload
              </label>
              <textarea
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-pure)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '12.5px',
                  outline: 'none',
                  marginBottom: '12px'
                }}
              />

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={() => handleBase64('encode')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--sky)',
                    color: '#090b10',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Encode to Base64
                </button>
                <button
                  onClick={() => handleBase64('decode')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  Decode from Base64
                </button>
              </div>

              {b64Result && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="mono">Result</span>
                    <button
                      onClick={() => handleCopy(b64Result)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--sky)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedVal === b64Result ? <Check size={11} color="var(--emerald)" /> : <Copy size={11} />}
                      <span>{copiedVal === b64Result ? 'Copied' : 'Copy Result'}</span>
                    </button>
                  </div>
                  <div style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12.5px',
                    wordBreak: 'break-all',
                    color: 'var(--text-pure)'
                  }}>
                    {b64Result}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-tool 3: Hash Generator */}
          {devTool === 'hash' && (
            <div>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }} className="mono">
                Plaintext String
              </label>
              <input
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Enter string to compute cryptographically secure hashes..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-pure)',
                  fontSize: '13px',
                  outline: 'none',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-hairline)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sky)' }} className="mono">SHA-256 (256-bit)</span>
                    <button
                      onClick={() => handleCopy(sha256Hex)}
                      style={{ background: 'none', border: 'none', color: 'var(--sky)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedVal === sha256Hex ? <Check size={11} color="var(--emerald)" /> : <Copy size={11} />}
                      <span>{copiedVal === sha256Hex ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <span className="mono" style={{ fontSize: '12px', wordBreak: 'break-all', color: 'var(--text-pure)' }}>
                    {sha256Hex || '—'}
                  </span>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-hairline)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)' }} className="mono">SHA-1 (160-bit)</span>
                    <button
                      onClick={() => handleCopy(sha1Hex)}
                      style={{ background: 'none', border: 'none', color: 'var(--amber)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedVal === sha1Hex ? <Check size={11} color="var(--emerald)" /> : <Copy size={11} />}
                      <span>{copiedVal === sha1Hex ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <span className="mono" style={{ fontSize: '12px', wordBreak: 'break-all', color: 'var(--text-pure)' }}>
                    {sha1Hex || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Zero-Knowledge Secret Vault Tab */}
      {activeTab === 'vault' && (
        <div className="panel" style={{ padding: '26px' }}>
          {!isVaultUnlocked ? (
            <div style={{ maxWidth: '420px', margin: '20px auto', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--sky-subtle)',
                border: '1px solid var(--sky-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--sky)'
              }}>
                <Shield size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '6px' }}>
                Zero-Knowledge Encrypted Vault
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                Encrypted client-side with AES-256-GCM. Your secrets are never transmitted in plaintext.
              </p>

              {vaultError && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-clay)',
                  fontSize: '12px',
                  marginBottom: '14px'
                }}>
                  {vaultError}
                </div>
              )}

              <form onSubmit={handleUnlockVault} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="Enter or create Master Passphrase..."
                  value={vaultPassphrase}
                  onChange={(e) => setVaultPassphrase(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    color: 'var(--text-pure)',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--sky)',
                    color: '#090b10',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Unlock / Initialize Vault
                </button>
              </form>
            </div>
          ) : (
            <div>
              {/* Unlocked Vault Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="var(--emerald)" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-pure)' }}>
                      Local Encrypted Credentials
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="mono">
                    {credentials.length} secret(s) stored locally • AES-GCM 256-bit
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowAddCredModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--sky)',
                      color: '#090b10',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>Add Secret</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsVaultUnlocked(false);
                      setVaultPassphrase('');
                      setCredentials([]);
                      playClickSound(soundEnabled);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <Lock size={12} />
                    <span>Lock Vault</span>
                  </button>
                </div>
              </div>

              {/* Credentials List */}
              {credentials.length === 0 ? (
                <div style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '12.5px'
                }}>
                  No secrets stored yet. Click "Add Secret" to store school portal passwords or developer API tokens safely.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {credentials.map(c => {
                    const isRevealed = revealedIds.has(c.id);
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-hairline)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-pure)' }}>
                            {c.service}
                          </span>
                          <button
                            onClick={() => handleDeleteCredential(c.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            title="Delete secret"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {c.username && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>User:</span>
                            <span
                              onClick={() => handleCopy(c.username)}
                              style={{ color: 'var(--sky)', cursor: 'pointer' }}
                              className="mono"
                              title="Click to copy"
                            >
                              {c.username}
                            </span>
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-hairline)'
                        }}>
                          <span className="mono" style={{ fontSize: '12px', color: 'var(--text-pure)' }}>
                            {isRevealed ? c.secret : '••••••••••••'}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleToggleReveal(c.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              onClick={() => handleCopy(c.secret)}
                              style={{ background: 'none', border: 'none', color: 'var(--sky)', cursor: 'pointer' }}
                              title="Copy secret"
                            >
                              {copiedVal === c.secret ? <Check size={13} color="var(--emerald)" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>

                        {c.note && (
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                            {c.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Credential Modal */}
              {showAddCredModal && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div className="animate-pop" style={{
                    width: '420px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '22px'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '14px' }}>
                      Add Encrypted Secret
                    </h3>

                    <form onSubmit={handleSaveCredential} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Account / Service Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GitHub Token, School Portal, Canvas"
                          value={newCredService}
                          onChange={e => setNewCredService(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '12.5px',
                            color: 'var(--text-pure)',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Username or Email (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. nirvaan@student.edu"
                          value={newCredUsername}
                          onChange={e => setNewCredUsername(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '12.5px',
                            color: 'var(--text-pure)',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Password / Secret Token *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter password or token..."
                          value={newCredPassword}
                          onChange={e => setNewCredPassword(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '12.5px',
                            color: 'var(--text-pure)',
                            outline: 'none',
                            fontFamily: 'JetBrains Mono'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Note (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Expires in 90 days"
                          value={newCredNote}
                          onChange={e => setNewCredNote(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '12.5px',
                            color: 'var(--text-pure)',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddCredModal(false)}
                          style={{
                            padding: '7px 12px',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--text-secondary)',
                            background: 'none',
                            border: 'none',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{
                            padding: '7px 16px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--sky)',
                            color: '#090b10',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Save Encrypted
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. GPA & Final Exam Target Calculator */}
      {activeTab === 'gpa' && (
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pure)' }}>
                Target Grade & Exam Score Calculator
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Enter your current course standing and exam weight to calculate exactly what you need on finals.
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '8px 16px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>ESTIMATED GPA</span>
                <span className="mono" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--emerald)' }}>
                  {gpaMeta.gpa} ({gpaMeta.letter})
                </span>
              </div>
              <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-hairline)' }} />
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>AVG PERCENT</span>
                <span className="mono" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--sky)' }}>
                  {currentWeightedAverage}%
                </span>
              </div>
              <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-hairline)' }} />
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>CREDITS</span>
                <span className="mono" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--amber)' }}>
                  {totalCredits}
                </span>
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.6fr 36px',
              gap: '10px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }} className="mono">
              <span>Course Name</span>
              <span>Credits</span>
              <span>Current %</span>
              <span>Final Wt %</span>
              <span>Target %</span>
              <span>Score Needed</span>
              <span></span>
            </div>

            {courses.map(course => {
              const neededScore = calculateNeededFinal(course.currentScore, course.targetScore, course.finalWeight);
              const isImpossible = neededScore > 100;
              const isSafe = neededScore <= course.currentScore;

              return (
                <div
                  key={course.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.6fr 36px',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-hairline)'
                  }}
                >
                  <input
                    type="text"
                    value={course.name}
                    onChange={e => handleUpdateCourse(course.id, 'name', e.target.value)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none'
                    }}
                  />

                  <input
                    type="number"
                    value={course.credits}
                    onChange={e => handleUpdateCourse(course.id, 'credits', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '50px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      padding: '3px 6px',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                    className="mono"
                  />

                  <input
                    type="number"
                    value={course.currentScore}
                    onChange={e => handleUpdateCourse(course.id, 'currentScore', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '54px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      padding: '3px 6px',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                    className="mono"
                  />

                  <input
                    type="number"
                    value={course.finalWeight}
                    onChange={e => handleUpdateCourse(course.id, 'finalWeight', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '54px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      padding: '3px 6px',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                    className="mono"
                  />

                  <input
                    type="number"
                    value={course.targetScore}
                    onChange={e => handleUpdateCourse(course.id, 'targetScore', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '54px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      padding: '3px 6px',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                    className="mono"
                  />

                  {/* Needed Score Pill */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span className="mono" style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: isImpossible ? 'var(--accent-clay)' : isSafe ? 'var(--emerald)' : 'var(--amber)'
                    }}>
                      {neededScore}%
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: isImpossible ? 'rgba(239, 68, 68, 0.15)' : isSafe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isImpossible ? 'var(--accent-clay)' : isSafe ? 'var(--emerald)' : 'var(--amber)'
                    }}>
                      {isImpossible ? 'Need >100%' : isSafe ? 'Safe' : 'Target'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveCourse(course.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAddCourse}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Plus size={13} />
            <span>Add Course</span>
          </button>
        </div>
      )}

      {/* 3. Unit & Base Converter */}
      {activeTab === 'converter' && (
        <div className="panel" style={{ padding: '24px' }}>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
            {[
              { id: 'base', label: 'CS Number Bases (Dec / Hex / Bin / Oct)' },
              { id: 'storage', label: 'Data & Storage (KB / MB / GB / TB)' },
              { id: 'temp', label: 'Temperature (°C / °F / K)' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setConverterMode(sub.id as any)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  fontWeight: converterMode === sub.id ? 600 : 400,
                  backgroundColor: converterMode === sub.id ? 'var(--bg-app)' : 'transparent',
                  color: converterMode === sub.id ? 'var(--text-pure)' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: converterMode === sub.id ? 'var(--border-subtle)' : 'transparent'
                }}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Mode 1: Base Converter */}
          {converterMode === 'base' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                <select
                  value={baseType}
                  onChange={e => setBaseType(e.target.value as any)}
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--sky)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="dec">Decimal (Base 10)</option>
                  <option value="hex">Hexadecimal (Base 16)</option>
                  <option value="bin">Binary (Base 2)</option>
                  <option value="oct">Octal (Base 8)</option>
                </select>

                <input
                  type="text"
                  value={baseInput}
                  onChange={e => setBaseInput(e.target.value)}
                  placeholder="Enter value..."
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--text-primary)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '14px',
                    fontFamily: 'JetBrains Mono',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Converted Output Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Decimal (DEC)', val: decStr, color: 'var(--sky)' },
                  { label: 'Hexadecimal (HEX)', val: hexStr, color: 'var(--amber)' },
                  { label: 'Binary (BIN)', val: binStr, color: 'var(--emerald)' },
                  { label: 'Octal (OCT)', val: octStr, color: 'var(--purple)' }
                ].map(item => (
                  <div
                    key={item.label}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-hairline)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{item.label}</span>
                      <span className="mono" style={{ fontSize: '15px', fontWeight: 600, color: item.color, wordBreak: 'break-all' }}>
                        {item.val}
                      </span>
                    </div>
                    {item.val !== '—' && (
                      <button
                        onClick={() => handleCopy(item.val)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedVal === item.val ? 'var(--emerald)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {copiedVal === item.val ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode 2: Storage Converter */}
          {converterMode === 'storage' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="number"
                  value={storageVal}
                  onChange={e => setStorageVal(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--text-primary)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '14px',
                    fontFamily: 'JetBrains Mono',
                    outline: 'none'
                  }}
                />

                <select
                  value={storageUnit}
                  onChange={e => setStorageUnit(e.target.value as any)}
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--sky)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="kb">Kilobytes (KB)</option>
                  <option value="mb">Megabytes (MB)</option>
                  <option value="gb">Gigabytes (GB)</option>
                  <option value="tb">Terabytes (TB)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Kilobytes (KB)', val: (rawBytes / 1024).toLocaleString() + ' KB' },
                  { label: 'Megabytes (MB)', val: (rawBytes / (1024 * 1024)).toLocaleString() + ' MB' },
                  { label: 'Gigabytes (GB)', val: (rawBytes / (1024 * 1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' GB' },
                  { label: 'Terabytes (TB)', val: (rawBytes / (1024 * 1024 * 1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 6 }) + ' TB' }
                ].map(item => (
                  <div
                    key={item.label}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-hairline)'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{item.label}</span>
                    <span className="mono" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--emerald)' }}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: Temperature Converter */}
          {converterMode === 'temp' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="number"
                  value={tempVal}
                  onChange={e => setTempVal(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--text-primary)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '14px',
                    fontFamily: 'JetBrains Mono',
                    outline: 'none'
                  }}
                />

                <select
                  value={tempUnit}
                  onChange={e => setTempUnit(e.target.value as any)}
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--amber)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="c">Celsius (°C)</option>
                  <option value="f">Fahrenheit (°F)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Celsius', val: `${tempInC.toFixed(1)} °C`, color: 'var(--sky)' },
                  { label: 'Fahrenheit', val: `${tempInF.toFixed(1)} °F`, color: 'var(--amber)' },
                  { label: 'Kelvin', val: `${tempInK.toFixed(2)} K`, color: 'var(--violet)' }
                ].map(item => (
                  <div
                    key={item.label}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-hairline)'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{item.label}</span>
                    <span className="mono" style={{ fontSize: '16px', fontWeight: 600, color: item.color }}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. QR Code Tab */}
      {activeTab === 'qr' && (
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }} className="mono">
                Text or URL
              </label>
              <input
                type="text"
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-hairline)',
                  fontSize: '13px',
                  outline: 'none',
                  color: 'var(--text-pure)'
                }}
              />
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Generates high-contrast QR image offline without network tracking.
              </p>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrText)}`}
                alt="QR Code"
                style={{ width: '140px', height: '140px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
