// Walls.js
import * as THREE from 'three';
import { START_POS_TRACK1, START_POS_TRACK2, START_POS_TRACK3 } from './Car.js';

export const barreirasTrack1 = [];
export const barreirasTrack2 = [];
export const barreirasTrack3 = [];  // <<< paredes da pista 3

export const groupSquareWalls = new THREE.Group();
export const groupLWalls      = new THREE.Group();
export const groupThirdWalls  = new THREE.Group(); // <<< grupo da pista 3

/**
 * Cria bloco branco/vermelho com bounding box
 */
function makeBlock(geom, pos, isRed) {
  const mat = new THREE.MeshBasicMaterial({
    color: isRed ? 0xff0000 : 0xffffff
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.copy(pos);
  mesh.castShadow = true;

  const bb = new THREE.Box3().setFromObject(mesh);
  return { mesh, bb };
}

/* ============================================================
   PISTA 1 — QUADRADA
============================================================ */
export function createSquareWalls(scene) {
  groupSquareWalls.clear();
  barreirasTrack1.length = 0;

  // calcula Y do topo da pista e centro das barreiras (altura / 2)
  const trackTopY = START_POS_TRACK1.y - 0.6; // mesmo offset usado em Track.js
  const barrierCenterY = trackTopY + 1.25; // metade da altura das barreiras (2.5 / 2)

  // externas grandes
  for (let i = 0; i < 20; i++) {
    const isRed = (i % 2 === 1);

    // esquerda
    {
      const b = makeBlock(
        new THREE.BoxGeometry(1, 2.5, 10),
        new THREE.Vector3(-100.5, barrierCenterY, -95 + i * 10),
        isRed
      );
      groupSquareWalls.add(b.mesh);
      barreirasTrack1.push(b);
    }

    // direita
    {
      const b = makeBlock(
        new THREE.BoxGeometry(1, 2.5, 10),
        new THREE.Vector3(100.5, barrierCenterY, -95 + i * 10),
        isRed
      );
      groupSquareWalls.add(b.mesh);
      barreirasTrack1.push(b);
    }

    // topo e baixo
    {
      const geom = new THREE.BoxGeometry(10, 2.5, 1);

      const bA = makeBlock(geom, new THREE.Vector3(-95 + i * 10, barrierCenterY, -100.5), isRed);
      const bB = makeBlock(geom, new THREE.Vector3(-95 + i * 10, barrierCenterY, 100.5), isRed);

      groupSquareWalls.add(bA.mesh, bB.mesh);
      barreirasTrack1.push(bA, bB);
    }
  }

  // internas (se necessário manter como antes)
  for (let i = 0; i < 16; i++) {
    const isRed = (i % 2 === 1);

    // laterais internas
    {
      const geom = new THREE.BoxGeometry(1, 2.5, 10);

      const posL = new THREE.Vector3(-80.5, barrierCenterY, -75 + i * 10);
      const posR = new THREE.Vector3(80.5, barrierCenterY, -75 + i * 10);

      const bL = makeBlock(geom, posL, isRed);
      const bR = makeBlock(geom, posR, isRed);

      groupSquareWalls.add(bL.mesh, bR.mesh);
      barreirasTrack1.push(bL, bR);
    }

    // topo / inferior internos
    {
      const geom = new THREE.BoxGeometry(10, 2.5, 1);

      const posA = new THREE.Vector3(-75 + i * 10, barrierCenterY, -80.5);
      const posB = new THREE.Vector3(-75 + i * 10, barrierCenterY, 80.5);

      const bA = makeBlock(geom, posA, isRed);
      const bB = makeBlock(geom, posB, isRed);

      groupSquareWalls.add(bA.mesh, bB.mesh);
      barreirasTrack1.push(bA, bB);
    }
  }

  if (scene) scene.add(groupSquareWalls);
}

/* ============================================================
   PISTA 2 — EM L
============================================================ */
export function createLWalls(scene) {
  groupLWalls.clear();
  barreirasTrack2.length = 0;
  function addBlock(geom, pos, isRed) {
    const b = makeBlock(geom, pos, isRed);
    groupLWalls.add(b.mesh);
    barreirasTrack2.push(b);
  }

  // calcula Y do topo da pista 2 e centro das barreiras
  const trackTopY2 = START_POS_TRACK2.y - 0.6;
  const barrierCenterY2 = trackTopY2 + 1.25;

  // === Segmentos da pista L (mantidos do seu código original) ===
  for (let i = 0; i < 20; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(100.5, barrierCenterY2, -95 + i * 10), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(-95 + i * 10, barrierCenterY2, -100.5), isRed);
  }

  for (let i = 0; i < 16; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(80.5, barrierCenterY2, -75 + i * 10), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(-75 + i * 10, barrierCenterY2, -80.5), isRed);
  }

  for (let i = 0; i < 10; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(-100.5, barrierCenterY2, -95 + i * 10), isRed);
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(-20.5, barrierCenterY2, 95 - i * 10), isRed);
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(-0.5, barrierCenterY2, 75 - i * 10), isRed);
  }

  for (let i = 0; i < 12; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(95 - i * 10, barrierCenterY2, 100.5), isRed);
  }

  for (let i = 0; i < 6; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(-80.5, barrierCenterY2, -75 + i * 10), isRed);
  }

  for (let i = 0; i < 8; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(75 - i * 10, barrierCenterY2, 80.5), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(-95 + i * 10, barrierCenterY2, 0.5), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(-75 + i * 10, barrierCenterY2, -20.5), isRed);
  }

  for (let i = 0; i < 9; i++) {
    const isRed = i % 2 === 1;
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(100.5, barrierCenterY2, 95 - i * 10), isRed);
  }

  if (scene) scene.add(groupLWalls);
}

/* ============================================================
   PISTA 3 — Formato em 8
============================================================ */
export function createThirdWalls(scene) {
  groupThirdWalls.clear();
  barreirasTrack3.length = 0;

  function addBlock(geom, pos, isRed) {
    const b = makeBlock(geom, pos, isRed);
    groupThirdWalls.add(b.mesh);
    barreirasTrack3.push(b);
  }

  // calcula Y do topo da pista 3 e centro das barreiras
  const trackTopY3 = START_POS_TRACK3.y - 0.6;
  const barrierCenterY3 = trackTopY3 + 1.25;

  for (let i = 0; i < 11; i++) {
    const isRed = i % 2 === 0;
    // (padrão: poderia preencher com blocos conforme necessário)
  }

  for (let i = 0; i < 7; i++) {
    const isRed = i % 2 === 0;
    // (padrão)
  }

  for (let i = 0; i < 10; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(10, barrierCenterY3, -95 + i * 10), isRed);
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(90.5, barrierCenterY3, 95 - i * 10), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(85 - i * 10, barrierCenterY3, 100.5), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(-85 + i * 10, barrierCenterY3, -100.5), isRed);
  }

  for (let i = 0; i < 12; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(-90.5, barrierCenterY3, -95 + i * 10), isRed);
  }

  for (let i = 0; i < 6; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(-65 + i * 10, barrierCenterY3, -80.5), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(15.5 + i * 10, barrierCenterY3, 19.5), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(-65 + i * 10, barrierCenterY3, -0.5), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(65 - i * 10, barrierCenterY3, 80.5), isRed);
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(10, barrierCenterY3, 75 - i * 10), isRed);
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(70.5, barrierCenterY3, 25 + i * 10), isRed);
  }

  for (let i = 0; i < 8; i++) {
    const isRed = i % 2 === 0;
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(-85 + i * 10, barrierCenterY3, 20.5), isRed);
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(-10.5, barrierCenterY3, 95 - i * 10), isRed);
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(-70.5, barrierCenterY3, -75 + i * 10), isRed);
    addBlock(new THREE.BoxGeometry(1, 2.5, 10), new THREE.Vector3(-10.5, barrierCenterY3, -75 + i * 10), isRed);
    addBlock(new THREE.BoxGeometry(10, 2.5, 1), new THREE.Vector3(15.5 + i * 10, barrierCenterY3, -0.5), isRed);
  }

  for (let i = 0; i < 9; i++) {
    const isRed = i % 2 === 1;
    // (padrão)
  }

  if (scene) scene.add(groupThirdWalls);
}
