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

import { createCar, resetCarPosition, updateCar, START_POS_TRACK1, START_POS_TRACK2, START_POS_TRACK3 } from './Car.js';
import { shootFromCar, updateProjectiles } from './Shoot.js';
import { createEnemyCar, updateEnemyCar, resetEnemyPosition } from './Enemy.js';
import { createTrack, track1, track2, track3, updateWaterEffects } from './Track.js';

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
import { checkLapCount, resetLapSystem, MAX_LAPS, winner, winnerId, lapCount, checkpointsTrack1, checkpointsTrack2, checkpointsTrack3, setLapDebug } from './Misc.js';

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
// controla se a corrida está rodando (movimento/IA/projéteis ativos)
export let raceRunning = false;
let countdownActive = false;

// ------------------------------------------------------------
// CAR (PLAYER) e INIMIGO
// ------------------------------------------------------------
export const car = createCar(scene);
export const enemies = [];
for (let i = 0; i < 3; i++) enemies.push(createEnemyCar(scene, i + 1));

// Define formação inicial dos veículos: chamada no init e após resets de pista
function setInitialFormation(trackNumber = 1) {
  if (enemies.length < 3) return;

  // Determina START_POS conforme a pista
  let basePos = START_POS_TRACK1.clone();
  if (trackNumber === 2) basePos.copy(START_POS_TRACK2);
  else if (trackNumber === 3) basePos.copy(START_POS_TRACK3);

  // aplica reset das posições principais (mantém o mesmo comportamento de resetCarPosition)
  resetCarPosition(car, trackNumber);

  const baseX = basePos.x;
  const baseY = basePos.y - 0.4; // mesma altura aplicada em reset
  const baseZ = basePos.z;


  // Posições relativas pedidas:
  // - adversário 2 (enemies[1]) fica 10 unidades à frente do carro (Z +10)
  // - adversário 3 (enemies[2]) fica 10 unidades "à esquerda" do carro (Z -10)
  // - adversário 1 (enemies[0]) fica 10 unidades à frente do adversário 3 (ou seja, enemies[2].z + 10)
  enemies[1].position.set(baseX+5, baseY, baseZ );        // adversário 2: à frente do carro
  enemies[2].position.set(baseX, baseY, baseZ-5);        // adversário 3: à esquerda/atrás do carro
  enemies[0].position.set(baseX+5, baseY, baseZ - 5); // adversário 1: à frente do adversário 3

  // alinha rotações e zera velocidades
  enemies.forEach(e => { e.rotation.y = 0; if (e.userData) e.userData.speed = 0; });
}

// ------------------------------------------------------
// Criação da iluminação e renderer
// ------------------------------------------------------

const dirLight = initLight(scene, car);
export const renderer = initRenderer();

// ------------------------------------------------------------
// CAMERA
// ------------------------------------------------------------

// habilita logs de depuração do sistema de voltas (ajuste para false após depuração)
setLapDebug(true);

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

// HUD – Munição por volta
const shotsDiv = document.createElement("div");
shotsDiv.id = "shots-counter";
shotsDiv.style.position = "absolute";
shotsDiv.style.left = "20px";
shotsDiv.style.bottom = "60px";
shotsDiv.style.padding = "6px 10px";
shotsDiv.style.background = "rgba(0,0,0,0.6)";
shotsDiv.style.color = "white";
shotsDiv.style.borderRadius = "6px";
shotsDiv.style.zIndex = "9999";
shotsDiv.style.fontFamily = "Arial";
shotsDiv.style.fontSize = "14px";
shotsDiv.style.textAlign = "left";
document.body.appendChild(shotsDiv);

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
// HUD – Contagem regressiva (overlay central)
// ------------------------------------------------------------
const countdownDiv = document.createElement("div");
countdownDiv.id = "countdown-overlay";
countdownDiv.style.position = "absolute";
countdownDiv.style.top = "50%";
countdownDiv.style.left = "50%";
countdownDiv.style.transform = "translate(-50%, -50%)";
countdownDiv.style.padding = "20px 30px";
countdownDiv.style.background = "rgba(0,0,0,0.7)";
countdownDiv.style.color = "white";
countdownDiv.style.borderRadius = "8px";
countdownDiv.style.zIndex = "10000";
countdownDiv.style.fontFamily = "Arial";
countdownDiv.style.fontSize = "48px";
countdownDiv.style.textAlign = "center";
countdownDiv.style.display = "none";
document.body.appendChild(countdownDiv);

// ------------------------------------------------------------
// SONS — tenta carregar os arquivos de início em vários prefixes
// ------------------------------------------------------------
const startFileNames = ['start01.mp3', 'start02.mp3'];
const startSounds = [];
let nextStartSoundIndex = 0;

function tryLoadAudioWithBases(filename, bases, onLoaded, onFail) {
  let i = 0;
  function tryNext() {
    if (i >= bases.length) { if (onFail) onFail(); return; }
    const src = bases[i] + '0_assets_T3/' + filename;
    const a = new Audio();
    a.preload = 'auto';
    let handled = false;
    a.addEventListener('canplaythrough', () => { if (handled) return; handled = true; onLoaded(a); });
    a.addEventListener('error', () => { if (handled) return; handled = true; i++; tryNext(); });
    a.src = src;
    // start loading
    a.load();
  }
  tryNext();
}

// candidate bases: tente primeiro o root absoluto (location.origin), depois '/' e relativos
const assetBases = [location.origin + '/', '/', '../', ''];
startFileNames.forEach((fname, idx) => {
  tryLoadAudioWithBases(fname, assetBases, (audio) => {
    startSounds[idx] = audio;
  }, () => {
    // fallback: attempt direct path without folder
    try { const a = new Audio(encodeURI('0_assets_T3/' + fname)); a.preload='auto'; startSounds[idx]=a; } catch(e){}
  });
});

function playStartSound() {
  const snd = startSounds[nextStartSoundIndex];
  nextStartSoundIndex = (nextStartSoundIndex + 1) % startFileNames.length;
  if (!snd) return;
  snd.currentTime = 0;
  const p = snd.play();
  if (p && p.catch) p.catch(() => {});
}

// ----------------------------
// Música de fundo por pista
// ----------------------------
const bgFileNames = [
  '01 Bad to the Bone.mp3',
  '02 Paranoid.mp3',
  '04 Peter Gunn.mp3'
];
const bgAudios = [null, null, null];
let bgAudio = null; // atualmente tocando
let bgEnabled = true; // começa ligada

bgFileNames.forEach((fname, idx) => {
  tryLoadAudioWithBases(fname, assetBases, (audio) => {
    audio.loop = true;
    audio.preload = 'auto';
    bgAudios[idx] = audio;
  }, () => {
    try { const a = new Audio(encodeURI('0_assets_T3/' + fname)); a.loop=true; a.preload='auto'; bgAudios[idx]=a; } catch(e){}
  });
});

// last lap sound
let lastLapAudio = null;
tryLoadAudioWithBases('lastLap.mp3', assetBases, (audio) => { lastLapAudio = audio; }, () => { try { lastLapAudio = new Audio(encodeURI('0_assets_T3/lastLap.mp3')); } catch(e){} });

function stopBackground() {
  try {
    if (bgAudio && !bgAudio.paused) { bgAudio.pause(); bgAudio.currentTime = 0; }
  } catch (e) {}
  bgAudio = null;
}

function playBackgroundForCurrentTrack() {
  if (!bgEnabled) return;
  const idx = Math.max(0, Math.min(2, currentTrack - 1));
  const candidate = bgAudios[idx];
  if (!candidate) return;
  try {
    // if another track is playing, stop it
    if (bgAudio && bgAudio !== candidate) {
      try { bgAudio.pause(); bgAudio.currentTime = 0; } catch(e){}
    }
    bgAudio = candidate;
    bgAudio.volume = 0.5;
    bgAudio.currentTime = 0;
    const p = bgAudio.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

function toggleBackground() {
  bgEnabled = !bgEnabled;
  if (!bgEnabled) stopBackground();
  else {
    // se a corrida já começou ou não há contagem, toca imediatamente
    if (raceRunning) playBackgroundForCurrentTrack();
  }
}

// Alguns navegadores bloqueiam autoplay — desbloqueamos no primeiro gesto do usuário
let audioUnlocked = false;
function unlockAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  // tenta tocar cada som por um curto período com volume zerado para 'destravar' permissões
  startSounds.forEach(snd => {
    try {
      const prevVol = snd.volume;
      snd.volume = 0;
      snd.currentTime = 0;
      const p = snd.play();
      if (p && p.catch) p.catch(() => {});
      setTimeout(() => { try { snd.pause(); snd.volume = prevVol; } catch (e) {} }, 150);
    } catch (e) {}
  });
  document.removeEventListener('pointerdown', unlockAudioOnce);
  document.removeEventListener('keydown', unlockAudioOnce);
  console.log('Audio unlocked (user gesture).');
}

document.addEventListener('pointerdown', unlockAudioOnce, { once: true });
document.addEventListener('keydown', unlockAudioOnce, { once: true });

function startCountdown(seconds = 5) {
  if (countdownActive) return;
  countdownActive = true;
  raceRunning = false;
  let remaining = seconds;
  countdownDiv.innerText = remaining;
  countdownDiv.style.display = "block";

  const id = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      countdownDiv.innerText = remaining;
    } else {
      clearInterval(id);
      countdownDiv.style.display = "none";
      countdownActive = false;
      // reseta delta para evitar pulo grande após pausa
      clock.getDelta();
      raceRunning = true;
        // ao fim da contagem, inicia música de fundo correspondente
        try { playBackgroundForCurrentTrack(); } catch (e) {}
    }
  }, 1000);
}

// Prepara cena: garante que veículos voltem às posições e fiquem parados
// antes de iniciar a contagem. Faz um render imediato (para "filmar")
// e só então dispara a contagem.
function prepareForCountdown(seconds = 5) {
  // garante que nada esteja se movendo
  raceRunning = false;

  // zera velocidades e reposiciona (caso chamada externa não tenha feito)
  car.userData.speed = 0;
  resetCarPosition(car, currentTrack);
  enemies.forEach((e, i) => { resetEnemyPosition(e, currentTrack); if (e.userData) e.userData.speed = 0; });
  setInitialFormation(currentTrack);

  // posiciona a câmera para "filmagem" dos veículos parados
  camera.position.set(car.position.x - 15, car.position.y + 4, car.position.z);
  camera.lookAt(car.position);

  // renderiza um frame para mostrar a cena estática
  renderer.render(scene, camera);

  // pequena espera para garantir atualização visual antes da contagem
  // toca som de início/troca de pista antes da contagem
  try { playStartSound(); } catch (e) {}
  // pausa música atual para trocar de faixa após a contagem
  try { stopBackground(); } catch (e) {}
  setTimeout(() => startCountdown(seconds), 100);
}

// ------------------------------------------------------------
// KEYBOARD
// ------------------------------------------------------------
window.addEventListener('resize', () => onWindowResize(camera, renderer), false);
const keyboard = new KeyboardState();
const clock = new THREE.Clock();
const moveDirection = { forward: false, backward: false, left: false, right: false };
let prevPlayerLap = lapCount;
// raycaster para detectar presença de chão/plataforma abaixo do veículo
const downRay = new THREE.Raycaster();

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
tunel.position.set(-90, 4, 0);
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

  // Atirar: cria um projétil saindo do nariz do carro
  if (keyboard.down("space") && !car.userData.disabled) {
    shootFromCar(car, scene);
  }

  // Toggle música de fundo (Q)
  if (keyboard.down("Q")) {
    toggleBackground();
  }


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

    resetCarPosition(car, 1);
    enemies.forEach(e => resetEnemyPosition(e, 1));
    setInitialFormation();
    resetLapSystem();
    lapDiv.innerText = "Volta: 0 / " + MAX_LAPS;
    removeArvores();
    arvoresAtuais = criaArvoresQuadrado(scene);
    // resetar munição ao trocar de pista
    car.userData.shotsRemaining = car.userData.maxShotsPerLap || 4;
    enemies.forEach(e => { if (e.userData) e.userData.shotsRemaining = e.userData.maxShotsPerLap || 4; });
    // prepara e inicia contagem antes de começar a correr
    prepareForCountdown(5);
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

    resetCarPosition(car, 2);
    enemies.forEach(e => resetEnemyPosition(e, 2));
    setInitialFormation(2);
    resetLapSystem();
    lapDiv.innerText = "Volta: 0 / " + MAX_LAPS;
    removeArvores();
    arvoresAtuais = criaArvoresL(scene);
    scene.remove(tunel);
    tunel.position.set(-90, 4, -50);
    scene.add(tunel);
    // resetar munição ao trocar de pista
    car.userData.shotsRemaining = car.userData.maxShotsPerLap || 4;
    enemies.forEach(e => { if (e.userData) e.userData.shotsRemaining = e.userData.maxShotsPerLap || 4; });
    // prepara e inicia contagem antes de começar a correr
    prepareForCountdown(5);
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

    resetCarPosition(car, 3);
    enemies.forEach(e => resetEnemyPosition(e, 3));
    setInitialFormation(3);
    resetLapSystem();
    lapDiv.innerText = "Volta: 0 / " + MAX_LAPS;
    removeArvores();
    arvoresAtuais = criaArvoresQuatroQuadrantes(scene);
    scene.remove(tunel);
    tunel.position.set(-80, 4, -50);
    scene.add(tunel);
    // resetar munição ao trocar de pista
    car.userData.shotsRemaining = car.userData.maxShotsPerLap || 4;
    enemies.forEach(e => { if (e.userData) e.userData.shotsRemaining = e.userData.maxShotsPerLap || 4; });
    // prepara e inicia contagem antes de começar a correr
    prepareForCountdown(5);
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

// Verifica se um veículo caiu na descontinuidade (gap) da pista 3 e aplica respawn
function checkAndRespawnIfFallen(vehicle) {
  if (currentTrack !== 3) return false;
  if (!track3 || !track3.userData || !track3.userData.gap) return false;
  const gap = track3.userData.gap;
  // verifica se a projeção XZ do veículo está dentro dos limites do gap
  const dx = Math.abs(vehicle.position.x - gap.center.x);
  const dz = Math.abs(vehicle.position.z - gap.center.z);
  if (dx <= gap.halfSize.x && dz <= gap.halfSize.z) {
    // dispara um raycast para baixo para verificar se há piso/plataforma logo abaixo
    const origin = vehicle.position.clone();
    origin.y += 1.0;
    downRay.set(origin, new THREE.Vector3(0, -1, 0));
    // intersecta apenas os objetos do track3 (mosaicos + plataformas)
    const objs = track3.children.filter(c => c.isMesh);
    const intersects = downRay.intersectObjects(objs, true);
    // se não encontrou nada ou o primeiro hit estiver longe, considera que caiu
    if (intersects.length === 0 || intersects[0].distance > 1.2) {
      // se o veículo estiver no estado de pulo, não reaplicar respawn imediatamente
      if (vehicle.userData.isJumping) {
        // porém, se já houver um hit próximo (pouso), encerra o pulo e posiciona corretamente
        if (intersects.length > 0 && intersects[0].distance <= 1.2) {
          vehicle.userData.isJumping = false;
          if (typeof vehicle.userData.vy !== 'undefined') vehicle.userData.vy = 0;
          try {
            // ajusta Y do veículo para ficar sobre a superfície detectada
            vehicle.position.y = origin.y - intersects[0].distance + 0.1;
            if (typeof vehicle.userData.isPlayer !== 'undefined' && vehicle.userData.isPlayer) {
              camera.position.set(vehicle.position.x - 15, vehicle.position.y + 4, vehicle.position.z);
              camera.lookAt(vehicle.position);
            }
          } catch (e) {}
          return false; // não respawnou
        }
        // se ainda no ar, não respawnar
        return false;
      }
      // aplica respawn normal (não estava pulando)
      try {
        const rp = gap.respawn;
        vehicle.position.set(rp.x, rp.y, rp.z);
        if (typeof vehicle.userData.speed !== 'undefined') vehicle.userData.speed = 0;
        if (typeof vehicle.userData.isPlayer !== 'undefined' && vehicle.userData.isPlayer) {
          // reposiciona câmera imediatamente atrás do carro
          camera.position.set(vehicle.position.x - 15, vehicle.position.y + 4, vehicle.position.z);
          camera.lookAt(vehicle.position);
        }
      } catch (e) {}
      return true;
    }
  }
  return false;
}

// ------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------
function render() {
  keyboardUpdate();

  const delta = clock.getDelta();

  if (raceRunning) {

  // Atualiza timers de penalidade (player)
  if (car.userData.isPenalized) {
    car.userData.penaltyTimeLeft -= delta;
    if (car.userData.penaltyTimeLeft <= 0) {
      car.userData.isPenalized = false;
      if (typeof car.userData.prePenaltySpeed === 'number') {
        car.userData.speed = car.userData.prePenaltySpeed;
        delete car.userData.prePenaltySpeed;
      }
      if (typeof car.userData.prePenaltyAccel === 'number') {
        car.userData.accel = car.userData.prePenaltyAccel;
        delete car.userData.prePenaltyAccel;
      }
      car.userData.penaltyTimeLeft = 0;
    }
  }
  updateCar(car, delta, moveDirection);
  enemies.forEach(enemy => { if (!enemy.userData || enemy.userData.disabled) return; updateEnemyCar(enemy, delta, currentTrack); });
  updateCameraFollow(camera, car, moveDirection);
  updateLightFollow(car, dirLight);

  // atualiza efeitos da água (spray) — Track.js exporta updateWaterEffects
  updateWaterEffects(scene, car, delta);

  // ---------- Lógica de pulo (track 3) ----------
  if (currentTrack === 3 && track3 && track3.userData && track3.userData.jumpPlatform) {
    const platform = track3.userData.jumpPlatform;
    const geom = platform.geometry || {};
    const pw = (geom.parameters && geom.parameters.width) ? geom.parameters.width : (platform.scale.x || 10);
    const pz = (geom.parameters && geom.parameters.depth) ? geom.parameters.depth : (platform.scale.z || 10);
    const halfW = pw / 2;
    const halfZ = pz / 2;

    // aplica a mesma lógica para jogador e inimigos
    const allVehicles = [car].concat(enemies);
    allVehicles.forEach(vehicle => {
      if (!vehicle || !vehicle.position) return;
      const dx = Math.abs(vehicle.position.x - platform.position.x);
      const dz = Math.abs(vehicle.position.z - platform.position.z);
      // iniciou contato com a plataforma
      if (dx <= halfW && dz <= halfZ) {
        if (!vehicle.userData.isJumping) {
          const cfg = platform.userData.jumpConfig || { up: 5, gravity: 60 };
          vehicle.userData.isJumping = true;
          vehicle.userData.vy = Math.sqrt(2 * (cfg.gravity || 60) * (cfg.up || 5));
          vehicle.userData.jumpConfig = cfg;
          vehicle.userData.jumpTimer = 0;
        }
      }

      // atualiza física simples enquanto estiver no ar e controla timeout de 3s
      if (vehicle.userData.isJumping) {
        const cfg = vehicle.userData.jumpConfig || platform.userData.jumpConfig || { gravity: 60 };
        // atualiza posição vertical
        vehicle.position.y += (vehicle.userData.vy || 0) * delta;
        vehicle.userData.vy -= (cfg.gravity || 60) * delta;
        // inicia/atualiza timer do salto
        vehicle.userData.jumpTimer = (vehicle.userData.jumpTimer || 0) + delta;

        // verifica se atingiu o lado oposto (posição alvo: gap center) ou já voltou ao nível da pista
        const gap = track3 && track3.userData ? track3.userData.gap : null;
        const desiredTopY = START_POS_TRACK3.y - 0.6 + 0.1; // nível desejado da pista após o salto (sincronizado com Track)
        let landedOK = false;
        if (gap) {
          const withinX = Math.abs(vehicle.position.x - gap.center.x) <= (gap.halfSize.x + 1);
          const withinZ = Math.abs(vehicle.position.z - gap.center.z) <= (gap.halfSize.z + 1);
          const nearY = Math.abs(vehicle.position.y - gap.center.y) <= 1.2;
          if (withinX && withinZ && nearY) landedOK = true;
        }
        // condição adicional: se já desceu ao nível da pista e está indo para baixo, considera pouso
        if (vehicle.position.y <= desiredTopY + 0.11 && (vehicle.userData.vy || 0) <= 0) landedOK = true;

        if (landedOK) {
          // pousou do outro lado: encerra o pulo e ajusta altura ao topo da pista
          vehicle.userData.isJumping = false;
          vehicle.userData.vy = 0;
          vehicle.userData.jumpTimer = 0;
          try {
            vehicle.position.y = desiredTopY;
          } catch (e) {}
        } else if (vehicle.userData.jumpTimer >= 3.0) {
          // timeout: não conseguiu atravessar em 3s — teleportar para início da reta (y=0)
          try {
            if (gap) {
              // posiciona no topo da pista do lado do gap
              vehicle.position.set(gap.center.x, desiredTopY, gap.center.z);
            }
            if (typeof vehicle.userData.speed !== 'undefined') vehicle.userData.speed = 0;
            vehicle.userData.isJumping = false;
            vehicle.userData.vy = 0;
            vehicle.userData.jumpTimer = 0;
            // atualiza câmera para o jogador
            if (typeof vehicle.userData.isPlayer !== 'undefined' && vehicle.userData.isPlayer) {
              camera.position.set(vehicle.position.x - 15, vehicle.position.y + 4, vehicle.position.z);
              camera.lookAt(vehicle.position);
            }
          } catch (e) {}
        }

        // evita que o veículo afunde muito abaixo do mundo
        // também impede que caia abaixo do topo da pista após o salto
        if (vehicle.position.y < desiredTopY + 0.1) {
          vehicle.position.y = desiredTopY + 0.0;
          vehicle.userData.isJumping = false;
          vehicle.userData.vy = 0;
          vehicle.userData.jumpTimer = 0;
        }
        if (vehicle.position.y < -50) vehicle.position.y = -50;
      }
    });
  }

  // prepara lista de paredes para a pista atual
  const wallList = currentTrack === 1 ? barreirasTrack1 : currentTrack === 2 ? barreirasTrack2 : barreirasTrack3;
  const wallMeshes = wallList.map(b => b.mesh);

  // Atualiza projéteis do jogador (checa colisão contra inimigos e paredes)
  updateProjectiles(car, delta, enemies.concat(wallMeshes), scene);

  // Inimigos: comportamento de tiro e atualização de projéteis
  enemies.forEach(enemy => {
    if (!enemy.userData) return;
    // se inimigo está desativado (acabou a vida), não permite atirar nem mover, apenas atualiza projéteis existentes
    if (enemy.userData.disabled) {
      updateProjectiles(enemy, delta, [car].concat(wallMeshes), scene);
      return;
    }
    // decrementa cooldown e atira quando <= 0 (apenas se jogador estiver à frente)
    if (typeof enemy.userData.shootCooldown === 'number') {
      enemy.userData.shootCooldown -= delta;
      if (enemy.userData.shootCooldown <= 0) {
        // Regra de 'à frente' baseada em progresso (voltas * 1000 + checkpointIndex)
        const checkpoints = currentTrack === 1 ? checkpointsTrack1 : currentTrack === 2 ? checkpointsTrack2 : checkpointsTrack3;
        let playerCpIndex = 0;
        let minDist = Infinity;
        for (let k = 0; k < checkpoints.length; k++) {
          const d = car.position.distanceTo(checkpoints[k].pos);
          if (d < minDist) { minDist = d; playerCpIndex = k; }
        }
        const playerProgress = (lapCount || 0) * 1000 + playerCpIndex;
        const enemyProgress = (enemy.userData.ai && enemy.userData.ai.lapCount ? enemy.userData.ai.lapCount[currentTrack] || 0 : 0) * 1000 + (enemy.userData.ai ? enemy.userData.ai.checkpointIndex[currentTrack] || 0 : 0);

        // Regra adicional: se o jogador está no cone frontal e dentro de certa distância
        const toPlayer = new THREE.Vector3().subVectors(car.position, enemy.position);
        const distToPlayer = toPlayer.length();
        const forward = new THREE.Vector3(Math.cos(enemy.rotation.y), 0, -Math.sin(enemy.rotation.y));
        const angleToPlayer = forward.angleTo(toPlayer.clone().normalize());
        const inFrontCone = angleToPlayer < THREE.MathUtils.degToRad(45) && distToPlayer < 150;
        const closeEnough = distToPlayer < 200; // regra adicional: se estiver perto, atira

        let shouldShoot = false;
        if (playerProgress > enemyProgress) shouldShoot = true; // jogador à frente
        if (inFrontCone) shouldShoot = true; // jogador visível pela frente
        if (closeEnough) shouldShoot = true; // perto demais → atira

        if (shouldShoot) {
          // só atira se tiver munição
          if (typeof enemy.userData.shotsRemaining === 'number' ? enemy.userData.shotsRemaining > 0 : true) {
            shootFromCar(enemy, scene, { speed: 60, damage: 20, maxRange: 300 });
          }
        }

        enemy.userData.shootCooldown = Math.random() * 2 + 1; // 1-3s
      }
    }

    // atualiza projéteis do inimigo (alvo: jogador, outros inimigos ativos e paredes)
    const otherEnemies = enemies.filter(e => e !== enemy && e.userData && !e.userData.disabled);
    updateProjectiles(enemy, delta, [car].concat(otherEnemies).concat(wallMeshes), scene);

    // detectar se o inimigo completou uma volta para recarregar munição
    const currEnemyLap = enemy.userData.ai && enemy.userData.ai.lapCount ? enemy.userData.ai.lapCount[currentTrack] || 0 : 0;
    if (typeof enemy.userData.prevLapCount === 'number' && currEnemyLap > enemy.userData.prevLapCount) {
      enemy.userData.shotsRemaining = enemy.userData.maxShotsPerLap || 4;
    }
    enemy.userData.prevLapCount = currEnemyLap;
    // penalidade timer para inimigo
    if (enemy.userData.isPenalized) {
      enemy.userData.penaltyTimeLeft -= delta;
      if (enemy.userData.penaltyTimeLeft <= 0) {
        enemy.userData.isPenalized = false;
        if (typeof enemy.userData.prePenaltySpeed === 'number') {
          enemy.userData.speed = enemy.userData.prePenaltySpeed;
          delete enemy.userData.prePenaltySpeed;
        }
        if (typeof enemy.userData.prePenaltyAccel === 'number') {
          enemy.userData.accel = enemy.userData.prePenaltyAccel;
          delete enemy.userData.prePenaltyAccel;
        }
        enemy.userData.penaltyTimeLeft = 0;
      }
    }
  });

  // Verifica colisões para ambos os veículos
  checkCollision(currentTrack);
  enemies.forEach(enemy => { if (!enemy.userData || enemy.userData.disabled) return; checkVehicleCollision(enemy, currentTrack); });

  // Verifica colisão entre o jogador e cada inimigo
  enemies.forEach(enemy => { if (!enemy.userData || enemy.userData.disabled) return; checkCarToCarCollision(car, enemy); });

  // Verifica colisão entre inimigos (pares)
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      checkCarToCarCollision(enemies[i], enemies[j]);
    }
  }

  // Verifica se algum veículo caiu na descontinuidade (pista 3)
  try { checkAndRespawnIfFallen(car); } catch(e) {}
  enemies.forEach(enemy => { try { checkAndRespawnIfFallen(enemy); } catch(e) {} });

  const lapText = checkLapCount(car, currentTrack);
  if (lapText !== null) {
    // Se há um vencedor, mostra a mensagem apropriada
    if (winner === 'player') {
      lapDiv.innerText = 'Você venceu! 🏆';
    } else if (winner === 'enemy') {
      lapDiv.innerText = winnerId ? `Adversário ${winnerId} ganhou` : 'Adversário ganhou';
    } else {
      lapDiv.innerText = lapText;
    }
  } else if (winner === 'enemy') {
    // Se o adversário ganhou mas o jogador ainda não completou, mostra mensagem
    lapDiv.innerText = winnerId ? `Adversário ${winnerId} ganhou` : 'Adversário ganhou';
  }

  }

  // se jogador completou nova volta, recarrega munição
  if (lapCount > prevPlayerLap) {
    car.userData.shotsRemaining = car.userData.maxShotsPerLap || 4;
    // se o jogador acabou de iniciar a última volta (lapCount == MAX_LAPS - 1), toca lastLap
    try {
      if (lastLapAudio && lapCount === (MAX_LAPS - 1)) {
        lastLapAudio.currentTime = 0;
        const p = lastLapAudio.play(); if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {}
  }
  prevPlayerLap = lapCount;

  // Atualiza HUD de munição
  shotsDiv.innerText = `Munição: ${car.userData.shotsRemaining || 0} / ${car.userData.maxShotsPerLap || 4}`;

  speedBox.changeMessage("Velocidade: " + Number(car.userData.speed).toFixed(0));

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------
resetCarPosition(car, 1);
enemies.forEach(e => resetEnemyPosition(e, 1));
// Ajuste da formação inicial
setInitialFormation(1);
// prepara e inicia contagem antes de começar a correr
prepareForCountdown(5);
render();
