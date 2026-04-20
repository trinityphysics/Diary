import React, { useState } from 'react';
import type { ClassInfo, AppSettings } from '../types';
import { storage } from '../utils/storage';
import { getPeriods, formatTime, DAY_NAMES, PERIOD_LABELS } from '../utils/schedule';

const Schedule: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>(storage.getClasses());
  const [settings] = useState<AppSettings>(storage.getSettings());
  const [editingCell, setEditingCell] = useState<{ dayIndex: number; periodIndex: number } | null>(null);
  const [editForm, setEditForm] = useState<Partial<ClassInfo>>({});

  const now = new Date();
  const jsDay = now.getDay();
  const todayIndex = jsDay === 0 ? 4 : jsDay === 6 ? 4 : jsDay - 1;

  const periodRows = getPeriods(0, settings.breakTimeOption).filter(p => !p.isBreak && !p.isLunch);

  function getClass(dayIndex: number, periodIndex: number): ClassInfo | undefined {
    return classes.find(c => c.dayIndex === dayIndex && c.periodIndex === periodIndex);
  }

  function openEdit(dayIndex: number, periodIndex: number) {
    const existing = getClass(dayIndex, periodIndex);
    setEditingCell({ dayIndex, periodIndex });
    setEditForm(existing || { dayIndex, periodIndex, name: '', room: '', notes: '' });
  }

  function saveEdit() {
    if (!editingCell) return;
    const updated = classes.filter(
      c => !(c.dayIndex === editingCell.dayIndex && c.periodIndex === editingCell.periodIndex)
    );
    if (editForm.name) {
      updated.push({
        id: editForm.id || Date.now().toString(),
        name: editForm.name || '',
        room: editForm.room || '',
        dayIndex: editingCell.dayIndex,
        periodIndex: editingCell.periodIndex,
        notes: editForm.notes || '',
      });
    }
    storage.setClasses(updated);
    setClasses(updated);
    setEditingCell(null);
  }

  function deleteClass() {
    if (!editingCell) return;
    const updated = classes.filter(
      c => !(c.dayIndex === editingCell.dayIndex && c.periodIndex === editingCell.periodIndex)
    );
    storage.setClasses(updated);
    setClasses(updated);
    setEditingCell(null);
  }

  return (
    <div className="schedule-page">
      <h1 className="page-title">📅 Weekly Schedule</h1>

      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Period</th>
              {DAY_NAMES.map((day, i) => (
                <th key={i} className={i === todayIndex ? 'schedule-table__today' : ''}>{day.slice(0, 3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodRows.map(period => (
              <tr key={period.index}>
                <td className="schedule-table__period">
                  <div>{period.label}</div>
                  <div className="schedule-table__time">{formatTime(period.startTime)}</div>
                </td>
                {DAY_NAMES.map((_, dayIndex) => {
                  // Period 7 doesn't exist on Friday
                  if (dayIndex === 4 && period.index === 6) {
                    return <td key={dayIndex} className="schedule-table__empty">—</td>;
                  }
                  const cls = getClass(dayIndex, period.index);
                  const isToday = dayIndex === todayIndex;
                  return (
                    <td
                      key={dayIndex}
                      className={`schedule-table__cell ${isToday ? 'schedule-table__today' : ''} ${cls ? 'schedule-table__cell--filled' : 'schedule-table__cell--empty'}`}
                      onClick={() => openEdit(dayIndex, period.index)}
                    >
                      {cls ? (
                        <div>
                          <div className="cell-name">{cls.name}</div>
                          {cls.room && <div className="cell-room">Rm {cls.room}</div>}
                        </div>
                      ) : (
                        <span className="cell-add">+</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingCell && (
        <div className="modal-overlay" onClick={() => setEditingCell(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal__title">
              {DAY_NAMES[editingCell.dayIndex]} — {PERIOD_LABELS[editingCell.periodIndex]}
            </h2>
            <div className="form-group">
              <label>Class Name</label>
              <input
                className="input"
                value={editForm.name || ''}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Year 10 Maths"
              />
            </div>
            <div className="form-group">
              <label>Room</label>
              <input
                className="input"
                value={editForm.room || ''}
                onChange={e => setEditForm(f => ({ ...f, room: e.target.value }))}
                placeholder="e.g. B12"
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="input textarea"
                value={editForm.notes || ''}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes..."
              />
            </div>
            <div className="modal__actions">
              <button className="btn btn--primary" onClick={saveEdit}>Save</button>
              {getClass(editingCell.dayIndex, editingCell.periodIndex) && (
                <button className="btn btn--danger" onClick={deleteClass}>Delete</button>
              )}
              <button className="btn btn--secondary" onClick={() => setEditingCell(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
