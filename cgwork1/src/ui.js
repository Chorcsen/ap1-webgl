// ui.js —— 参数面板

// 颜色切换时不跳色
export const SCHEMES = [
  { name: '琥珀', bg: [0.09, 0.07, 0.05], a: [0.98, 0.80, 0.48], b: [0.70, 0.27, 0.14] },
  { name: '靛蓝', bg: [0.05, 0.06, 0.10], a: [0.72, 0.78, 0.96], b: [0.22, 0.24, 0.62] },
  { name: '苔绿', bg: [0.05, 0.07, 0.05], a: [0.78, 0.88, 0.62], b: [0.16, 0.40, 0.26] },
  { name: '铁灰', bg: [0.07, 0.07, 0.07], a: [0.93, 0.93, 0.91], b: [0.34, 0.34, 0.36] },
];

const rgb = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;

// 生成左侧参数面板：直接读写 state，通过 actions 把交互回传给主程序
export function buildPanel(root, state, actions) {
  root.innerHTML = `
    <h1>交互式 2D 分形</h1>

    <div class="field">
      <label>渲染模式</label>
      <div class="seg" id="seg-mode">
        <button data-mode="points">点云</button>
        <button data-mode="lines">线框</button>
        <button data-mode="triangles">实体</button>
      </div>
    </div>

    <div class="field" id="f-points">
      <label>顶点数<span class="val" id="v-points"></span></label>
      <input type="range" id="r-points" min="500" max="60000" step="500">
      <label class="mt">边数 n<span class="val" id="v-sides"></span></label>
      <input type="range" id="r-sides" min="3" max="8" step="1">
    </div>

    <div class="field" id="f-depth">
      <label>递归深度<span class="val" id="v-depth"></span></label>
      <input type="range" id="r-depth" min="0" max="6" step="1">
    </div>

    <div class="field">
      <label>点大小<span class="val" id="v-size"></span></label>
      <input type="range" id="r-size" min="1" max="10" step="1">
    </div>

    <div class="field">
      <label>配色</label>
      <div class="schemes" id="schemes"></div>
    </div>

    <div class="field">
      <button id="play" class="wide"></button>
    </div>

    <div class="legend">
      <span><b>拖动</b>平移</span>
      <span><b>滚轮</b>缩放</span>
      <span><b>1 2 3</b>图元</span>
      <span><b>空格</b>生长</span>
    </div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const modeBox = $('#seg-mode');
  const schemeBox = $('#schemes');

  // 点击面板按钮后移除焦点，避免空格键既触发按钮又触发"暂停/继续生长"
  root.addEventListener('click', () => document.activeElement?.blur());

  SCHEMES.forEach((s, i) => {
    const b = document.createElement('button');
    b.title = s.name;
    b.setAttribute('aria-label', '配色方案：' + s.name);
    // 0deg：自下而上，与着色器按 vPos.y 混色的方向一致
    b.style.background = `linear-gradient(0deg, ${rgb(s.a)}, ${rgb(s.b)})`;
    b.onclick = () => { state.scheme = i; actions.onChange(); };
    schemeBox.appendChild(b);
  });

  modeBox.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    state.mode = btn.dataset.mode;
    actions.onChange();
  });
  $('#r-points').addEventListener('input', (e) => { state.pointCount = +e.target.value; actions.onChange(); });
  $('#r-sides').addEventListener('input', (e) => { state.sides = +e.target.value; actions.onChange(); });
  $('#r-depth').addEventListener('input', (e) => { state.depth = +e.target.value; actions.onChange(); });
  $('#r-size').addEventListener('input', (e) => { state.pointSize = +e.target.value; actions.onChange(); });
  $('#play').addEventListener('click', () => actions.onTogglePlay());

  function sync() {
    $('#v-points').textContent = state.pointCount.toLocaleString();
    $('#v-sides').textContent = state.sides;
    $('#v-depth').textContent = state.depth;
    $('#v-size').textContent = state.pointSize + ' px';
    $('#r-points').value = state.pointCount;
    $('#r-sides').value = state.sides;
    $('#r-depth').value = state.depth;
    $('#r-size').value = state.pointSize;

    for (const b of modeBox.children) b.classList.toggle('on', b.dataset.mode === state.mode);
    [...schemeBox.children].forEach((b, i) => b.classList.toggle('on', i === state.scheme));

    // 顶点数 / 边数只对点云有效，深度只对线框 / 实体有效
    $('#f-points').hidden = state.mode !== 'points';
    $('#f-depth').hidden = state.mode === 'points';

    $('#play').textContent = state.playing ? '暂停生长' : '继续生长';
  }

  return { sync };
}
