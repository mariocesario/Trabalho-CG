import { loadAssets } from './T3/AssetsLoader.js';

const loadingText = document.getElementById("loading-text");
const startBtn = document.getElementById("startBtn");

loadAssets(progress => {
  loadingText.innerText = `Carregando ${progress}%`;
}).then(() => {
  startBtn.disabled = false;
  loadingText.innerText = "Pronto!";
});

startBtn.onclick = () => {
  document.getElementById("loading-screen").style.display = "none";
  startGame(); // aqui você cria a Scene, Camera, Renderer
};
