/* מודל התכנית של מפגש ב: הקו הכחול, המגרשים, והבניין שנבנה על המגרש שנבחר. קורא את המצב מ-window.TOOL. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const host = document.getElementById("iso3d");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 4000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 0.65);
sun.position.set(80, 160, 60);
scene.add(sun);

const base = new THREE.Group();
const dyn = new THREE.Group();
scene.add(base, dyn);

const BLUE = 0x1f5fbf, ENV = 0x6f859c;
const plotMeshes = {};
let baseKey = "", dynKey = "", focus = null, camTween = null, growStart = 0, bounds = null;

function clear(g) {
  while (g.children.length) {
    const o = g.children.pop();
    o.traverse((x) => {
      if (x.geometry) x.geometry.dispose();
      if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); }
    });
  }
}
function rectPts(x1, z1, x2, z2, y) {
  return [[x1, z1], [x2, z1], [x2, z2], [x1, z2], [x1, z1]].map((p) => new THREE.Vector3(p[0], y, p[1]));
}
function lineOf(pts, color, dashed) {
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 1.4, gapSize: 1 }) : new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geo, mat);
  if (dashed) line.computeLineDistances();
  return line;
}
function label(text) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(255,255,255,0.92)";
  x.fillRect(40, 24, 176, 80);
  x.fillStyle = "#151515";
  x.font = "500 64px Heebo, Arial, sans-serif";
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(text, 128, 66);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(16, 8, 1);
  sp.renderOrder = 5;
  return sp;
}
function bar(x1, z1, x2, z2, color, t) {
  const len = Math.hypot(x2 - x1, z2 - z1) + t;
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, t, t), new THREE.MeshBasicMaterial({ color }));
  m.position.set((x1 + x2) / 2, t / 2 + 0.05, (z1 + z2) / 2);
  m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  return m;
}

function buildBase(s) {
  clear(base);
  Object.keys(plotMeshes).forEach((k) => delete plotMeshes[k]);
  let x1 = Infinity, z1 = Infinity, x2 = -Infinity, z2 = -Infinity;
  s.plots.forEach((p) => { x1 = Math.min(x1, p.x); z1 = Math.min(z1, p.y); x2 = Math.max(x2, p.x + p.w); z2 = Math.max(z2, p.y + p.d); });
  const m = s.margin;
  bounds = { x1: x1 - m, z1: z1 - m, x2: x2 + m, z2: z2 + m };
  const W = bounds.x2 - bounds.x1, D = bounds.z2 - bounds.z1;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W * 3, D * 3), new THREE.MeshBasicMaterial({ color: 0xfafaf9 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((bounds.x1 + bounds.x2) / 2, -0.02, (bounds.z1 + bounds.z2) / 2);
  base.add(ground);

  const inner = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ color: 0xf1f1ef }));
  inner.rotation.x = -Math.PI / 2;
  inner.position.set((bounds.x1 + bounds.x2) / 2, 0, (bounds.z1 + bounds.z2) / 2);
  base.add(inner);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(W, s.road.y2 - s.road.y1), new THREE.MeshBasicMaterial({ color: 0xd6d6d2 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set((bounds.x1 + bounds.x2) / 2, 0.03, (s.road.y1 + s.road.y2) / 2);
  base.add(road);

  s.plots.forEach((p) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w - 0.6, 0.5, p.d - 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    mesh.position.set(p.x + p.w / 2, 0.25, p.y + p.d / 2);
    mesh.userData.plot = p.id;
    base.add(mesh);
    plotMeshes[p.id] = mesh;
    base.add(lineOf(rectPts(p.x + 0.3, p.y + 0.3, p.x + p.w - 0.3, p.y + p.d - 0.3, 0.52), 0x151515));
    const sp = label(p.id);
    sp.position.set(p.x + p.w / 2, 6, p.y + p.d / 2);
    sp.userData.plot = p.id;
    base.add(sp);
  });

  /* הקו הכחול: גבול התכנית */
  const b = bounds;
  [[b.x1, b.z1, b.x2, b.z1], [b.x2, b.z1, b.x2, b.z2], [b.x2, b.z2, b.x1, b.z2], [b.x1, b.z2, b.x1, b.z1]].forEach((q) => base.add(bar(q[0], q[1], q[2], q[3], BLUE, 1.1)));
}

function overview() {
  const cx = (bounds.x1 + bounds.x2) / 2, cz = (bounds.z1 + bounds.z2) / 2, r = Math.max(bounds.x2 - bounds.x1, bounds.z2 - bounds.z1);
  return { pos: new THREE.Vector3(cx + r * 0.75, r * 1.05, cz + r * 1.25), target: new THREE.Vector3(cx, 0, cz) };
}
function plotView(p, H) {
  const cx = p.x + p.w / 2, cz = p.y + p.d / 2, r = Math.max(p.w, p.d, H);
  return { pos: new THREE.Vector3(cx + r * 1.7, r * 1.5 + H * 0.6, cz + r * 2.3), target: new THREE.Vector3(cx, H / 3, cz) };
}
function flyTo(v, dur) {
  camTween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos, t1: v.target, start: performance.now(), dur: dur };
}

function buildDyn(s) {
  clear(dyn);
  if (!s.focus) return;
  const z = s.zone;
  if (z) {
    dyn.add(lineOf(rectPts(z.x, z.y, z.x + z.w, z.y + z.d, 0.6), ENV, true));
    if (z.h > 0) {
      dyn.add(lineOf(rectPts(z.x, z.y, z.x + z.w, z.y + z.d, z.h), ENV, true));
      [[z.x, z.y], [z.x + z.w, z.y], [z.x + z.w, z.y + z.d], [z.x, z.y + z.d]].forEach((c) => {
        dyn.add(lineOf([new THREE.Vector3(c[0], 0.5, c[1]), new THREE.Vector3(c[0], z.h, c[1])], ENV, true));
      });
    }
  }
  const body = new THREE.Group();
  body.name = "body";
  s.boxes.forEach((b) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.H, b.d), new THREE.MeshStandardMaterial({ color: 0xbdbdba, roughness: 0.85 }));
    mesh.position.set(b.x + b.w / 2, 0.5 + b.z0 + b.H / 2, b.y + b.d / 2);
    body.add(mesh);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: 0x151515 }));
    e.position.copy(mesh.position);
    body.add(e);
    for (let i = 1; i * s.flh < b.H - 0.2; i++) body.add(lineOf(rectPts(b.x, b.y, b.x + b.w, b.y + b.d, 0.5 + b.z0 + i * s.flh), 0x6b6b6b));
  });
  dyn.add(body);
}

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return false;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  return true;
}
function update3D() {
  if (!window.TOOL || !window.TOOL.visible()) return;
  if (!resize()) return;
  const s = window.TOOL.plan();
  const bk = JSON.stringify(s.plots);
  let first = false;
  if (bk !== baseKey) { baseKey = bk; buildBase(s); first = true; }
  Object.keys(plotMeshes).forEach((id) => plotMeshes[id].material.color.set(id === s.focus ? 0xfff3a3 : 0xffffff));
  const dk = JSON.stringify([s.focus, s.boxes, s.zone]);
  if (dk !== dynKey) {
    const changedFocus = s.focus !== focus;
    dynKey = dk;
    buildDyn(s);
    if (changedFocus || first) {
      focus = s.focus;
      if (s.focus) {
        const p = s.plots.filter((x) => x.id === s.focus)[0];
        const H = s.boxes.reduce((m, b) => Math.max(m, b.z0 + b.H), 0);
        flyTo(plotView(p, Math.max(H, s.zone ? s.zone.h : 0)), first ? 1 : 1400);
        growStart = performance.now() + (first ? 0 : 900);
      } else flyTo(overview(), first ? 1 : 1000);
    }
  } else if (first) { flyTo(overview(), 1); }
}

/* לחיצה על מגרש בוחרת אותו. גרירה לא נחשבת לחיצה. */
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(base.children, false).filter((h) => h.object.userData.plot)[0];
  if (hit && window.TOOL.pick) window.TOOL.pick(hit.object.userData.plot);
});

window.update3D = update3D;
window.addEventListener("resize", update3D);
if (window.ResizeObserver) new ResizeObserver(() => { if (window.TOOL && window.TOOL.visible()) resize(); }).observe(host);
const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
renderer.setAnimationLoop((now) => {
  if (!window.TOOL || !window.TOOL.visible()) return;
  if (camTween) {
    const u = still ? 1 : Math.min(1, (now - camTween.start) / camTween.dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    camera.position.lerpVectors(camTween.p0, camTween.p1, e);
    controls.target.lerpVectors(camTween.t0, camTween.t1, e);
    if (u >= 1) camTween = null;
  }
  const body = dyn.getObjectByName("body");
  if (body) {
    const g = still ? 1 : Math.max(0, Math.min(1, (now - growStart) / 900));
    body.scale.y = Math.max(0.001, g < 0.5 ? 2 * g * g : 1 - Math.pow(-2 * g + 2, 2) / 2);
  }
  controls.update();
  renderer.render(scene, camera);
});
update3D();
