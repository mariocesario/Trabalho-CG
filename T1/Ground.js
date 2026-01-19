import * as THREE from 'three';
import { degreesToRadians } from "../libs/util/util.js";
import { texturaExterna } from './Texture.js';

export function createGroundPlane(scene,n) {

  const groundGeometry = new THREE.PlaneGeometry(500, 500);
  const ground = texturaExterna(groundGeometry, n);

  ground.rotation.x = degreesToRadians(-90);
  ground.position.y = -0.2;
  ground.receiveShadow = true;

  scene.add(ground);
}
