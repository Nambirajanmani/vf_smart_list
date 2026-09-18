import { useState } from 'react';
import { deleteItem, toggleItem } from '../api/api.js';
import { getTanglishName, getEnglishName } from '../utils/tanglish.js';
import './AdminItemRow.css';

/**
 * AdminItemRow — One row in the admin items table (English + Tamil + Tanglish Name, Category, Visibility, Actions).
 */
export default function AdminItemRow({ item, onRefresh }) {
  const [loadingDel,  setLoadingDel]  = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);

  /* ── Toggle Visibility ── */
  const handleToggle = async () => {
    setLoadingToggle(true);
    try { await toggleItem(item.id); await onRefresh(); }
    catch { /* ignore */ }
    setLoadingToggle(false);
  };

  /* ── Delete Item ── */
  const handleDelete = async () => {
    if (!confirmDel) {
      setConfirmDel(true);
      setTimeout(() => setConfirmDel(false), 3000);
      return;
    }
    setLoadingDel(true);
    try { await deleteItem(item.id); await onRefresh(); }
    catch { /* ignore */ }
    setLoadingDel(false);
  };

  const tanglish    = getTanglishName(item);
  const englishName = getEnglishName(item);
  const cleanName   = (item.name || '').trim();
  const lowerName   = cleanName.toLowerCase();
  const lowerEn     = (englishName || '').toLowerCase();
  const hasEnglish  = lowerEn && (
    lowerName === lowerEn ||
    lowerName.includes(`(${lowerEn})`) ||
    lowerName.includes(lowerEn)
  );
  const englishSuffix = (!hasEnglish && englishName) ? ` (${englishName})` : '';
  const showTanglish = tanglish && !lowerName.includes(tanglish.toLowerCase());

  return (
    <tr className={`admin-row ${!item.is_active ? 'admin-row--hidden' : ''}`}>
      {/* Emoji + Name (English, Tamil & Tanglish) */}
      <td className="td-name">
        <span className="row-emoji">{item.emoji}</span>
        <div className="row-names">
          <span className="row-name">
            {item.name}
            {englishSuffix && <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>{englishSuffix}</span>}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {item.name_ta && <span className="row-name-ta">{item.name_ta}</span>}
            {showTanglish && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>({tanglish})</span>}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="td-cat">
        <span className={`badge badge-${item.category}`}>{item.category}</span>
      </td>

      {/* Status */}
      <td className="td-status">
        <span className={`badge ${item.is_active ? 'badge-active' : 'badge-inactive'}`}>
          {item.is_active ? 'Visible' : 'Hidden'}
        </span>
      </td>

      {/* Actions */}
      <td className="td-actions">
        <button
          className={`btn btn-sm ${item.is_active ? 'btn-ghost' : 'btn-primary'}`}
          onClick={handleToggle}
          disabled={loadingToggle}
          title={item.is_active ? 'Hide item' : 'Show item'}
        >
          {loadingToggle ? '…' : item.is_active ? '👁️ Hide' : '👁️ Show'}
        </button>

        {confirmDel ? (
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={loadingDel}
          >
            {loadingDel ? '…' : '⚠️ Confirm?'}
          </button>
        ) : (
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            title="Delete item"
          >
            🗑️
          </button>
        )}

        {confirmDel && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setConfirmDel(false)}
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}
