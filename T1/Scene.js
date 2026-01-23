// Scene.js
import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js';
import { criaArvoresQuadrado, criaArvoresL, criaArvoresQuatroQuadrantes, criaTunel } from './Elements.js';
import { initRenderer } from './Renderer.js';
import { initLight, updateLightFollow } from './Light.js';
import {
  setDefaultMaterial,
  InfoBox,
  SecondaryBox,
  onWindowResize
} from "../libs/util/util.js";

import { createCar, resetCarPosition, updateCar } from './Car.js';
import { createEnemyCar, updateEnemyCar, resetEnemyCheckpointIndex, resetEnemyPosition } from './Enemy.js';
import { createTrack, track1, track2, track3 } from './Track.js';

import {
  createSquareWalls,
  createLWalls,
  createThirdWalls,
  groupSquareWalls,
  groupLWalls,
  groupThirdWalls,
  barreirasTrack1,
  barreirasTrack2,
  barreirasTrack3
} from './Walls.js';

import { createGroundPlane } from './Ground.js';
import { updateCameraFollow } from './Camera.js';
import { checkLapCount, resetLapSystem, MAX_LAPS, winner } from './Misc.js';

import { Skybox } from './Texture.js';

// ------------------------------------------------------------
// SCENE
// ------------------------------------------------------------
export const scene = new THREE.Scene();
Skybox(scene);

// ------------------------------------------------------------
// MATERIALS
// ------------------------------------------------------------
const materialPista = setDefaultMaterial('rgb(200,200,200)');
const materialChao = setDefaultMaterial('rgb(34,139,34)');

// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------
export let currentTrack = 1;

// ------------------------------------------------------------
// CAR (PLAYER) e INIMIGO
// ------------------------------------------------------------
export const car = createCar(scene);
export const enemyCar = createEnemyCar(scene);

// ------------------------------------------------------
// Criação da iluminação e renderer
// ------------------------------------------------------

const dirLight = initLight(scene, car);
export const renderer = initRenderer();

// ------------------------------------------------------------
// CAMERA
// ------------------------------------------------------------
export const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(car.position.x - 15, car.position.y + 4, car.position.z);
camera.up.set(0, 1, 0);
camera.lookAt(car.position);
scene.add(camera);

// ------------------------------------------------------------
// HUD – Velocidade
// ------------------------------------------------------------
const speedBox = new SecondaryBox("");
speedBox.changeMessage("Velocidade: " + Number(car.userData.speed).toFixed(0));

// ------------------------------------------------------------
// HUD – Voltas
// ------------------------------------------------------------
const lapDiv = document.createElement("div");
lapDiv.id = "lap-counter";
lapDiv.style.position = "absolute";
lapDiv.style.right = "20px";
lapDiv.style.bottom = "20px";
lapDiv.style.padding = "6px 10px";
lapDiv.style.background = "rgba(0,0,0,0.6)";
lapDiv.style.color = "white";
lapDiv.style.borderRadius = "6px";
lapDiv.style.zIndex = "9999";
lapDiv.style.fontFamily = "Arial";
lapDiv.style.fontSize = "14px";
lapDiv.style.textAlign = "right";
lapDiv.innerText = "Volta: 0 / " + MAX_LAPS;
document.body.appendChild(lapDiv);

// ------------------------------------------------------------
// KEYBOARD
// ------------------------------------------------------------
window.addEventListener('resize', () => onWindowResize(camera, renderer), false);
const keyboard = new KeyboardState();
const clock = new THREE.Clock();
const moveDirection = { forward: false, backward: false, left: false, right: false };

// ------------------------------------------------------------
// INFOBOX
// ------------------------------------------------------------
const controls = new InfoBox();
controls.infoBox.style.top = "0px";
controls.add("Car Race");
controls.addParagraph();
controls.add("* Seta ← → para girar");
controls.add("* Seta ↑ / X para acelerar");
controls.add("* Seta ↓ para frear");
controls.add("* Tecla 1 = Pista Quadrada");
controls.add("* Tecla 2 = Pista L");
controls.add("* Tecla 3 = Pista Formato em 8");
controls.show();

// ------------------------------------------------------------
// CREATE WORLD
// ------------------------------------------------------------
createTrack(scene, materialPista);
createGroundPlane(scene,1);

// Walls creation
createSquareWalls();
createLWalls();
createThirdWalls();

// Add groups to scene
scene.add(groupSquareWalls);
scene.add(groupLWalls);
scene.add(groupThirdWalls);

// Initial visibility
groupSquareWalls.visible = true;
groupLWalls.visible = false;
groupThirdWalls.visible = false;

track1.visible = true;
track2.visible = false;
track3.visible = false;

// ------------------------------------------------------------
// ARVORES EM VOLTA DAS PISTAS
// ------------------------------------------------------------
let arvoresAtuais = [];
function removeArvores() {
  for (const arvore of arvoresAtuais) {
    scene.remove(arvore);
  }
  arvoresAtuais = [];
}
// Cria árvores da pista quadrada inicialmente
arvoresAtuais = criaArvoresQuadrado(scene);

//cria tunel

const tunel = criaTunel(scene);
tunel.position.set(-90, -6, 0);
scene.add(tunel);

// ------------------------------------------------------------
// KEYBOARD UPDATE
// ------------------------------------------------------------
function keyboardUpdate() {
  keyboard.update();

  moveDirection.forward  = keyboard.pressed("up") || keyboard.pressed("X");
  moveDirection.backward = keyboard.pressed("down");
  moveDirection.left     = keyboard.pressed("left");
  moveDirection.right    = keyboard.pressed("right");


  // TRACK 1
  if (keyboard.down("1") && currentTrack !== 1) {
    currentTrack = 1;
    createGroundPlane(scene,currentTrack);
    track1.visible = true;
    track2.visible = false;
    track3.visible = false;
    groupSquareWalls.visible = true;
    groupLWalls.visible = false;
    groupThirdWalls.visible = false;

    resetCarPosition(car, enemyCar, 1);
    resetEnemyPosition(enemyCar, 1);
    resetEnemyCheckpointIndex(); // Reseta o checkpoint do adversário
    resetLapSystem();
    lapDiv.innerText = "Volta: 0 / " + MAX_LAPS;
    removeArvores();
    arvoresAtuais = criaArvoresQuadrado(scene);
  }

  // TRACK 2
  if (keyboard.down("2") && currentTrack !== 2) {
    currentTrack = 2;
    createGroundPlane(scene,currentTrack);
    track1.visible = false;
    track2.visible = true;
    track3.visible = false;
    groupSquareWalls.visible = false;
    groupLWalls.visible = true;
    groupThirdWalls.visible = false;

    resetCarPosition(car, enemyCar, 2);
    resetEnemyPosition(enemyCar, 2);
    resetEnemyCheckpointIndex(); // Reseta o checkpoint do adversário
    resetLapSystem();
    lapDiv.innerText = "Volta: 0 / " + MAX_LAPS;
    removeArvores();
    arvoresAtuais = criaArvoresL(scene);
    scene.remove(tunel);
    tunel.position.set(-90, -6, -50);
    scene.add(tunel);
  }

  // TRACK 3 (NOVA)
  if (keyboard.down("3") && currentTrack !== 3) {
    currentTrack = 3;
    createGroundPlane(scene,currentTrack);
    track1.visible = false;
    track2.visible = false;
    track3.visible = true;
    groupSquareWalls.visible = false;
    groupLWalls.visible = false;
    groupThirdWalls.visible = true;

    resetCarPosition(car, enemyCar, 3);
    resetEnemyPosition(enemyCar, 3);
    resetEnemyCheckpointIndex(); // Reseta o checkpoint do adversário
    resetLapSystem();
    lapDiv.innerText = "Volta: 0 / " + MAX_LAPS;
    removeArvores();
    arvoresAtuais = criaArvoresQuatroQuadrantes(scene);
    scene.remove(tunel);
    tunel.position.set(-80, -6, -50);
    scene.add(tunel);
  }
}

// ------------------------------------------------------------
// COLLISIONS
// ------------------------------------------------------------
// Função genérica para verificar colisão de qualquer veículo
function checkVehicleCollision(vehicle, track) {
  const vehicleBB = new THREE.Box3().setFromObject(vehicle);
  const vehicleDir = new THREE.Vector3(Math.cos(vehicle.rotation.y), 0, -Math.sin(vehicle.rotation.y));

  const list = track === 1 ? barreirasTrack1 :
              track === 2 ? barreirasTrack2 :
                             barreirasTrack3;

  for (const { mesh, bb } of list) {
    bb.setFromObject(mesh);

    if (vehicleBB.intersectsBox(bb)) {
      // ======= Detecta sobreposição =======
      const overlapX = Math.min(vehicleBB.max.x, bb.max.x) - Math.max(vehicleBB.min.x, bb.min.x);
      const overlapZ = Math.min(vehicleBB.max.z, bb.max.z) - Math.max(vehicleBB.min.z, bb.min.z);

      let normal = new THREE.Vector3();
      if (overlapX < overlapZ) {
        normal.set(vehicle.position.x > mesh.position.x ? 1 : -1, 0, 0);
      } else {
        normal.set(0, 0, vehicle.position.z > mesh.position.z ? 1 : -1);
      }

      // Corrige posição suavemente (com interpolação)
      const correction = normal.clone().multiplyScalar(Math.min(overlapX, overlapZ) * 0.9);
      vehicle.position.add(correction.multiplyScalar(1.4)); // menos agressivo

      // ======= Cálculo do ângulo e fator de desaceleração =======
      const vehicleSpeed = vehicle.userData.speed || 0;
      const movementDir = vehicleDir.clone().multiplyScalar(Math.sign(vehicleSpeed) || 1);
      const angle = movementDir.angleTo(normal);

      // Reduz mais se o ângulo for frontal
      const factor = Math.max(0, Math.min(1, (angle - Math.PI / 2) / (Math.PI / 2))); // 0..1
      const reduction = 0.02 + factor * 0.05; // máximo 7% da velocidade

      // ======= Aplica deslize =======
      // remove a componente perpendicular e mantém a paralela (deslizamento)
      const slideDir = movementDir.clone().sub(normal.clone().multiplyScalar(movementDir.dot(normal)));
      slideDir.normalize();

      const newSpeed = Math.max(0, Math.abs(vehicleSpeed) * (1 - reduction));
      if (vehicle.userData.speed !== undefined) {
        vehicle.userData.speed = Math.sign(vehicleSpeed) * newSpeed;
      }

      // Move levemente no sentido do deslize
      vehicle.position.add(slideDir.multiplyScalar(newSpeed * 0.05));

      return true;
    }
  }
  return false;
}

// Função de compatibilidade para o carro do jogador
function checkCollision(track) {
  return checkVehicleCollision(car, track);
}

// ------------------------------------------------------------
// COLISÃO ENTRE OS DOIS CARROS
// ------------------------------------------------------------
function checkCarToCarCollision(car1, car2) {
  const car1BB = new THREE.Box3().setFromObject(car1);
  const car2BB = new THREE.Box3().setFromObject(car2);

  if (car1BB.intersectsBox(car2BB)) {
    const overlapX = Math.min(car1BB.max.x, car2BB.max.x) - Math.max(car1BB.min.x, car2BB.min.x);
    const overlapZ = Math.min(car1BB.max.z, car2BB.max.z) - Math.max(car1BB.min.z, car2BB.min.z);

    let normal = new THREE.Vector3();
    let correction = new THREE.Vector3();

    if (overlapX < overlapZ) {
      normal.set(car1.position.x > car2.position.x ? 1 : -1, 0, 0);
      correction.copy(normal).multiplyScalar(overlapX / 2 + 0.05);
    } else {
      normal.set(0, 0, car1.position.z > car2.position.z ? 1 : -1);
      correction.copy(normal).multiplyScalar(overlapZ / 2 + 0.05);
    }

    car1.position.add(correction);
    car2.position.sub(correction);

    const car1Speed = car1.userData.speed !== undefined ? car1.userData.speed : 0;
    const car2Speed = car2.userData.speed !== undefined ? car2.userData.speed : 0;

    const car1Dir = new THREE.Vector3(Math.cos(car1.rotation.y), 0, -Math.sin(car1.rotation.y));
    const car2Dir = new THREE.Vector3(Math.cos(car2.rotation.y), 0, -Math.sin(car2.rotation.y));

    const car1Vel = car1Dir.clone().multiplyScalar(car1Speed);
    const car2Vel = car2Dir.clone().multiplyScalar(car2Speed);
    const relativeVel = car1Vel.clone().sub(car2Vel);
    const impact = relativeVel.dot(normal);

    if (impact < 0) {
      const bounceFactor = 0.3;
      const impulse = impact * bounceFactor;

      if (car1.userData.speed !== undefined) {
        const newSpeed1 = Math.max(0, car1Speed + impulse * 0.5);
        car1.userData.speed = Math.sign(car1Speed) * newSpeed1;
      }

      if (car2.userData.speed !== undefined) {
        const newSpeed2 = Math.max(0, car2Speed - impulse * 0.5);
        car2.userData.speed = Math.sign(car2Speed) * newSpeed2;
      }
    }

    return true;
  }

  return false;
}

// ------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------
function render() {
  keyboardUpdate();

  const delta = clock.getDelta();
  updateCar(car, delta, moveDirection);
  updateEnemyCar(enemyCar, delta, currentTrack);
  updateCameraFollow(camera, car, moveDirection);
  updateLightFollow(car, dirLight);

  // Verifica colisões para ambos os veículos
  checkCollision(currentTrack);
  checkVehicleCollision(enemyCar, currentTrack);
  
  // Verifica colisão entre os dois carros
  checkCarToCarCollision(car, enemyCar);

  const lapText = checkLapCount(car, currentTrack);
  if (lapText !== null) {
    // Se há um vencedor, mostra a mensagem apropriada
    if (winner === 'player') {
      lapDiv.innerText = 'Você venceu! 🏆';
    } else if (winner === 'enemy') {
      lapDiv.innerText = 'Adversário ganhou';
    } else {
      lapDiv.innerText = lapText;
    }
  } else if (winner === 'enemy') {
    // Se o adversário ganhou mas o jogador ainda não completou, mostra mensagem
    lapDiv.innerText = 'Adversário ganhou';
  }

  speedBox.changeMessage("Velocidade: " + Number(car.userData.speed).toFixed(0));

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------
resetCarPosition(car, enemyCar, 1);
resetEnemyPosition(enemyCar, 1);
resetEnemyCheckpointIndex();
render();
