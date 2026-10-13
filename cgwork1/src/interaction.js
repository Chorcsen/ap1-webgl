// interaction.js —— 输入交互

// 左键拖动平移，滚轮缩放
export function bindMouse(canvas, view) {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // 只响应左键
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    // 屏幕像素 → 裁剪空间：横向 2/r.width，纵向取反
    view.offset[0] += (2 * (e.clientX - lastX)) / r.width;
    view.offset[1] -= (2 * (e.clientY - lastY)) / r.height;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', () => { dragging = false; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    view.zoom = Math.min(40, Math.max(0.1, view.zoom * Math.exp(-e.deltaY * 0.0015)));
  }, { passive: false });
}

const KEY_MODES = { '1': 'points', '2': 'lines', '3': 'triangles' };

// 1/2/3 切换渲染模式，空格 暂停 / 继续生长
export function bindKeys(target, handlers) {
  target.addEventListener('keydown', (e) => {
    if (KEY_MODES[e.key]) {
      handlers.onMode(KEY_MODES[e.key]);
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault(); // 防止页面滚动
      handlers.onTogglePlay();
    }
  });
}
