import { useState } from 'react';
import './AddItemModal.css';

const VEGETABLES_EMOJIS = ['🥦','🥕','🍅','🥔','🧅','🧄','🫛','🌽','🍆','🫑','🥒','🌶️','🍄','🌿','🟣','🌱','🫚'];
const FRUIT_EMOJIS      = ['🍎','🍊','🍋','🍇','🍓','🥝','🍑','🍒','🥭','🍍','🥥','🍌','🍐','🍈','🍉','🫐','⭐','🟤','🔴','🟡','🟢'];

/**
 * AddItemModal — Modal dialog for adding a new vegetable or fruit with English & Tamil names.
 */
export default function AddItemModal({ onClose, onSubmit }) {
  const [form, setForm]     = useState({
    name: '', name_ta: '', category: 'vegetable', emoji: '🥦',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const emojiOptions = form.category === 'vegetable' ? VEGETABLES_EMOJIS : FRUIT_EMOJIS;

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'category') {
        updated.emoji = value === 'vegetable' ? '🥦' : '🍎';
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('English Item name is required.');

    setLoading(true);
    setError('');
    try {
      await onSubmit({
        name:         form.name.trim(),
        name_ta:      form.name_ta.trim(),
        category:     form.category,
        price_per_kg: 0.00,
        emoji:        form.emoji,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box glass-card slide-down">
        <div className="modal-header">
          <h2>➕ Add New Item / புதிய பொருள் சேர்</h2>
          <button className="modal-close btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* English Name */}
          <div className="form-group">
            <label className="form-label">Item Name (English) *</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Broccoli, Mango..."
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              autoFocus
            />
          </div>

          {/* Tamil Name */}
          <div className="form-group">
            <label className="form-label">Item Name (தமிழ் / Tamil)</label>
            <input
              className="input"
              type="text"
              placeholder="எ.கா. தக்காளி, மாம்பழம்..."
              value={form.name_ta}
              onChange={e => handleChange('name_ta', e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category *</label>
            <div className="category-toggle">
              <button
                type="button"
                className={`cat-btn ${form.category === 'vegetable' ? 'cat-btn--active vegetable' : ''}`}
                onClick={() => handleChange('category', 'vegetable')}
              >
                🥦 Vegetable
              </button>
              <button
                type="button"
                className={`cat-btn ${form.category === 'fruit' ? 'cat-btn--active fruit' : ''}`}
                onClick={() => handleChange('category', 'fruit')}
              >
                🍎 Fruit
              </button>
            </div>
          </div>

          {/* Emoji Picker */}
          <div className="form-group">
            <label className="form-label">Choose Emoji</label>
            <div className="emoji-grid">
              {emojiOptions.map(em => (
                <button
                  key={em}
                  type="button"
                  className={`emoji-btn ${form.emoji === em ? 'emoji-btn--selected' : ''}`}
                  onClick={() => handleChange('emoji', em)}
                  title={em}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="item-preview">
            <span className="preview-emoji">{form.emoji}</span>
            <div>
              <div className="preview-name">
                {form.name || 'Item Name'} {form.name_ta && <span style={{color:'var(--accent)', fontSize:'0.85rem'}}>({form.name_ta})</span>}
              </div>
              <div className="preview-meta">
                <span className={`badge badge-${form.category}`}>{form.category}</span>
              </div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Adding...' : '✅ Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
