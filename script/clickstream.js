const urlParams = new URLSearchParams(window.location.search);
const participant =
  "participant" + urlParams.get("participant") + "_" + Date.now();

const settings = {
  width: window.innerWidth,
  height: window.innerHeight,
  participant: participant,
};
const data = [settings];

function saveData() {
  fetch("https://andrerafael.com/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ participant, data }),
  });
}
setInterval(saveData, 5000);
window.onbeforeunload = saveData;
// Dados enviados ao evento
function pushEventData(event) {
  data.push([
    new Date().getTime(),
    event.pageX,
    event.pageY,
    event.target.id,
    event.type,
    event.key,
  ]);
}

// Envia os dados ao mousemove e remove o evento.
function onMouseMove(event) {
  pushEventData(event);
  document.body.removeEventListener("mousemove", onMouseMove, false);
}

// Cada Xms lista o mousemove
setInterval(() => {
  document.body.addEventListener("mousemove", onMouseMove, false);
}, 100);

// Verifica o evento de click.
document.documentElement.addEventListener("mousedown", pushEventData);
document.documentElement.addEventListener("keydown", pushEventData);

const video = document.querySelector("video");
video.addEventListener("ended", pushEventData);
video.addEventListener("pause", pushEventData);
video.addEventListener("play", pushEventData);
