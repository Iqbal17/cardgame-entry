// Ember Duel — the rival's brain. Readable, counterable, never random.
// The rival plays its best card while it can afford one, in this order:
//   1. finish the player when lethal damage is on the table;
//   2. shield up when its own life is low;
//   3. heal when hurt and no lethal play exists;
//   4. otherwise the highest-damage card it can afford;
//   5. draw cards when nothing else helps.
import { playCard } from './state.js';

function damageOf(card, combo) {
  const b = combo ? 1 : 0;
  const e = card.effect;
  if (e.kind === 'damage') return e.n + b;
  if (e.kind === 'damageShield') return e.d + b;
  if (e.kind === 'damageDraw') return e.d + b;
  return 0;
}

function scoreCard(game, card, index) {
  const rival = game.rival;
  const player = game.player;
  const combo = rival.lastSuit === card.suit;
  const dmg = damageOf(card, combo);
  const e = card.effect;
  let score = 0;
  if (dmg >= player.life) score += 1000; // lethal first
  score += dmg * 3;
  if (e.kind === 'shield' && rival.life <= 12) score += 40 + e.n;
  if (e.kind === 'damageShield' && rival.life <= 12) score += 25;
  if (e.kind === 'heal' && rival.life <= 18) score += 30 + e.n;
  if (e.kind === 'healDraw' && rival.life <= 18) score += 30;
  if (e.kind === 'draw' || e.kind === 'damageDraw' || e.kind === 'healDraw') score += 6;
  if (combo) score += 4;
  score -= card.cost * 2;
  return score;
}

// Plays the rival's whole turn and returns the list of plays made.
export function rivalTurn(game) {
  const plays = [];
  game.phase = 'rival';
  game.rival.shield = 0; // shield fades at the start of the rival's own turn
  while (game.phase === 'rival') {
    const rival = game.rival;
    let bestIndex = -1;
    let bestScore = 0;
    rival.hand.forEach((card, i) => {
      if (card.cost > rival.ember) return;
      const s = scoreCard(game, card, i);
      if (s > bestScore) {
        bestScore = s;
        bestIndex = i;
      }
    });
    if (bestIndex < 0) break;
    const result = playCard(game, 'rival', bestIndex);
    if (!result) break;
    plays.push(result);
    if (game.phase === 'over') break;
  }
  if (game.phase === 'rival') game.phase = 'player';
  return plays;
}
