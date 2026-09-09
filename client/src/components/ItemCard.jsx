import { useState, useEffect } from 'react';
import { formatKgFraction } from '../utils/formatKg.js';
import './ItemCard.css';

/**
 * ItemCard — Displays one vegetable/fruit with ¼, ½, ¾, 1 kg preset buttons & manual KG selection.
 */
export default function ItemCard({ item, value = 0, onQtyChange }) {
  const [kgStr, setKgStr] = useState(value > 0 ? value.toString() : '');

  // Keep local string in sync if parent resets value
  useEffect(() => {
    setKgStr(value > 0 ? value.toString() : '');
  }, [value]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setKgStr(val);
    const parsed = parseFloat(val);
    onQtyChange(item.id, isNaN(parsed) || parsed < 0 ? 0 : parsed);
  };

  const handleStep = (delta) => {
    const current = parseFloat(kgStr) || 0;
    const updated = Math.max(0, Math.round((current + delta) * 1000) / 1000);
    setKgStr(updated > 0 ? updated.toString() : '');
    onQtyChange(item.id, updated);
  };

  const setPreset = (presetKg) => {
    const updated = Math.round(presetKg * 1000) / 1000;
    setKgStr(updated.toString());
    onQtyChange(item.id, updated);
  };

  const currentKg = parseFloat(kgStr) || 0;
  const isSelected = currentKg > 0;

  return (
    <div className={`item-card glass-card ${isSelected ? 'item-card--selected' : ''} ${item.category}`}>
      {/* Selection Checkmark Badge with Fraction Format */}
      {isSelected && (
        <div className="selected-badge fade-in">
          ✓ {formatKgFraction(currentKg)}
        </div>
      )}

      {/* Emoji Icon */}
      <div className="item-emoji">{item.emoji}</div>

      {/* English & Tamil Names */}
      <div className="item-info">
        <div className="item-names">
          <h3 className="item-name">{item.name}</h3>
          {item.name_ta && <span className="item-name-ta">{item.name_ta}</span>}
        </div>
        <span className={`badge badge-${item.category}`}>{item.category}</span>
      </div>

      {/* Manual Weight Quantity Selector */}
      <div className="item-kg-controls">
        <label htmlFor={`kg-${item.id}`} className="kg-label">Manual Weight (KG)</label>

        <div className="kg-stepper">
          <button
            type="button"
            className="stepper-btn stepper-btn--minus"
            onClick={() => handleStep(-0.05)}
            disabled={currentKg <= 0}
            title="Decrease by 50g (0.05 kg)"
          >
            −
          </button>

          <div className="kg-input-wrapper">
            <input
              id={`kg-${item.id}`}
              type="number"
              className="kg-input"
              placeholder="0"
              value={kgStr}
              min="0"
              step="0.05"
              onChange={handleInputChange}
            />
            <span className="kg-unit">kg</span>
          </div>

          <button
            type="button"
            className="stepper-btn stepper-btn--plus"
            onClick={() => handleStep(0.05)}
            title="Increase by 50g (0.05 kg)"
          >
            +
          </button>
        </div>

        {/* Quick Presets: 50g, 100g, 250g, 500g, 750g, 1 kg */}
        <div className="kg-presets">
          <button
            type="button"
            className={`preset-btn ${currentKg === 0.05 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.05)}
            title="50 g / 50 கிராம்கள்"
          >
            50 g
          </button>
          <button
            type="button"
            className={`preset-btn ${currentKg === 0.1 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.1)}
            title="100 g / 100 கிராம்கள்"
          >
            100 g
          </button>
          <button
            type="button"
            className={`preset-btn ${currentKg === 0.25 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.25)}
            title="250 g (¼ kg) / கால் கிலோ"
          >
            250 g
          </button>
          <button
            type="button"
            className={`preset-btn ${currentKg === 0.5 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.5)}
            title="500 g (½ kg) / அரை கிலோ"
          >
            500 g
          </button>
          <button
            type="button"
            className={`preset-btn ${currentKg === 0.75 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.75)}
            title="750 g (¾ kg) / முக்கால் கிலோ"
          >
            750 g
          </button>
          <button
            type="button"
            className={`preset-btn ${currentKg === 1.0 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(1.0)}
            title="1.0 kg / ஒரு கிலோ"
          >
            1 kg
          </button>
        </div>
      </div>
    </div>
  );
}
