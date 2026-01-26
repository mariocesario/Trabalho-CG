import * as THREE from 'three';

// TextureLoader compartilhado e cache de texturas
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();
const materialCache = new Map();

function getTexture(path) {
  if (textureCache.has(path)) {
    return textureCache.get(path);
  }
  const texture = textureLoader.load(path);
  textureCache.set(path, texture);
  return texture;
}

function getMaterial(texturePath, materialType = THREE.MeshLambertMaterial) {
  const key = `${texturePath}_${materialType.name}`;
  if (materialCache.has(key)) {
    return materialCache.get(key);
  }
  const texture = getTexture(texturePath);
  const material = new materialType({ map: texture });
  materialCache.set(key, material);
  return material;
}

export function texturaAsfalto(geometria) {
  const asfalto = getTexture('../assets/textures/asfalto.jpg');
  asfalto.wrapS = THREE.RepeatWrapping;
  asfalto.wrapT = THREE.RepeatWrapping;
  asfalto.repeat.x = 2;
  asfalto.repeat.y = 2;

  const pistaMaterial = new THREE.MeshLambertMaterial({ map: asfalto });
  return new THREE.Mesh(geometria, pistaMaterial);
}

export function texturaFolha(geometria) {
  const material = getMaterial('../assets/textures/grass.jpg');
  return new THREE.Mesh(geometria, material);
}

export function Skybox(scene) {
  const textureEquirec = getTexture('../assets/textures/skybox/panorama1.jpg');
  textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = textureEquirec;
}

export function texturaExterna(geometria, n) {
  let texturePath;
  if (n == 1) {
    texturePath = '../assets/textures/grass.jpg';
  } else if (n == 2) {
    texturePath = '../assets/textures/sand.jpg';
  } else {
    texturePath = '../assets/textures/cement.jpg';
  }

  const material = getMaterial(texturePath);
  return new THREE.Mesh(geometria, material);
}

export function texturaBarreira(geometria) {
  let geoMaterials = [
        setMaterial('./texturas/barreira.jpg'),
        setMaterial('./texturas/barreira.jpg'),
        setMaterial('../assets/textures/crate.jpg'),
        new THREE.MeshBasicMaterial({color:'rgb(255,255,255)'}),
        setMaterial('./texturas/barreira.jpg'),
        setMaterial('./texturas/barreira.jpg')
    ];
  return new THREE.Mesh(geometria, geoMaterials);
}

export function texturaPistaElevada(geometria)
{
    let geoMaterials = [
        setMaterial('../assets/textures/stone.jpg'),
        setMaterial('../assets/textures/stone.jpg'),
        setMaterial('../assets/textures/asfalto.jpg'),
        setMaterial('../assets/textures/stone.jpg'),
        setMaterial('../assets/textures/stone.jpg'),
        setMaterial('../assets/textures/stone.jpg')
    ];

    let pista = new THREE.Mesh(geometria, geoMaterials);

    return pista;
}

export function texturaCarroBase(geometria)
{
  const material = getMaterial('./texturas/Pneu.jpg');

  return new THREE.Mesh(geometria, material);
}

export function texturaCarroCorpo(geometria,n,orimaterial)
{
  let material;
  
  if(n == 1)
  {
    material = [
      getMaterial('./texturas/carro.jpg'),
      orimaterial,
      orimaterial
    ];
  }
  else
  {
    material = [
      getMaterial('./texturas/carro1.jpg'),
      orimaterial,
      orimaterial
    ];
  }

  return new THREE.Mesh(geometria, material);
}

function setMaterial(file, repeatU = 1, repeatV = 1, color = 'rgb(255,255,255)'){
    let loader = new THREE.TextureLoader();
   let mat = new THREE.MeshBasicMaterial({ map: loader.load(file), color:color});
      mat.map.colorSpace = THREE.SRGBColorSpace;
   mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
   mat.map.minFilter = mat.map.magFilter = THREE.LinearFilter;
   mat.map.repeat.set(repeatU,repeatV); 
   return mat;
}
