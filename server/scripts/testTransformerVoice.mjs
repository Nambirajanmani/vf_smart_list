/**
 * testTransformerVoice.js — Automated Verification Script
 * Tests the Transformer Semantic Matcher and Voice Parser logic
 */

import { parseVoiceCommand, findMatchingItem } from '../../client/src/utils/voiceParser.js';

// Mock catalog representing database items
const MOCK_CATALOG = [
  { id: 1,  name: 'Thakkali',       name_ta: 'தக்காளி',       category: 'vegetable', emoji: '🍅', price_per_kg: 30 },
  { id: 2,  name: 'Urulaikizhangu', name_ta: 'உருளைக்கிழங்கு', category: 'vegetable', emoji: '🥔', price_per_kg: 25 },
  { id: 3,  name: 'Vengayam',       name_ta: 'வெங்காயம்',     category: 'vegetable', emoji: '🧅', price_per_kg: 35 },
  { id: 4,  name: 'Poondu',         name_ta: 'பூண்டு',         category: 'vegetable', emoji: '🧄', price_per_kg: 120 },
  { id: 5,  name: 'Inji',           name_ta: 'இஞ்சி',         category: 'vegetable', emoji: '🫚', price_per_kg: 80 },
  { id: 13, name: 'Vendaikkai',     name_ta: 'வெண்டைக்காய்',   category: 'vegetable', emoji: '🌾', price_per_kg: 40 },
  { id: 48, name: 'Aappil',         name_ta: 'ஆப்பிள்',       category: 'fruit',     emoji: '🍎', price_per_kg: 150 },
  { id: 130, name: 'Paal',          name_ta: 'பால்',          category: 'dairy',     emoji: '🥛', price_per_kg: 35 }
];

const TEST_CASES = [
  { phrase: "Add 1kg Tomato", expectedCount: 1, expectedName: "Thakkali", expectedQty: 1.0 },
  { phrase: "add 2 kg potato and half kg onion", expectedCount: 2, expectedName: "Urulaikizhangu", expectedQty: 2.0 },
  { phrase: "rendu kilo thakkali and ara kilo vengayam", expectedCount: 2, expectedName: "Thakkali", expectedQty: 2.0 },
  { phrase: "ஒரு கிலோ தக்காளி", expectedCount: 1, expectedName: "Thakkali", expectedQty: 1.0 },
  { phrase: "500g garlic", expectedCount: 1, expectedName: "Poondu", expectedQty: 0.5 },
  { phrase: "1 liter milk", expectedCount: 1, expectedName: "Paal", expectedQty: 1.0 },
  { phrase: "bring some potatos", expectedCount: 1, expectedName: "Urulaikizhangu", expectedQty: 1.0 },
  { phrase: "put 250g ginger please", expectedCount: 1, expectedName: "Inji", expectedQty: 0.25 }
];

console.log("==================================================");
console.log("🚀 TESTING TRANSFORMER SEMANTIC VOICE IDENTIFIER");
console.log("==================================================");

let passed = 0;

for (const tc of TEST_CASES) {
  const result = parseVoiceCommand(tc.phrase, MOCK_CATALOG);
  const matched = result.items && result.items.length >= tc.expectedCount;
  const firstItem = result.items && result.items[0];
  const nameMatched = firstItem && firstItem.item.name === tc.expectedName;
  const qtyMatched = firstItem && Math.abs(firstItem.qty - tc.expectedQty) < 0.01;

  if (matched && nameMatched && qtyMatched) {
    passed++;
    console.log(`✅ PASS: "${tc.phrase}"`);
    console.log(`   → Matched: ${firstItem.item.name} (${firstItem.qty} ${firstItem.isLiquid ? 'L' : 'kg'}) | Confidence: ${Math.round((firstItem.confidence || 0.95) * 100)}% | MatchType: ${firstItem.matchType || 'SEMANTIC'}`);
  } else {
    console.log(`❌ FAIL: "${tc.phrase}"`);
    console.log(`   → Got:`, result);
  }
}

console.log("==================================================");
console.log(`Summary: ${passed}/${TEST_CASES.length} tests passed (${Math.round((passed / TEST_CASES.length) * 100)}%)`);
console.log("==================================================");
