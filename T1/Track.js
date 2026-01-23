// Track.js
import * as THREE from 'three';
import { degreesToRadians } from "../libs/util/util.js";
import { START_POS_TRACK1, START_POS_TRACK2, START_POS_TRACK3 } from './Car.js';
import { texturaAsfalto } from './Texture.js';

export let track1 = null;
export let track2 = null;
export let track3 = null;

export function createTrack(scene, materialPista) {

  // ------------------------------------------------------------
  // PISTA 1 — QUADRADA (ORIGINAL)
  // ------------------------------------------------------------
  track1 = new THREE.Group();
  createSquareTrackElements(track1, materialPista);

  const checkpoint1 = makeCheckpoint(START_POS_TRACK1.x, START_POS_TRACK1.z);
  const checkpoint2 = makeCheckpoint(90, START_POS_TRACK1.z);
  const checkpoint3 = makeCheckpoint(90, 90);
  const checkpoint4 = makeCheckpoint(-90, 90);
  track1.add(checkpoint1, checkpoint2, checkpoint3, checkpoint4);


  // ------------------------------------------------------------
  // PISTA 2 — EM L (ORIGINAL)
  // ------------------------------------------------------------
  track2 = new THREE.Group();
  createLTrackElements(track2, materialPista);

  const checkpoint5  = makeCheckpoint(START_POS_TRACK2.x, START_POS_TRACK2.z);
  const checkpoint6  = makeCheckpoint(90, START_POS_TRACK2.z);
  const checkpoint7  = makeCheckpoint(90, 90);
  const checkpoint8  = makeCheckpoint(-10, 90);
  const checkpoint9  = makeCheckpoint(-10, -10);
  const checkpoint10 = makeCheckpoint(-90, -10);
  checkpoint5.receiveShadow = true;
  checkpoint6.receiveShadow = true;
  checkpoint7.receiveShadow = true;
  checkpoint8.receiveShadow = true;
  checkpoint9.receiveShadow = true;
  checkpoint10.receiveShadow = true;
  track2.add(checkpoint5, checkpoint6, checkpoint7, checkpoint8, checkpoint9, checkpoint10);


  // ------------------------------------------------------------
  // PISTA 3 — 4 QUADRANTES (NOVA)
  // ------------------------------------------------------------
  track3 = new THREE.Group();
  createFourQuadrantTrack(track3, materialPista);

  const checkpoint11 = makeCheckpoint(START_POS_TRACK3.x, START_POS_TRACK3.z);
  const checkpoint17 = makeCheckpoint(0, -90);
  const checkpoint12 = makeCheckpoint(0, 90);
  const checkpoint18 = makeCheckpoint(80, 90);
  const checkpoint13 = makeCheckpoint(80, 10);
  const checkpoint14 = makeCheckpoint(-80, 10);
  checkpoint11.receiveShadow = true;
  checkpoint12.receiveShadow = true;
  checkpoint13.receiveShadow = true;
  checkpoint14.receiveShadow = true;
  track3.add(checkpoint11, checkpoint12, checkpoint13, checkpoint14);


  // ------------------------------------------------------------
  // ADD ao SCENE
  // ------------------------------------------------------------
  track1.userData.checkpoint = checkpoint1;
  track2.userData.checkpoint = checkpoint5;
  track3.userData.checkpoint = checkpoint11;

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
function makeCheckpoint(x, z) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshLambertMaterial({ color: 0xffff00 })
  );
  m.rotation.x = degreesToRadians(-90);
  m.position.set(x, 0.05, z);
  return m;
}


// =====================================================================
// GEOMETRIA DA PISTA QUADRADA
// =====================================================================
export function createSquareTrackElements(trackGroup, material) {
  const trackWidth = 20;

  const gX = new THREE.PlaneGeometry(200, trackWidth);
  const gZ = new THREE.PlaneGeometry(trackWidth, 200);

  const p1 = texturaAsfalto(gX);
  const p2 = texturaAsfalto(gX);
  const p3 = texturaAsfalto(gZ);
  const p4 = texturaAsfalto(gZ);

  let rot = new THREE.Matrix4().makeRotationX(degreesToRadians(-90));

  p1.matrixAutoUpdate = p2.matrixAutoUpdate = false;
  p3.matrixAutoUpdate = p4.matrixAutoUpdate = false;

  p1.matrix.identity().multiply(new THREE.Matrix4().makeTranslation(0, -0.15, 90)).multiply(rot);
  p2.matrix.identity().multiply(new THREE.Matrix4().makeTranslation(0, -0.15, -90)).multiply(rot);
  p3.matrix.identity().multiply(new THREE.Matrix4().makeTranslation(-90, -0.1, 0)).multiply(rot);
  p4.matrix.identity().multiply(new THREE.Matrix4().makeTranslation(90, -0.1, 0)).multiply(rot);

  p1.receiveShadow = true;
  p2.receiveShadow = true;
  p3.receiveShadow = true;
  p4.receiveShadow = true;

  trackGroup.add(p1, p2, p3, p4);
}


// =====================================================================
// GEOMETRIA DA PISTA EM L
// =====================================================================
export function createLTrackElements(trackGroup, material) {
  const trackWidth = 20;

  const segmentData = [
    { length: 200, isHorizontal: true, pos: new THREE.Vector3(0, 0, -90) },
    { length: 180, isHorizontal: false, pos: new THREE.Vector3(90, -0.25, 10) },
    { length: 100, isHorizontal: true, pos: new THREE.Vector3(30, 0, 90) },
    { length: 100, isHorizontal: false, pos: new THREE.Vector3(-10, -0.25, 30) },
    { length: 80, isHorizontal: true, pos: new THREE.Vector3(-60, 0, -10) },
    { length: 60, isHorizontal: false, pos: new THREE.Vector3(-90, -0.25, -50) },
  ];

  let rot = new THREE.Matrix4().makeRotationX(degreesToRadians(-90));

  segmentData.forEach(s => {
    let geo = s.isHorizontal
      ? new THREE.PlaneGeometry(s.length, trackWidth)
      : new THREE.PlaneGeometry(trackWidth, s.length);

    //let mesh = new THREE.Mesh(geo, material);
    let mesh = texturaAsfalto(geo);
    mesh.matrixAutoUpdate = false;
    mesh.matrix.identity()
      .multiply(new THREE.Matrix4().makeTranslation(s.pos.x, s.pos.y, s.pos.z))
      .multiply(rot);
    mesh.receiveShadow = true;
    trackGroup.add(mesh);
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

  segmentData.forEach(s => {
    let geo = s.isHorizontal
      ? new THREE.PlaneGeometry(s.length, trackWidth)
      : new THREE.PlaneGeometry(trackWidth, s.length);

    //let mesh = new THREE.Mesh(geo, material);
    let mesh = texturaAsfalto(geo);
    mesh.matrixAutoUpdate = false;
    mesh.matrix.identity()
      .multiply(new THREE.Matrix4().makeTranslation(s.pos.x, s.pos.y, s.pos.z))
      .multiply(rot);

    mesh.receiveShadow = true;
    
    trackGroup.add(mesh);
  });
}
