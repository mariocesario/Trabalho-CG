// Bootstrap: tela de carregamento + START. A cena 3D é criada por Scene.js.
const loadingText = document.getElementById("loading-text");
const startBtn = document.getElementById("startBtn");

loadingText.textContent = "Pronto!";
startBtn.disabled = false;

startBtn.onclick = () => {
  document.getElementById("loading-screen").style.display = "none";
};
