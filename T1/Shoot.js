import * as THREE from 'three';
import { setDefaultMaterial } from "./libs/util/util.js";

// Tenta tocar um arquivo de áudio com vários prefixes para evitar 404s quando rodando em subpastas
// Agora tenta procurar em `T1/` primeiro (os arquivos foram copiados para essa pasta),
// depois faz fallback para `0_assets_T3/` e outros prefixes.
function playWithFallbacks(filename, volume = 0.8) {
  const bases = [location.origin + '/', '/', '../', ''];
  const basename = filename.includes('/') ? filename.split('/').pop() : filename;

  // monta lista de candidatos. Se filename contém caminho (ex: 'T1/laser.mp3'),
  // tenta esse caminho primeiro em cada base; em seguida tenta em 0_assets_T3/ como fallback.
  const candidatePaths = [];
  bases.forEach(b => {
    if (filename.includes('/')) {
      candidatePaths.push(b + filename);
    } else {
      candidatePaths.push(b + 'T1/' + filename); // prioridade para T1/
    }
    candidatePaths.push(b + '0_assets_T3/' + basename); // fallback antigo
  });

  const tryPlay = (i) => {
    if (i >= candidatePaths.length) return;
    try {
      const src = encodeURI(candidatePaths[i]);
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume = volume;
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) p.catch(() => { tryPlay(i + 1); });
    } catch (e) {
      tryPlay(i + 1);
    }
  };
  tryPlay(0);
}

// Cria um projétil que sai do nariz do veículo
export function shootFromCar(car, scene, options = {}) {
  const nose = car.getObjectByName('nose');
  if (!nose) return null;

  // posição inicial do projétil (posição mundial do nariz)
  const startPos = new THREE.Vector3();
  nose.getWorldPosition(startPos);

  // direção de disparo — mesmo cálculo usado para mover o carro
  const dir = new THREE.Vector3(
    Math.cos(car.rotation.y),
    0,
    -Math.sin(car.rotation.y)
  ).normalize();

  const geom = new THREE.SphereGeometry(options.radius || 0.25, 8, 8);
  // projéteis vermelhos brilhantes (Phong)
  const mat = new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 });
  const proj = new THREE.Mesh(geom, mat);
  proj.position.copy(startPos);

  proj.userData = {
    dir: dir.clone(),
    speed: options.speed || 80,
    traveled: 0,
    maxRange: options.maxRange || 400,
    owner: car,
    damage: options.damage || 25
  };

  scene.add(proj);

  if (!car.userData.projectiles) car.userData.projectiles = [];
  // verifica munição por volta
  if (typeof car.userData.shotsRemaining === 'number') {
    if (car.userData.shotsRemaining <= 0) {
      // não atira sem munição
      if (proj.parent) proj.parent.remove(proj);
      return null;
    }
    car.userData.shotsRemaining -= 1;
  }

  car.userData.projectiles.push(proj);

  // Toca som do laser quando disparado (arquivo agora em T1/)
  try { playWithFallbacks('T1/laser.mp3', 0.9); } catch (e) {}

  return proj;
}

// Atualiza projéteis de um veículo, checando colisões contra uma lista de alvos
export function updateProjectiles(car, delta, targets = [], scene = null) {
  const list = car.userData.projectiles || [];
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    const move = p.userData.speed * delta;
    const prevPos = p.position.clone();
    p.position.addScaledVector(p.userData.dir, move);
    p.userData.traveled += move;

    // colisão com alvos fornecidos
    let collided = false;
    for (let t = 0; t < targets.length; t++) {
      const target = targets[t];
      if (!target || !target.parent) continue;

      // primeiro tenta detecção por raycast entre pos anterior e atual (evita "tunneling")
      let hit = false;
      try {
        const ray = new THREE.Raycaster(prevPos, p.userData.dir, 0, move + 0.001);
        const intersects = ray.intersectObject(target, true);
        if (intersects && intersects.length > 0) hit = true;
      } catch (e) {
        hit = false;
      }

      // fallback: bounding box contains point (antigo método)
      if (!hit) {
        const targetBB = new THREE.Box3().setFromObject(target);
        if (targetBB.containsPoint(p.position)) hit = true;
      }

      if (hit) {
          // evita atingir o próprio dono
          if (target === p.userData.owner) {
            hit = false;
          }

          // não atinge alvos já desativados
          if (target.userData && target.userData.disabled) {
            hit = false;
          }

          if (!hit) continue;

          // aplica penalidade na aceleração (não desabilita o alvo)
          if (target.userData) {
            if (typeof target.userData.accel === 'number') {
              if (typeof target.userData.prePenaltyAccel !== 'number') {
                  target.userData.prePenaltyAccel = target.userData.accel;
                  target.userData.accel = target.userData.accel * 0.3; // reduz aceleração para 30%
                } else {
                  // se já existe prePenaltyAccel, garante que esteja coerente
                  if (typeof target.userData.prePenaltyAccel !== 'number' && typeof target.userData.accel === 'number') {
                    target.userData.prePenaltyAccel = target.userData.accel / 0.3;
                  }
                }
            }
            // aplica redução imediata de velocidade (salva valor anterior)
            if (typeof target.userData.speed === 'number') {
              if (typeof target.userData.prePenaltySpeed !== 'number') {
                target.userData.prePenaltySpeed = target.userData.speed;
                target.userData.speed = target.userData.speed * 0.5; // reduz velocidade para 50%
              }
            }
            // marca penalidade e tempo (usamos o mesmo flag `isPenalized` e `penaltyTimeLeft`)
            target.userData.isPenalized = true;
            target.userData.penaltyTimeLeft = 3.0;
          }

          // toca som específico se o jogador foi atingido (arquivo agora em T1/)
          try { if (target.userData && target.userData.isPlayer) playWithFallbacks('T1/bat_hit.mp3', 0.9); } catch(e) {}

        // remove projétil da cena
        if (p.parent) p.parent.remove(p);
        list.splice(i, 1);
        collided = true;

        break;
      }
    }

    if (collided) continue;

    // remover quando ultrapassar o alcance
    if (p.userData.traveled >= p.userData.maxRange) {
      if (p.parent) p.parent.remove(p);
      list.splice(i, 1);
    }
  }
}
