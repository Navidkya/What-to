import { useState } from 'react';
import type { DataItem, ScheduleEntry } from '../../types';

interface SchedulePanelProps {
  item: DataItem | null;
  catId: string;
  catName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ScheduleEntry) => void;
  onToast: (msg: string) => void;
}

function toDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toTimeLocal(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function buildGoogleCalUrl(title: string, dateStr: string, timeStr: string, note: string): string {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  const [year, month, day] = dateStr.split('-');
  const [hour, minute] = timeStr.split(':');
  const start = `${year}${month}${day}T${hour}${minute}00`;
  // end = 1 hour later
  const endHour = String(Number(hour) + 1).padStart(2, '0');
  const end = `${year}${month}${day}T${endHour}${minute}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: note || `Agendado via What to — ${title}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function SchedulePanel({ item, catId, catName, isOpen, onClose, onSave, onToast }: SchedulePanelProps) {
  const today = new Date();
  const [dateVal, setDateVal] = useState(toDateLocal(today));
  const [timeVal, setTimeVal] = useState(toTimeLocal(today));
  const [note, setNote] = useState('');

  if (!item) return null;

  const handleSave = () => {
    const isoDate = `${dateVal}T${timeVal}:00`;
    const entry: ScheduleEntry = {
      id: `${Date.now()}`,
      title: item.title,
      emoji: item.emoji,
      catId,
      cat: catName,
      date: isoDate,
      note: note || undefined,
    };
    onSave(entry);
    onToast('📅 Agendado!');
    onClose();
    setNote('');
  };

  const handleGoogleCal = () => {
    const url = buildGoogleCalUrl(item.title, dateVal, timeVal, note);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAppleCal = () => {
    // Apple Calendar requires macOS/iOS — fallback to Google Cal with a note
    const url = buildGoogleCalUrl(item.title, dateVal, timeVal, note);
    window.open(url, '_blank', 'noopener,noreferrer');
    onToast('Abre no iOS/macOS com a app Calendário');
  };

  return (
    <div className={`ov${isOpen ? ' on' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel">
        <div className="panel-drag" />

        <div className="sched-item-header">
          <span className="sched-item-em">{item.emoji}</span>
          <div>
            <div className="sched-item-title">{item.title}</div>
            <div className="sched-item-cat">{catName}</div>
          </div>
        </div>

        <div className="sched-label">Data e hora</div>
        <div className="sched-datetime">
          <input
            type="date"
            className="sched-input"
            value={dateVal}
            onChange={e => setDateVal(e.target.value)}
          />
          <input
            type="time"
            className="sched-input"
            value={timeVal}
            onChange={e => setTimeVal(e.target.value)}
          />
        </div>

        <div className="sched-label" style={{ marginTop: 10 }}>Nota (opcional)</div>
        <textarea
          className="sched-textarea"
          placeholder="Adiciona uma nota..."
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
        />

        <button className="sched-save-btn" onClick={handleSave}>
          📅 Agendar
        </button>

        <div className="sched-label" style={{ marginTop: 10, marginBottom: 7 }}>Adicionar ao calendário</div>
        <div className="cal-btns">
          <button className="cal-btn" onClick={handleGoogleCal}>
            <span>📅</span> Google Calendar
          </button>
          <button className="cal-btn" onClick={handleAppleCal}>
            <span>🍎</span> Apple Calendar
          </button>
        </div>

        <button className="btn-x" style={{ marginTop: 8 }} onClick={onClose}>fechar</button>
      </div>
    </div>
  );
}
