      // Enemy.js
    import * as THREE from 'three';
    import { setDefaultMaterial, degreesToRadians } from "../libs/util/util.js";
    import { START_POS_TRACK1, START_POS_TRACK2, START_POS_TRACK3 } from './Car.js';
    import {
    checkpointsTrack1,
    checkpointsTrack2,
    checkpointsTrack3,
    MAX_LAPS,
    setEnemyWinner
    } from './Misc.js';

    // ------------------------------------------------------------
    // POSIÇÕES INICIAIS DO ENEMY (usando valores de `Car.js`)
    // ------------------------------------------------------------
    export const START_ROT_TRACKcar2 = degreesToRadians(0);

      // ------------------------------------------------------------
      // CONTROLE DE PROGRESSO DO INIMIGO POR PISTA
      // ------------------------------------------------------------
      
     
    // Nota: o estado de IA por inimigo é armazenado em `enemy.userData.ai`


      // ------------------------------------------------------------
      // FUNÇÃO GENÉRICA DE CRIAÇÃO DO MODELO DO HOVERCRAFT
      // (usada para o adversário)
      // ------------------------------------------------------------
      function buildHovercraft(baseMat, bodyMat, cabineMat, noseMat) {
      const craft = new THREE.Group();

      const base = new THREE.Mesh(
          new THREE.TorusGeometry(1.3, 0.25, 16, 32),
          baseMat
      );
      base.rotation.x = Math.PI / 2;
      craft.add(base);

      const body = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.4, 0.8, 16),
          bodyMat
      );
      body.position.y = 0.55;
      craft.add(body);

      const cabine = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 0.5, 0.7),
          cabineMat
      );
      cabine.position.set(0, 1.0, 0);
      craft.add(cabine);

      const nose = new THREE.Mesh(
          new THREE.ConeGeometry(0.4, 1.0, 16),
          noseMat
      );
      nose.rotation.z = Math.PI / 2;
      nose.position.set(1.7, 0.35, 0);
    nose.name = 'nose';
      craft.add(nose);

      return craft;
      }

      // ------------------------------------------------------------
      // CARRO ADVERSÁRIO
      // ------------------------------------------------------------
    export function createEnemyCar(scene, id = null) {
      // Materiais foscos (Lambert)
      const matteRed    = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
      const matteBlue   = new THREE.MeshLambertMaterial({ color: 0x0033aa });

      // Material brilhante (Phong)
      const shinyYellow = new THREE.MeshPhongMaterial({
          color: 0xffff00,
          shininess: 100
      });

      // Cria hovercraft adversário
      const enemy = buildHovercraft(
          matteBlue,     // base fosca azul
          shinyYellow,   // corpo brilhante amarelo
          matteRed,      // cabine fosca vermelha
          shinyYellow    // nariz brilhante amarelo
      );

    enemy.position.set(-110, START_POS_TRACK1.y - 0.4, -100);
      enemy.rotation.y = 0;

      enemy.userData = {
          speed: 0, // Velocidade inicial zero - vai acelerar gradualmente
          health: 100,
          maxShotsPerLap: 4,
          shotsRemaining: 4,
          accel: 12.0,
          brake: 10.0,
          drag: 10,
          maxSpeed: 18,
          turnSpeed: THREE.MathUtils.degToRad(70),

          // controle do bot
          aiEnabled: true,
          aiTargetIndex: 0
      };
      // identifica este inimigo
      enemy.userData.id = id;
      enemy.name = id != null ? `enemy${id}` : enemy.name;
      // projéteis e cooldown de tiro
    enemy.userData.projectiles = [];
    enemy.userData.shootCooldown = Math.random() * 2 + 1; // 1-3s
    enemy.userData.prevLapCount = 0;
          // Estado da IA específico por inimigo
          enemy.userData.ai = {
              checkpointIndex: { 1: 0, 2: 0, 3: 0 },
              insideCheckpoint: { 1: false, 2: false, 3: false },
              targetRotation: { 1: null, 2: null },
              lapCount: { 1: 0, 2: 0, 3: 0 }
          };
      
      enemy.traverse(obj => {
    if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
    }
});

      scene.add(enemy);
      return enemy;
      }

      // ------------------------------------------------------------
      // RESET DO CARRO INIMIGO POR PISTA
      // ------------------------------------------------------------
      export function resetEnemyPosition(enemy, trackNumber) {
        let basePos = START_POS_TRACK1.clone();
        const newRot = START_ROT_TRACKcar2;
        if (trackNumber === 1) basePos.copy(START_POS_TRACK1);
        else if (trackNumber === 2) basePos.copy(START_POS_TRACK2);
        else if (trackNumber === 3) basePos.copy(START_POS_TRACK3);

        // Posição base sobre a pista (ajustada para sentar sobre o topo da pista)
        const baseX = basePos.x;
        const baseY = basePos.y - 0.4;
        const baseZ = basePos.z;

        // Posiciona inimigos em formação relativa ao START_POS do track:
        // id == 1 => frente (0, +10)
        // id == 2 => direita (+10, 0) — jogador fica à esquerda deste inimigo
        // id == 3 => frente-da-direita (+10, +10)
        const id = enemy.userData && enemy.userData.id ? enemy.userData.id : 1;
        let offX = 0, offZ = 0;
        if (id === 1) { offX = 0;  offZ = 10; }
        else if (id === 2) { offX = -10; offZ = 0; }
        else if (id === 3) { offX = -10; offZ = 10; }

        enemy.position.set(baseX + offX, baseY, baseZ + offZ);
        enemy.rotation.y = newRot;
        enemy.userData.speed = 0;

      // Garante que o estado de IA exista
      if (!enemy.userData.ai) {
          enemy.userData.ai = {
              checkpointIndex: { 1: 0, 2: 0, 3: 0 },
              insideCheckpoint: { 1: false, 2: false, 3: false },
              targetRotation: { 1: null, 2: null },
              lapCount: { 1: 0, 2: 0, 3: 0 }
          };
      }

      // Reseta apenas o estado do inimigo passado
      enemy.userData.ai.checkpointIndex[trackNumber] = 0;
      enemy.userData.ai.insideCheckpoint[trackNumber] = false;
      enemy.userData.ai.targetRotation[trackNumber] = null;
      }

      // ------------------------------------------------------------
      // VELOCIDADE BASE DO INIMIGO
      // ------------------------------------------------------------
      export const enemySpeed = 22;

      // ------------------------------------------------------------
      // ÍNDICES DO ALVO DO INIMIGO (para referência futura)
      // ------------------------------------------------------------
    // Os índices por inimigo não são mais globais; cada inimigo guarda seu próprio AI

      // ------------------------------------------------------------
      // FUNÇÃO PRINCIPAL — IA DO INIMIGO
      // ------------------------------------------------------------
      export function updateEnemyCar(enemyCar, delta, currentTrack) {
        let checkpoints = null;

      if (currentTrack === 1) checkpoints = checkpointsTrack1;
      if (currentTrack === 2) checkpoints = checkpointsTrack2;
      if (currentTrack === 3) checkpoints = checkpointsTrack3;

      if (!checkpoints || checkpoints.length === 0) return;
    // usa estado de IA do próprio inimigo
    const ai = enemyCar.userData.ai || {
            checkpointIndex: { 1: 0, 2: 0, 3: 0 },
            insideCheckpoint: { 1: false, 2: false, 3: false },
            targetRotation: { 1: null, 2: null },
            lapCount: { 1: 0, 2: 0, 3: 0 }
    };

    // índice do checkpoint que o bot precisa ir
    let idx = ai.checkpointIndex[currentTrack];

    // Garante que o índice está dentro dos limites (usando módulo para voltar ao início)
    if (idx < 0) idx = 0;
    if (idx >= checkpoints.length) idx = idx % checkpoints.length;

    // Atualiza o índice no estado do inimigo
    ai.checkpointIndex[currentTrack] = idx;

      // checkpoint alvo atual
      const currentCheckpoint = checkpoints[idx];
      const target = currentCheckpoint.pos;
      const checkpointRadius = currentCheckpoint.radius || 20;

      // Para pistas 1 e 2: apenas anda para frente, sem virar
      // Para pista 3: calcula direção até o checkpoint
      let direction, distance, isInside, wasInside;
      
      // ------------------------------------------------------------
      // LÓGICA SIMPLIFICADA PARA PISTAS 1 E 2
      // ------------------------------------------------------------
      if (currentTrack === 1 || currentTrack === 2) {
          // Lógica original — segue em direção ao checkpoint atual, com detecção menor
          direction = new THREE.Vector3().subVectors(target, enemyCar.position);
          distance = direction.length();
          const detectionRadius = 8;
          isInside = distance < detectionRadius;
          wasInside = ai.insideCheckpoint[currentTrack];

          if (isInside && !wasInside) {
              const nextIdx = (idx + 1) % checkpoints.length;

              if (nextIdx === 0 && idx === checkpoints.length - 1) {
                  ai.lapCount[currentTrack] = Math.min(ai.lapCount[currentTrack] + 1, MAX_LAPS);
                  if (ai.lapCount[currentTrack] >= MAX_LAPS) setEnemyWinner(enemyCar.userData.id);
              }

              ai.checkpointIndex[currentTrack] = nextIdx;
              ai.insideCheckpoint[currentTrack] = false;
          } else if (isInside) {
              ai.insideCheckpoint[currentTrack] = true;
          } else {
              ai.insideCheckpoint[currentTrack] = false;
          }

          // Rotação suave em direção ao checkpoint (mesma que antes)
          direction.normalize();
          const targetRotation = Math.atan2(-direction.z, direction.x);

          let angleDiff = targetRotation - enemyCar.rotation.y;
          if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          else if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

          const turnSpeed = THREE.MathUtils.degToRad(100);
          const maxRotationStep = turnSpeed * delta;
          const rotationStep = THREE.MathUtils.clamp(angleDiff, -maxRotationStep, maxRotationStep);
          enemyCar.rotation.y += rotationStep;
          // Caso contrário, apenas anda para frente na direção atual
      } else {
          // Para pista 3, segue normalmente em direção ao checkpoint
          direction = new THREE.Vector3().subVectors(target, enemyCar.position);
          distance = direction.length();
          const detectionRadius = 20;
          isInside = distance < detectionRadius;
          wasInside = ai.insideCheckpoint[currentTrack];
          
          // Se entrou no raio do checkpoint pela primeira vez → avança para o próximo
          if (isInside && !wasInside) {
              const nextIdx = (idx + 1) % checkpoints.length;
              
              // Se completou todos os checkpoints e voltou ao checkpoint 0, conta uma volta
              if (nextIdx === 0 && idx === checkpoints.length - 1) {
                  ai.lapCount[currentTrack] = Math.min(ai.lapCount[currentTrack] + 1, MAX_LAPS);
                  
                  // Se completou 4 voltas e ainda não tem vencedor, adversário vence
                  if (ai.lapCount[currentTrack] >= MAX_LAPS) {
                      setEnemyWinner(enemyCar.userData.id);
                  }
              }
              
              ai.checkpointIndex[currentTrack] = nextIdx;
              ai.insideCheckpoint[currentTrack] = false;
          } else if (isInside) {
              ai.insideCheckpoint[currentTrack] = true;
          } else {
              ai.insideCheckpoint[currentTrack] = false;
          }
          
          // Calcula rotação em direção ao checkpoint
          direction.normalize();
          const targetRotation = Math.atan2(-direction.z, direction.x);
          
          // Ajusta a rotação gradualmente para fazer curvas suaves
          let angleDiff = targetRotation - enemyCar.rotation.y;
          
          // Normaliza o ângulo para o intervalo [-PI, PI] para pegar o caminho mais curto
          if (angleDiff > Math.PI) {
              angleDiff -= 2 * Math.PI;
          } else if (angleDiff < -Math.PI) {
              angleDiff += 2 * Math.PI;
          }
          
          // Velocidade de rotação constante
          const turnSpeed = THREE.MathUtils.degToRad(80);
          const maxRotationStep = turnSpeed * delta;
          
          // Limita a rotação para não ultrapassar o alvo
          const rotationStep = THREE.MathUtils.clamp(angleDiff, -maxRotationStep, maxRotationStep);
          
          enemyCar.rotation.y += rotationStep;
      }
      
      // Ajusta a velocidade gradualmente em direção à velocidade base
      const targetSpeed = enemySpeed;
      const currentSpeed = enemyCar.userData.speed || 0;
      const accel = enemyCar.userData.accel || 12.0;

      // Se a velocidade está abaixo da velocidade alvo, acelera (usa `accel`, que pode ter sido reduzida pela penalidade)
      if (currentSpeed < targetSpeed) {
          const speedIncrease = accel * delta;
          enemyCar.userData.speed = Math.min(currentSpeed + speedIncrease, targetSpeed);
      } else if (currentSpeed > targetSpeed) {
          const speedDiff = targetSpeed - currentSpeed;
          enemyCar.userData.speed = currentSpeed + speedDiff * delta * 3;
      } else {
          enemyCar.userData.speed = targetSpeed;
      }
      
      // Move usando a velocidade atual na direção que está olhando
      const forwardDir = new THREE.Vector3(
          Math.cos(enemyCar.rotation.y),
          0,
          -Math.sin(enemyCar.rotation.y)
      );
      enemyCar.position.addScaledVector(forwardDir, enemyCar.userData.speed * delta);
      }

    // ------------------------------------------------------------
    // Nota: não há resets globais de IA — cada inimigo armazena seu próprio estado
    // ------------------------------------------------------------

