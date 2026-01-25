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

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(50, 80, 40);
  dirLight.castShadow = true;

  // === Parâmetros de sombra ===
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;

  const d = 120;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 500;

  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.02;

  scene.add(dirLight);

  // === Luz ambiente ===
  const ambient = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambient);

  // === Atualização (segue o carro sem rotacionar) ===
  function updateLightFollow() {
    dirLight.position.x = car.position.x + 50;
    dirLight.position.z = car.position.z + 40;
  }

  return { dirLight, updateLightFollow };
}

/*export function updateLightFollow(car, dirLight) {
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
}*/