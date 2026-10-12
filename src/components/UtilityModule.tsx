import React, { useState } from 'react';
import { playClickSound } from '../utils/sound';
import { 
  Calculator as CalcIcon, 
  QrCode, 
  Code2, 
  Copy, 
  Check 
} from 'lucide-react';

interface UtilityModuleProps {
  soundEnabled: boolean;
}

export const UtilityModule: React.FC<UtilityModuleProps> = ({ soundEnabled }) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'qr' | 'json'>('calc');

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');

  // QR Code State
  const [qrText, setQrText] = useState('https://github.com');

  // JSON Formatter State
  const [jsonInput, setJsonInput] = useState('{"title": "Cadence", "offline": true, "version": 1}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCalcPress = (val: string) => {
    playClickSound(soundEnabled);
    if (val === 'C') {
      setCalcDisplay('0');
    } else if (val === '=') {
      try {
        const sanitized = calcDisplay.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(result));
      } catch {
        setCalcDisplay('Error');
      }
    } else if (['sin', 'cos', 'tan', 'sqrt', 'log'].includes(val)) {
      try {
        const num = parseFloat(calcDisplay);
        let res = 0;
        if (val === 'sin') res = Math.sin((num * Math.PI) / 180);
        if (val === 'cos') res = Math.cos((num * Math.PI) / 180);
        if (val === 'tan') res = Math.tan((num * Math.PI) / 180);
        if (val === 'sqrt') res = Math.sqrt(num);
        if (val === 'log') res = Math.log10(num);
        setCalcDisplay(String(Number(res.toFixed(6))));
      } catch {
        setCalcDisplay('Error');
      }
    } else {
      if (calcDisplay === '0' || calcDisplay === 'Error') {
        setCalcDisplay(val);
      } else {
        setCalcDisplay(calcDisplay + val);
      }
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-quiet" style={{ padding: '40px 56px', maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--border-hairline)',
        marginBottom: '28px'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }} className="mono">
            Offline Utilities
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-pure)', marginTop: '4px' }}>
            Tools
          </h2>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-xs)' }}>
          {[
            { id: 'calc', label: 'Calculator', icon: <CalcIcon size={13} /> },
            { id: 'qr', label: 'QR Code', icon: <QrCode size={13} /> },
            { id: 'json', label: 'JSON Validator', icon: <Code2 size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); playClickSound(soundEnabled); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 500 : 400,
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

      {/* Calculator Tab */}
      {activeTab === 'calc' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="panel" style={{ width: '320px', padding: '20px' }}>
            {/* Display */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-hairline)',
              textAlign: 'right',
              fontFamily: 'JetBrains Mono',
              fontSize: '24px',
              fontWeight: 500,
              color: 'var(--text-pure)',
              overflowX: 'auto',
              marginBottom: '16px'
            }}>
              {calcDisplay}
            </div>

            {/* Scientific Function Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
              {['sin', 'cos', 'tan', 'sqrt'].map(fn => (
                <button
                  key={fn}
                  onClick={() => handleCalcPress(fn)}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px'
                  }} className="mono"
                >
                  {fn}
                </button>
              ))}
            </div>

            {/* Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {['C', 'log', '/', '*'].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleCalcPress(btn)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: btn === 'C' ? 'var(--accent-clay)' : 'var(--text-muted)',
                    fontSize: '13px'
                  }} className="mono"
                >
                  {btn}
                </button>
              ))}

              {['7', '8', '9', '-'].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleCalcPress(btn)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }} className="mono"
                >
                  {btn}
                </button>
              ))}

              {['4', '5', '6', '+'].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleCalcPress(btn)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }} className="mono"
                >
                  {btn}
                </button>
              ))}

              {['1', '2', '3', '='].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleCalcPress(btn)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: btn === '=' ? 'var(--text-pure)' : 'var(--bg-card)',
                    color: btn === '=' ? '#0b0c0e' : 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: btn === '=' ? 600 : 400
                  }} className="mono"
                >
                  {btn}
                </button>
              ))}

              <button
                onClick={() => handleCalcPress('0')}
                style={{
                  gridColumn: 'span 2',
                  padding: '12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '13px'
                }} className="mono"
              >
                0
              </button>
              <button
                onClick={() => handleCalcPress('.')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '13px'
                }} className="mono"
              >
                .
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Studio */}
      {activeTab === 'qr' && (
        <div className="panel" style={{ padding: '28px', maxWidth: '480px', margin: '0 auto' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Text or URL
          </label>
          <input
            type="text"
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px',
              marginBottom: '24px'
            }}
          />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xs)',
            width: 'fit-content',
            margin: '0 auto'
          }}>
            <svg width="160" height="160" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="#ffffff" />
              <rect x="5" y="5" width="25" height="25" fill="#0b0c0e" />
              <rect x="8" y="8" width="19" height="19" fill="#ffffff" />
              <rect x="12" y="12" width="11" height="11" fill="#0b0c0e" />

              <rect x="70" y="5" width="25" height="25" fill="#0b0c0e" />
              <rect x="73" y="8" width="19" height="19" fill="#ffffff" />
              <rect x="77" y="12" width="11" height="11" fill="#0b0c0e" />

              <rect x="5" y="70" width="25" height="25" fill="#0b0c0e" />
              <rect x="8" y="73" width="19" height="19" fill="#ffffff" />
              <rect x="12" y="77" width="11" height="11" fill="#0b0c0e" />

              {Array.from({ length: 64 }).map((_, i) => {
                const x = 35 + (i % 8) * 4;
                const y = 35 + Math.floor(i / 8) * 4;
                const charCode = qrText.charCodeAt(i % qrText.length) || 0;
                const isBlack = (charCode + i * 7) % 2 === 0;
                return isBlack ? <rect key={i} x={x} y={y} width="3" height="3" fill="#0b0c0e" /> : null;
              })}
            </svg>
          </div>
        </div>
      )}

      {/* JSON Formatter */}
      {activeTab === 'json' && (
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-pure)' }}>
              JSON Validator
            </span>
            <button
              onClick={handleFormatJson}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--text-pure)',
                color: '#0b0c0e',
                fontSize: '11.5px',
                fontWeight: 500
              }}
            >
              Format & Validate
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Raw Input
              </span>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={11}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-hairline)',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono',
                  resize: 'none'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Formatted
                </span>
                {jsonOutput && (
                  <button
                    onClick={() => handleCopy(jsonOutput)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-secondary)',
                      fontSize: '10.5px'
                    }}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <textarea
                value={jsonError || jsonOutput}
                readOnly
                rows={11}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid',
                  borderColor: jsonError ? 'var(--accent-clay)' : 'var(--border-hairline)',
                  color: jsonError ? 'var(--accent-clay)' : 'var(--text-main)',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono',
                  resize: 'none'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
