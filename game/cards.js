// Ember Duel — the cards. Four elements, each told apart by colour AND shape.
// A card is { id, name, suit, cost, text, effect } where effect is one of:
//   damage n | shield n | heal n | draw n | damageShield d s | damageDraw d n
export const SUITS = {
  flame: { label: 'FLAME', glyph: '\u25B2', color: '#ff5a3c' },
  tide: { label: 'TIDE', glyph: '\u25CF', color: '#4db8ff' },
  thorn: { label: 'THORN', glyph: '\u25C6', color: '#5dbb3a' },
  spark: { label: 'SPARK', glyph: '\u2605', color: '#ffd23c' },
};

const DEFS = [
  { name: 'Ember Jab', suit: 'flame', cost: 1, text: 'Deal 3 damage.', effect: { kind: 'damage', n: 3 } },
  { name: 'Ember Jab', suit: 'flame', cost: 1, text: 'Deal 3 damage.', effect: { kind: 'damage', n: 3 } },
  { name: 'Ember Jab', suit: 'flame', cost: 1, text: 'Deal 3 damage.', effect: { kind: 'damage', n: 3 } },
  { name: 'Cinder Slam', suit: 'flame', cost: 2, text: 'Deal 5 damage.', effect: { kind: 'damage', n: 5 } },
  { name: 'Cinder Slam', suit: 'flame', cost: 2, text: 'Deal 5 damage.', effect: { kind: 'damage', n: 5 } },
  { name: 'Wildfire', suit: 'flame', cost: 3, text: 'Deal 8 damage.', effect: { kind: 'damage', n: 8 } },
  { name: 'Spring Mend', suit: 'tide', cost: 1, text: 'Heal 4 life.', effect: { kind: 'heal', n: 4 } },
  { name: 'Spring Mend', suit: 'tide', cost: 1, text: 'Heal 4 life.', effect: { kind: 'heal', n: 4 } },
  { name: 'Deep Current', suit: 'tide', cost: 2, text: 'Heal 7 life.', effect: { kind: 'heal', n: 7 } },
  { name: 'Still Pool', suit: 'tide', cost: 1, text: 'Draw 2 cards.', effect: { kind: 'draw', n: 2 } },
  { name: 'Still Pool', suit: 'tide', cost: 1, text: 'Draw 2 cards.', effect: { kind: 'draw', n: 2 } },
  { name: 'Thorn Guard', suit: 'thorn', cost: 1, text: 'Gain 5 shield.', effect: { kind: 'shield', n: 5 } },
  { name: 'Thorn Guard', suit: 'thorn', cost: 1, text: 'Gain 5 shield.', effect: { kind: 'shield', n: 5 } },
  { name: 'Briar Wall', suit: 'thorn', cost: 2, text: 'Gain 9 shield.', effect: { kind: 'shield', n: 9 } },
  { name: 'Thorn Volley', suit: 'thorn', cost: 2, text: 'Deal 2 damage and gain 2 shield.', effect: { kind: 'damageShield', d: 2, s: 2 } },
  { name: 'Thorn Volley', suit: 'thorn', cost: 2, text: 'Deal 2 damage and gain 2 shield.', effect: { kind: 'damageShield', d: 2, s: 2 } },
  { name: 'Spark Flicker', suit: 'spark', cost: 1, text: 'Deal 2 damage. Draw 1 card.', effect: { kind: 'damageDraw', d: 2, n: 1 } },
  { name: 'Spark Flicker', suit: 'spark', cost: 1, text: 'Deal 2 damage. Draw 1 card.', effect: { kind: 'damageDraw', d: 2, n: 1 } },
  { name: 'Spark Flicker', suit: 'spark', cost: 1, text: 'Deal 2 damage. Draw 1 card.', effect: { kind: 'damageDraw', d: 2, n: 1 } },
  { name: 'Lightning Arc', suit: 'spark', cost: 2, text: 'Deal 4 damage. Draw 1 card.', effect: { kind: 'damageDraw', d: 4, n: 1 } },
  { name: 'Lightning Arc', suit: 'spark', cost: 2, text: 'Deal 4 damage. Draw 1 card.', effect: { kind: 'damageDraw', d: 4, n: 1 } },
  { name: 'Storm Surge', suit: 'spark', cost: 3, text: 'Deal 6 damage. Draw 2 cards.', effect: { kind: 'damageDraw', d: 6, n: 2 } },
  { name: 'Ember Bloom', suit: 'flame', cost: 2, text: 'Deal 3 damage. Gain 3 shield.', effect: { kind: 'damageShield', d: 3, s: 3 } },
  { name: 'Tidecaller', suit: 'tide', cost: 3, text: 'Heal 6 life. Draw 1 card.', effect: { kind: 'healDraw', h: 6, n: 1 } },
];

// Build a fresh 24-card deck (a shuffled copy of DEFS) with unique ids.
export function buildDeck() {
  return DEFS.map((d, i) => ({ ...d, id: `c${i}` }));
}

// Fisher-Yates shuffle. Accepts an optional seeded rng so screenshots are stable.
export function shuffle(deck, rng = Math.random) {
  const a = deck.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tiny deterministic rng (mulberry32) for screenshot seeds.
export function seededRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Describe a card's effect in plain words for the log, with a combo bonus applied.
export function describePlay(card, combo) {
  const b = combo ? 1 : 0;
  const e = card.effect;
  switch (e.kind) {
    case 'damage': return `deals ${e.n + b} damage`;
    case 'shield': return `gains ${e.n + b} shield`;
    case 'heal': return `heals ${e.n + b} life`;
    case 'draw': return `draws ${e.n + b} cards`;
    case 'damageShield': return `deals ${e.d + b} damage and gains ${e.s + b} shield`;
    case 'damageDraw': return `deals ${e.d + b} damage and draws ${e.n + b} cards`;
    case 'healDraw': return `heals ${e.h + b} life and draws ${e.n + b} cards`;
    default: return 'plays a card';
  }
}
