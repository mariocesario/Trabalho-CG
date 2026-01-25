import * as THREE from  'three';

export function texturaTest(geometria)
{
    var textureloader = new THREE.TextureLoader();
    var stone = textureloader.load('../assets/textures/stone.jpg');

    var cubeMaterial = new THREE.MeshLambertMaterial();
    cubeMaterial.map = stone;
    var cube = new THREE.Mesh(geometria, cubeMaterial);

    return cube;
}

export function texturaAsfalto(geometria)
{
    var textureloader = new THREE.TextureLoader();
    var asfalto = textureloader.load('../assets/textures/asfalto.jpg');
    asfalto.wrapS = THREE.RepeatWrapping;
    asfalto.wrapT = THREE.RepeatWrapping;

    var pistaMaterial = new THREE.MeshLambertMaterial();
    pistaMaterial.map = asfalto;
    var pista = new THREE.Mesh(geometria, pistaMaterial);
    pista.material.map.repeat.x = 2;
    pista.material.map.repeat.y = 2;

    return pista;
}

export function texturaFolha(geometria)
{
    var textureloader = new THREE.TextureLoader();
    var chao = textureloader.load('../assets/textures/grass.jpg');

    var chaoMaterial = new THREE.MeshLambertMaterial();
    chaoMaterial.map = chao;
    var plano = new THREE.Mesh(geometria, chaoMaterial);

    return plano;
}

export function Skybox(scene)
{
    const textureloader = new THREE.TextureLoader();
    let textureEquirec = textureloader.load('../assets/textures/skybox/panorama1.jpg');
    textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
    
    scene.background = textureEquirec;
}

export function texturaExterna(geometria,n)
{
    var textureloader = new THREE.TextureLoader();
    if(n == 1)
    {
        var areaExter =textureloader.load('../assets/textures/grass.jpg');
    }
    else if(n== 2)
    {
        var areaExter =textureloader.load('../assets/textures/sand.jpg');
    }
    else
    {
        var areaExter =textureloader.load('../assets/textures/cement.jpg');
    }

    var areaEX = new THREE.MeshLambertMaterial();
    areaEX.map = areaExter;
    var area = new THREE.Mesh(geometria,areaEX);

    return area;
}

export function texturaBarreira(geometria)
{
    var textureloader = new THREE.TextureLoader();
    var barreira = textureloader.load('../assets/textures/crate.jpg');

    var barreiraMaterial = new THREE.MeshLambertMaterial();
    barreiraMaterial.map = barreira;
    var barrei = new THREE.Mesh(geometria, barreiraMaterial);

    return barrei;
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


function setMaterial(file, repeatU = 1, repeatV = 1, color = 'rgb(255,255,255)'){
    let loader = new THREE.TextureLoader();
   let mat = new THREE.MeshBasicMaterial({ map: loader.load(file), color:color});
      mat.map.colorSpace = THREE.SRGBColorSpace;
   mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
   mat.map.minFilter = mat.map.magFilter = THREE.LinearFilter;
   mat.map.repeat.set(repeatU,repeatV); 
   return mat;
}