import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar        from '../components/Navbar.jsx';
import ItemCard      from '../components/ItemCard.jsx';
import UserAuthModal from '../components/UserAuthModal.jsx';
import HistoryModal  from '../components/HistoryModal.jsx';
import { fetchPublicItems, saveHistory } from '../api/api.js';
import { formatKgFraction } from '../utils/formatKg.js';
import './LandingPage.css';

const TABS = [
  { key: 'all',       label: '🛒 All Catalog' },
  { key: 'vegetable', label: '🥦 Vegetables'  },
  { key: 'fruit',     label: '🍎 Fruits'      },
];

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
      kg: quantities[item.id],
      kgFormatted: formatKgFraction(quantities[item.id]),
    }));

  const selectedCount = selectedItems.length;
  const totalKg = selectedItems.reduce((sum, item) => sum + item.kg, 0);

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
      `📦 Total Items: ${selectedCount} | ⚖️ Total Weight: ${formatKgFraction(totalKg)} (${totalKg.toFixed(2)} kg)`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  // 2. Download Shopping List as High-Res PNG Image
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
    ctx.fillText('QUANTITY / எடை', width - 160, 130);

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
      ctx.fillStyle = item.category === 'vegetable' ? '#22c55e' : '#f97316';
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillText(item.category.toUpperCase(), 420, y);

      // KG Quantity with Fraction
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
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.fillText(`Total Weight: ${formatKgFraction(totalKg)}`, width - 260, y + 30);

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
        <td style="padding: 10px 14px; font-weight: bold; color: ${item.category === 'vegetable' ? '#16a34a' : '#ea580c'}; text-transform: uppercase; font-size: 12px;">
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
                <th style="text-align: right;">Quantity / எடை</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="footer">
            <div>Total Selected Items: ${selectedCount}</div>
            <div class="footer-weight">Total Weight: ${formatKgFraction(totalKg)}</div>
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
                  Total Weight / மொத்த எடை: <strong>{formatKgFraction(totalKg)}</strong> ({totalKg.toFixed(2)} kg)
                </p>
              </div>

              <div className="selected-list-actions">
                <button
                  className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'} btn-sm`}
                  onClick={handleSaveToHistory}
                  disabled={savingHistory}
                  title="Save this shopping selection to your account history"
                >
                  {savingHistory ? '⏳ Saving...' : saveSuccess ? '✅ Saved to History!' : '💾 Save to History'}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadImage}
                  title="Download shopping list as a PNG Image"
                >
                  🖼️ Image (.png)
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadPDF}
                  title="Save or print shopping list as a PDF document"
                >
                  📄 PDF (.pdf)
                </button>
                <button
                  className={`btn ${copySuccess ? 'btn-success' : 'btn-ghost'} btn-sm`}
                  onClick={handleCopyList}
                  title="Copy formatted text for WhatsApp or Notes"
                >
                  {copySuccess ? '✅ Copied!' : '📋 Copy Text'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setQuantities({})}
                  title="Clear all selected items"
                >
                  🗑️ Clear All
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
              <span className="total-hint">Total Weight: {formatKgFraction(totalKg)}</span>
            </div>

            <div className="total-bar-actions">
              <button
                className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'}`}
                onClick={handleSaveToHistory}
                disabled={savingHistory}
              >
                {savingHistory ? '⏳ Saving...' : saveSuccess ? '✅ Saved!' : '💾 Save to History'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDownloadImage}
              >
                🖼️ Image (.png)
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDownloadPDF}
              >
                📄 PDF (.pdf)
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setQuantities({})}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="page-footer page-container">
        <p>© {new Date().getFullYear()} VF Smart List. Fresh Vegetables & Fruits.</p>
        <Link to="/admin" className="admin-footer-link">🔐 Admin Portal</Link>
      </footer>

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

