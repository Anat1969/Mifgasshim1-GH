/* מודל המסה התלת-ממדי של מפגש א. נטען כמודול, קורא את המצב מ-window.TOOL. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const host = document.getElementById("iso3d");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 4000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const sun = new THREE.DirectionalLight(0xffffff, 0.7);
sun.position.set(60, 120, 40);
scene.add(sun);
const group = new THREE.Group();
scene.add(group);

let framed = "";

function rectPts(x1, z1, x2, z2, y) {
  return [[x1, z1], [x2, z1], [x2, z2], [x1, z2], [x1, z1]].map((p) => new THREE.Vector3(p[0], y, p[1]));
}
function lineOf(pts, color, dashed) {
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 1.2, gapSize: 0.8 })
    : new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geo, mat);
  if (dashed) line.computeLineDistances();
  return line;
}
function clearGroup() {
  while (group.children.length) {
    const o = group.children.pop();
    o.traverse((x) => {
      if (x.geometry) x.geometry.dispose();
      if (x.material) x.material.dispose();
    });
  }
}
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return false;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  return true;
}
function build() {
  clearGroup();
  const s = window.TOOL.snapshot();
  const R = s.R, g = s.g, P = g.P;
  const ok = (v) => v !== null && v !== undefined && v !== "";

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(P, P),
    new THREE.MeshBasicMaterial({ color: 0xf1f1ef, side: THREE.DoubleSide })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(P / 2, 0, P / 2);
  group.add(ground);
  group.add(lineOf(rectPts(0, 0, P, P, 0.02), 0x151515));
  if (ok(R.ss) && ok(R.sr) && ok(R.sf)) group.add(lineOf(rectPts(R.ss, R.sr, P - R.ss, P - R.sf, 0.04), 0x8a8a8a, true));
  if (ok(R.h)) group.add(lineOf(rectPts(0, 0, P, P, R.h), 0xd4a017));

  if (s.mass) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(g.w, g.H, g.d),
      new THREE.MeshStandardMaterial({ color: s.breach ? 0xb83a2e : 0xb9b9b6, roughness: 0.85, transparent: true, opacity: 0.94 })
    );
    body.position.set(g.ox + g.w / 2, g.H / 2, g.oy + g.d / 2);
    group.add(body);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: 0x151515 }));
    edges.position.copy(body.position);
    group.add(edges);
    for (let i = 1; i < s.a.fl; i++) {
      group.add(lineOf(rectPts(g.ox, g.oy, g.ox + g.w, g.oy + g.d, i * s.fl), s.breach ? 0x7a2219 : 0x6b6b6b));
    }
  }

  /* המצלמה ממוסגרת מחדש רק כשהמגרש מתחלף, כדי שהסיבוב של המשתמש יישמר בין חלופות */
  const key = s.plot + ":" + Math.round(P);
  if (key !== framed) {
    framed = key;
    const top = Math.max(ok(R.h) ? R.h : 0, s.mass ? g.H : 0, 6);
    controls.target.set(P / 2, top / 3, P / 2);
    camera.position.set(P * 1.9, Math.max(P, top) * 1.35, P * 2.15);
    controls.update();
  }
}
function update3D() {
  if (!window.TOOL || !window.TOOL.visible()) return;
  if (!resize()) return;
  build();
}

window.update3D = update3D;
window.addEventListener("resize", update3D);
if (window.ResizeObserver) new ResizeObserver(() => { if (window.TOOL && window.TOOL.visible()) resize(); }).observe(host);
renderer.setAnimationLoop(() => {
  if (window.TOOL && window.TOOL.visible()) {
    controls.update();
    renderer.render(scene, camera);
  }
});
update3D();
