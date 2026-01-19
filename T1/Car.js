// Car.js
import * as THREE from 'three';
    import { CSG } from '../libs/other/CSGMesh.js';
import { setDefaultMaterial, degreesToRadians } from "../libs/util/util.js";


let material = setDefaultMaterial('rgba(189, 82, 32, 1)');
// ------------------------------------------------------------
// POSIÇÕES INICIAIS — 3 PISTAS
// ------------------------------------------------------------
export const START_POS_TRACK1 = new THREE.Vector3(-40, 0.5, -90);
export const START_ROT_TRACK1 = degreesToRadians(0);

export const START_POS_TRACKcar2 = new THREE.Vector3(-40, 0.5, -95);
export const START_ROT_TRACKcar2 = degreesToRadians(0);

export const START_POS_TRACK2 = new THREE.Vector3(-40, 0.5, -90);
export const START_ROT_TRACK2 = degreesToRadians(0);

export const START_POS_TRACK3 = new THREE.Vector3(-40, 0.5, -90);
export const START_ROT_TRACK3 = degreesToRadians(0);


// ------------------------------------------------------------
// FUNÇÃO GENÉRICA DE CRIAÇÃO DO MODELO DO HOVERCRAFT
// (usada tanto para o jogador quanto para o adversário)
// ------------------------------------------------------------
export function buildHovercraft(baseMat, bodyMat, cabineMat, noseMat) {

  const geometry = new THREE.BoxGeometry( 4, 3, 1.5 );
  const geometry2 = new THREE.CylinderGeometry( 1.5, 1.5, 1.5, 14);
  const geometry3 = new THREE.BoxGeometry( 1.8, 0.5, 1.5);
  
  const baseG = new THREE.Mesh(geometry, material);
  const add =new THREE.Mesh(geometry2, material);
  const add2 =new THREE.Mesh(geometry2, material);
  
  baseG.position.set(0, 0.75, 0);
  baseG.rotateX(THREE.MathUtils.degToRad(90));
  updateObject(baseG);
  add.position.set(2, 0.75, 0);
  updateObject(add);
  add2.position.set(-2, 0.75, 0);
  updateObject(add2);
  
  let baseCSG = CSG.fromMesh(baseG);
  baseCSG =baseCSG.union(CSG.fromMesh(add));
  baseCSG =baseCSG.union(CSG.fromMesh(add2));
  
  
  
  const baseMesh = CSG.toMesh(baseCSG, baseG.matrix, material);

  const craft = new THREE.Group();

  const base = baseMesh
  base.position.y = 0.75;
  craft.add(base);

  const body = new THREE.Mesh(
    geometry3,
    bodyMat
  );
  body.position.y = 1.5;
  body.position.x = -1;
  craft.add(body);

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
    accel: 17.0,
    brake: 17.0,
    drag: 15,
    maxSpeed: 30,
    maxReverseSpeed: -30,
    turnSpeed: THREE.MathUtils.degToRad(120)
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
export function resetCarPosition(car,enemy, trackNumber) {
  let newPos, newRot, newPoscar2, newRotcar2;
  if (trackNumber === 1) {
    newPos = START_POS_TRACK1;
    newRot = START_ROT_TRACK1;
    newPoscar2 = START_POS_TRACKcar2;
    newRotcar2 = START_ROT_TRACKcar2;
  } else if (trackNumber === 2) {
    newPos = START_POS_TRACK2;
    newRot = START_ROT_TRACK2;
    newPoscar2 = START_POS_TRACKcar2;
    newRotcar2 = START_ROT_TRACKcar2;
  } else if (trackNumber === 3) {
    newPos = START_POS_TRACK3;
    newRot = START_ROT_TRACK3;
    newPoscar2 = START_POS_TRACKcar2;
    newRotcar2 = START_ROT_TRACKcar2;
  } else {
    newPos = START_POS_TRACK1;
    newRot = START_ROT_TRACK1;
    newPoscar2 = START_POS_TRACKcar2;
    newRotcar2 = START_ROT_TRACKcar2;
  }
  car.position.copy(newPos);
  car.rotation.y = newRot;
  car.userData.speed = 0;
  enemy.position.copy(newPoscar2);
  enemy.rotation.y = newRotcar2;
  enemy.userData.speed = 0;
}


// ------------------------------------------------------------
// MOVIMENTO DO CARRO DO JOGADOR
// ------------------------------------------------------------
export function updateCar(car, delta, moveDirection) {
  const carData = car.userData;

  // Acelerar
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

function updateObject(mesh)
{
   mesh.matrixAutoUpdate = false;
   mesh.updateMatrix();
}