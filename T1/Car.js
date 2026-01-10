// Car.js
import * as THREE from 'three';
import { setDefaultMaterial, degreesToRadians } from "../libs/util/util.js";

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
  car.position.set(-100.0, -0.5, -100.0);

  car.userData = {
    speed: 0,
    accel: 17.0,
    brake: 17.0,
    drag: 15,
    maxSpeed: 30,
    maxReverseSpeed: -30,
    turnSpeed: THREE.MathUtils.degToRad(120)
  };

  car.traverse(obj => {
    if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
    }
});

  scene.add(car);
  return car;
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
  car.position.copy(newPos);
  car.rotation.y = newRot;
  car.userData.speed = 0;
  

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

  // Mover usando a velocidade atual na direção que está olhando
  const forwardDir = new THREE.Vector3(
    Math.cos(car.rotation.y),
    0,
    -Math.sin(car.rotation.y)
  );
  car.position.addScaledVector(forwardDir, carData.speed * delta);
}