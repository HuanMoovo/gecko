/* ============================================================
   GECKO Hero 3D — 守宫眼球 + 知识网络（Three.js, 程序化几何）
   无外部模型文件；WebGL 不可用时优雅降级
   视图重渲染后调用 window.GECKO.initHero3D() 重新挂载
   ============================================================ */
import * as THREE from "three";

let active = null; // { canvas, dispose }

function maybeInit() {
  const container = document.getElementById("hero3d");
  const canvas = document.getElementById("heroCanvas");
  if (!container || !canvas) return;
  if (active && active.canvas === canvas && canvas.isConnected) return;
  try { active && active.dispose && active.dispose(); } catch (e) { /* ignore */ }
  active = { canvas, dispose: null };
  init(container, canvas)
    .then((dispose) => { if (active && active.canvas === canvas) active.dispose = dispose; })
    .catch((e) => {
      console.warn("[gecko:3d] disabled:", e.message);
      container.classList.add("is-off");
      active = null;
    });
}

window.GECKO = window.GECKO || {};
window.GECKO.initHero3D = maybeInit;
document.addEventListener("DOMContentLoaded", () => setTimeout(maybeInit, 60));

async function init(container, canvas) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = window.matchMedia("(max-width: 900px)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0.15, 4.1);

  /* ---------- 光照 ---------- */
  scene.add(new THREE.AmbientLight(0x9ff5d0, 0.55));
  const key = new THREE.PointLight(0x34d399, 26, 12);
  key.position.set(2.4, 2.0, 2.6);
  scene.add(key);
  const rim = new THREE.PointLight(0x22d3ee, 18, 12);
  rim.position.set(-2.6, -1.4, 1.8);
  scene.add(rim);
  const back = new THREE.PointLight(0xa78bfa, 12, 14);
  back.position.set(0, 0.6, -3.0);
  scene.add(back);

  const root = new THREE.Group();
  scene.add(root);

  /* ---------- 中心：守宫眼球 ---------- */
  const eye = new THREE.Group();

  const ballGeo = new THREE.SphereGeometry(0.52, 64, 64);
  const ballMat = new THREE.MeshPhysicalMaterial({
    color: 0x07231b, roughness: 0.22, metalness: 0.1,
    clearcoat: 1.0, clearcoatRoughness: 0.15,
    emissive: 0x0c3f2e, emissiveIntensity: 0.85,
  });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.scale.set(1.02, 0.94, 1.0);
  eye.add(ball);

  // 虹膜环
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x0b3a2b, emissive: 0x1ce8a8, emissiveIntensity: 1.6, roughness: 0.35, metalness: 0.2,
  });
  const iris = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.028, 24, 96), irisMat);
  iris.rotation.x = Math.PI / 2;
  iris.position.z = 0.44;
  eye.add(iris);

  // 竖瞳（垂直拉伸的黑色胶囊）
  const pupil = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.052, 0.30, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0x020604, roughness: 0.15, metalness: 0.4,
      emissive: 0x03150f, emissiveIntensity: 1.2 })
  );
  pupil.position.set(0, 0, 0.47);
  eye.add(pupil);

  // 高光
  const spec = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
  );
  spec.position.set(-0.15, 0.20, 0.50);
  spec.scale.set(0.7, 1.4, 0.6);
  eye.add(spec);

  // 光晕（径向渐变贴图 sprite）
  const glowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const rad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    rad.addColorStop(0, "rgba(52,211,153,0.75)");
    rad.addColorStop(0.35, "rgba(34,211,238,0.28)");
    rad.addColorStop(1, "rgba(52,211,153,0)");
    g.fillStyle = rad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9,
  }));
  glow.scale.set(3.4, 3.4, 1);
  glow.position.z = -0.35;
  eye.add(glow);

  root.add(eye);

  /* ---------- 环绕轨道环 ---------- */
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.35 });
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.28 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.006, 8, 160), ringMat);
  ring1.rotation.set(1.15, 0.35, 0);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.30, 0.005, 8, 160), ringMat2);
  ring2.rotation.set(1.5, -0.5, 0.4);
  root.add(ring1, ring2);

  /* ---------- 知识网络：球面节点 + 邻近连线 ---------- */
  const N = isSmall ? 160 : 420;
  const R = 1.75;
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pts.push(new THREE.Vector3(Math.cos(th) * r * R, y * R * 0.86, Math.sin(th) * r * R));
  }
  const nodeGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const nodeMat = new THREE.PointsMaterial({
    size: 0.028, color: 0x7df0c8, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const nodes = new THREE.Points(nodeGeo, nodeMat);
  nodes.position.y = 0.14;
  root.add(nodes);

  // 连线：每个节点连向最近的 2 个邻居（限制总数控制性能）
  const edges = [];
  const maxDist = 0.52;
  for (let i = 0; i < pts.length; i++) {
    let count = 0;
    for (let j = i + 1; j < pts.length && count < 2; j++) {
      if (pts[i].distanceTo(pts[j]) < maxDist) { edges.push(pts[i], pts[j]); count++; }
    }
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(edges);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x2ec98f, transparent: true, opacity: 0.14,
    blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.position.y = 0.14;
  root.add(lines);

  /* ---------- 漂浮微粒 ---------- */
  const dustN = isSmall ? 40 : 110;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 7;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.02, color: 0x9ef7d4, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(dust);

  /* ---------- 尺寸与交互 ---------- */
  function resize() {
    const w = container.clientWidth || 360;
    const h = container.clientHeight || 340;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    const r = container.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    mouse.tx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.5)));
    mouse.ty = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.5)));
  }, { passive: true });

  /* ---------- 渲染循环 ---------- */
  let raf = 0;
  let t = 0;
  const clock = new THREE.Clock();
  let visible = true;
  let disposed = false;
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; if (visible) loop(); });
  // hero 滚出视口后暂停渲染
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting && !document.hidden;
    if (visible) loop();
  }, { threshold: 0.02 }).observe(container);

  function loop() {
    if (!visible || raf || disposed || !canvas.isConnected) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (disposed || !canvas.isConnected) return;   // 视图切换后画布被移除 → 停止
      const dt = Math.min(clock.getDelta(), 0.05);
      t += dt;

      if (!reduceMotion) {
        root.rotation.y += dt * 0.22;
        nodes.rotation.y -= dt * 0.05;
        lines.rotation.y -= dt * 0.05;
        ring1.rotation.z += dt * 0.16;
        ring2.rotation.z -= dt * 0.12;
        pupil.scale.y = 1 + Math.sin(t * 1.7) * 0.06;
        glow.material.opacity = 0.72 + Math.sin(t * 1.3) * 0.14;
        dust.rotation.y += dt * 0.02;
        dust.position.y = Math.sin(t * 0.5) * 0.08;
      }

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      root.rotation.x = mouse.y * 0.22;
      root.position.x = mouse.x * 0.16;
      camera.position.x = mouse.x * 0.28;
      camera.position.y = 0.15 - mouse.y * 0.18;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      if (visible) loop();
    });
  }
  loop();
  container.classList.add("is-live");

  /* ---------- 清理 ---------- */
  return function dispose() {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { try { x.dispose(); } catch (e) { /* ignore */ } });
    });
    glowTex.dispose();
    renderer.dispose();
  };
}
