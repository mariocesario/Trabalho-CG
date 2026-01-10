import * as THREE from 'three';

export function updateCameraFollow(camera, car, moveDirection) {
  const localOffset = new THREE.Vector3(-15, 4, 0);
  const worldPos = localOffset.clone();
  car.localToWorld(worldPos);
  const smoothFactor = moveDirection.backward ? 0.1 : 0.03;
  camera.position.lerp(worldPos, smoothFactor);
  camera.lookAt(car.position);
}
