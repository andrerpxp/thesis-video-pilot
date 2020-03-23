// Já peguei tudo então posso usar abaixo
async function fetchFullData(event) {
  event && event.preventDefault();
  const data = await fetch("../data/fulldata.json")
    .then(r => r.json())
    .then(r => r);
  // paintMoveStream(data);
  // paintClickStream(data, "rgba(255, 255, 0, 0.7)");
  countElementsClicks(data);
}
setTimeout(() => {
  fetchFullData();
}, 300);

function countElementsClicks(data) {
  const mouseClicks = data.filter(
    ([t, x, y, id, type]) => type === "mousedown",
  );
  let count = {};
  mouseClicks.forEach(item => {
    let id = item[3];
    const progress = id === "" && item[2] < 480 && item[2] > 440;
    if (id.startsWith("prog")) {
      id = "progress";
    } else if (progress) {
      id = "progress";
    } else if (id === "" && !progress) {
      id = "others";
    }
    if (count[id]) {
      count[id].push(item);
    } else {
      count[id] = [];
      count[id].push(item);
    }
  });
  console.log(count.progress);
  paintMoveStream(count.progress);
  // paintClickStream(count.progress);
  // calculateClicksNearPoints(count.progress);
}

function calculateClicksNearPoints(data) {
  const points = document.querySelectorAll(".int-section-progress");
  let filterData = [];
  points.forEach(point => {
    const { x } = point.getBoundingClientRect();
    // const el = document.createElement("div");
    // el.classList.add("focal-area");
    // el.style.left = x + "px";
    // document.documentElement.appendChild(el);

    const filter = data.filter(item => item[1] > x - 15 && item[1] < x + 30);
    filterData.push(filter);
  });
  // const progressBar = document
  //   .querySelector(".v-progress-max")
  //   .getBoundingClientRect();
  // console.log((4 * 50) / progressBar.width);
  const finalData = filterData.flat();
}

function paintMoveStream(data) {
  // Limpa se já existir algum criado
  const actualCanvas = document.querySelector(".heatmap-canvas");
  if (actualCanvas) actualCanvas.remove();

  const heatmap = h337.create({
    container: document.body,
  });
  const finalData = data.map(([time, x, y]) => ({
    x,
    y: y - 20,
    value: 1,
  }));
  window.finalData = finalData;
  heatmap.configure({
    radius: 1,
    maxOpacity: 0.8,
    minOpacity: 0,
    blur: 0.75,
  });
  heatmap.setData({
    // max: data.length * 0.007,
    max: data.length * 0.035,
    data: finalData,
  });
}

function paintClickStream(data, color = "white") {
  const finalData = data.filter(([t, x, y, id, type]) => type === "mousedown");

  // Make Circle
  const canvas = document.querySelector(".heatmap-canvas");
  const context = canvas.getContext("2d");
  finalData.forEach(([t, x, y]) => {
    context.beginPath();
    context.arc(x - 4, y - 20, 4, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
  });
}
