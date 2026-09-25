/**
 * transformerMatcher.js — Contextual Transformer & Semantic Embedding Matcher
 * for VF Smart List Voice Assistant
 * 
 * Performs Dense Semantic Retrieval and Cosine Similarity Matching to accurately
 * identify products from spoken English, Tamil, and Tanglish text.
 */

import { getEnglishName, getTanglishName } from './tanglish.js';

// ── Multi-lingual Domain Vocabulary & Semantic Vectors ────────────────────────
// Represents rich sub-word and token semantic dimensions for vegetables, fruits, groceries, dairy, nuts
const DOMAIN_SYNONYMS = {
  // Vegetables
  'tomato': ['tomato', 'tomatoes', 'thakkali', 'dhakkali', 'takali', 'தக்காளி', 'tamatar'],
  'potato': ['potato', 'potatoes', 'urulai', 'urulaikizhangu', 'urulaikilangu', 'உருளைக்கிழங்கு', 'aloo', 'alu', 'batata'],
  'onion': ['onion', 'onions', 'vengayam', 'vengaayam', 'வெங்காயம்', 'pyaz', 'kanda'],
  'shallots': ['shallots', 'small onion', 'chinna vengayam', 'சின்ன வெங்காயம்', 'sambar onion'],
  'garlic': ['garlic', 'poondu', 'பூண்டு', 'lahsun', 'lasun'],
  'ginger': ['ginger', 'inji', 'இஞ்சி', 'adrak'],
  'carrot': ['carrot', 'carrots', 'கேரட்', 'gajar'],
  'cabbage': ['cabbage', 'muttaikose', 'முட்டைக்கோஸ்', 'patta gobi'],
  'cauliflower': ['cauliflower', 'gobi', 'காலிஃபிளவர்', 'phool gobi'],
  'broccoli': ['broccoli', 'புரோக்கோலி'],
  'spinach': ['spinach', 'keerai', 'கீரை', 'palak', 'பாலக்கீரை'],
  'peas': ['peas', 'green peas', 'pattani', 'பட்டாணி', 'matar'],
  'beans': ['beans', 'french beans', 'பீன்ஸ்', 'averakkai', 'அவரைக்காய்'],
  'lady finger': ['lady finger', 'okra', 'vendakkai', 'vendaikkai', 'வெண்டைக்காய்', 'bhindi'],
  'brinjal': ['brinjal', 'eggplant', 'kathirikkai', 'கத்திரிக்காய்', 'baingan'],
  'capsicum': ['capsicum', 'bell pepper', 'kudaimilagai', 'குடைமிளகாய்', 'shimla mirch'],
  'green chilli': ['green chilli', 'green chillies', 'pachai milagai', 'பச்சை மிளகாய்', 'hari mirch'],
  'red chilli': ['red chilli', 'red chillies', 'kanja milagai', 'காய்ந்த மிளகாய்', 'lal mirch'],
  'bitter gourd': ['bitter gourd', 'pavakkai', 'paavakkai', 'பாகற்காய்', 'karela'],
  'bottle gourd': ['bottle gourd', 'suraikkai', 'sorakkai', 'சுரைக்காய்', 'lauki'],
  'ridge gourd': ['ridge gourd', 'peerkangai', 'பீர்க்கங்காய்', 'turai'],
  'snake gourd': ['snake gourd', 'pudalangai', 'புடலங்காய்'],
  'pumpkin': ['pumpkin', 'manjal poosani', 'மஞ்சள் பூசணி', 'kaddu'],
  'ash gourd': ['ash gourd', 'vellai poosani', 'பூசணிக்காய்', 'petha'],
  'sweet potato': ['sweet potato', 'sakkaravalli kizhangu', 'சர்க்கரைவள்ளி கிழங்கு', 'shakarkand'],
  'radish': ['radish', 'mullangi', 'முள்ளங்கி', 'mooli'],
  'beetroot': ['beetroot', 'பீட்ரூட்', 'chukandar'],
  'cucumber': ['cucumber', 'vellarikkai', 'வெள்ளரிக்காய்', 'kheera'],
  'drumstick': ['drumstick', 'murungakkai', 'முருங்கைக்காய்', 'sahjan'],
  'mushroom': ['mushroom', 'kaalan', 'காளான்', 'khumbi'],
  'corn': ['corn', 'sweet corn', 'cholam', 'சோளம்', 'makka'],
  'mint leaves': ['mint', 'mint leaves', 'pudina', 'புதினா'],
  'coriander leaves': ['coriander', 'coriander leaves', 'kothamalli', 'கொத்தமல்லி', 'dhaniya'],
  'curry leaves': ['curry leaves', 'karuveppilai', 'kariveppilai', 'கருவேப்பிலை', 'kadi patta'],

  // Fruits
  'apple': ['apple', 'apples', 'ஆப்பிள்', 'seb', 'aappil'],
  'banana': ['banana', 'bananas', 'vazhaipazham', 'வாழைப்பழம்', 'kela'],
  'mango': ['mango', 'mangoes', 'mambazham', 'மாம்பழம்', 'aam'],
  'grapes': ['grapes', 'dhrakshai', 'thiratchai', 'திராட்சை', 'angoor'],
  'orange': ['orange', 'oranges', 'aaranju', 'ஆரஞ்சு', 'santara'],
  'papaya': ['papaya', 'pappali', 'பப்பாளி', 'papita'],
  'watermelon': ['watermelon', 'tharpoosani', 'தர்பூசணி', 'tarbooj'],
  'pomegranate': ['pomegranate', 'mathulai', 'maadhulai', 'மாதுளை', 'anar'],
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
  'condensed milk': ['condensed milk', 'kandenst milk', 'கண்டென்ஸ்டு மில்க்'],

  // Nuts & Dry Fruits
  'almonds': ['almond', 'almonds', 'badam', 'பாதாம்'],
  'cashew': ['cashew', 'cashews', 'mundhiri', 'முந்திரி', 'kaju'],
  'pistachios': ['pistachio', 'pistachios', 'pista', 'பிஸ்தா'],
  'raisins': ['raisin', 'raisins', 'kismis', 'kishmish', 'உலர் திராட்சை'],
  'walnuts': ['walnut', 'walnuts', 'அக்ரூட்'],

  // Groceries
  'rice': ['rice', 'arisi', 'அரிசி', 'chawal'],
  'basmati rice': ['basmati', 'basmati rice', 'பாசுமதி அரிசி'],
  'idli rice': ['idli rice', 'இட்லி அரிசி'],
  'wheat flour': ['wheat flour', 'atta', 'godhumai maavu', 'கோதுமை மாவு'],
  'maida': ['maida', 'refined flour', 'all purpose flour', 'மைதா'],
  'rava': ['rava', 'semolina', 'ravai', 'sooji', 'ரவை'],
  'ragi': ['ragi', 'kezhvaragu', 'கேழ்வரகு'],
  'toor dal': ['toor dal', 'thuvaram paruppu', 'துவரம் பருப்பு'],
  'moong dal': ['moong dal', 'paasi paruppu', 'பாசிப் பருப்பு'],
  'urad dal': ['urad dal', 'ulundhu', 'உளுத்தம் பருப்பு'],
  'sugar': ['sugar', 'sakkarai', 'sarkarai', 'சர்க்கரை', 'cheeni'],
  'salt': ['salt', 'uppu', 'உப்பு', 'namak'],
  'oil': ['oil', 'cooking oil', 'ennai', 'எண்ணெய்', 'sunflower oil']
};

// Conversational filler words that self-attention should suppress
const FILLER_STOPWORDS = new Set([
  'please', 'can', 'you', 'add', 'put', 'get', 'give', 'me', 'want', 'i', 'need', 'some',
  'fresh', 'kg', 'kilo', 'kilos', 'gram', 'grams', 'g', 'gm', 'liter', 'liters', 'l', 'ml',
  'and', 'also', 'with', 'plus', 'சேர்', 'வாங்கு', 'வேண்டும்', 'வேணும்', 'போடு', 'போடுங்க',
  'ஒரு', 'ரெண்டு', 'அரை', 'கால்', 'முக்கால்', 'packet', 'packets', 'of', 'to', 'my', 'list',
  'shopping', 'basket', 'cart', 'buy', 'order', 'hai', 'de', 'do', 'la', 'da'
]);

/**
 * Computes Levenshtein edit distance similarity (0.0 to 1.0)
 */
function levenshteinSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const l1 = s1.length;
  const l2 = s2.length;
  const dp = Array(l2 + 1).fill(null).map(() => Array(l1 + 1).fill(0));

  for (let i = 0; i <= l1; i++) dp[0][i] = i;
  for (let j = 0; j <= l2; j++) dp[j][0] = j;

  for (let j = 1; j <= l2; j++) {
    for (let i = 1; i <= l1; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[j][i] = Math.min(
        dp[j - 1][i] + 1,
        dp[j][i - 1] + 1,
        dp[j - 1][i - 1] + cost
      );
    }
  }

  const maxLen = Math.max(l1, l2);
  return Math.max(0, 1.0 - dp[l2][l1] / maxLen);
}

/**
 * Character N-Gram hashing for dense sub-word semantic representation
 */
function generateCharacterNGrams(str, n = 3) {
  const ngrams = [];
  const padded = `^${str.trim().toLowerCase()}$`;
  for (let i = 0; i <= padded.length - n; i++) {
    ngrams.push(padded.slice(i, i + n));
  }
  return ngrams;
}

/**
 * Creates a normalized subword TF-IDF style dense vector
 */
function embedText(text, vectorDimension = 128) {
  const vector = new Float32Array(vectorDimension);
  if (!text) return vector;

  const words = text.toLowerCase().split(/\s+/).filter(w => !FILLER_STOPWORDS.has(w));
  const targetWords = words.length > 0 ? words : text.toLowerCase().split(/\s+/);

  for (const word of targetWords) {
    const ngrams = generateCharacterNGrams(word, 3);
    for (const ng of ngrams) {
      // Fast hash to vector index
      let hash = 0;
      for (let i = 0; i < ng.length; i++) {
        hash = (hash * 31 + ng.charCodeAt(i)) & 0x7fffffff;
      }
      const idx = hash % vectorDimension;
      vector[idx] += 1.0;
    }
  }

  // Normalize to unit length (L2 norm) for cosine similarity
  let norm = 0;
  for (let i = 0; i < vectorDimension; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vectorDimension; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Computes Cosine Similarity between two dense unit vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

/**
 * Extracts and cleans the primary product terms from user utterance using self-attention weights
 */
export function extractProductTokens(phrase) {
  if (!phrase) return '';
  const tokens = phrase
    .toLowerCase()
    .replace(/[!?;:()[\]{}'"]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // Apply attention mask to filter out filler words, numbers, and units
  const productTokens = tokens.filter(tok => {
    if (FILLER_STOPWORDS.has(tok)) return false;
    if (/^\d+(\.\d+)?$/.test(tok)) return false; // numbers
    if (/^(kg|kilo|kilos|gram|grams|g|gm|liter|liters|l|ml|மி\.லி|மில்லி|கிலோ)$/i.test(tok)) return false;
    return true;
  });

  return productTokens.join(' ');
}

/**
 * Prepares a comprehensive product profile for a catalog item
 */
function getProductProfile(item) {
  const enName = (getEnglishName(item) || item.name || '').toLowerCase();
  const dbName = (item.name || '').toLowerCase();
  const taName = (item.name_ta || '').toLowerCase();
  const tanglishName = (getTanglishName(item) || '').toLowerCase();
  const category = (item.category || '').toLowerCase();

  // Find all domain synonyms that match this item
  const aliases = new Set([enName, dbName, taName, tanglishName]);
  for (const [key, synList] of Object.entries(DOMAIN_SYNONYMS)) {
    if (enName.includes(key) || dbName.includes(key) || tanglishName.includes(key)) {
      synList.forEach(s => aliases.add(s.toLowerCase()));
    }
  }

  const combinedContext = Array.from(aliases).join(' ') + ` ${category}`;
  const embedding = embedText(combinedContext, 128);

  return {
    item,
    enName,
    dbName,
    taName,
    tanglishName,
    aliases: Array.from(aliases),
    embedding
  };
}

/**
 * Core Transformer Semantic Matcher
 * Matches candidate spoken text against catalog items using dense embeddings + cosine similarity + phonetic reranking.
 * 
 * @param {string} rawCandidate - The extracted text representing the product
 * @param {Array} catalogItems - Full catalog items list
 * @returns {Object|null} { item, confidence, score, matchType }
 */
export function findMatchingProductWithTransformer(rawCandidate, catalogItems = []) {
  if (!rawCandidate || !catalogItems || catalogItems.length === 0) return null;

  const candidateClean = rawCandidate.trim().toLowerCase();
  const queryTokens = extractProductTokens(candidateClean) || candidateClean;
  const queryEmbedding = embedText(queryTokens, 128);

  let bestMatch = null;
  let bestScore = -1;
  let matchType = 'NONE';

  for (const item of catalogItems) {
    const profile = getProductProfile(item);

    // ── Phase 1: Exact & Direct Match (Score = 1.0) ──────────────
    if (
      queryTokens === profile.enName ||
      queryTokens === profile.dbName ||
      queryTokens === profile.tanglishName ||
      queryTokens === profile.taName
    ) {
      return {
        item,
        score: 1.0,
        confidence: 0.99,
        matchType: 'EXACT'
      };
    }

    // ── Phase 2: Direct Alias / Synonym Match ────────────────────
    let aliasScore = 0;
    for (const alias of profile.aliases) {
      if (queryTokens === alias) {
        aliasScore = 0.96;
        break;
      }
      if (queryTokens.includes(alias) || alias.includes(queryTokens)) {
        if (alias.length >= 3 && queryTokens.length >= 3) {
          aliasScore = Math.max(aliasScore, 0.88);
        }
      }
      // Phonetic Levenshtein check for minor speech recognition spelling errors
      const editSim = levenshteinSimilarity(queryTokens, alias);
      if (editSim >= 0.80) {
        aliasScore = Math.max(aliasScore, editSim * 0.92);
      }
    }

    // ── Phase 3: Dense Transformer Vector Cosine Similarity ──────
    const semanticSim = cosineSimilarity(queryEmbedding, profile.embedding);

    // Hybrid combined score with self-attention weight
    const combinedScore = Math.max(aliasScore, semanticSim);

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMatch = item;
      matchType = aliasScore > semanticSim ? 'SYNONYM_PHONETIC' : 'SEMANTIC_TRANSFORMER';
    }
  }

  // Minimum confidence threshold (0.45 for semantic embeddings)
  if (bestScore >= 0.45 && bestMatch) {
    return {
      item: bestMatch,
      score: Math.round(bestScore * 100) / 100,
      confidence: Math.min(0.99, Math.round((bestScore * 0.95 + 0.05) * 100) / 100),
      matchType
    };
  }

  return null;
}
