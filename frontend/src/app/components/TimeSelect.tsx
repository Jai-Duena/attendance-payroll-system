import React, { useState, useEffect } from 'react';

interface TimeSelectProps {
  value: string;           // "HH:MM" 24-hour, e.g. "14:30"
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}

/**
 * Three-column time picker (Hour / Minute / AM.PM) that stores its value
 * as a 24-hour "HH:MM" string -- the same format as <input type="time">.
 */
export default function TimeSelect({ value, onChange, required, className = '' }: TimeSelectProps) {
  // Parse the incoming 24-hour value into parts
  function parse(v: string) {
    if (!v) return { h: '', m: '', ap: '' };
    const [hStr, mStr] = v.split(':');
    const h24 = parseInt(hStr, 10);
    if (isNaN(h24)) return { h: '', m: '', ap: '' };
    return {
      h:  String(h24 % 12 || 12),
      m:  mStr ?? '',
      ap: h24 < 12 ? 'AM' : 'PM',
    };
  }

  const parsed = parse(value);
  const [hour, setHour]   = useState(parsed.h);
  const [min,  setMin]    = useState(parsed.m);
  const [ampm, setAmpm]   = useState(parsed.ap);

  // Sync internal state when the external value changes (e.g. form reset)
  useEffect(() => {
    const p = parse(value);
    setHour(p.h);
    setMin(p.m);
    setAmpm(p.ap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (h: string, m: string, ap: string) => {
    if (!h || !m || !ap) { onChange(''); return; }
    let h24 = parseInt(h, 10);
    if (ap === 'AM') { if (h24 === 12) h24 = 0; }
    else             { if (h24 !== 12) h24 += 12; }
    onChange(`${String(h24).padStart(2, '0')}:${m}`);
  };

  const handleHour = (v: string) => { setHour(v);  commit(v,    min,  ampm); };
  const handleMin  = (v: string) => { setMin(v);   commit(hour, v,    ampm); };
  const handleAmpm = (v: string) => { setAmpm(v);  commit(hour, min,  v);    };

  const sel = `px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${className}`;

  return (
    <div className="flex gap-1">
      {/* Hour */}
      <select required={required} value={hour} onChange={(e) => handleHour(e.target.value)} className={`flex-1 ${sel}`}>
        <option value="">HH</option>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map((h) => (
          <option key={h} value={String(h)}>{h}</option>
        ))}
      </select>

      {/* Minute */}
      <select required={required} value={min} onChange={(e) => handleMin(e.target.value)} className={`flex-1 ${sel}`}>
        <option value="">MM</option>
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* AM / PM */}
      <select required={required} value={ampm} onChange={(e) => handleAmpm(e.target.value)} className={`w-[4.5rem] ${sel}`}>
        <option value="">AM/PM</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
