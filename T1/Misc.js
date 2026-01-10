// Misc.js
import * as THREE from 'three';

// contador de voltas e limite
export let lapCount = 0;
export let lapCountEnemy = 0;
export const MAX_LAPS = 4;

// Rastreia quem venceu primeiro
export let winner = null; // null = ninguém, 'player' = jogador, 'enemy' = adversário

// Função para marcar vencedor do adversário
export function setEnemyWinner() {
  if (winner === null) {
    winner = 'enemy';
    gameOver = true;
  }
}

// ============================================================
// CHECKPOINTS — PISTA 1
// ============================================================
export const checkpointsTrack1 = [
  { pos: new THREE.Vector3(-40, 1, -90), radius: 20 }, // CP1
  { pos: new THREE.Vector3(90, 1, -90),  radius: 20 }, // CP2
  { pos: new THREE.Vector3(90, 1, 90),   radius: 20 }, // CP3
  { pos: new THREE.Vector3(-90, 1, 90),  radius: 20 }, // CP4
  { pos: new THREE.Vector3(-90, 1, -90), radius: 20 }  // CP15
];

let expectedIndex1 = 0;
let sequenceComplete1 = false;
const checkpointInside1 = [false, false, false, false, false];

// ============================================================
// CHECKPOINTS — PISTA 2 (L)
// ============================================================
export const checkpointsTrack2 = [
  { pos: new THREE.Vector3(-40, 1, -90), radius: 20 }, // CP5 - início
  { pos: new THREE.Vector3(90, 1, -90),  radius: 20 }, // CP6
  { pos: new THREE.Vector3(90, 1, 90),   radius: 20 }, // CP7
  { pos: new THREE.Vector3(-5,  1, 90),  radius: 20 }, // CP8
  { pos: new THREE.Vector3(-10, 1, 0),   radius: 20 }, // CP9
  { pos: new THREE.Vector3(-90, 1, -10), radius: 20 }, // CP10
  { pos: new THREE.Vector3(-90, 1, -90), radius: 20 }  // CP16
];

let expectedIndex2 = 0;
let sequenceComplete2 = false;
const checkpointInside2 = [false, false, false, false, false, false, false];

// ============================================================
// CHECKPOINTS — PISTA 3 (4 QUADRANTES)
// ============================================================
export const checkpointsTrack3 = [
  { pos: new THREE.Vector3(-40, 1, -90), radius: 20 }, // CP11 - início
  { pos: new THREE.Vector3(0,   1, -90), radius: 20 }, // CP17
  { pos: new THREE.Vector3(0,   1, 90),  radius: 20 }, // CP12
  { pos: new THREE.Vector3(80,  1, 90),  radius: 20 }, // CP18
  { pos: new THREE.Vector3(80,  1, 10),  radius: 20 }, // CP13
  { pos: new THREE.Vector3(-80, 1, 10),  radius: 20 }, // CP14
  { pos: new THREE.Vector3(-80, 1, -90), radius: 20 }  // CP19
];

let expectedIndex3 = 0;
let sequenceComplete3 = false;
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
  lapCountEnemy = 0;
  gameOver = false;
  winner = null;

  // pista 1
  expectedIndex1 = 0;
  sequenceComplete1 = false;
  for (let i = 0; i < checkpointInside1.length; i++) checkpointInside1[i] = false;

  // pista 2
  expectedIndex2 = 0;
  sequenceComplete2 = false;
  for (let i = 0; i < checkpointInside2.length; i++) checkpointInside2[i] = false;

  // pista 3
  expectedIndex3 = 0;
  sequenceComplete3 = false;
  for (let i = 0; i < checkpointInside3.length; i++) checkpointInside3[i] = false;
}

// ============================================================
// FUNÇÃO GENÉRICA DE PROCESSAMENTO
// - retorna { expectedIndex, sequenceComplete, lapText }
// ============================================================
function processLap(car, checkpoints, expectedIndex, sequenceComplete, insideFlags) {
  // se já terminou o jogo, não processa mais
  if (gameOver) return { expectedIndex, sequenceComplete, lapText: null };

  const idxToCheck = sequenceComplete ? 0 : expectedIndex;
  const cp = checkpoints[idxToCheck];

  const dist = car.position.distanceTo(cp.pos);
  const isInside = dist < cp.radius;

  // ENTER
  if (isInside && !insideFlags[idxToCheck]) {
    insideFlags[idxToCheck] = true;

    if (!sequenceComplete) {
      expectedIndex++;

      // completou todos → agora precisa voltar ao CP inicial
      if (expectedIndex >= checkpoints.length) {
        sequenceComplete = true;
        expectedIndex = checkpoints.length - 1;
      }

      return { expectedIndex, sequenceComplete, lapText: null };
    }

    // sequenceComplete === true e entrou no CP inicial -> conta volta
    lapCount = Math.min(lapCount + 1, MAX_LAPS);

    // se chegou ao max, marca vitória do jogador
    if (lapCount >= MAX_LAPS && winner === null) {
      winner = 'player';
      gameOver = true;
      return { expectedIndex: checkpoints.length - 1, sequenceComplete: false, lapText: `Você venceu! 🏆` };
    }
    
    // Se já tem um vencedor, mantém a mensagem
    if (gameOver && winner === 'player') {
      return { expectedIndex: checkpoints.length - 1, sequenceComplete: false, lapText: `Você venceu! 🏆` };
    }

    // caso ainda não tenha atingido MAX_LAPS, prepara próxima volta
    sequenceComplete = false;
    expectedIndex = 1; // já passou CP1 agora, próximo é CP2

    return { expectedIndex, sequenceComplete, lapText: `Volta: ${lapCount} / ${MAX_LAPS}` };
  }

  // EXIT (sair do checkpoint) — limpa flag para permitir re-trigger
  if (!isInside && insideFlags[idxToCheck]) {
    insideFlags[idxToCheck] = false;
  }

  return { expectedIndex, sequenceComplete, lapText: null };
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
      return `Adversário ganhou`;
    }
    return `Fim de jogo`;
  }

  if (currentTrack === 1) {
    const res = processLap(car, checkpointsTrack1, expectedIndex1, sequenceComplete1, checkpointInside1);
    expectedIndex1 = res.expectedIndex;
    sequenceComplete1 = res.sequenceComplete;
    return res.lapText;
  }

  if (currentTrack === 2) {
    const res = processLap(car, checkpointsTrack2, expectedIndex2, sequenceComplete2, checkpointInside2);
    expectedIndex2 = res.expectedIndex;
    sequenceComplete2 = res.sequenceComplete;
    return res.lapText;
  }

  if (currentTrack === 3) {
    const res = processLap(car, checkpointsTrack3, expectedIndex3, sequenceComplete3, checkpointInside3);
    expectedIndex3 = res.expectedIndex;
    sequenceComplete3 = res.sequenceComplete;
    return res.lapText;
  }

  return null;
}
