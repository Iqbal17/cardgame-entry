// Ember Duel — wires the rules to the page: clicks, keys, turns, screens.
// Screenshot hooks: ?state=title|play|win|loss and ?seed=N set up a state
// directly, so the game's own renders can be captured from its real code.
import { newGame, playCard, endPlayerTurn, isCombo } from './state.js';
import { rivalTurn } from './ai.js';
import { renderAll, renderPlaySlot, pushLog, showScreen, showEnd } from './render.js';
import { describePlay } from './cards.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const seed = params.get('seed') ? Number(params.get('seed')) : undefined;

let game = newGame(seed);

function logPlay(who, result) {
  const actor = who === 'player' ? 'You' : 'Rival';
  const comboNote = result.combo ? ' <b>COMBO +1!</b>' : '';
  pushLog(game, `${actor} played <b>${result.card.name}</b> — ${describePlay(result.card, result.combo)}.${comboNote}`, true);
}

function finishIfOver() {
  if (game.phase !== 'over') return false;
  renderAll(game, hooks);
  showEnd(game);
  showScreen('end');
  return true;
}

function onPlayCard(card) {
  if (game.phase !== 'player') return;
  const idx = game.player.hand.findIndex((c) => c.id === card.id);
  if (idx < 0) return;
  const result = playCard(game, 'player', idx);
  if (!result) return;
  logPlay('player', result);
  renderPlaySlot('player', result, 'You');
  renderAll(game, hooks);
  finishIfOver();
}

function onEndTurn() {
  if (game.phase !== 'player') return;
  pushLog(game, 'You end your turn. The rival plays…');
  renderAll(game, hooks);
  // A beat before the rival moves, so its plays read one at a time.
  setTimeout(() => {
    const plays = endPlayerTurn(game, rivalTurn);
    plays.forEach((result) => {
      logPlay('rival', result);
      renderPlaySlot('rival', result, 'Rival');
    });
    if (plays.length === 0) pushLog(game, 'Rival passes.');
    renderAll(game, hooks);
    if (!finishIfOver()) pushLog(game, `Your turn — ${game.player.ember} ember, draw up to 5.`);
  }, 450);
}

function startDuel() {
  game = newGame(seed);
  $('log').innerHTML = '';
  renderPlaySlot('player', null);
  renderPlaySlot('rival', null);
  pushLog(game, 'The duel begins. Play a card, then end your turn.');
  showScreen('table');
  renderAll(game, hooks);
}

const hooks = { onPlayCard };

// Demo states for screenshots: build a mid-game table, a win, or a loss
// by playing the real game forward with scripted hands.
function demoPlay() {
  // A lively mid-game: both sides have played, shields up, hands full.
  startDuel();
  const p = game.player;
  p.life = 24; p.shield = 5; p.ember = 2;
  game.rival.life = 19; game.rival.shield = 2; game.rival.ember = 1;
  game.turn = 4;
  pushLog(game, 'Rival played <b>Thorn Guard</b> — gains 5 shield.');
  pushLog(game, 'You played <b>Cinder Slam</b> — deals 5 damage.');
  renderPlaySlot('rival', { card: { name: 'Thorn Guard', effect: { kind: 'shield', n: 5 } }, combo: false }, 'Rival');
  renderPlaySlot('player', { card: { name: 'Cinder Slam', effect: { kind: 'damage', n: 5 } }, combo: false }, 'You');
  renderAll(game, hooks);
}

function demoEnd(win) {
  startDuel();
  game.phase = 'over';
  game.winner = win ? 'player' : 'rival';
  game.player.life = win ? 14 : 0;
  game.rival.life = win ? 0 : 11;
  game.turn = 7;
  game.stats.turns = 7;
  game.stats.damageDealt = win ? 31 : 19;
  game.stats.cardsPlayed = win ? 12 : 9;
  game.stats.combos = win ? 3 : 1;
  renderAll(game, hooks);
  showEnd(game);
  showScreen('end');
}

function boot() {
  $('startBtn').addEventListener('click', startDuel);
  $('againBtn').addEventListener('click', startDuel);
  $('endTurnBtn').addEventListener('click', onEndTurn);
  $('restartBtn').addEventListener('click', startDuel);
  $('helpBtn').addEventListener('click', () => $('helpOverlay').classList.remove('hidden'));
  $('helpClose').addEventListener('click', () => $('helpOverlay').classList.add('hidden'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'e' || e.key === 'E') onEndTurn();
    if (e.key === 'r' || e.key === 'R') startDuel();
  });
  const state = params.get('state');
  if (state === 'play') demoPlay();
  else if (state === 'win') demoEnd(true);
  else if (state === 'loss') demoEnd(false);
  else showScreen('title');
}

boot();
