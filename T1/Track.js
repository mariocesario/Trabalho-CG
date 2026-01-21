// Track.js
import * as THREE from 'three';
import { degreesToRadians } from "../libs/util/util.js";
import { START_POS_TRACK1, START_POS_TRACK2, START_POS_TRACK3 } from './Car.js';
import { Water } from '../build/jsm/objects/Water.js';

export let track1 = null;
export let track2 = null;
export let track3 = null;

export function createTrack(scene, materialPista) {

  // ------------------------------------------------------------
  // PISTA 1 — QUADRADA (ORIGINAL)
  // ------------------------------------------------------------
  track1 = new THREE.Group();
  createSquareTrackElements(track1, materialPista);

  // checkpoints da pista 1 — posicionados pouco acima do topo da pista
  const checkpointY = START_POS_TRACK1.y - 0.55; // topo da pista é START_POS_TRACK1.y - 0.6, agora +0.05 acima
  const cp1 = makeCheckpoint(START_POS_TRACK1.x, START_POS_TRACK1.z, { start: true, y: checkpointY });
  const cp2 = makeCheckpoint(90, START_POS_TRACK1.z, { y: checkpointY });
  const cp3 = makeCheckpoint(90, 90, { y: checkpointY });
  const cp4 = makeCheckpoint(-90, 90, { y: checkpointY });
  const cp4b = makeCheckpoint(START_POS_TRACK1.x - 50, START_POS_TRACK1.z, { y: checkpointY });
  track1.add(cp1, cp2, cp3, cp4, cp4b);


  // ------------------------------------------------------------
  // PISTA 2 — EM L (ORIGINAL)
  // ------------------------------------------------------------
  track2 = new THREE.Group();
  createLTrackElements(track2, materialPista);

  const checkpointY2 = START_POS_TRACK2.y - 0.55;
  const cp5 = makeCheckpoint(START_POS_TRACK2.x, START_POS_TRACK2.z, { start: true, y: checkpointY2 });
  const cp6 = makeCheckpoint(90, START_POS_TRACK2.z, { y: checkpointY2 });
  const cp7 = makeCheckpoint(90, 90, { y: checkpointY2 });
  const cp8 = makeCheckpoint(-10, 90, { y: checkpointY2 });
  const cp9 = makeCheckpoint(-10, -10, { y: checkpointY2 });
  const cp10 = makeCheckpoint(-90, -10, { y: checkpointY2 });
  const cp10b = makeCheckpoint(START_POS_TRACK2.x - 50, START_POS_TRACK2.z, { y: checkpointY2 });
  cp5.receiveShadow = cp6.receiveShadow = cp7.receiveShadow = cp8.receiveShadow = cp9.receiveShadow = cp10.receiveShadow = cp10b.receiveShadow = true;
  track2.add(cp5, cp6, cp7, cp8, cp9, cp10, cp10b);


  // ------------------------------------------------------------
  // PISTA 3 — 4 QUADRANTES (NOVA)
  // ------------------------------------------------------------
  track3 = new THREE.Group();
  createFourQuadrantTrack(track3, materialPista);

  const checkpointY3 = START_POS_TRACK3.y - 0.55;
  const cp11 = makeCheckpoint(START_POS_TRACK3.x, START_POS_TRACK3.z, { start: true, y: checkpointY3 });
  const cp17 = makeCheckpoint(0, -90, { y: checkpointY3 });
  const cp12 = makeCheckpoint(0, 90, { y: checkpointY3 });
  const cp18 = makeCheckpoint(80, 90, { y: checkpointY3 });
  const cp13 = makeCheckpoint(80, 10, { y: checkpointY3 });
  const cp14 = makeCheckpoint(-80, 10, { y: checkpointY3 });
  cp11.receiveShadow = cp12.receiveShadow = cp13.receiveShadow = cp14.receiveShadow = true;
  track3.add(cp11, cp12, cp13, cp14);


  // ------------------------------------------------------------
  // ADD ao SCENE
  // ------------------------------------------------------------
  track1.userData.checkpoint = cp1;
  track2.userData.checkpoint = cp5;
  track3.userData.checkpoint = cp11;

  scene.add(track1);
  scene.add(track2);
  scene.add(track3);

  track1.visible = true;
  track2.visible = false;
  track3.visible = false;
}


// =====================================================================
// CHECKPOINT HELPERS
// =====================================================================
function makeCheckerTexture(cellsX = 8, cellsY = 8, size = 256) {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return null;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cellW = canvas.width / cellsX;
  const cellH = canvas.height / cellsY;
  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}
function makeCheckpoint(x, z, opts = {}) {
  if (opts.start) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshLambertMaterial({ map: makeCheckerTexture(8, 8, 256) })
    );
    m.rotation.x = degreesToRadians(-90);
    m.position.set(x, (opts.y !== undefined ? opts.y : 0.05), z);
    return m;
  }

  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshLambertMaterial({ color: 0xffff00 })
  );
  m.rotation.x = degreesToRadians(-90);
  m.position.set(x, (opts.y !== undefined ? opts.y : 0.05), z);
  return m;
}


// =====================================================================
// GEOMETRIA DA PISTA QUADRADA
// =====================================================================
export function createSquareTrackElements(trackGroup, material) {
  const trackWidth = 20;
  // Convert track planes to solid boxes so the track appears filled underneath
  const track1PlaneY = START_POS_TRACK1.y - 0.6; // top surface Y
  const thickness = Math.max(0.1, track1PlaneY + 0.1); // thickness to fill down toward ground
  const centerY = track1PlaneY - thickness / 2;

  const box1 = new THREE.Mesh(new THREE.BoxGeometry(200, thickness, trackWidth), material);
  const box2 = new THREE.Mesh(new THREE.BoxGeometry(200, thickness, trackWidth), material);
  const box3 = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, thickness, 200), material);
  const box4 = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, thickness, 200), material);

  box1.position.set(0, centerY, 90);
  box2.position.set(0, centerY, -90);
  box3.position.set(-90, centerY, 0);
  box4.position.set(90, centerY, 0);

  box1.receiveShadow = box2.receiveShadow = box3.receiveShadow = box4.receiveShadow = true;
  trackGroup.add(box1, box2, box3, box4);
}


// =====================================================================
// GEOMETRIA DA PISTA EM L
// =====================================================================
export function createLTrackElements(trackGroup, material) {
  const trackWidth = 20;
  const segmentData = [
    { length: 200, isHorizontal: true, pos: new THREE.Vector3(0, 0, -90) },
    { length: 180, isHorizontal: false, pos: new THREE.Vector3(90, 0, 10) },
    { length: 100, isHorizontal: true, pos: new THREE.Vector3(30, 0, 90) },
    { length: 100, isHorizontal: false, pos: new THREE.Vector3(-10, 0, 30) },
    { length: 80, isHorizontal: true, pos: new THREE.Vector3(-60, 0, -10) },
    { length: 60, isHorizontal: false, pos: new THREE.Vector3(-90, 0, -50) },
  ];

  // converte segmentos para volumes preenchidos (BoxGeometry) semelhantes à pista 1
  const track2PlaneY = START_POS_TRACK2.y - 0.6;
  const thickness = Math.max(0.1, track2PlaneY + 0.1);
  const centerY = track2PlaneY - thickness / 2;
  let horizontalCount = 0;
  segmentData.forEach(s => {
    let mesh;
    if (s.isHorizontal) {
      horizontalCount++;
      mesh = new THREE.Mesh(new THREE.BoxGeometry(s.length, thickness, trackWidth), material);
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, thickness, s.length), material);
    }
    mesh.position.set(s.pos.x, centerY + s.pos.y, s.pos.z);
    mesh.receiveShadow = true;
    trackGroup.add(mesh);
    // Cria área de água apenas na terceira reta horizontal (contando apenas segmentos horizontais)
    if (s.isHorizontal && horizontalCount === 3) {
      const waterWidth = 70;
      const waterGeometry = new THREE.PlaneGeometry(waterWidth, trackWidth);
      const textureLoader = new THREE.TextureLoader();
      const water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: textureLoader.load('../assets/textures/NormalMapping/waternormals.jpg', function(t){ t.wrapS = t.wrapT = THREE.RepeatWrapping; }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 1.5,
      });
      water.rotation.x = -Math.PI / 2;
      water.position.set(s.pos.x, track2PlaneY + 0.01, s.pos.z);
      trackGroup.add(water);
      if (!trackGroup.userData) trackGroup.userData = {};
      trackGroup.userData.waterAreas = trackGroup.userData.waterAreas || [];
      trackGroup.userData.waterAreas.push({ center: new THREE.Vector3(s.pos.x, track2PlaneY + 0.01, s.pos.z), halfSize: new THREE.Vector3(waterWidth/2, 0.5, trackWidth/2), water });
    }
  });
}


// =====================================================================
// GEOMETRIA DA PISTA 3 — 4 QUADRANTES
// =====================================================================
export function createFourQuadrantTrack(trackGroup, material) {

  const trackWidth = 20;

  const segmentData = [
    { length: 100, isHorizontal: true, pos: new THREE.Vector3(-40, -0.1, -90) },
    { length: 200, isHorizontal: false, pos: new THREE.Vector3(0, -0.1, 0) },
    { length: 180, isHorizontal: true, pos: new THREE.Vector3(0, -0.1, 10) },
    { length: 60, isHorizontal: false, pos: new THREE.Vector3(80, -0.1, 50) },
    { length: 100, isHorizontal: true, pos: new THREE.Vector3(40, -0.1, 90) },
    { length: 80, isHorizontal: false, pos: new THREE.Vector3(-80, -0.1, -40) },
  ];

  let rot = new THREE.Matrix4().makeRotationX(degreesToRadians(-90));
  // converte segmentos para volumes preenchidos (BoxGeometry) como na pista 1
  // topo da pista 3 — usar mesma regra das outras pistas
  const track3PlaneY = START_POS_TRACK3.y - 0.6;
  const thickness3 = Math.max(0.1, track3PlaneY + 0.1);
  const centerY3 = track3PlaneY - thickness3 / 2;

  segmentData.forEach(s => {
    let mesh;
    // Caso especial: descontinuidade na reta especificada (vertical, pos -80,-0.1,-40, length 80)
    const isGapSegment = (!s.isHorizontal && s.length === 80 && s.pos.x === -80 && s.pos.z === -40);
    if (isGapSegment) {
      // não removemos o bloco da pista — criamos a reta completa (sem buraco)
      const gapLength = 0; // sem lacuna
      const meshFull = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, thickness3, s.length), material);
      meshFull.position.set(s.pos.x, centerY3, s.pos.z);
      meshFull.receiveShadow = true;
      trackGroup.add(meshFull);
      // centros para respawn/limites (compatível com código anterior)
      const half1 = s.length / 2;
      const z1 = s.pos.z + (half1 / 2);

      // cria a jump platform central — ocupa no máximo 50% da largura da pista
      const platformWidth = Math.min(trackWidth / 2, 10); // <= 50% da largura
      const platformLength = 10;
      const platformMat = material.clone ? material.clone() : material;
      // dar uma cor ligeiramente diferente para visualizar
      try { platformMat.color = new THREE.Color(0x3333aa); } catch(e) {}
      const platform = new THREE.Mesh(new THREE.BoxGeometry(platformWidth, 1.5, platformLength), platformMat);
      // posiciona a plataforma ANTES do buraco (lado de aproximação – borda da metade superior)
      const zInner = s.pos.z + (gapLength / 2); // coordenada da borda interna próxima ao gap
      // posiciona a plataforma explicitamente conforme pedido: z = -10, y = 10.25
      platform.position.set(s.pos.x, 10.25, -10);
      // marca a plataforma para ser detectada pela cena e configura parâmetros de pulo
      platform.name = 'jumpPlatform';
      platform.userData = platform.userData || {};
      platform.userData.jumpConfig = { up: 5, gravity: 60 }; // sobe 5 unidades, gravidade aplicada durante o salto
      platform.receiveShadow = true;
      platform.castShadow = true;
      trackGroup.add(platform);

      // registra área do "gap" (agora sem buraco) e ponto de respawn (início da reta antes da descontinuidade)
      if (!trackGroup.userData) trackGroup.userData = {};
      const halfGap = gapLength / 2;
      const halfW = trackWidth / 2;
      // bounds em XZ (para vertical X é constante). Como não existe buraco, halfSize.z é pequeno
      trackGroup.userData.gap = {
        center: new THREE.Vector3(s.pos.x, centerY3, s.pos.z),
        halfSize: new THREE.Vector3(halfW, 2, 0.1),
        // escolhe como respawn a borda da metade "acima" (maior Z)
        respawn: new THREE.Vector3(s.pos.x, centerY3 + 1.0, z1 + (half1 / 2) - 1),
        respawnRotY: 0
      };
      // referência rápida à plataforma de salto
      trackGroup.userData.jumpPlatform = platform;
      return; // passou pela criação especial (saída do callback forEach)
    }
    if (s.isHorizontal) {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(s.length, thickness3, trackWidth), material);
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, thickness3, s.length), material);
    }
    mesh.position.set(s.pos.x, centerY3, s.pos.z);
    mesh.receiveShadow = true;
    trackGroup.add(mesh);
  });
}


// Atualiza efeitos da água (animação do shader e interações simples)
export function updateWaterEffects(scene, car, delta) {
  if (!track2 || !track2.userData || !track2.userData.waterAreas) return;
  track2.userData.waterAreas.forEach(area => {
    const water = area.water;
    if (water && water.material && water.material.uniforms && water.material.uniforms['time']) {
      water.material.uniforms['time'].value += delta * 0.5;
    }
    if (car && area.center) {
      const dx = Math.abs(car.position.x - area.center.x);
      const dz = Math.abs(car.position.z - area.center.z);
      if (dx <= area.halfSize.x && dz <= area.halfSize.z) {
        if (water && water.material && water.material.uniforms && water.material.uniforms['size']) {
          water.material.uniforms['size'].value = Math.min(10, (water.material.uniforms['size'].value || 1) + 0.2);
        }
      }
    }
  });
}
