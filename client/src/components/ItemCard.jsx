import { useState, useEffect } from 'react';
import { formatKgFraction } from '../utils/formatKg.js';
import './ItemCard.css';

/**
 * ItemCard — Displays one vegetable/fruit with manual weight typing (kg or grams),
 * unit switcher (kg ↔ g), stepper controls & quick preset buttons.
 */
export default function ItemCard({ item, value = 0, onQtyChange }) {
  const [unit, setUnit] = useState('kg'); // 'kg' | 'g'
  const [kgStr, setKgStr] = useState(value > 0 ? value.toString() : '');

  // Helper to parse input string to kg value
  const parseToKg = (strVal, currentUnit) => {
    const raw = parseFloat(strVal);
    if (isNaN(raw) || raw < 0) return 0;
    const kg = currentUnit === 'g' ? raw / 1000 : raw;
    return Math.max(0, Math.round(kg * 1000) / 1000);
  };

  // Helper to format string based on target unit
  const formatValForUnit = (valKg, targetUnit) => {
    if (valKg <= 0) return '';
    if (targetUnit === 'g') {
      return (Math.round(valKg * 1000)).toString();
    }
    return valKg.toString();
  };

  // Keep input in sync with parent value changes (e.g. Clear All) without breaking active user typing
  useEffect(() => {
    const currentKgFromStr = parseToKg(kgStr, unit);
    if (Math.abs(currentKgFromStr - value) > 0.0001) {
      if (value === 0) {
        setKgStr('');
      } else {
        setKgStr(formatValForUnit(value, unit));
      }
    }
  }, [value]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setKgStr(val);
    const parsedKg = parseToKg(val, unit);
    onQtyChange(item.id, parsedKg);
  };

  const handleUnitToggle = (newUnit) => {
    if (newUnit === unit) return;
    const currentKg = parseToKg(kgStr, unit);
    setUnit(newUnit);
    if (currentKg > 0) {
      setKgStr(formatValForUnit(currentKg, newUnit));
    } else {
      setKgStr('');
    }
  };

  const handleStep = (deltaKg) => {
    const currentKg = parseToKg(kgStr, unit);
    const updatedKg = Math.max(0, Math.round((currentKg + deltaKg) * 1000) / 1000);
    setKgStr(formatValForUnit(updatedKg, unit));
    onQtyChange(item.id, updatedKg);
  };

  const setPreset = (presetKg) => {
    const updatedKg = Math.round(presetKg * 1000) / 1000;
    setKgStr(formatValForUnit(updatedKg, unit));
    onQtyChange(item.id, updatedKg);
  };

  const clearInput = () => {
    setKgStr('');
    onQtyChange(item.id, 0);
  };

  const currentKg = parseToKg(kgStr, unit);
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
        <div className="kg-label-row">
          <label htmlFor={`kg-${item.id}`} className="kg-label">
            Type Weight ({unit === 'kg' ? 'KG' : 'Grams'})
          </label>

          <div className="unit-toggle" title="Switch between Kilograms (kg) and Grams (g)">
            <button
              type="button"
              className={`unit-toggle-btn ${unit === 'kg' ? 'active' : ''}`}
              onClick={() => handleUnitToggle('kg')}
            >
              kg
            </button>
            <button
              type="button"
              className={`unit-toggle-btn ${unit === 'g' ? 'active' : ''}`}
              onClick={() => handleUnitToggle('g')}
            >
              g
            </button>
          </div>
        </div>

        <div className="kg-stepper">
          <button
            type="button"
            className="stepper-btn stepper-btn--minus"
            onClick={() => handleStep(-0.05)}
            disabled={currentKg <= 0}
            title="Decrease by 50g"
          >
            −
          </button>

          <div className="kg-input-wrapper">
            <input
              id={`kg-${item.id}`}
              type="text"
              inputMode="decimal"
              className="kg-input"
              placeholder={unit === 'kg' ? 'e.g. 0.5' : 'e.g. 250'}
              value={kgStr}
              onChange={handleInputChange}
            />
            <span className="kg-unit">{unit}</span>

            {kgStr !== '' && (
              <button
                type="button"
                className="input-clear-btn"
                onClick={clearInput}
                title="Clear weight input"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className="stepper-btn stepper-btn--plus"
            onClick={() => handleStep(0.05)}
            title="Increase by 50g"
          >
            +
          </button>
        </div>

        {/* Quick Presets: 50g, 100g, 250g, 500g, 750g, 1 kg */}
        <div className="kg-presets">
          <button
            type="button"
            className={`preset-btn ${Math.abs(currentKg - 0.05) < 0.001 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.05)}
            title="50 g / 50 கிராம்கள்"
          >
            50 g
          </button>
          <button
            type="button"
            className={`preset-btn ${Math.abs(currentKg - 0.1) < 0.001 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.1)}
            title="100 g / 100 கிராம்கள்"
          >
            100 g
          </button>
          <button
            type="button"
            className={`preset-btn ${Math.abs(currentKg - 0.25) < 0.001 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.25)}
            title="250 g (¼ kg) / கால் கிலோ"
          >
            250 g
          </button>
          <button
            type="button"
            className={`preset-btn ${Math.abs(currentKg - 0.5) < 0.001 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.5)}
            title="500 g (½ kg) / அரை கிலோ"
          >
            500 g
          </button>
          <button
            type="button"
            className={`preset-btn ${Math.abs(currentKg - 0.75) < 0.001 ? 'preset-btn--active' : ''}`}
            onClick={() => setPreset(0.75)}
            title="750 g (¾ kg) / முக்கால் கிலோ"
          >
            750 g
          </button>
          <button
            type="button"
            className={`preset-btn ${Math.abs(currentKg - 1.0) < 0.001 ? 'preset-btn--active' : ''}`}
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

