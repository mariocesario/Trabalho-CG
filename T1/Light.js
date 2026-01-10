import * as THREE from 'three';

export function initLight(scene, car) {

    // inicializa luz ambiente
    let lightColor = "rgb(255,255,255)";
    let ambientLight = new THREE.AmbientLight(lightColor, 0.7);
    scene.add(ambientLight);

    // inicializa luz direcional
    const angleDeg = -70;
    const angleRad = THREE.MathUtils.degToRad(angleDeg);
    const dist = 40;
    const altura = 22;

    const dx = dist * Math.cos(angleRad);
    const dy = altura;
    const dz = dist * Math.sin(angleRad);

    let lightPosition = new THREE.Vector3(
        car.position.x + dx,
        car.position.y + dy,
        car.position.z + dz
    );

    let dirLight = new THREE.DirectionalLight(lightColor, 1);
    dirLight.position.copy(lightPosition);
    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;  
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    dirLight.shadow.camera.top = 120;
    dirLight.shadow.camera.bottom = -120;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 300;

    scene.add(dirLight);
    return dirLight;
}

export function updateLightFollow(car, dirLight) {
  // Ângulo de inclinação (em graus)
  const angleDeg = -70;
  const angleRad = THREE.MathUtils.degToRad(angleDeg);

  // Distância da luz ao carro
  const dist = 40; // ajuste conforme necessário
  const altura = 22; // altura acima do carro

  // Calcula deslocamento em X e Y (Y é vertical)
  const dx = dist * Math.cos(angleRad);
  const dy = altura;
  const dz = dist * Math.sin(angleRad);

  // Posição da luz: acompanha o carro, mas com ângulo fixo
  const lightPos = new THREE.Vector3(
    car.position.x + dx,
    car.position.y + dy,
    car.position.z + dz
  );

  dirLight.position.copy(lightPos);

  // Luz sempre aponta para o carro (target)
  dirLight.target.position.copy(car.position);
  dirLight.target.updateMatrixWorld();
}