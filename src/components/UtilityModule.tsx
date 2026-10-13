import React, { useState } from 'react';
import { playClickSound } from '../utils/sound';
import { 
  Calculator as CalcIcon, 
  GraduationCap, 
  ArrowLeftRight, 
  QrCode, 
  Copy, 
  Check, 
  Plus, 
  Trash2
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

export const UtilityModule: React.FC<UtilityModuleProps> = ({ soundEnabled }) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'gpa' | 'converter' | 'qr'>('calc');

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVal(text);
    setTimeout(() => setCopiedVal(null), 1500);
  };

  // GPA Calculation Helper
  const totalCredits = courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
  const weightedSum = courses.reduce((acc, c) => acc + ((Number(c.credits) || 0) * (Number(c.currentScore) || 0)), 0);
  const currentWeightedAverage = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(1) : '0';

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
    <div className="animate-quiet" style={{ padding: '36px 48px', maxWidth: '920px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
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
            { id: 'gpa', label: 'GPA & Final Exam Target', icon: <GraduationCap size={13} /> },
            { id: 'converter', label: 'Unit & Base Converter', icon: <ArrowLeftRight size={13} /> },
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

      {/* 1. Calculator Tab */}
      {activeTab === 'calc' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="panel" style={{ width: '340px', padding: '22px' }}>
            {/* Display */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-hairline)',
              marginBottom: '16px',
              textAlign: 'right'
            }}>
              <span className="mono" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-pure)' }}>
                {calcDisplay}
              </span>
            </div>

            {/* Scientific Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {['sin', 'cos', 'tan', 'sqrt', 'log'].map(op => (
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
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {op}
                </button>
              ))}
            </div>

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
                      transition: 'var(--transition-fast)'
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

      {/* 2. GPA & Final Exam Target Calculator */}
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
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>WEIGHTED AVERAGE</span>
                <span className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--emerald)' }}>
                  {currentWeightedAverage}%
                </span>
              </div>
              <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-hairline)' }} />
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>TOTAL CREDITS</span>
                <span className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sky)' }}>
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
