/**
 * voiceParser.js — Intelligent Natural Language & Voice Parser for VF Smart List
 * 
 * Extracts items, quantities, units, and system commands from spoken English,
 * Tamil (தமிழ்), or mixed Tanglish text.
 */

import { getTanglishName } from './tanglish.js';

// Common Tamil number & fraction words
const TAMIL_QTY_MAP = [
  { words: ['ஒரு கிலோ', 'ஒன்னு கிலோ', '1 கிலோ', 'ஒரு'], qty: 1.0 },
  { words: ['அரை கிலோ', 'அர கிலோ', 'அரை'], qty: 0.5 },
  { words: ['கால் கிலோ', 'கால்'], qty: 0.25 },
  { words: ['முக்கால் கிலோ', 'முக்கால்'], qty: 0.75 },
  { words: ['இரண்டு கிலோ', 'ரெண்டு கிலோ', '2 கிலோ', 'ரெண்டு'], qty: 2.0 },
  { words: ['மூன்று கிலோ', 'மூணு கிலோ', '3 கிலோ', 'மூணு'], qty: 3.0 },
  { words: ['நான்கு கிலோ', 'நாலு கிலோ', '4 கிலோ', 'நாலு'], qty: 4.0 },
  { words: ['ஐந்து கிலோ', 'அஞ்சு கிலோ', '5 கிலோ', 'அஞ்சு'], qty: 5.0 },
  { words: ['100 கிராம்', 'நூறு கிராம்'], qty: 0.1 },
  { words: ['50 கிராம்', 'ஐம்பது கிராம்', 'அம்பது கிராம்'], qty: 0.05 },
  { words: ['200 கிராம்', 'இருநூறு கிராம்'], qty: 0.2 },
  { words: ['250 கிராம்'], qty: 0.25 },
  { words: ['500 கிராம்'], qty: 0.5 },
  { words: ['750 கிராம்'], qty: 0.75 },
  { words: ['ஒரு லிட்டர்', '1 லிட்டர்'], qty: 1.0, isLiquid: true },
  { words: ['அரை லிட்டர்', 'அர லிட்டர்'], qty: 0.5, isLiquid: true },
  { words: ['கால் லிட்டர்'], qty: 0.25, isLiquid: true },
  { words: ['ரெண்டு லிட்டர்', 'இரண்டு லிட்டர்', '2 லிட்டர்'], qty: 2.0, isLiquid: true },
  { words: ['500 மில்லி', '500 மி.லி'], qty: 0.5, isLiquid: true },
  { words: ['250 மில்லி', '250 மி.லி'], qty: 0.25, isLiquid: true },
  { words: ['100 மில்லி', '100 மி.லி'], qty: 0.1, isLiquid: true },
  { words: ['50 மில்லி', '50 மி.லி'], qty: 0.05, isLiquid: true },
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
  'onion': ['onion', 'onions', 'vengayam', 'vengayam', 'வெங்காயம்', 'pyaz'],
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
 * Extract weight/liter quantity from a snippet of text.
 * Returns { qty: number, isLiquid: boolean, matchedStr: string }
 */
export function extractQuantity(snippet) {
  const norm = snippet.toLowerCase();

  // 1. Check Tamil phrase maps first
  for (const item of TAMIL_QTY_MAP) {
    for (const w of item.words) {
      if (norm.includes(w)) {
        return { qty: item.qty, isLiquid: !!item.isLiquid, matchedStr: w };
      }
    }
  }

  // 2. Patterns like "1.5 kg", "2.5 kilos", "500 grams", "250 g", "50g", "2 liters", "500 ml"
  // Fractions: "1/2 kg", "1/4 kg", "3/4 kg"
  const fractionMatch = norm.match(/(?:(\d+)\s+)?(1\/2|1\/4|3\/4|half|quarter|three\s*quarters?)\s*(?:kilo|kg|kilos|liters?|litres?|l)?/i);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseFloat(fractionMatch[1]) : 0;
    const fracStr = fractionMatch[2].toLowerCase();
    let frac = 0.5;
    if (fracStr.includes('1/4') || fracStr.includes('quarter')) frac = 0.25;
    if (fracStr.includes('3/4') || fracStr.includes('three'))   frac = 0.75;
    const isLiquid = norm.includes('liter') || norm.includes('litre') || norm.includes(' l');
    return { qty: whole + frac, isLiquid, matchedStr: fractionMatch[0] };
  }

  // 3. Decimal or integer with units: "500g", "500 grams", "100 g", "50 g", "250g"
  const gramMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:grams?|gm|g|கிராம்)/i);
  if (gramMatch) {
    const g = parseFloat(gramMatch[1]);
    return { qty: Math.round((g / 1000) * 1000) / 1000, isLiquid: false, matchedStr: gramMatch[0] };
  }

  // 4. Milliliters: "500 ml", "250ml"
  const mlMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliters?|மில்லி)/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    return { qty: Math.round((ml / 1000) * 1000) / 1000, isLiquid: true, matchedStr: mlMatch[0] };
  }

  // 5. Kilograms: "1 kg", "2.5 kilos", "1 kilo"
  const kgMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|kgs|கிலோ)/i);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    return { qty: kg, isLiquid: false, matchedStr: kgMatch[0] };
  }

  // 6. Liters: "1 liter", "2 litres", "1.5 l"
  const lMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:liters?|litres?|ltr|லிட்டர்|\bl\b)/i);
  if (lMatch) {
    const l = parseFloat(lMatch[1]);
    return { qty: l, isLiquid: true, matchedStr: lMatch[0] };
  }

  // 7. Word numbers + units: "two kg", "one kilo", "three liters"
  for (const [word, num] of Object.entries(ENGLISH_WORD_NUMBERS)) {
    const regex = new RegExp(`\\b${word}\\s+(?:kilos?|kg|liters?|litres?|l|கிலோ|லிட்டர்)\\b`, 'i');
    if (regex.test(norm)) {
      const isLiquid = /liter|litre|\bl\b|லிட்டர்/i.test(norm);
      return { qty: num, isLiquid, matchedStr: `${word} kg` };
    }
  }

  // 8. Plain isolated numbers (e.g., "tomato 1", "onion 2", "2 potato")
  const plainNumMatch = norm.match(/\b(\d+(?:\.\d+)?)\b/);
  if (plainNumMatch) {
    const num = parseFloat(plainNumMatch[1]);
    if (num > 0) {
      // If user said "50" or "100" or "250" or "500", treat as grams
      if (num === 50 || num === 100 || num === 250 || num === 500 || num === 750) {
        return { qty: num / 1000, isLiquid: false, matchedStr: `${num}g` };
      }
      return { qty: num, isLiquid: false, matchedStr: `${num}` };
    }
  }

  return null;
}

/**
 * Fuzzy match a term against catalog items.
 * Catalog item structure: { id, name, name_ta, category, emoji, price_per_kg }
 */
export function findMatchingItem(term, catalogItems) {
  if (!term || !catalogItems || catalogItems.length === 0) return null;
  const clean = normalizeText(term);

  // 1. Exact or starts-with match on English name, Tamil name, or Tanglish name
  for (const item of catalogItems) {
    const enName = item.name.toLowerCase();
    const taName = (item.name_ta || '').toLowerCase();
    const tanglish = (getTanglishName(item) || '').toLowerCase();

    if (enName === clean || taName === clean || tanglish === clean) return item;
    if (enName.startsWith(clean) || clean.startsWith(enName)) return item;
    if (taName && (taName.startsWith(clean) || clean.startsWith(taName))) return item;
    if (tanglish && (tanglish.startsWith(clean) || clean.startsWith(tanglish))) return item;
  }

  // 2. Alias / Synonyms match
  for (const [key, aliases] of Object.entries(ITEM_ALIASES)) {
    for (const alias of aliases) {
      if (clean.includes(alias) || alias.includes(clean)) {
        // Find in catalog
        const found = catalogItems.find(it =>
          it.name.toLowerCase().includes(key) ||
          (it.name_ta && it.name_ta.includes(alias)) ||
          (getTanglishName(it).toLowerCase().includes(alias))
        );
        if (found) return found;
      }
    }
  }

  // 3. Substring matching
  for (const item of catalogItems) {
    const enName = item.name.toLowerCase();
    const taName = (item.name_ta || '').toLowerCase();
    const tanglish = (getTanglishName(item) || '').toLowerCase();
    if (clean.length >= 3 && (enName.includes(clean) || (taName && taName.includes(clean)) || (tanglish && tanglish.includes(clean)))) {
      return item;
    }
  }

  return null;
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

  const norm = normalizeText(transcript);

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
  // Split transcript into item segments using separators like:
  // "and", "plus", ",", "மற்றும்", "அப்புறம்", "கூட"
  const segments = transcript
    .split(/\b(?:and|plus|also|with|மற்றும்|அப்புறம்|கூட|மேலும்)\b|,|\n/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);

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

    if (matchedItem) {
      // Default quantity if not spoken:
      // If removing, qty is 0.
      // If liquid, default to 1 Liter or 0.5 Liter.
      // If solid, default to 1 kg.
      if (isSegRemove) {
        qty = 0;
      } else if (!qty || qty <= 0) {
        qty = matchedItem.category === 'dairy' ? 1.0 : 1.0;
      }

      parsedItems.push({
        item: matchedItem,
        qty: Math.round(qty * 1000) / 1000,
        isRemove: isSegRemove,
        isLiquid: matchedItem.category === 'dairy',
        matchedSnippet: seg
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
      const enNames = addedList.map(i => `${i.qty >= 1 ? `${i.qty} kg` : `${Math.round(i.qty * 1000)}g`} ${i.item.name}`).join(', ');
      const taNames = addedList.map(i => `${i.qty} கிலோ ${i.item.name_ta || i.item.name}`).join(', ');
      feedbackParts.push(`Added ${enNames}`);
      feedbackPartsTa.push(`${taNames} சேர்க்கப்பட்டது`);
    }

    if (removedList.length > 0) {
      const enRem = removedList.map(i => i.item.name).join(', ');
      const taRem = removedList.map(i => i.item.name_ta || i.item.name).join(', ');
      feedbackParts.push(`Removed ${enRem}`);
      feedbackPartsTa.push(`${taRem} நீக்கப்பட்டது`);
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
    feedbackText: `I heard: "${transcript}", but couldn't identify the items. Try saying "Add 1kg Tomato and 500g Onion".`,
    feedbackTamil: `தயவுசெய்து "1 கிலோ தக்காளி மற்றும் அரை கிலோ வெங்காயம் சேர்" என்று சொல்லுங்கள்.`,
    rawText: transcript
  };
}
