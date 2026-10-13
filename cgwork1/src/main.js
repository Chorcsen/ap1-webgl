// main.js —— 应用入口
import { chaosGame, gasketVertices, regularPolygon, ratioOf, demo } from './geometry.js';
import { bindMouse, bindKeys } from './interaction.js';
import { buildPanel, SCHEMES } from './ui.js';

const state = {
  mode: 'points',      // points | lines | triangles
  pointCount: 20000,
  sides: 3,
  depth: 4,
  pointSize: 2,
  scheme: 0,
  playing: true,
  growth: 0,           // 生长进度 0..1
  view: { offset: [0, 0], zoom: 1 },
};

const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext('webgl2');
if (!gl) alert("WebGL 2.0 isn't available");

if (new URLSearchParams(location.search).has('selftest')) {
  console.log('geometry self-check:', demo());
}

gl.viewport(0, 0, canvas.width, canvas.height);

const program = initShaders(gl, 'vertex-shader', 'fragment-shader'); // Common/initShaders.js
gl.useProgram(program);

const aPosition = gl.getAttribLocation(program, 'aPosition');
const uScale = gl.getUniformLocation(program, 'uScale');
const uOffset = gl.getUniformLocation(program, 'uOffset');
const uPointSize = gl.getUniformLocation(program, 'uPointSize');
const uColorA = gl.getUniformLocation(program, 'uColorA');
const uColorB = gl.getUniformLocation(program, 'uColorB');

const MODE_GL = { points: gl.POINTS, lines: gl.LINES, triangles: gl.TRIANGLES };
const STRIDE = { points: 1, lines: 2, triangles: 3 }; // 每个图元占几个顶点

const pointBuffer = gl.createBuffer();  // 混沌游戏点云
const gasketBuffer = gl.createBuffer(); // 递归细分三角形
const cache = { points: '', depth: -1, gasketVerts: 0 };

// 只有参数变化时才重新上传 VBO
function uploadPoints() {
  const key = state.pointCount + '/' + state.sides;
  if (cache.points === key) return;
  cache.points = key;
  const data = chaosGame(state.pointCount, regularPolygon(state.sides), ratioOf(state.sides));
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
}

function uploadGasket() {
  if (cache.depth === state.depth) return;
  cache.depth = state.depth;
  const data = gasketVertices(state.depth);
  cache.gasketVerts = data.length / 2;
  gl.bindBuffer(gl.ARRAY_BUFFER, gasketBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
}

function draw() {
  const scheme = SCHEMES[state.scheme];
  gl.clearColor(scheme.bg[0], scheme.bg[1], scheme.bg[2], 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform2f(uScale, state.view.zoom, state.view.zoom);
  gl.uniform2f(uOffset, state.view.offset[0], state.view.offset[1]);
  gl.uniform1f(uPointSize, state.pointSize);
  gl.uniform3fv(uColorA, scheme.a);
  gl.uniform3fv(uColorB, scheme.b);

  let total;
  if (state.mode === 'points') {
    uploadPoints();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    total = state.pointCount;
  } else {
    uploadGasket();
    gl.bindBuffer(gl.ARRAY_BUFFER, gasketBuffer);
    total = cache.gasketVerts;
  }
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  // 逐点生长：按进度算出要画多少顶点，并取整到完整的图元
  const stride = STRIDE[state.mode];
  const count = Math.floor((total * state.growth) / stride) * stride;
  if (count > 0) gl.drawArrays(MODE_GL[state.mode], 0, count);
}

const GROW_SECONDS = 2.5; // 从 0 长满所需时间

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (state.playing && state.growth < 1) {
    state.growth = Math.min(1, state.growth + dt / GROW_SECONDS);
  }
  draw();
  requestAnimationFrame(frame);
}

function togglePlay() {
  state.playing = !state.playing;
  if (state.playing && state.growth >= 1) state.growth = 0; // 已长满则重新播放
  panel.sync();
}

const panel = buildPanel(document.getElementById('panel'), state, {
  onChange: () => panel.sync(),
  onTogglePlay: togglePlay,
});

bindMouse(canvas, state.view);
bindKeys(window, {
  onMode: (m) => { state.mode = m; panel.sync(); },
  onTogglePlay: togglePlay,
});

panel.sync();
requestAnimationFrame((t) => { last = t; frame(t); });
