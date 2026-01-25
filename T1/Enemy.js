// Enemy.js
import * as THREE from 'three';
import { degreesToRadians } from "../libs/util/util.js";
import { START_POS_TRACK1, START_POS_TRACK2, START_POS_TRACK3 } from './Car.js';
import {
  checkpointsTrack1,
  checkpointsTrack2,
  checkpointsTrack3,
  MAX_LAPS,
  setEnemyWinner
} from './Misc.js';

export const START_ROT_TRACKcar2 = degreesToRadians(0);


// ------------------------------------------------------------
// FUNÇÃO GENÉRICA DE CRIAÇÃO DO MODELO DO HOVERCRAFT
// (usada para o adversário)
// ------------------------------------------------------------
function buildHovercraft(baseMat, bodyMat, cabineMat, noseMat) {
  const craft = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.25, 16, 32),
    baseMat
  );
  base.rotation.x = Math.PI / 2;
  craft.add(base);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.4, 0.8, 16),
    bodyMat
  );
  body.position.y = 0.55;
  craft.add(body);

  const cabine = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.5, 0.7),
    cabineMat
  );
  cabine.position.set(0, 1.0, 0);
  craft.add(cabine);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 1.0, 16),
    noseMat
  );
  nose.rotation.z = Math.PI / 2;
  nose.position.set(1.7, 0.35, 0);
  nose.name = 'nose';
  craft.add(nose);

  return craft;
}

// ------------------------------------------------------------
// CARRO ADVERSÁRIO
// ------------------------------------------------------------
export function createEnemyCar(scene, id = null) {
  const matteRed = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
  const matteBlue = new THREE.MeshLambertMaterial({ color: 0x0033aa });
  const shinyYellow = new THREE.MeshPhongMaterial({
    color: 0xffff00,
    shininess: 100
  });

  const enemy = buildHovercraft(
    matteBlue,
    shinyYellow,
    matteRed,
    shinyYellow
  );

  enemy.position.set(-110, START_POS_TRACK1.y - 0.4, -100);
  enemy.rotation.y = 0;

  enemy.userData = {
    speed: 0,
    health: 100,
    maxShotsPerLap: 4,
    shotsRemaining: 4,
    accel: 12.0,
    brake: 10.0,
    drag: 10,
    maxSpeed: 18,
    turnSpeed: THREE.MathUtils.degToRad(70),
    aiEnabled: true,
    aiTargetIndex: 0,
    id: id,
    projectiles: [],
    shootCooldown: Math.random() * 2 + 1,
    prevLapCount: 0,
    ai: {
      checkpointIndex: { 1: 0, 2: 0, 3: 0 },
      insideCheckpoint: { 1: false, 2: false, 3: false },
      targetRotation: { 1: null, 2: null },
      lapCount: { 1: 0, 2: 0, 3: 0 }
    }
  };

  enemy.name = id != null ? `enemy${id}` : enemy.name;

  enemy.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  scene.add(enemy);
  return enemy;
}

// ------------------------------------------------------------
// RESET DO CARRO INIMIGO POR PISTA
// ------------------------------------------------------------
export function resetEnemyPosition(enemy, trackNumber) {
  let basePos = START_POS_TRACK1.clone();
  const newRot = START_ROT_TRACKcar2;
  if (trackNumber === 1) basePos.copy(START_POS_TRACK1);
  else if (trackNumber === 2) basePos.copy(START_POS_TRACK2);
  else if (trackNumber === 3) basePos.copy(START_POS_TRACK3);

  const baseX = basePos.x;
  const baseY = basePos.y - 0.4;
  const baseZ = basePos.z;

  const id = enemy.userData && enemy.userData.id ? enemy.userData.id : 1;
  let offX = 0, offZ = 0;
  if (id === 1) { offX = 0; offZ = 10; }
  else if (id === 2) { offX = -10; offZ = 0; }
  else if (id === 3) { offX = -10; offZ = 10; }

  enemy.position.set(baseX + offX, baseY, baseZ + offZ);
  enemy.rotation.y = newRot;
  enemy.userData.speed = 0;

  if (!enemy.userData.ai) {
    enemy.userData.ai = {
      checkpointIndex: { 1: 0, 2: 0, 3: 0 },
      insideCheckpoint: { 1: false, 2: false, 3: false },
      targetRotation: { 1: null, 2: null },
      lapCount: { 1: 0, 2: 0, 3: 0 }
    };
  }

  enemy.userData.ai.checkpointIndex[trackNumber] = 0;
  enemy.userData.ai.insideCheckpoint[trackNumber] = false;
  enemy.userData.ai.targetRotation[trackNumber] = null;
}

export const enemySpeed = 28;

// ------------------------------------------------------------
// FUNÇÃO PRINCIPAL — IA DO INIMIGO
// ------------------------------------------------------------
export function updateEnemyCar(enemyCar, delta, currentTrack) {
  let checkpoints = null;

  if (currentTrack === 1) checkpoints = checkpointsTrack1;
  else if (currentTrack === 2) checkpoints = checkpointsTrack2;
  else if (currentTrack === 3) checkpoints = checkpointsTrack3;

  if (!checkpoints || checkpoints.length === 0) return;

  const ai = enemyCar.userData.ai || {
    checkpointIndex: { 1: 0, 2: 0, 3: 0 },
    insideCheckpoint: { 1: false, 2: false, 3: false },
    targetRotation: { 1: null, 2: null },
    lapCount: { 1: 0, 2: 0, 3: 0 }
  };

  let idx = ai.checkpointIndex[currentTrack];

  if (idx < 0) idx = 0;
  if (idx >= checkpoints.length) idx = idx % checkpoints.length;

  ai.checkpointIndex[currentTrack] = idx;

  const currentCheckpoint = checkpoints[idx];
  const target = currentCheckpoint.pos;
  const checkpointRadius = currentCheckpoint.radius || 20;

  let direction, distance, isInside, wasInside;

  direction = new THREE.Vector3().subVectors(target, enemyCar.position);
  distance = direction.length();
  const detectionRadius = currentTrack === 3 ? 20 : 8;
  isInside = distance < detectionRadius;
  wasInside = ai.insideCheckpoint[currentTrack];

  if (isInside && !wasInside) {
    const nextIdx = (idx + 1) % checkpoints.length;

    if (nextIdx === 0 && idx === checkpoints.length - 1) {
      ai.lapCount[currentTrack] = Math.min(ai.lapCount[currentTrack] + 1, MAX_LAPS);
      if (ai.lapCount[currentTrack] >= MAX_LAPS) {
        setEnemyWinner(enemyCar.userData.id);
      }
    }

    ai.checkpointIndex[currentTrack] = nextIdx;
    ai.insideCheckpoint[currentTrack] = false;
  } else if (isInside) {
    ai.insideCheckpoint[currentTrack] = true;
  } else {
    ai.insideCheckpoint[currentTrack] = false;
  }

  direction.normalize();
  const targetRotation = Math.atan2(-direction.z, direction.x);

  let angleDiff = targetRotation - enemyCar.rotation.y;
  if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  else if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  const turnSpeed = THREE.MathUtils.degToRad(currentTrack === 3 ? 80 : 100);
  const maxRotationStep = turnSpeed * delta;
  const rotationStep = THREE.MathUtils.clamp(angleDiff, -maxRotationStep, maxRotationStep);
  enemyCar.rotation.y += rotationStep;

  const targetSpeed = enemySpeed;
  const currentSpeed = enemyCar.userData.speed || 0;
  const accel = enemyCar.userData.accel || 12.0;

  if (currentSpeed < targetSpeed) {
    const speedIncrease = accel * delta;
    enemyCar.userData.speed = Math.min(currentSpeed + speedIncrease, targetSpeed);
  } else if (currentSpeed > targetSpeed) {
    const speedDiff = targetSpeed - currentSpeed;
    enemyCar.userData.speed = currentSpeed + speedDiff * delta * 3;
  } else {
    enemyCar.userData.speed = targetSpeed;
  }

  const forwardDir = new THREE.Vector3(
    Math.cos(enemyCar.rotation.y),
    0,
    -Math.sin(enemyCar.rotation.y)
  );
  enemyCar.position.addScaledVector(forwardDir, enemyCar.userData.speed * delta);
}

