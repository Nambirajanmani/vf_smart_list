import { useState, useEffect } from 'react';
import { fetchHistory, deleteHistory } from '../api/api';
import { formatKgFraction } from '../utils/formatKg';
import './HistoryModal.css';

/**
 * HistoryModal — Displays logged-in user's past saved shopping lists.
 */
export default function HistoryModal({ onClose, onReloadList }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchHistory();
      setHistory(res.history || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load selection history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteHistory(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  const handleReload = (itemsData) => {
    // itemsData is an array of items [{ id, kg }]
    onReloadList(itemsData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="history-modal-card glass-card slide-down">
        <div className="history-header">
          <div>
            <h2>📜 My Selection History</h2>
            <p className="history-subtitle">உங்கள் முந்தைய காய்கறி & பழங்கள் பட்டியல் வரலாறு</p>
          </div>
          <button className="btn btn-ghost btn-sm close-btn" onClick={onClose}>✕</button>
        </div>

        {loading && (
          <div className="state-center py-4">
            <div className="spinner" />
            <p>Loading your saved lists...</p>
          </div>
        )}

        {error && (
          <div className="auth-error text-center my-3">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="history-empty">
            <span className="empty-icon">🛒</span>
            <h3>No Saved Shopping History Yet</h3>
            <p>Select items on the catalog and click <strong>"💾 Save to History"</strong> to save your lists here!</p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="history-list">
            {history.map((record) => {
              const dateStr = new Date(record.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              const itemsList = Array.isArray(record.items_data) ? record.items_data : [];

              return (
                <div key={record.id} className="history-card glass-card">
                  <div className="history-card-header">
                    <div>
                      <h3 className="history-card-title">{record.title}</h3>
                      <span className="history-card-date">🕒 {dateStr}</span>
                    </div>
                    <div className="history-card-meta">
                      <span className="meta-pill items">{record.total_items} Items</span>
                      <span className="meta-pill weight">{formatKgFraction(record.total_weight)}</span>
                    </div>
                  </div>

                  {/* Items Preview Chips */}
                  <div className="history-items-chips">
                    {itemsList.map((item, idx) => (
                      <span key={idx} className={`history-chip ${item.category || ''}`}>
                        <span className="chip-emoji">{item.emoji}</span>
                        <span className="chip-name">{item.name} {item.name_ta && `(${item.name_ta})`}:</span>
                        <strong className="chip-weight">{item.kgFormatted || `${item.kg} kg`}</strong>
                      </span>
                    ))}
                  </div>

                  {/* Card Actions */}
                  <div className="history-card-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleReload(itemsList)}
                      title="Load this list into your active selection grid"
                    >
                      📋 Reload into List
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                      title="Delete this history record"
                    >
                      {deletingId === record.id ? '…' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
