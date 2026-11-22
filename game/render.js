// Ember Duel — everything that paints the duel onto the page.
import { SUITS, describePlay } from './cards.js';
import { MAX_LIFE, isCombo } from './state.js';

const $ = (id) => document.getElementById(id);

export function cardElement(card, opts = {}) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `card ${card.suit}`;
  el.dataset.cardId = card.id;
  if (opts.playable === false) el.classList.add('unplayable');
  if (opts.comboReady) el.classList.add('combo-ready');
  if (opts.justPlayed) el.classList.add('just-played');
  el.innerHTML =
    `<span class="cost">${card.cost}</span>` +
    `<span class="suit-glyph">${suit.glyph}</span>` +
    `<span class="card-name">${card.name}</span>` +
    `<span class="card-effect">${card.text}</span>` +
    `<span class="card-suit">${suit.glyph} ${suit.label}</span>`;
  if (opts.onClick) el.addEventListener('click', () => opts.onClick(card));
  el.title = `${card.name} — ${suit.label}, costs ${card.cost} ember. ${card.text}`;
  return el;
}

export function cardBackElement(playedOut) {
  const el = document.createElement('div');
  el.className = 'card' + (playedOut ? ' played-out' : '');
  el.innerHTML = '<span class="back-glyph">&#9670;</span>';
  return el;
}

export function renderAll(game, hooks) {
  renderDuelist(game, 'player');
  renderDuelist(game, 'rival');
  renderHands(game, hooks);
  $('turnPill').textContent = `Turn ${game.turn}`;
  $('endTurnBtn').disabled = game.phase !== 'player';
}

function renderDuelist(game, who) {
  const d = game[who];
  const prefix = who === 'player' ? 'player' : 'rival';
  $(`${prefix}LifeFill`).style.width = `${(d.life / MAX_LIFE) * 100}%`;
  $(`${prefix}LifeText`).textContent = d.life;
  const shield = $(`${prefix}Shield`);
  shield.classList.toggle('hidden', d.shield <= 0);
  shield.innerHTML = `&#9670; ${d.shield}`;
  $(`${prefix}Ember`).textContent = d.ember;
  $(`${prefix}DeckCount`).textContent = d.deck.length;
}

function renderHands(game, hooks) {
  const ph = $('playerHand');
  ph.innerHTML = '';
  game.player.hand.forEach((card) => {
    const comboReady = game.player.lastSuit === card.suit;
    ph.appendChild(cardElement(card, {
      playable: game.phase === 'player' && card.cost <= game.player.ember,
      comboReady,
      onClick: (c) => hooks.onPlayCard(c),
    }));
  });
  const rh = $('rivalHand');
  rh.innerHTML = '';
  game.rival.hand.forEach((card) => {
    rh.appendChild(cardBackElement(false));
  });
}

export function renderPlaySlot(who, result, actorName) {
  const slot = who === 'player' ? $('playerPlay') : $('rivalPlay');
  if (!result) { slot.textContent = ''; return; }
  const comboNote = result.combo ? ' — COMBO +1!' : '';
  slot.textContent = `${actorName} played ${result.card.name} (${describePlay(result.card, result.combo)})${comboNote}`;
}

export function pushLog(game, html, fresh) {
  const log = $('log');
  const line = document.createElement('div');
  if (fresh) line.className = 'fresh';
  line.innerHTML = html;
  log.prepend(line);
  while (log.children.length > 2) log.removeChild(log.lastChild);
}

export function showScreen(name) {
  $('titleScreen').classList.toggle('hidden', name !== 'title');
  $('table').classList.toggle('hidden', name !== 'table');
  $('endScreen').classList.toggle('hidden', name !== 'end');
}

export function showEnd(game) {
  const win = game.winner === 'player';
  const end = $('endScreen');
  end.classList.toggle('win', win);
  end.classList.toggle('loss', !win);
  $('endGlyph').innerHTML = win ? '&#9733;' : '&#9760;';
  $('endTitle').textContent = win ? 'VICTORY' : 'DEFEAT';
  $('endText').textContent = win
    ? 'The rival’s ember fades. You take the duel.'
    : 'Your ember fades. The rival takes this one — duel again.';
  const s = game.stats;
  $('endStats').innerHTML =
    `<span>Turns <b>${s.turns}</b></span>` +
    `<span>Damage dealt <b>${s.damageDealt}</b></span>` +
    `<span>Cards played <b>${s.cardsPlayed}</b></span>` +
    `<span>Combos <b>${s.combos}</b></span>`;
}
