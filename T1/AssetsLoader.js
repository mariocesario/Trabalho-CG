import * as THREE from 'three';


export function loadAssets(onProgress) {
  return new Promise(resolve => {
    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, loaded, total) => {
      onProgress(Math.floor((loaded / total) * 100));
    };
    manager.onLoad = resolve;

    new THREE.TextureLoader(manager).load("assets/track.jpg");
    new THREE.AudioLoader(manager).load("assets/sounds/track01.mp3");
    new THREE.GLTFLoader(manager).load("assets/models/tree.glb");
  });
}
