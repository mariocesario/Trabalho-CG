      // Enemy.js
      import * as THREE from 'three';
      import { setDefaultMaterial, degreesToRadians } from "../libs/util/util.js";
      import {
      checkpointsTrack1,
      checkpointsTrack2,
      checkpointsTrack3,
      MAX_LAPS,
      setEnemyWinner
      } from './Misc.js';

      // ------------------------------------------------------------
      // POSIÇÕES INICIAIS DO ENEMY
      // ------------------------------------------------------------
      export const START_POS_TRACKcar2 = new THREE.Vector3(-40, 0.5, -95);
      export const START_ROT_TRACKcar2 = degreesToRadians(0);

      // ------------------------------------------------------------
      // CONTROLE DE PROGRESSO DO INIMIGO POR PISTA
      // ------------------------------------------------------------
      export let enemyCheckpointIndex = {
      1: 0,
      2: 0,
      3: 0
      };

      // Rastreia se o adversário já entrou no raio do checkpoint atual
      // Isso evita que ele avance múltiplas vezes no mesmo checkpoint
      let enemyInsideCheckpoint = {
      1: false,
      2: false,
      3: false
      };

      // Rastreia o ângulo alvo para curvas suaves nas pistas 1 e 2
      let enemyTargetRotation = {
      1: null,
      2: null
      };

      // Rastreia voltas do adversário por pista
      let enemyLapCount = {
      1: 0,
      2: 0,
      3: 0
      };

      // Rastreia se o adversário completou todos os checkpoints (pronto para próxima volta)
      let enemySequenceComplete = {
      1: false,
      2: false,
      3: false
      };

      export function resetEnemyCheckpointIndex() {
      enemyCheckpointIndex[1] = 0;
      enemyCheckpointIndex[2] = 0;
      enemyCheckpointIndex[3] = 0;
      enemyInsideCheckpoint[1] = false;
      enemyInsideCheckpoint[2] = false;
      enemyInsideCheckpoint[3] = false;
      enemyTargetRotation[1] = null;
      enemyTargetRotation[2] = null;
      enemyLapCount[1] = 0;
      enemyLapCount[2] = 0;
      enemyLapCount[3] = 0;
      enemySequenceComplete[1] = false;
      enemySequenceComplete[2] = false;
      enemySequenceComplete[3] = false;
      }


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
      craft.add(nose);

      return craft;
      }

      // ------------------------------------------------------------
      // CARRO ADVERSÁRIO
      // ------------------------------------------------------------
      export function createEnemyCar(scene) {
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

      enemy.position.set(-110, 0.5, -100);
      enemy.rotation.y = 0;

      enemy.userData = {
          speed: 0, // Velocidade inicial zero - vai acelerar gradualmente
          accel: 12.0,
          brake: 10.0,
          drag: 10,
          maxSpeed: 18,
          turnSpeed: THREE.MathUtils.degToRad(70),

          // controle do bot
          aiEnabled: true,
          aiTargetIndex: 0
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
      let newPos, newRot;
      
      if (trackNumber === 1) {
          newPos = START_POS_TRACKcar2;
          newRot = START_ROT_TRACKcar2;
      } else if (trackNumber === 2) {
          newPos = START_POS_TRACKcar2;
          newRot = START_ROT_TRACKcar2;
      } else if (trackNumber === 3) {
          newPos = START_POS_TRACKcar2;
          newRot = START_ROT_TRACKcar2;
      } else {
          newPos = START_POS_TRACKcar2;
          newRot = START_ROT_TRACKcar2;
      }
      
      enemy.position.copy(newPos);
      enemy.rotation.y = newRot;
      enemy.userData.speed = 0;
      
      // Reseta o checkpoint index quando troca de pista
      enemyCheckpointIndex[trackNumber] = 0;
      enemyInsideCheckpoint[trackNumber] = false;
      enemyTargetRotation[trackNumber] = null;
      }

      // ------------------------------------------------------------
      // VELOCIDADE BASE DO INIMIGO
      // ------------------------------------------------------------
      export const enemySpeed = 22;

      // ------------------------------------------------------------
      // ÍNDICES DO ALVO DO INIMIGO (para referência futura)
      // ------------------------------------------------------------
      let enemyTargetIndex1 = 0;
      let enemyTargetIndex2 = 0;
      let enemyTargetIndex3 = 0;

      // ------------------------------------------------------------
      // FUNÇÃO PRINCIPAL — IA DO INIMIGO
      // ------------------------------------------------------------
      export function updateEnemyCar(enemyCar, delta, currentTrack) {
      let checkpoints = null;

      if (currentTrack === 1) checkpoints = checkpointsTrack1;
      if (currentTrack === 2) checkpoints = checkpointsTrack2;
      if (currentTrack === 3) checkpoints = checkpointsTrack3;

      if (!checkpoints || checkpoints.length === 0) return;

      // índice do checkpoint que o bot precisa ir
      let idx = enemyCheckpointIndex[currentTrack];
      
      // Garante que o índice está dentro dos limites (usando módulo para voltar ao início)
      if (idx < 0) idx = 0;
      if (idx >= checkpoints.length) idx = idx % checkpoints.length;
      
      // Atualiza o índice se necessário
      enemyCheckpointIndex[currentTrack] = idx;

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
          // Distância até o checkpoint atual
          const distance = enemyCar.position.distanceTo(target);

          // Raio para ativação
          const detectionRadius = 8;

          // Se entrou no checkpoint neste quadro
          if (distance < detectionRadius && !enemyInsideCheckpoint[currentTrack]) {
              // Marca que entrou (para não repetir enquanto dentro)
              enemyInsideCheckpoint[currentTrack] = true;

              // Faz curva de 90° exceto no checkpoint 1 (índice 0)
              if (idx !== 0) {
                  // Pista 1: todas as curvas são para a direita
                  // Pista 2: checkpoint 9 (penúltimo antes do último) vira para esquerda, outros para direita
                  if (currentTrack === 1) {
                      // Pista 1: sempre vira 90 graus à direita
                      enemyTargetRotation[currentTrack] = enemyCar.rotation.y - Math.PI / 2;
                  } else if (currentTrack === 2) {
                      // Pista 2: checkpoint 9 (índice 4) vira para esquerda, outros para direita
                      // Mesmo se adicionar mais checkpoints, o checkpoint 9 continua no índice 4
                      if (idx === 4) {
                          // Checkpoint 9: vira 90 graus à esquerda
                          enemyTargetRotation[currentTrack] = enemyCar.rotation.y + Math.PI / 2;
                      } else {
                          // Outros checkpoints: vira 90 graus à direita
                          enemyTargetRotation[currentTrack] = enemyCar.rotation.y - Math.PI / 2;
                      }
                  }
              }

              // Avança para o próximo checkpoint (usando módulo para voltar ao 0)
              // Isso permite repetir a primeira volta 4 vezes iguais
              const nextIdx = (idx + 1) % checkpoints.length;
              
              // Se completou todos os checkpoints e voltou ao checkpoint 0, conta uma volta
              if (nextIdx === 0 && idx === checkpoints.length - 1) {
                  enemyLapCount[currentTrack] = Math.min(enemyLapCount[currentTrack] + 1, MAX_LAPS);
                  
                  // Se completou 4 voltas e ainda não tem vencedor, adversário vence
                  if (enemyLapCount[currentTrack] >= MAX_LAPS) {
                      setEnemyWinner();
                  }
              }
              
              enemyCheckpointIndex[currentTrack] = nextIdx;
              
              // Reseta o flag imediatamente para permitir detecção do próximo checkpoint
              // Isso garante que funcione igual em todas as 4 voltas
              enemyInsideCheckpoint[currentTrack] = false;
          }

          // Se saiu do raio, libera para detectar o próximo checkpoint
          if (distance >= detectionRadius) {
              enemyInsideCheckpoint[currentTrack] = false;
          }

          // Se está no primeiro checkpoint (índice 0), vai em direção a ele
          // Depois disso, apenas anda para frente
          if (idx === 0 && distance > detectionRadius) {
              // Vai em direção ao primeiro checkpoint
              direction = new THREE.Vector3().subVectors(target, enemyCar.position);
              direction.normalize();
              const targetRotation = Math.atan2(-direction.z, direction.x);
              
              let angleDiff = targetRotation - enemyCar.rotation.y;
              
              // Normaliza o ângulo
              if (angleDiff > Math.PI) {
                  angleDiff -= 2 * Math.PI;
              } else if (angleDiff < -Math.PI) {
                  angleDiff += 2 * Math.PI;
              }
              
              // Rotação suave em direção ao checkpoint
              const turnSpeed = THREE.MathUtils.degToRad(80);
              const maxRotationStep = turnSpeed * delta;
              const rotationStep = THREE.MathUtils.clamp(angleDiff, -maxRotationStep, maxRotationStep);
              enemyCar.rotation.y += rotationStep;
          } else if (enemyTargetRotation[currentTrack] !== null) {
              // Se há uma curva pendente, executa gradualmente
              const targetRot = enemyTargetRotation[currentTrack];
              let angleDiff = targetRot - enemyCar.rotation.y;
              
              // Normaliza o ângulo para o intervalo [-PI, PI]
              if (angleDiff > Math.PI) {
                  angleDiff -= 2 * Math.PI;
              } else if (angleDiff < -Math.PI) {
                  angleDiff += 2 * Math.PI;
              }
              
              // Velocidade de rotação para curva suave
              const turnSpeed = THREE.MathUtils.degToRad(120); // graus por segundo
              const maxRotationStep = turnSpeed * delta;
              
              // Limita a rotação
              const rotationStep = THREE.MathUtils.clamp(angleDiff, -maxRotationStep, maxRotationStep);
              enemyCar.rotation.y += rotationStep;
              
              // Se chegou ao ângulo alvo, limpa o target
              if (Math.abs(angleDiff) < 0.01) {
                  enemyCar.rotation.y = targetRot; // Garante precisão
                  enemyTargetRotation[currentTrack] = null;
              }
          }
          // Caso contrário, apenas anda para frente na direção atual
      }
 else {
          // Para pista 3, segue normalmente em direção ao checkpoint
          direction = new THREE.Vector3().subVectors(target, enemyCar.position);
          distance = direction.length();
          const detectionRadius = 20;
          isInside = distance < detectionRadius;
          wasInside = enemyInsideCheckpoint[currentTrack];
          
          // Se entrou no raio do checkpoint pela primeira vez → avança para o próximo
          if (isInside && !wasInside) {
              const nextIdx = (idx + 1) % checkpoints.length;
              
              // Se completou todos os checkpoints e voltou ao checkpoint 0, conta uma volta
              if (nextIdx === 0 && idx === checkpoints.length - 1) {
                  enemyLapCount[currentTrack] = Math.min(enemyLapCount[currentTrack] + 1, MAX_LAPS);
                  
                  // Se completou 4 voltas e ainda não tem vencedor, adversário vence
                  if (enemyLapCount[currentTrack] >= MAX_LAPS) {
                      setEnemyWinner();
                  }
              }
              
              enemyCheckpointIndex[currentTrack] = nextIdx;
              enemyInsideCheckpoint[currentTrack] = false;
          } else if (isInside) {
              enemyInsideCheckpoint[currentTrack] = true;
          } else {
              enemyInsideCheckpoint[currentTrack] = false;
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
      
      // Se a velocidade está abaixo da velocidade alvo, acelera
      if (currentSpeed < targetSpeed) {
          // Acelera usando a aceleração definida
          const speedIncrease = accel * delta;
          enemyCar.userData.speed = Math.min(currentSpeed + speedIncrease, targetSpeed);
      } else if (currentSpeed > targetSpeed) {
          // Se estiver acima (após colisão), reduz gradualmente
          const speedDiff = targetSpeed - currentSpeed;
          enemyCar.userData.speed = currentSpeed + speedDiff * delta * 3;
      } else {
          // Mantém a velocidade alvo
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
      // RESETAR IA QUANDO TROCAR DE PISTA
      // ------------------------------------------------------------
      export function resetEnemyAI() {
      enemyTargetIndex1 = 0;
      enemyTargetIndex2 = 0;
      enemyTargetIndex3 = 0;
      }

