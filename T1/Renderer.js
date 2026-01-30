import * as THREE from 'three';

export function initRenderer() {
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
    // cap device pixel ratio to avoid heavy rendering on mobile/high-DPI
    const maxDPR = isMobile ? 1 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDPR));
    // ensure canvas is in the DOM before sizing / any resize events
    document.getElementById("webgl-output").appendChild(renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
}