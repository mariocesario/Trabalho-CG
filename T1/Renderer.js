import * as THREE from 'three';

export function initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    // set device pixel ratio early for correct rendering on high-DPI displays
    renderer.setPixelRatio(window.devicePixelRatio);
    // ensure canvas is in the DOM before sizing / any resize events
    document.getElementById("webgl-output").appendChild(renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
}