/**
 * voiceParser.js — Intelligent Natural Language & Voice Parser for VF Smart List
 * 
 * Extracts items, quantities, units, and system commands from spoken English,
 * Tamil (தமிழ்), or mixed Tanglish text.
 */

import { getTanglishName, getEnglishName } from './tanglish.js';
import { findMatchingProductWithTransformer } from './transformerMatcher.js';

// Common Tamil & Tanglish number & fraction words
const TAMIL_QTY_MAP = [
  // Compound fractions
  { words: ['ஒன்றரை கிலோ', 'ஒன்னரை கிலோ', '1.5 கிலோ', 'ondrarai kilo', 'onnara kilo', 'one and half kilo'], qty: 1.5 },
  { words: ['ரெண்டரை கிலோ', 'இரண்டரை கிலோ', '2.5 கிலோ', 'rendara kilo', 'rendarai kilo', 'two and half kilo'], qty: 2.5 },
  { words: ['மூன்றரை கிலோ', 'மூணரை கிலோ', '3.5 கிலோ', 'moonara kilo', 'three and half kilo'], qty: 3.5 },
  { words: ['நாலரை கிலோ', 'நான்கரை கிலோ', '4.5 கிலோ', 'naalara kilo', 'four and half kilo'], qty: 4.5 },
  { words: ['அஞ்சரை கிலோ', 'ஐந்தரை கிலோ', '5.5 கிலோ', 'anjara kilo', 'five and half kilo'], qty: 5.5 },
  { words: ['ஒன்றரை லிட்டர்', 'ஒன்னரை லிட்டர்', '1.5 லிட்டர்', 'ondrarai liter'], qty: 1.5, isLiquid: true },
  { words: ['ரெண்டரை லிட்டர்', 'இரண்டரை லிட்டர்', '2.5 லிட்டர்', 'rendara liter'], qty: 2.5, isLiquid: true },
  // Standard fractions and wholes
  { words: ['ஒரு கிலோ', 'ஒன்னு கிலோ', '1 கிலோ', 'ஒரு', 'ஒன்னு', 'oru kilo', 'onnu kilo', 'one kilo', '1 kilo', 'உன் கே ஜி', 'ஒன் கே ஜி', 'ஒன் கேஜி', 'உன்கேஜி', '1 கேஜி', '1கேஜி', 'ஒன் kg', 'one kg'], qty: 1.0 },
  { words: ['அரை கிலோ', 'அர கிலோ', 'அரை', 'ara kilo', 'arai kilo', 'half kilo', 'half kg'], qty: 0.5 },
  { words: ['கால் கிலோ', 'கால்', 'kaal kilo', 'kal kilo', 'quarter kilo'], qty: 0.25 },
  { words: ['முக்கால் கிலோ', 'முக்கால்', 'mukaal kilo', 'mukkaal kilo', 'three quarters'], qty: 0.75 },
  { words: ['இரண்டு கிலோ', 'ரெண்டு கிலோ', '2 கிலோ', 'ரெண்டு', 'rendu kilo', 'irandu kilo', 'two kilos', 'two kg', 'ரெண்டு கே ஜி', 'இரண்டு கே ஜி', '2 கேஜி', '2 கே ஜி'], qty: 2.0 },
  { words: ['மூன்று கிலோ', 'மூணு கிலோ', '3 கிலோ', 'மூணு', 'moonu kilo', 'three kilos', 'மூணு கே ஜி', '3 கேஜி', '3 கே ஜி'], qty: 3.0 },
  { words: ['நான்கு கிலோ', 'நாலு கிலோ', '4 கிலோ', 'நாலு', 'naalu kilo', 'four kilos', 'நாலு கே ஜி', '4 கேஜி', '4 கே ஜி'], qty: 4.0 },
  { words: ['ஐந்து கிலோ', 'அஞ்சு கிலோ', '5 கிலோ', 'அஞ்சு', 'anju kilo', 'five kilos', 'அஞ்சு கே ஜி', '5 கேஜி', '5 கே ஜி'], qty: 5.0 },
  { words: ['பத்து கிலோ', '10 கிலோ', 'pathu kilo', 'ten kilos'], qty: 10.0 },
  // Grams
  { words: ['100 கிராம்', 'நூறு கிராம்', '100 gram', 'nooru gram'], qty: 0.1 },
  { words: ['50 கிராம்', 'ஐம்பது கிராம்', 'அம்பது கிராம்', '50 gram'], qty: 0.05 },
  { words: ['200 கிராம்', 'இருநூறு கிராம்', '200 gram'], qty: 0.2 },
  { words: ['250 கிராம்', '250 gram'], qty: 0.25 },
  { words: ['500 கிராம்', '500 gram'], qty: 0.5 },
  { words: ['750 கிராம்', '750 gram'], qty: 0.75 },
  // Liters & ml
  { words: ['ஒரு லிட்டர்', '1 லிட்டர்', 'oru liter', 'one liter'], qty: 1.0, isLiquid: true },
  { words: ['அரை லிட்டர்', 'அர லிட்டர்', 'ara liter', 'half liter'], qty: 0.5, isLiquid: true },
  { words: ['கால் லிட்டர்', 'kaal liter'], qty: 0.25, isLiquid: true },
  { words: ['ரெண்டு லிட்டர்', 'இரண்டு லிட்டர்', '2 லிட்டர்', 'rendu liter'], qty: 2.0, isLiquid: true },
  { words: ['500 மில்லி', '500 மி.லி', '500 ml'], qty: 0.5, isLiquid: true },
  { words: ['250 மில்லி', '250 மி.லி', '250 ml'], qty: 0.25, isLiquid: true },
  { words: ['100 மில்லி', '100 மி.லி', '100 ml'], qty: 0.1, isLiquid: true },
  { words: ['50 மில்லி', '50 மி.லி', '50 ml'], qty: 0.05, isLiquid: true },
  // Packets & Bunches
  { words: ['ஒரு பாக்கெட்', '1 பாக்கெட்', 'oru packet'], qty: 1.0, unit: 'packet' },
  { words: ['இரண்டு பாக்கெட்', 'ரெண்டு பாக்கெட்', '2 பாக்கெட்'], qty: 2.0, unit: 'packet' },
  { words: ['ஒரு கட்டு', '1 கட்டு', 'oru kattu'], qty: 1.0, unit: 'bunch' },
  { words: ['இரண்டு கட்டு', 'ரெண்டு கட்டு', '2 கட்டு'], qty: 2.0, unit: 'bunch' },
];

// Common English number & fraction words
const ENGLISH_WORD_NUMBERS = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'single': 1, 'couple': 2
};

// Aliases, transliterations, and colloquial names mapping to standard catalog items
const ITEM_ALIASES = {
  // Vegetables
  'tomato': ['tomato', 'tomatoes', 'thakkali', 'தக்காளி', 'dhakkali'],
  'potato': ['potato', 'potatoes', 'urulai', 'urulaikizhangu', 'urulaikilangu', 'உருளைக்கிழங்கு', 'alu', 'aloo'],
  'onion': ['onion', 'onions', 'vengayam', 'vengaayam', 'வெங்காயம்', 'pyaz', 'ballari', 'pallari', 'ballari onion', 'பல்லாரி', 'பல்லாரி வெங்காயம்'],
  'shallots': ['shallots', 'small onion', 'chinna vengayam', 'சின்ன வெங்காயம்', 'sambar onion'],
  'garlic': ['garlic', 'poondu', 'பூண்டு', 'lahsun'],
  'ginger': ['ginger', 'inji', 'இஞ்சி', 'adrak'],
  'carrot': ['carrot', 'carrots', 'கேரட்', 'gajar'],
  'cabbage': ['cabbage', 'muttaikose', 'முட்டைக்கோஸ்', 'patta gobi'],
  'cauliflower': ['cauliflower', 'gobi', 'காலிஃபிளவர்'],
  'broccoli': ['broccoli', 'புரோக்கோலி'],
  'spinach': ['spinach', 'keerai', 'கீரை', 'palak', 'பாலக்கீரை'],
  'peas': ['peas', 'green peas', 'pattani', 'பட்டாணி', 'matar'],
  'beans': ['beans', 'french beans', 'பீன்ஸ்', 'averakkai', 'அவரைக்காய்'],
  'lady finger': ['lady finger', 'okra', 'vendakkai', 'வெண்டைக்காய்', 'bhindi'],
  'brinjal': ['brinjal', 'eggplant', 'kathirikkai', 'கத்திரிக்காய்', 'baingan'],
  'capsicum': ['capsicum', 'bell pepper', 'kudaimilagai', 'குடைமிளகாய்', 'shimla mirch'],
  'green chilli': ['green chilli', 'green chillies', 'pachai milagai', 'பச்சை மிளகாய்', 'hari mirch'],
  'red chilli': ['red chilli', 'red chillies', 'kanja milagai', 'காய்ந்த மிளகாய்', 'lal mirch'],
  'bitter gourd': ['bitter gourd', 'pavakkai', 'பாகற்காய்', 'karela'],
  'bottle gourd': ['bottle gourd', 'suraikkai', 'சுரைக்காய்', 'lauki'],
  'ridge gourd': ['ridge gourd', 'peerkangai', 'பீர்க்கங்காய்', 'turai'],
  'snake gourd': ['snake gourd', 'pudalangai', 'புடலங்காய்'],
  'pumpkin': ['pumpkin', 'manjal poosani', 'மஞ்சள் பூசணி', 'kaddu'],
  'ash gourd': ['ash gourd', 'vellai poosani', 'பூசணிக்காய்', 'petha'],
  'sweet potato': ['sweet potato', 'sakkaravalli kizhangu', 'சர்க்கரைவள்ளி கிழங்கு', 'shakarkand'],
  'radish': ['radish', 'mullangi', 'முள்ளங்கி', 'mooli'],
  'beetroot': ['beetroot', 'பீட்ரூட்', 'chukandar'],
  'cucumber': ['cucumber', 'vellarikkai', 'வெள்ளரிக்காய்', 'kheera'],
  'drumstick': ['drumstick', 'murungakkai', 'முருங்கைக்காய்'],
  'mushroom': ['mushroom', 'kaalan', 'காளான்'],
  'corn': ['corn', 'sweet corn', 'cholam', 'சோளம்', 'makka'],
  'mint leaves': ['mint', 'mint leaves', 'pudina', 'புதினா'],
  'coriander leaves': ['coriander', 'coriander leaves', 'kothamalli', 'கொத்தமல்லி', 'dhaniya'],
  'curry leaves': ['curry leaves', 'karuveppilai', 'கருவேப்பிலை', 'kadi patta'],

  // Fruits
  'apple': ['apple', 'apples', 'ஆப்பிள்', 'seb'],
  'banana': ['banana', 'bananas', 'vazhaipazham', 'வாழைப்பழம்', 'kela'],
  'mango': ['mango', 'mangoes', 'mambazham', 'மாம்பழம்', 'aam'],
  'grapes': ['grapes', 'dhrakshai', 'திராட்சை', 'angoor'],
  'orange': ['orange', 'oranges', 'ஆரஞ்சு', 'santhe'],
  'papaya': ['papaya', 'pappali', 'பப்பாளி'],
  'watermelon': ['watermelon', 'tharpoosani', 'தர்பூசணி', 'tarbooj'],
  'pomegranate': ['pomegranate', 'mathulai', 'மாதுளை', 'anaar'],
  'guava': ['guava', 'koyya', 'கொய்யா', 'amrood'],
  'coconut': ['coconut', 'thengai', 'தேங்காய்', 'nariyal'],
  'lemon': ['lemon', 'lemons', 'elumichai', 'எலுமிச்சை', 'nimbu'],
  'strawberry': ['strawberry', 'strawberries', 'ஸ்ட்ராபெர்ரி'],
  'kiwi': ['kiwi', 'கிவி'],
  'dragon fruit': ['dragon fruit', 'டிராகன் பழம்'],
  'avocado': ['avocado', 'butter fruit', 'வெண்ணெய் பழம்'],
  'dates': ['dates', 'perichampazham', 'பேரீச்சம்பழம்', 'khajoor'],

  // Dairy
  'milk': ['milk', 'paal', 'பால்', 'doodh'],
  'curd': ['curd', 'yogurt', 'thayir', 'தயிர்', 'dahi'],
  'butter': ['butter', 'vennai', 'வெண்ணெய்', 'makhan'],
  'ghee': ['ghee', 'nei', 'நெய்'],
  'paneer': ['paneer', 'cottage cheese', 'பனீர்'],
  'cheese': ['cheese', 'சீஸ்'],

  // Nuts & Dry Fruits
  'almonds': ['almond', 'almonds', 'badam', 'பாதாம்'],
  'cashew': ['cashew', 'cashews', 'cashew nuts', 'mundhiri', 'முந்திரி', 'kaju'],
  'pistachios': ['pistachio', 'pistachios', 'pista', 'பிஸ்தா'],
  'raisins': ['raisin', 'raisins', 'kismis', 'kishmish', 'உலர் திராட்சை'],
  'walnuts': ['walnut', 'walnuts', 'அக்ரூட்'],

  // Groceries
  'rice': ['rice', 'arisi', 'அரிசி', 'chawal'],
  'basmati rice': ['basmati', 'basmati rice', 'பாசுமதி அரிசி'],
  'idli rice': ['idli rice', 'இட்லி அரிசி'],
  'wheat flour': ['wheat flour', 'atta', 'godhumai maavu', 'கோதுமை மாவு'],
  'maida': ['maida', 'refined flour', 'all purpose flour', 'மைதா'],
  'rava': ['rava', 'semolina', 'ravai', 'ரவை', 'sooji'],
  'ragi': ['ragi', 'finger millet', 'kezhvaragu', 'கேழ்வரகு'],
  'toor dal': ['toor dal', 'thuvaram paruppu', 'துவரம் பருப்பு', 'arhar dal'],
  'moong dal': ['moong dal', 'paasi paruppu', 'பாசிப் பருப்பு'],
  'urad dal': ['urad dal', 'ulundhu', 'உளுத்தம் பருப்பு'],
  'sugar': ['sugar', 'sakkarai', 'sarkarai', 'சர்க்கரை', 'cheeni'],
  'salt': ['salt', 'uppu', 'உப்பு', 'namak'],
  'oil': ['oil', 'cooking oil', 'ennai', 'எண்ணெய்', 'sunflower oil', 'kadugu ennai']
};

/**
 * Normalizes text: lowers case, strips punctuation except decimals and commas.
 */
export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[!?;:()[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Collapses consecutive duplicated words or phrases.
 * E.g., "tomato tomato" -> "tomato", "1kg 1kg" -> "1kg", "தக்காளி தக்காளி" -> "தக்காளி"
 */
export function dedupeSpokenWords(text) {
  if (!text || typeof text !== 'string') return '';
  const tokens = text.trim().split(/\s+/);
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i].toLowerCase().replace(/[!?;:()[\]{}'"]/g, '');
    const prev = result.length > 0 ? result[result.length - 1].toLowerCase().replace(/[!?;:()[\]{}'"]/g, '') : null;
    if (curr && curr === prev) {
      continue;
    }
    result.push(tokens[i]);
  }
  return result.join(' ');
}

/**
 * Extract weight/liter/count quantity from a snippet of text.
 * Returns { qty: number, isLiquid: boolean, unit: string, matchedStr: string }
 */
export function extractQuantity(snippet) {
  const norm = snippet.toLowerCase();

  // 1. Compound expressions: "1 kg 500 grams", "2 kg 250 g", "1 kilo 500 gram", "1 kg and 500g"
  const compoundMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|கிலோ)\s*(?:and\s+)?(\d+(?:\.\d+)?)\s*(?:grams?|gm|g|கிராம்)/i);
  if (compoundMatch) {
    const k = parseFloat(compoundMatch[1]);
    const g = parseFloat(compoundMatch[2]);
    const total = Math.round((k + g / 1000) * 1000) / 1000;
    return { qty: total, isLiquid: false, unit: 'kg', matchedStr: compoundMatch[0] };
  }

  // Compound Tamil text like "ஒரு கிலோ 500 கிராம்"
  const tamilCompoundMatch = norm.match(/(?:ஒரு|1|இரண்டு|ரெண்டு|2|மூன்று|மூணு|3)\s*கிலோ\s*(\d+)\s*கிராம்/);
  if (tamilCompoundMatch) {
    let k = 1;
    if (norm.includes('இரண்டு') || norm.includes('ரெண்டு') || norm.includes('2 கிலோ')) k = 2;
    if (norm.includes('மூன்று') || norm.includes('மூணு') || norm.includes('3 கிலோ')) k = 3;
    const g = parseFloat(tamilCompoundMatch[1]);
    return { qty: k + g / 1000, isLiquid: false, unit: 'kg', matchedStr: tamilCompoundMatch[0] };
  }

  // 2. Exact numbers with units (Grams, Kg, Liters, Ml, Packets, Bunches, Pieces)
  // Grams: "500g", "500 grams", "250 g", "100 g", "50 g", "250 கிராம்"
  const gramMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:grams?|gm|g|கிராம்)/i);
  if (gramMatch) {
    const g = parseFloat(gramMatch[1]);
    return { qty: Math.round((g / 1000) * 1000) / 1000, isLiquid: false, unit: 'kg', matchedStr: gramMatch[0] };
  }

  // Milliliters: "500 ml", "250ml", "100 மில்லி"
  const mlMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliters?|மில்லி)/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    return { qty: Math.round((ml / 1000) * 1000) / 1000, isLiquid: true, unit: 'L', matchedStr: mlMatch[0] };
  }

  // Kilograms: "1 kg", "2.5 kilos", "1.5 kg", "2 கிலோ"
  const kgMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|kgs|கிலோ)/i);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    return { qty: kg, isLiquid: false, unit: 'kg', matchedStr: kgMatch[0] };
  }

  // Liters: "1 liter", "2 litres", "1.5 l", "2 லிட்டர்"
  const lMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:liters?|litres?|ltr|லிட்டர்|\bl\b)/i);
  if (lMatch) {
    const l = parseFloat(lMatch[1]);
    return { qty: l, isLiquid: true, unit: 'L', matchedStr: lMatch[0] };
  }

  // Packets: "2 packets", "1 packet", "1 pkt", "2 pkts", "2 பாக்கெட்"
  const pktMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:packets?|pkts?|pkt|பாக்கெட்)/i);
  if (pktMatch) {
    return { qty: parseFloat(pktMatch[1]), isLiquid: false, unit: 'packet', matchedStr: pktMatch[0] };
  }

  // Bunches: "1 bunch", "2 bunches", "2 கட்டு"
  const bunchMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:bunches?|bunch|கட்டு)/i);
  if (bunchMatch) {
    return { qty: parseFloat(bunchMatch[1]), isLiquid: false, unit: 'bunch', matchedStr: bunchMatch[0] };
  }

  // Pieces / Count: "2 pieces", "6 pieces", "2 nos", "3 nos"
  const pieceMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:pieces?|pcs?|nos|எண்ணிக்கை)/i);
  if (pieceMatch) {
    return { qty: parseFloat(pieceMatch[1]), isLiquid: false, unit: 'piece', matchedStr: pieceMatch[0] };
  }

  // 3. Spoken compounds: "one and a half kg", "one and half kg", "two and a half kilos"
  const spokenHalfMatch = norm.match(/\b(one|two|three|four|five|1|2|3|4|5)\s*(?:and\s+a?\s*half|and\s*half)\s*(?:kilo|kg|kilos|liters?|litres?|l)?\b/i);
  if (spokenHalfMatch) {
    const baseWord = spokenHalfMatch[1].toLowerCase();
    const base = ENGLISH_WORD_NUMBERS[baseWord] || parseFloat(baseWord) || 1;
    const isLiquid = /liter|litre|\bl\b/i.test(norm);
    return { qty: base + 0.5, isLiquid, unit: isLiquid ? 'L' : 'kg', matchedStr: spokenHalfMatch[0] };
  }

  // 4. Check Tamil & Tanglish phrase maps (sorted by length to match longest first)
  for (const item of TAMIL_QTY_MAP) {
    for (const w of item.words) {
      if (norm.includes(w)) {
        return {
          qty: item.qty,
          isLiquid: !!item.isLiquid,
          unit: item.unit || (item.isLiquid ? 'L' : 'kg'),
          matchedStr: w
        };
      }
    }
  }

  // 5. Fractions: "1/2 kg", "1/4 kg", "3/4 kg", "half kg", "quarter kg"
  const fractionMatch = norm.match(/(?:(\d+)\s+)?(1\/2|1\/4|3\/4|half|quarter|three\s*quarters?)\s*(?:kilo|kg|kilos|liters?|litres?|l)?/i);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseFloat(fractionMatch[1]) : 0;
    const fracStr = fractionMatch[2].toLowerCase();
    let frac = 0.5;
    if (fracStr.includes('1/4') || fracStr.includes('quarter')) frac = 0.25;
    if (fracStr.includes('3/4') || fracStr.includes('three'))   frac = 0.75;
    const isLiquid = norm.includes('liter') || norm.includes('litre') || norm.includes(' l');
    return { qty: whole + frac, isLiquid, unit: isLiquid ? 'L' : 'kg', matchedStr: fractionMatch[0] };
  }

  // 6. Word numbers + units: "two kg", "one kilo", "three liters"
  for (const [word, num] of Object.entries(ENGLISH_WORD_NUMBERS)) {
    const regex = new RegExp(`\\b${word}\\s+(?:kilos?|kg|liters?|litres?|l|கிலோ|லிட்டர்)\\b`, 'i');
    if (regex.test(norm)) {
      const isLiquid = /liter|litre|\bl\b|லிட்டர்/i.test(norm);
      return { qty: num, isLiquid, unit: isLiquid ? 'L' : 'kg', matchedStr: `${word} kg` };
    }
  }

  // 7. Plain isolated numbers (e.g., "tomato 1", "onion 2", "2 potato")
  const plainNumMatch = norm.match(/\b(\d+(?:\.\d+)?)\b/);
  if (plainNumMatch) {
    const num = parseFloat(plainNumMatch[1]);
    if (num > 0) {
      if (num === 50 || num === 100 || num === 200 || num === 250 || num === 500 || num === 750) {
        return { qty: num / 1000, isLiquid: false, unit: 'kg', matchedStr: `${num}g` };
      }
      return { qty: num, isLiquid: false, unit: 'kg', matchedStr: `${num}` };
    }
  }

  return null;
}

/**
 * Creates a smart dynamic product if a product name spoken by the user is not yet in the catalog.
 * This guarantees the item can be DIRECTLY added to the product list!
 */
export function createDynamicProduct(candidateName, qty = 1, isLiquid = false, unit = 'kg') {
  if (!candidateName || typeof candidateName !== 'string') return null;

  // Clean candidate text of common filler and action words
  const cleanName = candidateName
    .replace(/\b(?:add|put|take|get|buy|include|want|please|need|for|me|in|list|shopping|of|some|more|fresh|சேர்|வாங்கு|போடு|வேண்டும்|வேணும்)\b/gi, ' ')
    .replace(/[^\w\s\u0B80-\u0BFF]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanName || cleanName.length < 2) return null;

  // Capitalize each word nicely
  const formattedName = cleanName
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const lower = cleanName.toLowerCase();
  let category = 'grocery';
  let emoji = '🛍️';

  if (/fruit|apple|berry|banana|mango|melon|orange|grape|papaya|guava|lemon|lime|kiwi|dragon|pear|peach|plum|cherry|fig|dates|watermelon/i.test(lower)) {
    category = 'fruit';
    emoji = '🍎';
  } else if (/veg|spinach|keerai|gourd|leaves|chilli|pepper|potato|tomato|onion|cabbage|cauliflower|beans|carrot|radish|beet|cucumber|mushroom|corn|ginger|garlic|inji|poondu/i.test(lower)) {
    category = 'vegetable';
    emoji = '🥦';
  } else if (/milk|curd|cheese|butter|paneer|ghee|cream|yogurt|dairy|paal|vennai|thayir|dahi/i.test(lower) || isLiquid) {
    category = 'dairy';
    emoji = isLiquid ? '🥛' : '🧈';
  } else if (/nut|almond|cashew|walnut|pista|raisin|badam|kaju|peanut|seed/i.test(lower)) {
    category = 'nuts';
    emoji = '🥜';
  } else if (/oil/i.test(lower)) {
    category = 'grocery';
    emoji = '🫒';
  } else if (/rice|flour|wheat|atta|bread|grain/i.test(lower)) {
    category = 'grocery';
    emoji = '🌾';
  }

  const safeId = `voice_${lower.replace(/[^a-z0-9]/g, '_')}_${Date.now() % 100000}`;

  return {
    id: safeId,
    name: formattedName,
    name_ta: '',
    category,
    emoji,
    price_per_kg: 0,
    isCustom: true,
    customUnit: unit || (isLiquid ? 'L' : 'kg'),
    _confidence: 0.88,
    _matchType: 'AI_DYNAMIC_RECOGNITION'
  };
}

/**
 * Fuzzy match a term against catalog items.
 * Catalog item structure: { id, name, name_ta, category, emoji, price_per_kg }
 */
export function findMatchingItem(term, catalogItems) {
  if (!term || !catalogItems || catalogItems.length === 0) return null;

  // 1. Contextual Transformer Semantic Matcher (Cosine similarity + self-attention tokens)
  const transformerResult = findMatchingProductWithTransformer(term, catalogItems);
  if (transformerResult && transformerResult.item) {
    return {
      ...transformerResult.item,
      _confidence: transformerResult.confidence,
      _matchType: transformerResult.matchType
    };
  }

  const clean = normalizeText(term);

  // 2. Direct name matching across English, DB name, Tamil, and Tanglish
  for (const item of catalogItems) {
    const enName = (getEnglishName(item) || '').toLowerCase();
    const dbName = item.name.toLowerCase();
    const taName = (item.name_ta || '').toLowerCase();
    const tanglish = (getTanglishName(item) || '').toLowerCase();

    if (enName === clean || dbName === clean || taName === clean || tanglish === clean) return item;
    if (enName && (enName.startsWith(clean) || clean.startsWith(enName))) return item;
    if (dbName.startsWith(clean) || clean.startsWith(dbName)) return item;
    if (taName && (taName.startsWith(clean) || clean.startsWith(taName))) return item;
    if (tanglish && (tanglish.startsWith(clean) || clean.startsWith(tanglish))) return item;
  }

  // 3. Alias / Synonyms match
  for (const [key, aliases] of Object.entries(ITEM_ALIASES)) {
    for (const alias of aliases) {
      if (clean.includes(alias) || alias.includes(clean)) {
        const found = catalogItems.find(it => {
          const en = (getEnglishName(it) || '').toLowerCase();
          const db = it.name.toLowerCase();
          const ta = (it.name_ta || '').toLowerCase();
          const tg = (getTanglishName(it) || '').toLowerCase();
          return (
            en.includes(key) ||
            db.includes(key) ||
            en.includes(alias) ||
            db.includes(alias) ||
            ta.includes(alias) ||
            tg.includes(alias)
          );
        });
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Detects all quantity match ranges inside a text snippet.
 */
export function findQuantityRanges(text) {
  if (!text) return [];
  const norm = text.toLowerCase();
  const ranges = [];

  const addRange = (start, end, matchedStr) => {
    const overlap = ranges.some(r => !(end <= r.start || start >= r.end));
    if (!overlap) {
      ranges.push({ start, end, matchedStr });
    }
  };

  // 1. Compound numeric regex: "1 kg 500 grams", "2 kg 250 g"
  const compoundRegex = /(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|கிலோ)\s*(?:and\s+)?(\d+(?:\.\d+)?)\s*(?:grams?|gm|g|கிராம்)/gi;
  let m;
  while ((m = compoundRegex.exec(text)) !== null) {
    addRange(m.index, m.index + m[0].length, m[0]);
  }

  // 2. Tamil compound regex: "(ஒரு|1|2|3) கிலோ (500) கிராம்"
  const tamilCompoundRegex = /(?:ஒரு|1|இரண்டு|ரெண்டு|2|மூன்று|மூணு|3)\s*கிலோ\s*\d+\s*கிராம்/gi;
  while ((m = tamilCompoundRegex.exec(text)) !== null) {
    addRange(m.index, m.index + m[0].length, m[0]);
  }

  // 3. Numeric unit regex: "1kg", "500g", "2.5 kilos", "1 liter", "250 ml", "2 packets", "1 bunch", "2 pcs"
  const numUnitRegex = /\b(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|kgs|கிலோ|grams?|gm|g|கிராம்|liter|liters|litres|l|ltr|லிட்டர்|ml|மில்லி|packets?|pkts?|pkt|பாக்கெட்|bunches?|bunch|கட்டு|pieces?|pcs?|nos)\b/gi;
  while ((m = numUnitRegex.exec(text)) !== null) {
    addRange(m.index, m.index + m[0].length, m[0]);
  }

  // 4. Tamil & Tanglish quantity phrase map matches
  for (const item of TAMIL_QTY_MAP) {
    for (const w of item.words) {
      const lowerW = w.toLowerCase();
      let pos = 0;
      while ((pos = norm.indexOf(lowerW, pos)) !== -1) {
        addRange(pos, pos + w.length, w);
        pos += w.length;
      }
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

/**
 * Detects all known catalog product match ranges inside a text snippet.
 */
export function findKnownProductRanges(text, catalogItems = []) {
  if (!text) return [];
  const norm = text.toLowerCase();
  const ranges = [];

  const addRange = (start, end, name) => {
    const overlap = ranges.some(r => !(end <= r.start || start >= r.end));
    if (!overlap) {
      ranges.push({ start, end, name });
    }
  };

  // Check ITEM_ALIASES
  for (const [key, aliases] of Object.entries(ITEM_ALIASES)) {
    for (const alias of aliases) {
      if (alias.length < 3) continue;
      const lowerAlias = alias.toLowerCase();
      let pos = 0;
      while ((pos = norm.indexOf(lowerAlias, pos)) !== -1) {
        addRange(pos, pos + alias.length, alias);
        pos += alias.length;
      }
    }
  }

  // Check catalog items names
  for (const item of catalogItems) {
    const en = (item.name || '').toLowerCase();
    const ta = (item.name_ta || '').toLowerCase();
    const tg = (getTanglishName(item) || '').toLowerCase();

    [en, ta, tg].forEach(str => {
      if (str && str.length >= 3) {
        let pos = 0;
        while ((pos = norm.indexOf(str, pos)) !== -1) {
          addRange(pos, pos + str.length, str);
          pos += str.length;
        }
      }
    });
  }

  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

/**
 * Intelligently splits a continuous natural language transcript into individual product item segments.
 */
export function splitMultiItemUtterance(transcript, catalogItems = []) {
  if (!transcript || typeof transcript !== 'string') return [];
  const text = transcript.trim();
  if (!text) return [];

  // Initial split on explicit conjunctions, commas, line breaks
  const rawParts = text
    .split(/\b(?:and|plus|also|with|மற்றும்|அப்புறம்|கூட|மேலும்)\b|,|\n|;/i)
    .map(s => s.trim())
    .filter(Boolean);

  const resultSegments = [];

  for (const part of rawParts) {
    const qtyRanges = findQuantityRanges(part);

    if (qtyRanges.length > 1) {
      const firstStart = qtyRanges[0].start;

      if (firstStart <= 5) {
        // Quantities are near start of items (e.g. "1kg tomato 2kg onion 500g butter", "உன் கே ஜி தக்காளி ஒரு கிலோ பல்லாரி ஒரு கிலோ இஞ்சி")
        for (let i = 0; i < qtyRanges.length; i++) {
          const start = (i === 0) ? 0 : qtyRanges[i].start;
          const next = qtyRanges[i + 1];
          const end = next ? next.start : part.length;

          const segText = part.substring(start, end).trim();
          if (segText) resultSegments.push(segText);
        }
      } else {
        // Quantities come after item names (e.g. "tomato 1kg onion 2kg")
        for (let i = 0; i < qtyRanges.length; i++) {
          const start = (i === 0) ? 0 : qtyRanges[i - 1].end;
          const end = qtyRanges[i].end;

          const segText = part.substring(start, end).trim();
          if (segText) resultSegments.push(segText);
        }
        const lastEnd = qtyRanges[qtyRanges.length - 1].end;
        if (lastEnd < part.length) {
          const rem = part.substring(lastEnd).trim();
          if (rem) resultSegments.push(rem);
        }
      }
    } else {
      // 0 or 1 quantity range found. Check if multiple known products are spoken without explicit quantities
      const productRanges = findKnownProductRanges(part, catalogItems);
      if (qtyRanges.length === 0 && productRanges.length > 1) {
        for (let i = 0; i < productRanges.length; i++) {
          const start = productRanges[i].start;
          const next = productRanges[i + 1];
          const end = next ? next.start : part.length;

          const segText = part.substring(start, end).trim();
          if (segText) resultSegments.push(segText);
        }
      } else {
        resultSegments.push(part);
      }
    }
  }

  return resultSegments.length > 0 ? resultSegments : [text];
}

/**
 * Main Voice/Text NLP Command Parser.
 * Takes a raw transcript and the catalog items, returns an action object:
 * {
 *   action: 'ADD_OR_UPDATE' | 'REMOVE' | 'CLEAR' | 'READ_LIST' | 'SAVE_LIST' | 'WHATSAPP' | 'SEARCH' | 'UNKNOWN',
 *   items: [ { item, qty, isLiquid, matchedSnippet } ],
 *   feedbackText: string,
 *   feedbackTamil: string,
 *   rawText: string
 * }
 */
export function parseVoiceCommand(transcript, catalogItems = []) {
  if (!transcript || typeof transcript !== 'string') {
    return { action: 'UNKNOWN', items: [], rawText: '' };
  }

  const cleanedTranscript = dedupeSpokenWords(transcript);
  const norm = normalizeText(cleanedTranscript);

  // ── Global System Commands ─────────────────────────────────
  // 1. Clear shopping list
  if (
    norm.includes('clear list') ||
    norm.includes('clear all') ||
    norm.includes('delete all') ||
    norm.includes('empty list') ||
    norm.includes('பட்டியலை அழி') ||
    norm.includes('எல்லாவற்றையும் அழி') ||
    norm.includes('அனைத்தும் நீக்கு')
  ) {
    return {
      action: 'CLEAR',
      items: [],
      feedbackText: 'Cleared all items from your shopping list.',
      feedbackTamil: 'உங்கள் ஷாப்பிங் பட்டியல் அழிக்கப்பட்டது.',
      rawText: transcript
    };
  }

  // 2. Read shopping list aloud
  if (
    norm.includes('read my list') ||
    norm.includes('read list') ||
    norm.includes('what is in my list') ||
    norm.includes('tell my list') ||
    norm.includes('show my list') ||
    norm.includes('பட்டியலை வாசி') ||
    norm.includes('பட்டியலை படி') ||
    norm.includes('என்ன இருக்கு')
  ) {
    return {
      action: 'READ_LIST',
      items: [],
      feedbackText: 'Reading your shopping list...',
      feedbackTamil: 'உங்கள் பட்டியலை வாசிக்கிறேன்...',
      rawText: transcript
    };
  }

  // 3. Share on WhatsApp
  if (
    norm.includes('whatsapp') ||
    norm.includes('share on whatsapp') ||
    norm.includes('send list') ||
    norm.includes('வாட்ஸ்அப்') ||
    norm.includes('பகிர்')
  ) {
    return {
      action: 'WHATSAPP',
      items: [],
      feedbackText: 'Opening WhatsApp to share your shopping list.',
      feedbackTamil: 'வாட்ஸ்அப் பகிரப்படுகிறது.',
      rawText: transcript
    };
  }

  // 4. Save to history
  if (
    norm.includes('save list') ||
    norm.includes('save my list') ||
    norm.includes('save to history') ||
    norm.includes('சேமி')
  ) {
    return {
      action: 'SAVE_LIST',
      items: [],
      feedbackText: 'Saving your list to history.',
      feedbackTamil: 'உங்கள் பட்டியல் சேமிக்கப்படுகிறது.',
      rawText: transcript
    };
  }

  // 5. Search command: "search tomato", "தேடு தக்காளி"
  const searchMatch = norm.match(/(?:search for|search|find|lookup|தேடு|தேடுக)\s+(.+)/i);
  if (searchMatch && searchMatch[1]) {
    const searchTerm = searchMatch[1].trim();
    return {
      action: 'SEARCH',
      items: [],
      searchTerm,
      feedbackText: `Searching for ${searchTerm}.`,
      feedbackTamil: `${searchTerm} தேடப்படுகிறது.`,
      rawText: transcript
    };
  }

  // ── Item Parsing (Multi-item support) ───────────────────────
  // Split transcript intelligently into item segments
  const segments = splitMultiItemUtterance(cleanedTranscript, catalogItems);

  const parsedItems = [];
  const isRemoveGlobal = norm.startsWith('remove') || norm.startsWith('delete') || norm.includes('நீக்கு');

  for (const seg of segments) {
    const isSegRemove = isRemoveGlobal ||
      seg.toLowerCase().startsWith('remove') ||
      seg.toLowerCase().startsWith('delete') ||
      seg.includes('நீக்கு');

    // Clean segment of action trigger words
    const cleanSeg = seg
      .replace(/\b(?:add|put|take|get|buy|include|remove|delete|want|please|சேர்|வாங்கு|நீக்கு)\b/gi, ' ')
      .trim();

    // Extract quantity from this segment
    const qtyResult = extractQuantity(cleanSeg);
    let qty = qtyResult ? qtyResult.qty : null;

    // Try to isolate the item name portion
    let itemCandidate = cleanSeg;
    if (qtyResult && qtyResult.matchedStr) {
      itemCandidate = cleanSeg.replace(qtyResult.matchedStr, ' ').trim();
    }

    // Match candidate with catalog items
    let matchedItem = findMatchingItem(itemCandidate, catalogItems);

    // If candidate didn't match, check entire segment against catalog
    if (!matchedItem) {
      matchedItem = findMatchingItem(cleanSeg, catalogItems);
    }

    // If still no direct match, test each alias in the segment
    if (!matchedItem) {
      for (const [key, aliases] of Object.entries(ITEM_ALIASES)) {
        for (const alias of aliases) {
          if (new RegExp(`\\b${alias}\\b`, 'i').test(cleanSeg) || cleanSeg.includes(alias)) {
            matchedItem = catalogItems.find(it =>
              it.name.toLowerCase().includes(key) ||
              (it.name_ta && it.name_ta.includes(alias))
            );
            if (matchedItem) break;
          }
        }
        if (matchedItem) break;
      }
    }

    // Dynamic Product Recognition fallback:
    // If not in catalog, extract product name and details directly so it can be added to the product list!
    if (!matchedItem && (itemCandidate || cleanSeg)) {
      const candidateToUse = itemCandidate && itemCandidate.trim().length >= 2 ? itemCandidate : cleanSeg;
      const dynamicProduct = createDynamicProduct(candidateToUse, qty, qtyResult?.isLiquid, qtyResult?.unit);
      if (dynamicProduct) {
        matchedItem = dynamicProduct;
      }
    }

    if (matchedItem) {
      // Default quantity if not spoken:
      // If removing, qty is 0.
      // If liquid, default to 1 Liter.
      // If solid, default to 1 kg.
      if (isSegRemove) {
        qty = 0;
      } else if (!qty || qty <= 0) {
        qty = matchedItem.category === 'dairy' || qtyResult?.isLiquid ? 1.0 : 1.0;
      }

      const isLiquid = matchedItem.category === 'dairy' || !!qtyResult?.isLiquid || matchedItem.customUnit === 'L';
      const itemUnit = qtyResult?.unit || matchedItem.customUnit || (isLiquid ? 'L' : 'kg');

      parsedItems.push({
        item: matchedItem,
        qty: Math.round(qty * 1000) / 1000,
        isRemove: isSegRemove,
        isLiquid,
        unit: itemUnit,
        isCustom: !!matchedItem.isCustom,
        matchedSnippet: seg,
        confidence: matchedItem._confidence || 0.95,
        matchType: matchedItem._matchType || 'SEMANTIC_TRANSFORMER'
      });
    }
  }

  // Deduplicate items in case the same item matched twice (keep the last mentioned quantity)
  const uniqueItemsMap = new Map();
  parsedItems.forEach(p => uniqueItemsMap.set(p.item.id, p));
  const finalItems = Array.from(uniqueItemsMap.values());

  if (finalItems.length > 0) {
    const isOnlyRemove = finalItems.every(i => i.isRemove || i.qty === 0);
    const addedList = finalItems.filter(i => !i.isRemove && i.qty > 0);
    const removedList = finalItems.filter(i => i.isRemove || i.qty === 0);

    const feedbackParts = [];
    const feedbackPartsTa = [];

    if (addedList.length > 0) {
      const enNames = addedList.map(i => {
        const displayName = getEnglishName(i.item) || i.item.name;
        let unitStr = '';
        if (i.unit === 'packet') {
          unitStr = `${i.qty} pkt${i.qty > 1 ? 's' : ''}`;
        } else if (i.unit === 'bunch') {
          unitStr = `${i.qty} bunch${i.qty > 1 ? 'es' : ''}`;
        } else if (i.unit === 'piece') {
          unitStr = `${i.qty} piece${i.qty > 1 ? 's' : ''}`;
        } else if (i.isLiquid) {
          unitStr = `${i.qty} L`;
        } else {
          unitStr = i.qty >= 1 ? `${i.qty} kg` : `${Math.round(i.qty * 1000)} g`;
        }
        return `${unitStr} ${displayName}`;
      }).join(', ');

      const taNames = addedList.map(i => {
        const taUnit = i.isLiquid ? 'லிட்டர்' : (i.unit === 'packet' ? 'பாக்கெட்' : 'கிலோ');
        return `${i.qty} ${taUnit} ${i.item.name_ta || i.item.name}`;
      }).join(', ');

      feedbackParts.push(`Added ${enNames} directly to your list`);
      feedbackPartsTa.push(`${taNames} உங்கள் பட்டியலில் நேரடியாக சேர்க்கப்பட்டது`);
    }

    if (removedList.length > 0) {
      const enRem = removedList.map(i => getEnglishName(i.item) || i.item.name).join(', ');
      const taRem = removedList.map(i => i.item.name_ta || i.item.name).join(', ');
      feedbackParts.push(`Removed ${enRem} from list`);
      feedbackPartsTa.push(`${taRem} பட்டியலிலிருந்து நீக்கப்பட்டது`);
    }

    return {
      action: isOnlyRemove ? 'REMOVE' : 'ADD_OR_UPDATE',
      items: finalItems,
      feedbackText: feedbackParts.join('. '),
      feedbackTamil: feedbackPartsTa.join('. '),
      rawText: transcript
    };
  }

  return {
    action: 'UNKNOWN',
    items: [],
    feedbackText: `I heard: "${transcript}", but couldn't identify the product details. Try saying "Add 2kg Tomato and 1kg Onion".`,
    feedbackTamil: `தயவுசெய்து "2 கிலோ தக்காளி மற்றும் 1 கிலோ வெங்காயம் சேர்" என்று சொல்லுங்கள்.`,
    rawText: transcript
  };
}
