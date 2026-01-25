// Car.js
import * as THREE from 'three';
import { CSG } from '../libs/other/CSGMesh.js';
import { setDefaultMaterial, degreesToRadians } from "../libs/util/util.js";

// ------------------------------------------------------------
// POSIÇÕES INICIAIS — 3 PISTAS
// ------------------------------------------------------------
export const START_POS_TRACK1 = new THREE.Vector3(-40, 10.5, -90);
export const START_ROT_TRACK1 = degreesToRadians(0);

export const START_POS_TRACK2 = new THREE.Vector3(-40, 10.5, -90);
export const START_ROT_TRACK2 = degreesToRadians(0);

export const START_POS_TRACK3 = new THREE.Vector3(-40, 10.5, -90);
export const START_ROT_TRACK3 = degreesToRadians(0);

// ------------------------------------------------------------
// FUNÇÃO GENÉRICA DE CRIAÇÃO DO MODELO DO HOVERCRAFT
// (usada tanto para o jogador quanto para o adversário)
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
// CARRO DO JOGADOR
// ------------------------------------------------------------
export function createCar(scene) {

  const car = buildHovercraft(
    setDefaultMaterial('rgb(255,100,100)'), // base
    setDefaultMaterial('rgb(255,0,0)'),     // corpo
    setDefaultMaterial('rgb(255,255,255)'), // cabine
    setDefaultMaterial('rgb(255,0,0)')      // nariz
  );

  // posição inicial padrão
  car.position.set(-100.0, 0, -100.0);

  car.userData = {
    speed: 0,
    health: 100,
    maxShotsPerLap: 4,
    shotsRemaining: 4,
    accel: 17.0,
    brake: 17.0,
    drag: 15,
    maxSpeed: 30,
    maxReverseSpeed: -30,
    turnSpeed: THREE.MathUtils.degToRad(120),
    isPlayer: true,
    projectiles: []
  };
  scene.add(car);
  return car;
}


// ------------------------------------------------------------
// CARRO ADVERSÁRIO (NOVO)
// ------------------------------------------------------------
export function createEnemyCar(scene) {

  // Materiais foscos (Lambert)
  const matteRed    = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
  const matteBlue   = new THREE.MeshLambertMaterial({ color: 0x0033aa });

  // Material brilhante (Phong)
  const shinyYellow = new THREE.MeshPhongMaterial({
    color: 0xffff00,
    shininess: 100
  });

  // Cria hovercraft adversário
  const enemy = buildHovercraft(
    matteBlue,     // base fosca azul
    shinyYellow,   // corpo brilhante amarelo
    matteRed,      // cabine fosca vermelha
    shinyYellow    // nariz brilhante amarelo
  );

  enemy.position.set(-110, 0.5, -100);
  enemy.rotation.y = 0;

  enemy.userData = {
    speed: 0,
    accel: 12.0,
    brake: 10.0,
    drag: 10,
    maxSpeed: 18,
    turnSpeed: THREE.MathUtils.degToRad(70),

    // controle do bot
    aiEnabled: true,
    aiTargetIndex: 0
  };

  scene.add(enemy);
  return enemy;
}


// ------------------------------------------------------------
// RESET DO CARRO POR PISTA
// ------------------------------------------------------------
export function resetCarPosition(car, trackNumber) {
  let newPos, newRot;
  if (trackNumber === 1) {
    newPos = START_POS_TRACK1;
    newRot = START_ROT_TRACK1;
  } else if (trackNumber === 2) {
    newPos = START_POS_TRACK2;
    newRot = START_ROT_TRACK2;
  } else if (trackNumber === 3) {
    newPos = START_POS_TRACK3;
    newRot = START_ROT_TRACK3;
  } else {
    newPos = START_POS_TRACK1;
    newRot = START_ROT_TRACK1;
  }
  car.position.set(newPos.x, newPos.y - 0.4, newPos.z);
  car.rotation.y = newRot;
  car.userData.speed = 0;
}

// ------------------------------------------------------------
// MOVIMENTO DO CARRO DO JOGADOR
// ------------------------------------------------------------
export function updateCar(car, delta, moveDirection) {
  const carData = car.userData;

  // Acelerar (mesmo quando penalizado — `accel` pode ter sido reduzido pela penalidade)
  if (moveDirection.forward)
    carData.speed += carData.accel * delta;
  else if ((carData.speed - carData.drag * delta) >= 0)
    carData.speed -= carData.drag * delta;

  // Frear / Ré
  if (moveDirection.backward)
    carData.speed -= carData.brake * delta;
  else if ((carData.speed + carData.drag * delta) <= 0)
    carData.speed += carData.drag * delta;

  // Limites
  carData.speed = THREE.MathUtils.clamp(
    carData.speed,
    carData.maxReverseSpeed,
    carData.maxSpeed
  );

  // Girar
  if (moveDirection.left)
    car.rotation.y += carData.turnSpeed * delta;
  else if (moveDirection.right)
    car.rotation.y -= carData.turnSpeed * delta;

  // Mover
  car.translateX(carData.speed * delta);
}

function updateObject(mesh) {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
}