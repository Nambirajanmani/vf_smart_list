/**
 * generateVoiceData.js — Synthetic Multi-Lingual Text Dataset Generator
 * for Transformer-based Voice Command Identification
 * 
 * Generates 1,000+ realistic training/evaluation samples across English,
 * Tamil, and Tanglish with annotated product slots, quantities, and units.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS = [
  { id: 1,  en: 'Tomato',       ta: 'தக்காளி',       tanglish: 'Thakkali',      synonyms: ['tomato', 'thakkali', 'dhakkali', 'tamatar'] },
  { id: 2,  en: 'Potato',       ta: 'உருளைக்கிழங்கு',  tanglish: 'Urulaikizhangu', synonyms: ['potato', 'urulai', 'urulaikilangu', 'aloo', 'alu'] },
  { id: 3,  en: 'Onion',        ta: 'வெங்காயம்',      tanglish: 'Vengayam',      synonyms: ['onion', 'vengayam', 'pyaz', 'kanda'] },
  { id: 4,  en: 'Garlic',       ta: 'பூண்டு',          tanglish: 'Poondu',        synonyms: ['garlic', 'poondu', 'lahsun', 'lasun'] },
  { id: 5,  en: 'Ginger',       ta: 'இஞ்சி',          tanglish: 'Inji',          synonyms: ['ginger', 'inji', 'adrak'] },
  { id: 6,  en: 'Carrot',       ta: 'கேரட்',          tanglish: 'Carrot',        synonyms: ['carrot', 'carrots', 'gajar'] },
  { id: 7,  en: 'Cabbage',      ta: 'முட்டைக்கோஸ்',   tanglish: 'Muttaikose',    synonyms: ['cabbage', 'muttaikose', 'patta gobi'] },
  { id: 8,  en: 'Cauliflower',  ta: 'காலிஃபிளவர்',   tanglish: 'Cauliflower',   synonyms: ['cauliflower', 'gobi'] },
  { id: 10, en: 'Spinach',      ta: 'கீரை',           tanglish: 'Keerai',        synonyms: ['spinach', 'keerai', 'palak'] },
  { id: 13, en: 'Lady Finger',  ta: 'வெண்டைக்காய்',    tanglish: 'Vendakkai',     synonyms: ['lady finger', 'okra', 'vendakkai', 'bhindi'] },
  { id: 14, en: 'Brinjal',      ta: 'கத்திரிக்காய்',   tanglish: 'Kathirikkai',   synonyms: ['brinjal', 'eggplant', 'kathirikkai', 'baingan'] },
  { id: 48, en: 'Apple',        ta: 'ஆப்பிள்',        tanglish: 'Aappil',        synonyms: ['apple', 'apples', 'aappil', 'seb'] },
  { id: 49, en: 'Banana',       ta: 'வாழைப்பழம்',      tanglish: 'Vazhaipazham',  synonyms: ['banana', 'bananas', 'vazhaipazham', 'kela'] },
  { id: 50, en: 'Mango',        ta: 'மாம்பழம்',        tanglish: 'Maambazham',    synonyms: ['mango', 'mangoes', 'mambazham', 'aam'] },
  { id: 51, en: 'Grapes',       ta: 'திராட்சை',       tanglish: 'Dhraakshai',    synonyms: ['grapes', 'dhrakshai', 'thiratchai', 'angoor'] },
  { id: 130, en: 'Milk',        ta: 'பால்',           tanglish: 'Paal',          synonyms: ['milk', 'paal', 'doodh'] },
  { id: 131, en: 'Curd',        ta: 'தயிர்',           tanglish: 'Thayir',        synonyms: ['curd', 'thayir', 'yogurt', 'dahi'] },
  { id: 132, en: 'Butter',      ta: 'வெண்ணெய்',       tanglish: 'Vennai',        synonyms: ['butter', 'vennai', 'makhan'] },
  { id: 133, en: 'Ghee',        ta: 'நெய்',           tanglish: 'Nei',           synonyms: ['ghee', 'nei'] },
  { id: 140, en: 'Almonds',     ta: 'பாதாம்',          tanglish: 'Badam',         synonyms: ['almonds', 'almond', 'badam'] },
  { id: 141, en: 'Cashew',      ta: 'முந்திரி',        tanglish: 'Mundhiri',      synonyms: ['cashew', 'cashews', 'mundhiri', 'kaju'] },
  { id: 105, en: 'Basmati Rice', ta: 'பாசுமதி அரிசி',  tanglish: 'Basmati Arisi', synonyms: ['basmati rice', 'basmati', 'arisi'] },
  { id: 115, en: 'Toor Dal',    ta: 'துவரம் பருப்பு',  tanglish: 'Thuvaram Paruppu', synonyms: ['toor dal', 'thuvaram paruppu'] }
];

const QUANTITIES_EN = [
  { phrase: '1 kg', qty: 1.0, unit: 'kg' },
  { phrase: '2 kg', qty: 2.0, unit: 'kg' },
  { phrase: 'half kg', qty: 0.5, unit: 'kg' },
  { phrase: '500 grams', qty: 0.5, unit: 'kg' },
  { phrase: '250 grams', qty: 0.25, unit: 'kg' },
  { phrase: 'quarter kg', qty: 0.25, unit: 'kg' },
  { phrase: '1 liter', qty: 1.0, unit: 'liter' },
  { phrase: '2 liters', qty: 2.0, unit: 'liter' }
];

const QUANTITIES_TANGLISH = [
  { phrase: 'oru kilo', qty: 1.0, unit: 'kg' },
  { phrase: 'rendu kilo', qty: 2.0, unit: 'kg' },
  { phrase: 'ara kilo', qty: 0.5, unit: 'kg' },
  { phrase: 'kaal kilo', qty: 0.25, unit: 'kg' },
  { phrase: '500 gram', qty: 0.5, unit: 'kg' },
  { phrase: '250 gram', qty: 0.25, unit: 'kg' },
  { phrase: 'oru liter', qty: 1.0, unit: 'liter' }
];

const QUANTITIES_TA = [
  { phrase: 'ஒரு கிலோ', qty: 1.0, unit: 'kg' },
  { phrase: 'இரண்டு கிலோ', qty: 2.0, unit: 'kg' },
  { phrase: 'அரை கிலோ', qty: 0.5, unit: 'kg' },
  { phrase: 'கால் கிலோ', qty: 0.25, unit: 'kg' },
  { phrase: 'ஒரு லிட்டர்', qty: 1.0, unit: 'liter' }
];

const TEMPLATES_EN = [
  (q, p) => `Add ${q} ${p}`,
  (q, p) => `Please put ${q} of ${p} in my list`,
  (q, p) => `I want ${q} ${p}`,
  (q, p) => `Can you add ${q} fresh ${p}`,
  (q, p) => `Buy ${q} of ${p}`,
  (q, p) => `${p} ${q}`
];

const TEMPLATES_TANGLISH = [
  (q, p) => `${q} ${p} podunga`,
  (q, p) => `${p} ${q} venum`,
  (q, p) => `enakku ${q} ${p} serunga`,
  (q, p) => `add ${q} ${p} da`,
  (q, p) => `${q} ${p}`
];

const TEMPLATES_TA = [
  (q, p) => `${q} ${p} சேர்`,
  (q, p) => `${p} ${q} வேண்டும்`,
  (q, p) => `பட்டியலில் ${q} ${p} சேர்க்கவும்`,
  (q, p) => `${q} ${p}`
];

function generateDataset(targetCount = 1200) {
  const samples = [];
  let id = 1;

  // 1. English variations
  for (const prod of PRODUCTS) {
    for (const syn of prod.synonyms) {
      for (const q of QUANTITIES_EN) {
        for (const tmpl of TEMPLATES_EN) {
          samples.push({
            id: id++,
            utterance: tmpl(q.phrase, syn),
            lang: 'en',
            intent: 'ADD_OR_UPDATE',
            slots: {
              product_text: syn,
              canonical_product: prod.en,
              catalog_id: prod.id,
              qty: q.qty,
              unit: q.unit
            }
          });
        }
      }
    }
  }

  // 2. Tanglish variations
  for (const prod of PRODUCTS) {
    const terms = [prod.tanglish, ...prod.synonyms];
    for (const term of terms) {
      for (const q of QUANTITIES_TANGLISH) {
        for (const tmpl of TEMPLATES_TANGLISH) {
          samples.push({
            id: id++,
            utterance: tmpl(q.phrase, term),
            lang: 'tanglish',
            intent: 'ADD_OR_UPDATE',
            slots: {
              product_text: term,
              canonical_product: prod.en,
              catalog_id: prod.id,
              qty: q.qty,
              unit: q.unit
            }
          });
        }
      }
    }
  }

  // 3. Tamil Script variations
  for (const prod of PRODUCTS) {
    for (const q of QUANTITIES_TA) {
      for (const tmpl of TEMPLATES_TA) {
        samples.push({
          id: id++,
          utterance: tmpl(q.phrase, prod.ta),
          lang: 'ta',
          intent: 'ADD_OR_UPDATE',
          slots: {
            product_text: prod.ta,
            canonical_product: prod.en,
            catalog_id: prod.id,
            qty: q.qty,
            unit: q.unit
          }
        });
      }
    }
  }

  // Shuffle dataset
  for (let i = samples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [samples[i], samples[j]] = [samples[j], samples[i]];
  }

  const selectedSamples = samples.slice(0, targetCount).map((s, idx) => ({ ...s, id: idx + 1 }));

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const jsonPath = path.join(dataDir, 'voice_training_dataset.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    metadata: {
      generated_at: new Date().toISOString(),
      sample_count: selectedSamples.length,
      languages: ['en', 'tanglish', 'ta']
    },
    samples: selectedSamples
  }, null, 2), 'utf-8');

  console.log(`✅ Generated ${selectedSamples.length} training samples at ${jsonPath}`);
}

if (require.main === module) {
  generateDataset(1200);
}

module.exports = { generateDataset };
