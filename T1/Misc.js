// Misc.js
import * as THREE from 'three';
import { START_POS_TRACK1, START_POS_TRACK2, START_POS_TRACK3 } from './Car.js';

// contador de voltas e limite
export let lapCount = 0;
export const MAX_LAPS = 4;
// debug flag para logs do sistema de voltas
export let LAP_DEBUG = false;

// função para alterar a flag de debug de fora do módulo
export function setLapDebug(v) {
  LAP_DEBUG = !!v;
}

// Rastreia quem venceu primeiro
export let winner = null; // null = ninguém, 'player' = jogador, 'enemy' = adversário
export let winnerId = null; // id/nome do adversário que venceu (se aplicável)

// Função para marcar vencedor do adversário
export function setEnemyWinner(id = null) {
  if (winner === null) {
    winner = 'enemy';
    winnerId = id;
    gameOver = true;
  }
}

// ============================================================
// CHECKPOINTS — PISTA 1
// ============================================================
export const checkpointsTrack1 = [
  { pos: new THREE.Vector3(START_POS_TRACK1.x, START_POS_TRACK1.y - 0.55, START_POS_TRACK1.z), radius: 20 }, // CP1 (start)
  { pos: new THREE.Vector3(90, START_POS_TRACK1.y - 0.55, START_POS_TRACK1.z),  radius: 20 }, // CP2
  { pos: new THREE.Vector3(90, START_POS_TRACK1.y - 0.55, 90),   radius: 20 }, // CP3
  { pos: new THREE.Vector3(-90, START_POS_TRACK1.y - 0.55, 90),  radius: 20 }, // CP4
  { pos: new THREE.Vector3(START_POS_TRACK1.x - 50, START_POS_TRACK1.y - 0.55, START_POS_TRACK1.z), radius: 20 } // CP4b (novo)
];

let expectedIndex1 = 0;
const checkpointInside1 = [false, false, false, false, false];

// ============================================================
// CHECKPOINTS — PISTA 2 (L)
// ============================================================
export const checkpointsTrack2 = [
  { pos: new THREE.Vector3(START_POS_TRACK2.x, START_POS_TRACK2.y - 0.55, START_POS_TRACK2.z), radius: 20 }, // CP5 - início
  { pos: new THREE.Vector3(90, START_POS_TRACK2.y - 0.55, START_POS_TRACK2.z),  radius: 20 }, // CP6
  { pos: new THREE.Vector3(90, START_POS_TRACK2.y - 0.55, 90),   radius: 20 }, // CP7
  { pos: new THREE.Vector3(-10, START_POS_TRACK2.y - 0.55, 90),  radius: 20 }, // CP8
  { pos: new THREE.Vector3(-10, START_POS_TRACK2.y - 0.55, -10),   radius: 20 }, // CP9
  { pos: new THREE.Vector3(-90, START_POS_TRACK2.y - 0.55, -10), radius: 20 }, // CP10
  { pos: new THREE.Vector3(START_POS_TRACK2.x - 50, START_POS_TRACK2.y - 0.55, START_POS_TRACK2.z), radius: 20 } // CP10b (novo)
];

let expectedIndex2 = 0;
const checkpointInside2 = [false, false, false, false, false, false, false];

// ============================================================
// CHECKPOINTS — PISTA 3 (4 QUADRANTES)
// ============================================================
export const checkpointsTrack3 = [
  { pos: new THREE.Vector3(-40, START_POS_TRACK3.y - 0.55, -90), radius: 20 }, // CP11 - início
  { pos: new THREE.Vector3(0,   START_POS_TRACK3.y - 0.55, -90), radius: 20 }, // CP17
  { pos: new THREE.Vector3(0,   START_POS_TRACK3.y - 0.55, 90),  radius: 20 }, // CP12
  { pos: new THREE.Vector3(80,  START_POS_TRACK3.y - 0.55, 90),  radius: 20 }, // CP18
  { pos: new THREE.Vector3(80,  START_POS_TRACK3.y - 0.55, 10),  radius: 20 }, // CP13
  { pos: new THREE.Vector3(-80, START_POS_TRACK3.y - 0.55, 10),  radius: 20 }, // CP14
  { pos: new THREE.Vector3(-80, START_POS_TRACK3.y - 0.55, -90), radius: 20 }  // CP19
];

let expectedIndex3 = 0;
const checkpointInside3 = [false, false, false, false, false, false, false];

// ============================================================
// game over flag
// ============================================================
let gameOver = false;

// ============================================================
// RESET GERAL
// ============================================================
export function resetLapSystem() {
  lapCount = 0;
  gameOver = false;
  winner = null;
  winnerId = null;

  // pista 1
  expectedIndex1 = 0;
  for (let i = 0; i < checkpointInside1.length; i++) checkpointInside1[i] = false;

  // pista 2
  expectedIndex2 = 0;
  for (let i = 0; i < checkpointInside2.length; i++) checkpointInside2[i] = false;

  // pista 3
  expectedIndex3 = 0;
  for (let i = 0; i < checkpointInside3.length; i++) checkpointInside3[i] = false;
}

// ============================================================
// FUNÇÃO GENÉRICA DE PROCESSAMENTO
// - retorna { expectedIndex, sequenceComplete, lapText }
// ============================================================
function processLap(car, checkpoints, expectedIndex, insideFlags) {
  // se já terminou o jogo, não processa mais
  if (gameOver) return { expectedIndex, lapText: null };

  const n = checkpoints.length;

  // Limpa flags de entrada quando o carro sair fisicamente do checkpoint correspondente
  for (let i = 0; i < n; i++) {
    const d = car.position.distanceTo(checkpoints[i].pos);
    if (insideFlags[i] && d >= checkpoints[i].radius) {
      insideFlags[i] = false;
      if (LAP_DEBUG) console.log(`processLap: EXIT cp=${i}`);
    }
  }

  // verifica apenas o checkpoint esperado (ordem circular)
  const cp = checkpoints[expectedIndex];
  const dist = car.position.distanceTo(cp.pos);
  const isInside = dist < cp.radius;
  if (LAP_DEBUG) console.log(`processLap: checking expected=${expectedIndex} dist=${dist.toFixed(2)} flags=${insideFlags.map(f=>f?1:0).join(',')}`);

  if (isInside && !insideFlags[expectedIndex]) {
    // entrou no checkpoint esperado
    insideFlags[expectedIndex] = true;
    if (LAP_DEBUG) console.log(`processLap: ENTER cp=${expectedIndex}`);

    if (expectedIndex === n - 1) {
      // completou a sequência → conta volta
      lapCount = Math.min(lapCount + 1, MAX_LAPS);
      if (LAP_DEBUG) console.log(`processLap: LAP INCREMENT! lapCount=${lapCount}`);

      if (lapCount >= MAX_LAPS && winner === null) {
        winner = 'player';
        gameOver = true;
        return { expectedIndex: 0, lapText: `Você venceu! 🏆` };
      }

      // prepara próxima volta (retorna ao primeiro checkpoint)
      expectedIndex = 0;
      return { expectedIndex, lapText: `Volta: ${lapCount} / ${MAX_LAPS}` };
    }

    // avança para próximo checkpoint
    expectedIndex = (expectedIndex + 1) % n;
    return { expectedIndex, lapText: null };
  }

  return { expectedIndex, lapText: null };
}

// ============================================================
// FUNÇÃO CHAMADA NO RENDER()
// ============================================================
export function checkLapCount(car, currentTrack) {
  if (gameOver) {
    // quando game over, mostra mensagem baseada no vencedor
    if (winner === 'player') {
      return `Você venceu! 🏆`;
    } else if (winner === 'enemy') {
      return winnerId ? `Adversário ${winnerId} ganhou` : `Adversário ganhou`;
    }
    return `Fim de jogo`;
  }

  if (currentTrack === 1) {
    const res = processLap(car, checkpointsTrack1, expectedIndex1, checkpointInside1);
    expectedIndex1 = res.expectedIndex;
    return res.lapText;
  }

  if (currentTrack === 2) {
    const res = processLap(car, checkpointsTrack2, expectedIndex2, checkpointInside2);
    expectedIndex2 = res.expectedIndex;
    return res.lapText;
  }

  if (currentTrack === 3) {
    const res = processLap(car, checkpointsTrack3, expectedIndex3, checkpointInside3);
    expectedIndex3 = res.expectedIndex;
    return res.lapText;
  }

  return null;
}
