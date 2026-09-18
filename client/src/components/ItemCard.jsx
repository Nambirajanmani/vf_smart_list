import { useState, useEffect } from 'react';
import { formatItemQty } from '../utils/formatKg.js';
import { getTanglishName, getEnglishName } from '../utils/tanglish.js';
import './ItemCard.css';

/**
 * ItemCard — Compact "Small Box" Product Tile
 * Space-efficient, modern quick-commerce style card with 1-tap add,
 * compact stepper, inline weight/volume editing, and quick chips.
 * Supports Liters (L / ml) for Dairy and Weight (kg / g) for solids.
 */
export default function ItemCard({ item, value = 0, onQtyChange }) {
  const isLiquid = item.category === 'dairy';
  const mainUnit = isLiquid ? 'L' : 'kg';
  const subUnit  = isLiquid ? 'ml' : 'g';

  const [unit, setUnit] = useState(mainUnit);
  const [valStr, setValStr] = useState(value > 0 ? value.toString() : '');

  // Helper to parse input string to base (kg or L) value
  const parseToBase = (strVal, currentUnit) => {
    const raw = parseFloat(strVal);
    if (isNaN(raw) || raw < 0) return 0;
    const base = (currentUnit === 'g' || currentUnit === 'ml') ? raw / 1000 : raw;
    return Math.max(0, Math.round(base * 1000) / 1000);
  };

  // Helper to format string based on target unit
  const formatValForUnit = (valBase, targetUnit) => {
    if (valBase <= 0) return '';
    if (targetUnit === 'g' || targetUnit === 'ml') {
      return (Math.round(valBase * 1000)).toString();
    }
    return valBase.toString();
  };

  // Keep input in sync with parent value changes (e.g. Clear All)
  useEffect(() => {
    const currentFromStr = parseToBase(valStr, unit);
    if (Math.abs(currentFromStr - value) > 0.0001) {
      if (value === 0) {
        setValStr('');
      } else {
        setValStr(formatValForUnit(value, unit));
      }
    }
  }, [value]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setValStr(val);
    const parsed = parseToBase(val, unit);
    onQtyChange(item.id, parsed);
  };

  const handleUnitToggle = () => {
    const newUnit = unit === mainUnit ? subUnit : mainUnit;
    const current = parseToBase(valStr, unit);
    setUnit(newUnit);
    if (current > 0) {
      setValStr(formatValForUnit(current, newUnit));
    } else {
      setValStr('');
    }
  };

  const handleStep = (delta) => {
    const current = parseToBase(valStr, unit);
    const updated = Math.max(0, Math.round((current + delta) * 1000) / 1000);
    setValStr(formatValForUnit(updated, unit));
    onQtyChange(item.id, updated);
  };

  const setPreset = (presetBase) => {
    const updated = Math.round(presetBase * 1000) / 1000;
    setValStr(formatValForUnit(updated, unit));
    onQtyChange(item.id, updated);
  };

  const clearInput = () => {
    setValStr('');
    onQtyChange(item.id, 0);
  };

  const currentVal = parseToBase(valStr, unit);
  const isSelected = currentVal > 0;

  // Derive proper English and Tanglish display values
  const englishName = getEnglishName(item);
  const cleanName   = (item.name || '').trim();
  const lowerName   = cleanName.toLowerCase();
  const lowerEn     = (englishName || '').toLowerCase();

  // Determine if English name should be appended to item.name
  const hasEnglishInName = lowerEn && (
    lowerName === lowerEn ||
    lowerName.includes(`(${lowerEn})`) ||
    lowerName.includes(lowerEn)
  );
  const englishSuffix = (!hasEnglishInName && englishName) ? ` (${englishName})` : '';
  const fullDisplayName = `${cleanName}${englishSuffix}`;

  // Subtitle Tanglish name: avoid showing if it's already in the main name or english name
  const tanglish = getTanglishName(item);
  const lowerTanglish = (tanglish || '').toLowerCase();
  const showTanglish = tanglish && (
    !lowerName.includes(lowerTanglish) &&
    !lowerEn.includes(lowerTanglish)
  );

  return (
    <div className={`item-card glass-card ${isSelected ? 'item-card--selected' : ''} ${item.category}`}>
      {/* Top Header Row: Emoji Thumbnail + Category Badge / Selection Badge */}
      <div className="card-top-row">
        <div className="item-emoji-badge">
          {item.emoji}
        </div>

        {isSelected ? (
          <span className="selected-badge fade-in">
            ✓ {formatItemQty(currentVal, item.category)}
          </span>
        ) : (
          <span className={`badge badge-${item.category}`}>
            {item.category === 'vegetable' ? 'VEG' : item.category === 'fruit' ? 'FRUIT' : item.category === 'dairy' ? 'DAIRY' : item.category === 'nuts' ? 'NUTS' : 'GROCERY'}
          </span>
        )}
      </div>

      {/* Item Names (English, Tamil & Tanglish) */}
      <div className="item-names">
        <h3 className="item-name" title={fullDisplayName}>
          <span className="item-name-main">{cleanName}</span>
          {englishSuffix && <span className="item-name-en">{englishSuffix}</span>}
        </h3>
        <div className="item-sub-names">
          {item.name_ta && <span className="item-name-ta" title={item.name_ta}>{item.name_ta}</span>}
          {showTanglish && (
            <span className="item-name-tanglish" title={tanglish}>
              ({tanglish})
            </span>
          )}
        </div>
      </div>

      {/* Action Area: Compact Add / Stepper Controls */}
      <div className="card-action-area">
        {!isSelected ? (
          /* Unselected State: Clean + Add Button & 1-Tap Chips */
          <div className="unselected-actions">
            <button
              type="button"
              className="btn-add-primary"
              onClick={() => setPreset(0.5)}
              title={`Add ${isLiquid ? '500ml' : '500g'} to list`}
            >
              <span className="btn-add-icon">+</span>
              <span className="btn-add-text">ADD</span>
            </button>

            <div className="quick-chips">
              <button
                type="button"
                className="chip-pill"
                onClick={() => setPreset(0.25)}
                title={`Add ${isLiquid ? '¼ L (250ml)' : '¼ kg (250g)'}`}
              >
                {isLiquid ? '250ml' : '250g'}
              </button>
              <button
                type="button"
                className="chip-pill"
                onClick={() => setPreset(0.5)}
                title={`Add ${isLiquid ? '½ L (500ml)' : '½ kg (500g)'}`}
              >
                {isLiquid ? '500ml' : '500g'}
              </button>
              <button
                type="button"
                className="chip-pill"
                onClick={() => setPreset(1.0)}
                title={`Add 1 ${isLiquid ? 'L' : 'kg'}`}
              >
                {isLiquid ? '1L' : '1kg'}
              </button>
            </div>
          </div>
        ) : (
          /* Selected State: Compact Stepper + Chips */
          <div className="selected-actions fade-in">
            <div className="compact-stepper">
              <button
                type="button"
                className="compact-step-btn"
                onClick={() => handleStep(-0.05)}
                title={`Decrease by ${isLiquid ? '50ml' : '50g'}`}
              >
                −
              </button>

              <div className="compact-input-wrap">
                <input
                  id={`qty-${item.id}`}
                  type="text"
                  inputMode="decimal"
                  className="compact-input"
                  value={valStr}
                  onChange={handleInputChange}
                  placeholder="0"
                />
                <button
                  type="button"
                  className="unit-toggle-tag"
                  onClick={handleUnitToggle}
                  title={`Switch to ${unit === mainUnit ? (isLiquid ? 'milliliters (ml)' : 'grams (g)') : (isLiquid ? 'liters (L)' : 'kilograms (kg)')}`}
                >
                  {unit}
                </button>
              </div>

              <button
                type="button"
                className="compact-step-btn"
                onClick={() => handleStep(0.05)}
                title={`Increase by ${isLiquid ? '50ml' : '50g'}`}
              >
                +
              </button>

              <button
                type="button"
                className="compact-clear-btn"
                onClick={clearInput}
                title="Remove item"
              >
                ✕
              </button>
            </div>

            {/* Quick Switch Preset Chips */}
            <div className="quick-chips">
              <button
                type="button"
                className={`chip-pill ${Math.abs(currentVal - 0.1) < 0.001 ? 'chip-pill--active' : ''}`}
                onClick={() => setPreset(0.1)}
                title={isLiquid ? '100ml' : '100g'}
              >
                {isLiquid ? '100ml' : '100g'}
              </button>
              <button
                type="button"
                className={`chip-pill ${Math.abs(currentVal - 0.25) < 0.001 ? 'chip-pill--active' : ''}`}
                onClick={() => setPreset(0.25)}
                title={isLiquid ? '250ml (¼ L)' : '250g (¼ kg)'}
              >
                {isLiquid ? '250ml' : '250g'}
              </button>
              <button
                type="button"
                className={`chip-pill ${Math.abs(currentVal - 0.5) < 0.001 ? 'chip-pill--active' : ''}`}
                onClick={() => setPreset(0.5)}
                title={isLiquid ? '500ml (½ L)' : '500g (½ kg)'}
              >
                {isLiquid ? '500ml' : '500g'}
              </button>
              <button
                type="button"
                className={`chip-pill ${Math.abs(currentVal - 1.0) < 0.001 ? 'chip-pill--active' : ''}`}
                onClick={() => setPreset(1.0)}
                title={`1 ${isLiquid ? 'L' : 'kg'}`}
              >
                {isLiquid ? '1L' : '1kg'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
