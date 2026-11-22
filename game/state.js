// Ember Duel — the duel's state machine. Pure rules, no DOM here.
import { buildDeck, shuffle, seededRng } from './cards.js';

export const MAX_LIFE = 30;
export const HAND_SIZE = 5;
export const EMBER_PER_TURN = 3;

export function newDuelist(deck) {
  return {
    life: MAX_LIFE,
    shield: 0,
    ember: EMBER_PER_TURN,
    deck: deck.slice(),
    hand: [],
    discard: [],
    lastSuit: null, // suit of the last card this side played (combo tracking)
  };
}

export function newGame(seed) {
  const rng = seed ? seededRng(seed) : Math.random;
  const game = {
    turn: 1,
    phase: 'player', // 'player' | 'rival' | 'over'
    winner: null, // 'player' | 'rival' | null
    player: newDuelist(shuffle(buildDeck(), rng)),
    rival: newDuelist(shuffle(buildDeck(), rng)),
    log: [],
    stats: { damageDealt: 0, cardsPlayed: 0, combos: 0, turns: 0 },
  };
  drawUpTo(game.player);
  drawUpTo(game.rival);
  return game;
}

export function drawUpTo(duelist) {
  while (duelist.hand.length < HAND_SIZE) {
    if (duelist.deck.length === 0) {
      if (duelist.discard.length === 0) return;
      duelist.deck = shuffle(duelist.discard);
      duelist.discard = [];
    }
    duelist.hand.push(duelist.deck.pop());
  }
}

// Combo: same suit as the previous card this side played gives +1 to the numbers.
export function isCombo(duelist, card) {
  return duelist.lastSuit !== null && duelist.lastSuit === card.suit;
}

function applyDamage(target, amount) {
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  target.life = Math.max(0, target.life - (amount - absorbed));
  return amount - absorbed;
}

function applyEffect(game, actor, target, card, combo) {
  const b = combo ? 1 : 0;
  const e = card.effect;
  let dealt = 0;
  switch (e.kind) {
    case 'damage':
      dealt = applyDamage(target, e.n + b);
      break;
    case 'shield':
      actor.shield += e.n + b;
      break;
    case 'heal':
      actor.life = Math.min(MAX_LIFE, actor.life + e.n + b);
      break;
    case 'draw':
      for (let i = 0; i < e.n + b; i++) drawOne(actor);
      break;
    case 'damageShield':
      dealt = applyDamage(target, e.d + b);
      actor.shield += e.s + b;
      break;
    case 'damageDraw':
      dealt = applyDamage(target, e.d + b);
      for (let i = 0; i < e.n + b; i++) drawOne(actor);
      break;
    case 'healDraw':
      actor.life = Math.min(MAX_LIFE, actor.life + e.h + b);
      for (let i = 0; i < e.n + b; i++) drawOne(actor);
      break;
  }
  return dealt;
}

function drawOne(duelist) {
  if (duelist.deck.length === 0) {
    if (duelist.discard.length === 0) return;
    duelist.deck = shuffle(duelist.discard);
    duelist.discard = [];
  }
  duelist.hand.push(duelist.deck.pop());
}

// Play a card from the actor's hand. Returns a result object or null if illegal.
export function playCard(game, who, handIndex) {
  if (game.phase === 'over') return null;
  const actor = game[who];
  const target = game[who === 'player' ? 'rival' : 'player'];
  const card = actor.hand[handIndex];
  if (!card || card.cost > actor.ember) return null;
  const combo = isCombo(actor, card);
  actor.ember -= card.cost;
  actor.hand.splice(handIndex, 1);
  actor.discard.push(card);
  actor.lastSuit = card.suit;
  const dealt = applyEffect(game, actor, target, card, combo);
  if (who === 'player') {
    game.stats.damageDealt += dealt;
    game.stats.cardsPlayed += 1;
    if (combo) game.stats.combos += 1;
  }
  if (target.life <= 0) {
    game.phase = 'over';
    game.winner = who;
  } else if (actor.life <= 0) {
    game.phase = 'over';
    game.winner = who === 'player' ? 'rival' : 'player';
  }
  return { card, combo, dealt };
}

// End the player's turn: rival takes its turn, then a new player turn begins.
export function endPlayerTurn(game, rivalPlays) {
  if (game.phase !== 'player') return [];
  const plays = rivalPlays(game);
  if (game.phase === 'over') return plays;
  startPlayerTurn(game);
  return plays;
}

export function startPlayerTurn(game) {
  game.turn += 1;
  game.stats.turns = game.turn;
  game.phase = 'player';
  const p = game.player;
  p.ember = EMBER_PER_TURN;
  p.shield = 0; // shield fades at the start of your next turn
  p.lastSuit = null;
  drawUpTo(p);
  const r = game.rival;
  r.ember = EMBER_PER_TURN;
  r.lastSuit = null;
  drawUpTo(r);
}
