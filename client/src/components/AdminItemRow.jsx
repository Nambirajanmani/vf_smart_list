import { useState } from 'react';
import { deleteItem, toggleItem } from '../api/api.js';
import './AdminItemRow.css';

/**
 * AdminItemRow — One row in the admin items table (English + Tamil Name, Category, Visibility, Actions).
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

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setLoadingDel(true);
    try { await deleteItem(item.id); await onRefresh(); }
    catch { /* ignore */ }
    setLoadingDel(false);
    setConfirmDel(false);
  };

  return (
    <tr className={`admin-row ${!item.is_active ? 'admin-row--hidden' : ''}`}>
      {/* Emoji + Name (English & Tamil) */}
      <td className="td-name">
        <span className="row-emoji">{item.emoji}</span>
        <div className="row-names">
          <span className="row-name">{item.name}</span>
          {item.name_ta && <span className="row-name-ta">{item.name_ta}</span>}
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
