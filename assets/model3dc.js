/* מודל מפגש ג: הוולום במרחב, עם שכנים וצל לפי מיקום השמש. קורא את המצב מ-window.CTOOL. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const host = document.getElementById("iso3dc");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
const amb = new THREE.HemisphereLight(0xffffff, 0xdcdcd8, 0.75);
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
scene.add(amb, sun, sun.target);

const dyn = new THREE.Group();
scene.add(dyn);
let baseKey = "", sunKey = "", camTween = null, radius = 60, token = 0;
const aerialCache = new Map();
window.CAERIAL = { state: "off", tiles: 0 };

function clear(g) {
  while (g.children.length) {
    const o = g.children.pop();
    o.traverse((x) => {
      if (x.geometry) x.geometry.dispose();
      if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); }
    });
  }
}
/* נקודות (מזרח, צפון) הופכות ל-X ו-Z, כשצפון הוא Z שלילי */
function prism(pts, z0, H, color, edge) {
  const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = z0;
  mesh.castShadow = true; mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: edge }));
  e.rotation.x = -Math.PI / 2; e.position.y = z0;
  g.add(e);
  return g;
}
function line(pts, color, y, closed) {
  const v = pts.map((p) => new THREE.Vector3(p[0], y, -p[1]));
  if (closed) v.push(v[0].clone());
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(v), new THREE.LineBasicMaterial({ color }));
}
function label(text, w) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 96;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(255,255,255,0.92)"; x.fillRect(48, 16, 160, 64);
  x.fillStyle = "#151515"; x.font = "500 44px Heebo, Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(text, 128, 50);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  sp.scale.set(w, w * 0.375, 1); sp.renderOrder = 6;
  return sp;
}

/* תצלום אווירי: אריחי Esri World Imagery על הקרקע, כשהצפון למעלה */
function tileXY(lat, lon, z) {
  const n = 2 ** z, x = (lon + 180) / 360 * n, lr = lat * Math.PI / 180;
  return [x, (1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2 * n];
}
function loadAerial(s, my) {
  const R = s.radius, z = R <= 150 ? 18 : 17, c = tileXY(s.lat, s.lon, z), mpt = 156543.03392 * Math.cos(s.lat * Math.PI / 180) / 2 ** z * 256, h = R / mpt;
  const key = [s.lat, s.lon, R].join();
  const place = (cv) => {
    if (my !== token) return;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
    m.rotation.x = -Math.PI / 2; m.position.y = -0.005; m.receiveShadow = true;
    dyn.add(m);
  };
  if (aerialCache.has(key)) { place(aerialCache.get(key)); window.CAERIAL = { state: "ok", tiles: -1 }; return; }
  window.CAERIAL = { state: "loading", tiles: 0 };
  const S = 1024, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const g = cv.getContext("2d"), sc = S / (2 * h), x0 = Math.floor(c[0] - h), x1 = Math.floor(c[0] + h), y0 = Math.floor(c[1] - h), y1 = Math.floor(c[1] + h);
  let pending = 0, ok = 0;
  const done = () => {
    if (--pending > 0) return;
    if (ok) { aerialCache.set(key, cv); place(cv); window.CAERIAL = { state: "ok", tiles: ok }; } else window.CAERIAL = { state: "fail", tiles: 0 };
    if (window.CTOOL && window.CTOOL.aerialState) window.CTOOL.aerialState(window.CAERIAL.state);
  };
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    pending++;
    const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => { g.drawImage(im, (tx - (c[0] - h)) * sc, (ty - (c[1] - h)) * sc, sc + 0.5, sc + 0.5); ok++; done(); };
    im.onerror = done;
    im.src = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/" + z + "/" + ty + "/" + tx;
  }
}

function build(s) {
  clear(dyn);
  token++;
  radius = s.radius;
  const R = radius;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(R * 6, R * 6), new THREE.MeshStandardMaterial({ color: 0xf3f3f1, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
  dyn.add(ground);
  /* טבעת מצפן, וצפון */
  const ring = [];
  for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2; ring.push([Math.sin(a) * R, Math.cos(a) * R]); }
  dyn.add(line(ring, 0xbdbdb9, 0.05, true));
  const n = label("צפון", R * 0.28); n.position.set(0, 3, -R); dyn.add(n);
  /* המגרש: הצלע הקדמית בקו עבה */
  dyn.add(line(s.plot, 0x151515, 0.08, true));
  const f = s.plot.slice(2, 4);
  [0.04, 0.12, 0.2].forEach((dy) => dyn.add(line(f, 0x4a6079, 0.1 + dy, false)));
  if (s.aerial && s.lat != null) loadAerial(s, token); else window.CAERIAL = { state: "off", tiles: 0 };
  s.nbs.forEach((b) => dyn.add(prism(b.pts, 0, b.h, b.est ? 0xd9d9d6 : 0xc7c7c3, 0x8b8b87)));
  s.boxes.forEach((b) => dyn.add(prism(b.pts, b.z0, b.H, 0xf7f7f5, 0x151515)));
}
function setSun(s) {
  const up = s.sun && s.sun.alt > 0.02;
  const az = s.sun ? s.sun.az : 0, alt = s.sun ? Math.max(s.sun.alt, 0.05) : 0.8;
  const d = new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt));
  sun.position.copy(d.multiplyScalar(radius * 2.4));
  sun.target.position.set(0, 0, 0);
  sun.intensity = up ? 2.1 : 0.15;
  sun.castShadow = !!up;
  const sc = sun.shadow.camera, e = radius * 1.4;
  sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = radius * 6;
  sc.updateProjectionMatrix();
  amb.intensity = up ? 1.0 : 0.5;
}
function fit(first) {
  const R = radius;
  const p1 = new THREE.Vector3(R * 0.55, R * 0.8, R * 1.35), t1 = new THREE.Vector3(0, 6, 0);
  camTween = { p0: camera.position.clone(), t0: controls.target.clone(), p1, t1, start: performance.now(), dur: first ? 1 : 900 };
}
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return false;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  return true;
}
function update() {
  if (!window.CTOOL || !window.CTOOL.visible()) return;
  if (!resize()) return;
  const s = window.CTOOL.scene();
  if (!s) return;
  const bk = JSON.stringify([s.plot, s.boxes, s.nbs, s.radius, s.aerial, s.lat, s.lon]);
  let first = false;
  if (bk !== baseKey) { baseKey = bk; build(s); first = true; fit(camera.position.lengthSq() < 1); }
  const sk = JSON.stringify(s.sun) + bk;
  if (sk !== sunKey) { sunKey = sk; setSun(s); }
}
const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
renderer.setAnimationLoop((now) => {
  if (!window.CTOOL || !window.CTOOL.visible()) return;
  if (camTween) {
    const u = still ? 1 : Math.min(1, (now - camTween.start) / camTween.dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    camera.position.lerpVectors(camTween.p0, camTween.p1, e);
    controls.target.lerpVectors(camTween.t0, camTween.t1, e);
    if (u >= 1) camTween = null;
  }
  controls.update();
  renderer.render(scene, camera);
});
window.update3Dc = update;
window.addEventListener("resize", update);
if (window.ResizeObserver) new ResizeObserver(() => { if (window.CTOOL && window.CTOOL.visible()) { resize(); } }).observe(host);
update();
