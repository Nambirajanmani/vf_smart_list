import { useState, useEffect, useCallback } from 'react';
import Navbar        from '../components/Navbar.jsx';
import ItemCard      from '../components/ItemCard.jsx';
import UserAuthModal from '../components/UserAuthModal.jsx';
import HistoryModal  from '../components/HistoryModal.jsx';
import { fetchPublicItems, saveHistory } from '../api/api.js';
import { formatKgFraction, formatLiters, formatItemQty } from '../utils/formatKg.js';
import './LandingPage.css';

const TABS = [
  { key: 'all',       label: '🛒 All Catalog'       },
  { key: 'vegetable', label: '🥦 Vegetables'        },
  { key: 'fruit',     label: '🍎 Fruits'            },
  { key: 'grocery',   label: '🛍️ Groceries'         },
  { key: 'dairy',     label: '🥛 Dairy'             },
  { key: 'nuts',      label: '🥜 Nuts & Dry Fruits' },
];

// Clean, standard WhatsApp Brand SVG Icon
const WhatsAppIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function LandingPage() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [activeTab,   setActiveTab]   = useState('all');
  const [search,      setSearch]      = useState('');
  const [quantities,  setQuantities]  = useState({}); // { [id]: kg }
  const [copySuccess, setCopySuccess] = useState(false);

  // User Auth & History states
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vf_user_data')); }
    catch { return null; }
  });
  const [showAuthModal, setShowAuthModal]       = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [saveSuccess, setSaveSuccess]           = useState(false);
  const [savingHistory, setSavingHistory]       = useState(false);

  // Fetch items when tab changes
  useEffect(() => {
    setLoading(true);
    setError('');
    const category = activeTab === 'all' ? '' : activeTab;
    fetchPublicItems(category)
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { setError('Failed to load items. Is the server running?'); setLoading(false); });
  }, [activeTab]);

  // Logout handler
  const handleUserLogout = () => {
    localStorage.removeItem('vf_user_token');
    localStorage.removeItem('vf_user_data');
    setUser(null);
  };

  // Save current selection to backend history
  const handleSaveToHistory = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (selectedItems.length === 0) return;

    setSavingHistory(true);
    try {
      await saveHistory(selectedItems);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save to history.');
    } finally {
      setSavingHistory(false);
    }
  };

  // Reload past selection from history modal
  const handleReloadListFromHistory = (itemsList) => {
    const newQty = {};
    itemsList.forEach(item => {
      if (item.id && item.kg > 0) {
        newQty[item.id] = item.kg;
      }
    });
    setQuantities(newQty);
  };

  // Update quantity for an item
  const handleQtyChange = useCallback((id, kg) => {
    setQuantities(prev => {
      const updated = { ...prev };
      if (kg > 0) {
        updated[id] = kg;
      } else {
        delete updated[id];
      }
      return updated;
    });
  }, []);

  // Compute selected items list
  const selectedItems = items
    .filter(item => (quantities[item.id] || 0) > 0)
    .map(item => ({
      ...item,
      qty: quantities[item.id],
      kg: quantities[item.id],
      kgFormatted: formatItemQty(quantities[item.id], item.category),
    }));

  const selectedCount = selectedItems.length;
  const solidItems = selectedItems.filter(item => item.category !== 'dairy');
  const dairyItems = selectedItems.filter(item => item.category === 'dairy');
  const totalKg = solidItems.reduce((sum, item) => sum + item.qty, 0);
  const totalLiters = dairyItems.reduce((sum, item) => sum + item.qty, 0);

  const getSummaryQtyString = () => {
    const parts = [];
    if (totalKg > 0) parts.push(`⚖️ ${formatKgFraction(totalKg)}`);
    if (totalLiters > 0) parts.push(`🥛 ${formatLiters(totalLiters)}`);
    return parts.length > 0 ? parts.join(' • ') : '0 items';
  };

  // Filter items grid by search (searches both English and Tamil names)
  const filtered = items.filter(item => {
    const query = search.toLowerCase();
    const matchEn = item.name.toLowerCase().includes(query);
    const matchTa = item.name_ta ? item.name_ta.toLowerCase().includes(query) : false;
    return matchEn || matchTa;
  });

  // 1. Copy Shopping List to Clipboard (formatted with English + Tamil & Fractions)
  const handleCopyList = () => {
    if (selectedItems.length === 0) return;
    const text = [
      '🛒 VF Smart Shopping List / காய்கறி & பழங்கள் பட்டியல்',
      '────────────────────────────────────────────────────────',
      ...selectedItems.map(item => `${item.emoji} ${item.name} (${item.name_ta || ''}): ${item.kgFormatted}`),
      '────────────────────────────────────────────────────────',
      `📦 Total Items: ${selectedCount} | ${getSummaryQtyString()}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  // 2. Share Shopping List directly on WhatsApp
  const handleShareWhatsApp = () => {
    if (selectedItems.length === 0) return;
    const text = [
      '🛒 *VF Smart Shopping List / காய்கறி & பழங்கள் பட்டியல்*',
      '──────────────────────────────',
      ...selectedItems.map(item => `${item.emoji} *${item.name}* (${item.name_ta || ''}): *${item.kgFormatted}*`),
      '──────────────────────────────',
      `📦 *Total Items:* ${selectedCount} | ${getSummaryQtyString()}`,
      '',
      '_Shared from VF Smart List 🥬🍎_'
    ].join('\n');

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // 2b. Share Single Item on WhatsApp
  const handleShareSingleWhatsApp = (item) => {
    const text = [
      '🛒 *VF Smart Shopping List*',
      `${item.emoji} *${item.name}* (${item.name_ta || ''}): *${item.kgFormatted}*`,
      '',
      '_Shared from VF Smart List 🥬🍎_'
    ].join('\n');

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // 3. Download Shopping List as High-Res PNG Image
  const handleDownloadImage = () => {
    if (selectedItems.length === 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const width = 750;
    const rowHeight = 46;
    const headerHeight = 150;
    const footerHeight = 70;
    const height = headerHeight + (selectedItems.length * rowHeight) + footerHeight;

    // Retina 2x resolution
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Outer BG
    ctx.fillStyle = '#0a0f0a';
    ctx.fillRect(0, 0, width, height);

    // Card Outer Border & BG
    ctx.fillStyle = '#111a13';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(15, 15, width - 30, height - 30, 16);
    ctx.fill();
    ctx.stroke();

    // Title & Header
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.fillText('🌿 VF Smart Shopping List', 40, 55);

    ctx.fillStyle = '#4ade80';
    ctx.font = '15px "Outfit", sans-serif';
    ctx.fillText('காய்கறி மற்றும் பழங்கள் ஷாப்பிங் பட்டியல்', 40, 82);

    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    ctx.fillStyle = '#64748b';
    ctx.font = '12px "Outfit", sans-serif';
    ctx.fillText(`Date: ${dateStr}`, width - 200, 55);

    // Line Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 105);
    ctx.lineTo(width - 40, 105);
    ctx.stroke();

    // Table Headers
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.fillText('ITEM NAME / பொருள் பெயர்', 40, 130);
    ctx.fillText('CATEGORY', 420, 130);
    ctx.fillText('QUANTITY / அளவு', width - 160, 130);

    // Rows
    let y = 165;
    selectedItems.forEach((item, i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(35, y - 22, width - 70, 38);
      }

      // Emoji
      ctx.font = '18px "Segoe UI Emoji", sans-serif';
      ctx.fillText(item.emoji, 42, y);

      // English Name
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Outfit", sans-serif';
      ctx.fillText(item.name, 72, y);

      // Tamil Name
      if (item.name_ta) {
        const enWidth = ctx.measureText(item.name).width;
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 14px "Outfit", sans-serif';
        ctx.fillText(`(${item.name_ta})`, 82 + enWidth, y);
      }

      // Category
      ctx.fillStyle = item.category === 'vegetable' ? '#22c55e' : item.category === 'fruit' ? '#f97316' : item.category === 'dairy' ? '#38bdf8' : item.category === 'nuts' ? '#f59e0b' : '#a78bfa';
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillText(item.category.toUpperCase(), 420, y);

      // Quantity with Fraction
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 16px "Outfit", sans-serif';
      ctx.fillText(item.kgFormatted, width - 160, y);

      y += rowHeight;
    });

    // Footer Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(40, y - 5);
    ctx.lineTo(width - 40, y - 5);
    ctx.stroke();

    // Footer text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.fillText(`Total Selected Items: ${selectedCount}`, 40, y + 30);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.fillText(getSummaryQtyString(), width - 260, y + 30);

    // Trigger Download
    const link = document.createElement('a');
    link.download = `VF_Shopping_List_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 3. Download / Print Shopping List as PDF Document
  const handleDownloadPDF = () => {
    if (selectedItems.length === 0) return;

    const printWindow = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const rows = selectedItems.map((item, index) => `
      <tr style="background: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 10px 14px; font-size: 20px;">${item.emoji}</td>
        <td style="padding: 10px 14px; font-weight: 600; font-size: 15px;">
          ${item.name} <span style="color: #16a34a; font-weight: 600; font-size: 14px;">(${item.name_ta || ''})</span>
        </td>
        <td style="padding: 10px 14px; font-weight: bold; color: ${item.category === 'vegetable' ? '#16a34a' : item.category === 'fruit' ? '#ea580c' : item.category === 'dairy' ? '#0284c7' : item.category === 'nuts' ? '#d97706' : '#7c3aed'}; text-transform: uppercase; font-size: 12px;">
          ${item.category}
        </td>
        <td style="padding: 10px 14px; font-weight: bold; font-size: 16px; color: #16a34a; text-align: right;">
          ${item.kgFormatted}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VF_Smart_Shopping_List_${Date.now()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
            body { font-family: 'Outfit', sans-serif; margin: 30px; color: #0f172a; background: #fff; }
            .header { border-bottom: 2px solid #22c55e; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 700; color: #16a34a; margin: 0; }
            .sub { font-size: 14px; color: #64748b; margin-top: 4px; }
            .date { font-size: 12px; color: #64748b; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { background: #f1f5f9; text-align: left; padding: 10px 14px; font-size: 12px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            .footer { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px 20px; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; }
            .footer-weight { color: #16a34a; font-size: 18px; }
            @media print {
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">🌿 VF Smart Shopping List</h1>
              <div class="sub">காய்கறி மற்றும் பழங்கள் ஷாப்பிங் பட்டியல்</div>
            </div>
            <div class="date">Date: ${dateStr}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;"></th>
                <th>Item Name / பொருள் பெயர்</th>
                <th>Category</th>
                <th style="text-align: right;">Quantity / அளவு</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="footer">
            <div>Total Selected Items: ${selectedCount}</div>
            <div class="footer-weight">${getSummaryQtyString()}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="landing-page">
      <Navbar
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenHistory={() => setShowHistoryModal(true)}
        onLogout={handleUserLogout}
      />

      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-bg-orb hero-bg-orb--1" />
        <div className="hero-bg-orb hero-bg-orb--2" />
        <div className="page-container hero-content">
          <div className="hero-badge">📋 50g, 100g, ¼, ½, ¾, 1 kg Quantity Checklist</div>
          <h1 className="hero-title">
            Select Your Fresh <span className="text-accent">Vegetables</span> &<br />
            <span className="hero-title-fruit">Fruits</span> Shopping List
          </h1>
          <p className="hero-subtitle">
            50 கிராம் (50g), 100 கிராம் (100g), கால் (¼ kg), அரை (½ kg), முக்கால் (¾ kg), ஒரு கிலோ (1 kg) அளவுகளை தேர்வு செய்து ஷாப்பிங் பட்டியல் உருவாக்குங்கள்.
          </p>
        </div>
      </section>

      {/* ── Main Layout (Content + Live Shopping List) ── */}
      <main className="main-content page-container">
        
        {/* Selected List Section (Shows at top when items are selected) */}
        {selectedCount > 0 && (
          <section className="selected-list-section glass-card slide-down">
            <div className="selected-list-header">
              <div>
                <h2 className="selected-list-title">
                  📋 My Selected List / தேர்ந்தெடுக்கப்பட்ட பட்டியல் <span className="list-count-badge">{selectedCount} Items</span>
                </h2>
                <p className="selected-list-sub">
                  Total / மொத்த அளவு: <strong>{getSummaryQtyString()}</strong>
                </p>
              </div>

              <div className="selected-list-actions">
                <button
                  className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'} btn-sm`}
                  onClick={handleSaveToHistory}
                  disabled={savingHistory}
                  title="Save this shopping selection to your account history"
                >
                  {savingHistory ? '⏳ Saving...' : saveSuccess ? '✅ Saved!' : (
                    <>
                      <span>💾</span>
                      <span className="btn-full">Save to History</span>
                      <span className="btn-short">Save</span>
                    </>
                  )}
                </button>
                <button
                  className="btn btn-whatsapp btn-sm"
                  onClick={handleShareWhatsApp}
                  title="Share shopping list directly on WhatsApp"
                >
                  <WhatsAppIcon size={15} color="#fff" />
                  <span className="btn-full">WhatsApp</span>
                  <span className="btn-short">WA</span>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadImage}
                  title="Download shopping list as a PNG Image"
                >
                  <span>🖼️</span>
                  <span className="btn-full">Image (.png)</span>
                  <span className="btn-short">PNG</span>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadPDF}
                  title="Save or print shopping list as a PDF document"
                >
                  <span>📄</span>
                  <span className="btn-full">PDF (.pdf)</span>
                  <span className="btn-short">PDF</span>
                </button>
                <button
                  className={`btn ${copySuccess ? 'btn-success' : 'btn-ghost'} btn-sm`}
                  onClick={handleCopyList}
                  title="Copy formatted text for WhatsApp or Notes"
                >
                  {copySuccess ? '✅ Copied!' : (
                    <>
                      <span>📋</span>
                      <span className="btn-full">Copy Text</span>
                      <span className="btn-short">Copy</span>
                    </>
                  )}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setQuantities({})}
                  title="Clear all selected items"
                >
                  <span>🗑️</span>
                  <span className="btn-full">Clear All</span>
                  <span className="btn-short">Clear</span>
                </button>
              </div>
            </div>

            {/* Selected Items Grid / Chips */}
            <div className="selected-items-grid">
              {selectedItems.map(item => (
                <div key={item.id} className={`selected-item-chip ${item.category}`}>
                  <span className="chip-emoji">{item.emoji}</span>
                  <div className="chip-names">
                    <span className="chip-name">{item.name}</span>
                    {item.name_ta && <span className="chip-name-ta">{item.name_ta}</span>}
                  </div>
                  <span className="chip-kg">{item.kgFormatted}</span>
                  
                  {/* Quick 50g Quantity adjustments */}
                  <div className="chip-controls">
                    <button
                      type="button"
                      className="chip-btn"
                      onClick={() => handleQtyChange(item.id, Math.max(0, Math.round((item.kg - 0.05) * 1000) / 1000))}
                      title="Decrease by 50g"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="chip-btn"
                      onClick={() => handleQtyChange(item.id, Math.round((item.kg + 0.05) * 1000) / 1000)}
                      title="Increase by 50g"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="chip-btn chip-btn--whatsapp"
                      onClick={() => handleShareSingleWhatsApp(item)}
                      title={`Send ${item.name} on WhatsApp`}
                    >
                      <WhatsAppIcon size={12} color="#fff" />
                    </button>
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => handleQtyChange(item.id, 0)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search + Tabs */}
        <div className="controls-bar">
          <div className="tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'tab-btn--active' : ''}`}
                onClick={() => { setActiveTab(tab.key); setSearch(''); }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search / தேடுக (e.g. Tomato, தக்காளி)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Items Grid */}
        {loading && (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading catalog...</p>
          </div>
        )}

        {error && (
          <div className="state-center">
            <div className="error-box">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="state-center">
            <p className="text-muted">No items found matching "{search}"</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="items-grid">
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                value={quantities[item.id] || 0}
                onQtyChange={handleQtyChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Sticky Bottom Bar ── */}
      {selectedCount > 0 && (
        <div className="total-bar fade-in">
          <div className="total-bar-inner page-container">
            <div className="total-info">
              <span className="total-label">🛒 {selectedCount} item{selectedCount > 1 ? 's' : ''} selected</span>
              <span className="total-hint">{getSummaryQtyString()}</span>
            </div>

            <div className="total-bar-actions">
              <button
                className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'} total-btn`}
                onClick={handleSaveToHistory}
                disabled={savingHistory}
                title="Save this shopping list to history"
              >
                <span>💾</span>
                <span className="bar-btn-full">{savingHistory ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save to History'}</span>
                <span className="bar-btn-short">{savingHistory ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}</span>
              </button>
              <button
                className="btn btn-whatsapp total-btn"
                onClick={handleShareWhatsApp}
                title="Share shopping list directly on WhatsApp"
              >
                <WhatsAppIcon size={15} color="#fff" />
                <span className="bar-btn-full">WhatsApp</span>
                <span className="bar-btn-short">WA</span>
              </button>
              <button
                className="btn btn-primary total-btn"
                onClick={handleDownloadImage}
                title="Download as PNG image"
              >
                <span>🖼️</span>
                <span className="bar-btn-full">Image (.png)</span>
                <span className="bar-btn-short">PNG</span>
              </button>
              <button
                className="btn btn-primary total-btn"
                onClick={handleDownloadPDF}
                title="Save as PDF"
              >
                <span>📄</span>
                <span className="bar-btn-full">PDF (.pdf)</span>
                <span className="bar-btn-short">PDF</span>
              </button>
              <button
                className="btn btn-ghost total-btn"
                onClick={() => setQuantities({})}
                title="Clear selection"
              >
                <span>🗑️</span>
                <span className="bar-btn-full">Clear</span>
                <span className="bar-btn-short">Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAuthModal && (
        <UserAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            setShowAuthModal(false);
          }}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          onClose={() => setShowHistoryModal(false)}
          onReloadList={handleReloadListFromHistory}
        />
      )}
    </div>
  );
}

