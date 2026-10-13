// geometry.js —— 几何生成

const RADIUS = 1.0; // 外接圆半径，取值保证顶点不超出裁剪空间 [-1,1]

// 正 n 边形顶点，从正上方起逆时针；n=3 即等边三角形
export function regularPolygon(n, radius = RADIUS) {
  const v = [];
  for (let k = 0; k < n; k++) {
    const a = Math.PI / 2 + (2 * Math.PI * k) / n;
    v.push([radius * Math.cos(a), radius * Math.sin(a)]);
  }
  return v;
}

// n 边形垫片的收缩比：使相邻两个复制体刚好相切；n=3 时退化为经典 Sierpinski 的 1/2
export const ratioOf = (n) => 1 / (1 + 2 * Math.cos(Math.PI / n));

// 混沌游戏：初始点取外接圆心，反复执行 p = p + ratio * (随机顶点 - p)
export function chaosGame(count, poly, ratio, rand = Math.random) {
  const out = new Float32Array(count * 2);
  let x = 0;
  let y = 0;
  for (let i = 0; i < count; i++) {
    const v = poly[(rand() * poly.length) | 0];
    x += ratio * (v[0] - x);
    y += ratio * (v[1] - y);
    out[2 * i] = x;
    out[2 * i + 1] = y;
  }
  return out;
}

// 递归细分：按三边中点切成 3 个角上的三角形，中间的丢弃
export function subdivide(tri, depth, out = []) {
  if (depth <= 0) {
    out.push(...tri);
    return out;
  }
  const [ax, ay, bx, by, cx, cy] = tri;
  const abx = (ax + bx) / 2, aby = (ay + by) / 2;
  const bcx = (bx + cx) / 2, bcy = (by + cy) / 2;
  const cax = (cx + ax) / 2, cay = (cy + ay) / 2;
  subdivide([ax, ay, abx, aby, cax, cay], depth - 1, out);
  subdivide([abx, aby, bx, by, bcx, bcy], depth - 1, out);
  subdivide([cax, cay, bcx, bcy, cx, cy], depth - 1, out);
  return out;
}

// 细分结果的顶点数组，基准三角形与混沌游戏保持一致
export function gasketVertices(depth) {
  const [a, b, c] = regularPolygon(3);
  return new Float32Array(subdivide([...a, ...b, ...c], depth));
}

// 自检
export function demo() {
  const d2 = gasketVertices(2).length / 6;
  const d6 = gasketVertices(6).length / 6;
  console.assert(gasketVertices(0).length === 6, 'depth=0 应为 1 个三角形');
  console.assert(d2 === 9, 'depth=2 应为 9 个三角形');
  console.assert(d6 === 729, 'depth=6 应为 729 个三角形');
  console.assert(Math.abs(ratioOf(3) - 0.5) < 1e-12, 'n=3 的收缩比应退化为 1/2');
  console.assert(Math.abs(ratioOf(5) - 0.381966) < 1e-5, 'n=5 的收缩比应约为 0.382');

  let maxR = 0;
  const pts = chaosGame(20000, regularPolygon(6), ratioOf(6));
  for (let i = 0; i < pts.length; i += 2) maxR = Math.max(maxR, Math.hypot(pts[i], pts[i + 1]));
  console.assert(maxR <= RADIUS + 1e-6, '采样点不应超出外接圆');

  return {
    'depth=2 三角形数': d2,
    'depth=6 三角形数': d6,
    'ratioOf(3)': ratioOf(3),
    'ratioOf(5)': ratioOf(5),
    'ratioOf(6)': ratioOf(6),
    'n=6 采样点最大半径': maxR,
  };
}
