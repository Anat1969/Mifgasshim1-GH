/* מפגש ג: מהחלופה הנבחרת למודל עבודה. נשען על הגשר window.APP שמוגדר ב-app.js. */
(function () {
  "use strict";
  var APP = window.APP;
  if (!APP) return;
  var $ = APP.$, $$ = APP.$$, esc = APP.esc, fmt = APP.fmt, has = APP.has, copy = APP.copy;

  /* ---------- מצב ---------- */
  var DIRS = [["צפון", 0], ["צפון-מזרח", 45], ["מזרח", 90], ["דרום-מזרח", 135], ["דרום", 180], ["דרום-מערב", 225], ["מערב", 270], ["צפון-מערב", 315]];
  var PHOTOS = ["צפון", "דרום", "מזרח", "מערב", "מהרחוב אל המגרש", "מהמגרש אל הרחוב", "פנורמה 1", "פנורמה 2"];
  function fresh() {
    return { addr: "", lat: null, lon: null, front: 180, placed: false, useMan: false, man: { W: 30, D: 40, floors: 5, fp: 600, flh: 3.2, sf: 5, ss: 3, sr: 4, h: "", maxFl: "", cov: "", bp: "", units: "" },
      nb: [], osmMsg: "", dem: null, site: { exist: "", trees: "", soil: "", hist: "", water: "", sewer: "", elec: "", comm: "" }, siteDone: false,
      app: { maxH: "", maxFl: "" }, rami: "", park: null, sqm: 28, fireMin: 6, acc: false, statDone: false,
      date: "2026-12-21", hour: 9, wx: null, aerial: true, wiki: null, climDone: false, feasDone: false,
      intentText: "", keys: { style: [], mat: [], tone: "" }, intent: null, palette: [], expDone: false };
  }
  /* שני מצבים: דוגמה (ממולאת מראש, על מגרש 633 מהדוגמה של מפגש ב) והדגמה חיה (הנתונים של המשתמש) */
  var CMODE = APP.load("cmode", "example") === "live" ? "live" : "example";
  function ckey(m) { return (m || CMODE) === "live" ? "c1" : "c1ex"; }
  function DK(x) { return (CMODE === "live" ? "c:" : "ce:") + x; }
  function exampleState() {
    var f = fresh();
    f.addr = "אשדוד, רחוב הרצל (מיקום לדוגמה)"; f.lat = 31.8; f.lon = 34.65; f.front = 180;
    f.nb = [{ kind: "man", name: "מגדל משרדים", h: 30, dist: 12, dir: 0, w: 25, d: 30 }, { kind: "man", name: "בניין מגורים", h: 12.8, dist: 8, dir: 270, w: 30, d: 15 }, { kind: "man", name: "בית נמוך", h: 7, dist: 10, dir: 90, w: 15, d: 15 }];
    f.dem = { z: 22, slope: 0.6, down: 270 };
    f.site = { exist: "להריסה", trees: "שני עצי פיקוס בחזית", soil: "חול", hist: "אין", water: "חיבור מהרחוב", sewer: "לכיוון דרום", elec: "עמדה בפינה", comm: "כבלים" };
    f.app = { maxH: 28, maxFl: 8 };
    f.wx = { year: 2025, partial: false, example: true, rain: 310, rdays: 41, rad: 5.5, wind: ["דרום", "צפון", "צפון", "צפון-מערב", "צפון-מערב", "מערב", "מערב", "צפון-מערב", "צפון-מערב", "צפון", "דרום-מערב", "דרום"] };
    f.intentText = "אני רוצה בניין שמרגיש פתוח לכיוון הים, חומרים גסים, חזית מינימליסטית, השראה מהמחסנים הישנים של הנמל.";
    f.keys = { style: ["תעשייתי", "מינימליסטי"], mat: ["בטון"], tone: "" };
    f.palette = ["#7a746b", "#c9bfae", "#3c4650", "#a8a39a"];
    return f;
  }
  function freshFor(m) { return m === "example" ? exampleState() : fresh(); }
  function fixC(x) { var f = fresh(); Object.keys(f).forEach(function (k) { if (x[k] === undefined) x[k] = f[k]; }); return x; }
  var C = fixC(APP.load(ckey(), freshFor(CMODE)));
  var saveT = null;
  function save() { APP.save(ckey(), C); }
  function parseNum(v) { return v === "" || v === null || v === undefined ? null : Number(v); }

  /* ---------- שמש: חישוב לפי קואורדינטות, תאריך ושעה (אותה שיטה שמשמשת את SunCalc) ---------- */
  var RAD = Math.PI / 180, E_OBL = RAD * 23.4397;
  function sunPos(date, lat, lon) {
    var d = date.valueOf() / 86400000 - 0.5 + 2440588 - 2451545, lw = RAD * -lon, phi = RAD * lat;
    var M = RAD * (357.5291 + 0.98560028 * d), Cc = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + Cc + RAD * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(L) * Math.sin(E_OBL)), ra = Math.atan2(Math.sin(L) * Math.cos(E_OBL), Math.cos(L));
    var H = RAD * (280.16 + 360.9856235 * d) - lw - ra;
    var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) + Math.PI;
    var alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
    return { az: az % (2 * Math.PI), alt: alt };
  }
  var tzFmt = null;
  function jerOffsetMin(utc) {
    try {
      tzFmt = tzFmt || new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      var p = {}; tzFmt.formatToParts(utc).forEach(function (x) { p[x.type] = x.value; });
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - utc.getTime()) / 60000;
    } catch (e) { return 120; }
  }
  /* שעה מקומית בישראל לרגע אוניברסלי */
  function localDate(dateStr, hour) {
    var m = String(dateStr || "2026-12-21").split("-").map(Number);
    var t0 = Date.UTC(m[0], m[1] - 1, m[2], 0, 0) + hour * 3600000;
    return new Date(t0 - jerOffsetMin(new Date(t0 - 2 * 3600000)) * 60000);
  }
  function sunAt(dateStr, hour) { return has(C.lat) && has(C.lon) ? sunPos(localDate(dateStr, hour), C.lat, C.lon) : null; }
  function hh(h) { var m = Math.round(h * 60); return Math.floor(m / 60) + ":" + ("0" + (m % 60)).slice(-2); }

  /* ---------- וולום: מהחלופה שנבחרה במפגש ב, או מהזנה ידנית ---------- */
  function manualVol() {
    var m = C.man, W = +m.W, D = +m.D, fl = +m.floors, fp = +m.fp, flh = +m.flh || 3.2, sf = +m.sf || 0, ss = +m.ss || 0, sr = +m.sr || 0;
    if (!(W > 0 && D > 0 && fl > 0 && fp > 0)) return null;
    var zw = Math.max(1, W - 2 * ss), zd = Math.max(1, D - sf - sr), w = Math.min(zw, Math.sqrt(fp * zw / zd)), d = fp / w;
    var gross = fp * fl, R = { plot: W * D, cov: parseNum(m.cov), bp: parseNum(m.bp), floors: parseNum(m.maxFl), h: parseNum(m.h), sf: sf, ss: ss, sr: sr, units: parseNum(m.units) };
    return { src: "man", plotId: "ידני", key: "", name: "הזנה ידנית", W: W, D: D, flh: flh, R: R, area: W * D,
      boxes: [{ ox: ss + (zw - w) / 2, oy: sr + (zd - d) / 2, w: w, d: d, z0: 0, H: fl * flh }],
      c: { gross: gross, floors: fl, h: fl * flh, cov: fp / (W * D) * 100, bp: gross / (W * D) * 100, units: has(R.units) ? R.units : Math.floor(gross * 0.8 / 90), util: 0 }, why: "" };
  }
  function getVol() {
    if (C.useMan) return manualVol();
    var v = APP.volume(CMODE);
    if (v && !v.none) { v.src = CMODE === "example" ? "ex" : "a"; return v; }
    return null;
  }
  function aVolState() { var v = APP.volume(CMODE); return v ? (v.none ? "none" : "ok") : "empty"; }
  function volStats(v) {
    var H = v.boxes.reduce(function (m, b) { return Math.max(m, b.z0 + b.H); }, 0), top = v.boxes[v.boxes.length - 1];
    return { H: H, roof: top.w * top.d, floors: v.c.floors };
  }

  /* ---------- גאומטריה בעולם: מזרח וצפון במטרים, ממרכז המגרש ---------- */
  function frame() { var t = C.front * RAD; return { u: [-Math.cos(t), Math.sin(t)], f: [Math.sin(t), Math.cos(t)] }; }
  function toWorld(v, x, y) {
    var F = frame(), dx = x - v.W / 2, dy = y - v.D / 2;
    return [dx * F.u[0] + dy * F.f[0], dx * F.u[1] + dy * F.f[1]];
  }
  function rectWorld(v, x1, y1, x2, y2) { return [toWorld(v, x1, y1), toWorld(v, x2, y1), toWorld(v, x2, y2), toWorld(v, x1, y2)]; }
  function dirVec(deg) { return [Math.sin(deg * RAD), Math.cos(deg * RAD)]; }
  function nbPoly(v, b) {
    if (b.kind === "osm") return b.pts;
    var d = dirVec(b.dir), F = frame(), w = +b.w || 15, dd = +b.d || 15;
    var plotAlong = (Math.abs(d[0] * F.u[0] + d[1] * F.u[1]) * v.W + Math.abs(d[0] * F.f[0] + d[1] * F.f[1]) * v.D) / 2;
    var nbAlong = (Math.abs(d[0]) * w + Math.abs(d[1]) * dd) / 2, r = plotAlong + (+b.dist || 0) + nbAlong, cx = d[0] * r, cy = d[1] * r;
    return [[cx - w / 2, cy - dd / 2], [cx + w / 2, cy - dd / 2], [cx + w / 2, cy + dd / 2], [cx - w / 2, cy + dd / 2]];
  }
  function nbList(v) { return C.nb.map(function (b) { return { name: b.name || "שכן", h: +b.h || 0, est: !!b.est, pts: nbPoly(v, b) }; }); }
  function volPrisms(v) { return v.boxes.map(function (b) { return { pts: rectWorld(v, b.ox, b.oy, b.ox + b.w, b.oy + b.d), z0: b.z0, h: b.z0 + b.H }; }); }
  function inPoly(x, y, p) {
    var c = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    return c;
  }
  /* קרן מנקודה אל השמש: האם מנסרה כלשהי חוסמת אותה */
  function blocked(x, y, z, sun, prisms) {
    var s = [Math.sin(sun.az), Math.cos(sun.az)], t = Math.tan(sun.alt);
    if (t < 0.02) return true;
    var kmax = Math.min(400, 140 / t);
    for (var k = 0.5; k < kmax; k += 1) {
      var px = x + s[0] * k, py = y + s[1] * k, pz = z + k * t;
      for (var i = 0; i < prisms.length; i++) { var q = prisms[i]; if (pz <= q.h && pz >= (q.z0 || 0) - 0.01 && inPoly(px, py, q.pts)) return true; }
    }
    return false;
  }
  /* כמה מהשטח של כל שכן מוצל בידי הוולום, בין שעה לשעה */
  function nbShadow(v, dateStr, h1, h2) {
    var vp = volPrisms(v), out = [];
    nbList(v).forEach(function (b) {
      var xs = b.pts.map(function (p) { return p[0]; }), ys = b.pts.map(function (p) { return p[1]; }), n = 0, hit = 0;
      var x1 = Math.min.apply(null, xs), x2 = Math.max.apply(null, xs), y1 = Math.min.apply(null, ys), y2 = Math.max.apply(null, ys);
      for (var t = h1; t <= h2 + 1e-6; t += 0.5) {
        var sp = sunAt(dateStr, t); if (!sp || sp.alt <= 0.03) continue;
        for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++) {
          var x = x1 + (i + 0.5) / 6 * (x2 - x1), y = y1 + (j + 0.5) / 6 * (y2 - y1);
          if (!inPoly(x, y, b.pts)) continue;
          n++; if (blocked(x, y, 0.1, sp, vp)) hit++;
        }
      }
      out.push({ name: b.name, pct: n ? hit / n * 100 : 0, h: b.h });
    });
    return out;
  }
  /* שעות אור ישיר לכל חזית של הוולום, עם חסימה בידי השכנים */
  function facadeHours(v, dateStr) {
    var b = v.boxes[0], H = volStats(v).H, nbs = nbList(v).map(function (x) { return { pts: x.pts, z0: 0, h: x.h }; });
    var F = frame(), sides = [
      { n: [F.f[0], F.f[1]], c: toWorld(v, b.ox + b.w / 2, b.oy + b.d), street: true },
      { n: [-F.f[0], -F.f[1]], c: toWorld(v, b.ox + b.w / 2, b.oy) },
      { n: [F.u[0], F.u[1]], c: toWorld(v, b.ox + b.w, b.oy + b.d / 2) },
      { n: [-F.u[0], -F.u[1]], c: toWorld(v, b.ox, b.oy + b.d / 2) }
    ];
    sides.forEach(function (s) { s.az = (Math.atan2(s.n[0], s.n[1]) / RAD + 360) % 360; s.hours = 0; });
    for (var t = 4; t < 20; t += 0.25) {
      var sp = sunAt(dateStr, t); if (!sp || sp.alt <= 0.05) continue;
      var sv = [Math.sin(sp.az), Math.cos(sp.az)];
      sides.forEach(function (s) {
        if (sv[0] * s.n[0] + sv[1] * s.n[1] <= 0.05) return;
        if (!blocked(s.c[0] + s.n[0] * 0.3, s.c[1] + s.n[1] * 0.3, H / 2, sp, nbs)) s.hours += 0.25;
      });
    }
    return sides;
  }
  function dirName(az) { var best = DIRS[0]; DIRS.forEach(function (d) { var diff = Math.abs(((az - d[1] + 540) % 360) - 180); var bd = Math.abs(((az - best[1] + 540) % 360) - 180); if (diff < bd) best = d; }); return best[0]; }
  function facadeAll(v) {
    var days = [["2026-06-21", "קיץ"], ["2026-12-21", "חורף"], [C.date, "היום שנבחר"]], res = {};
    days.forEach(function (d) { res[d[0] + d[1]] = facadeHours(v, d[0]); });
    var rows = facadeHours(v, C.date).map(function (s, i) {
      return { name: "חזית " + dirName(s.az) + (s.street ? " (רחוב)" : ""), sum: res["2026-06-21קיץ"][i].hours, win: res["2026-12-21חורף"][i].hours, sel: s.hours };
    });
    return rows;
  }

  /* ---------- נתוני הפרויקט ---------- */
  function placedOk() { return !!(C.placed && has(C.lat) && has(C.lon) && getVol()); }
  function bar() {
    var v = getVol(), t;
    if (!v) t = "עוד אין וולום. מכריעים חלופה בהדגמה החיה של מפגש ב, או מזינים וולום ידנית בצומת 1.";
    else {
      var f = C.feasDone ? feasCounts() : null;
      t = "<b>פרויקט:</b> " + (CMODE === "example" ? '<span class="demo-tag">דוגמה</span> ' : "") + (v.src !== "man" ? "מגרש " + esc(v.plotId) + ", חלופה " + esc(v.key) + " (" + esc(v.name) + ")" : "וולום ידני") + " · " + v.c.floors + " קומות · " + fmt(v.c.h) + " מ' · " + fmt(v.c.gross, 0) + ' מ"ר · ' + (C.addr ? esc(C.addr) : "בלי כתובת") +
        (f ? " · היתכנות: " + f.r + " חריגות, " + f.y + " אזהרות" : " · היתכנות: טרם נבדקה");
    }
    return t;
  }
  function paintBars() { $$("[data-cbar]").forEach(function (el) { el.innerHTML = bar(); }); }
  function packText() {
    var v = getVol(); if (!v) return "";
    var L = ["נתוני הפרויקט:", "וולום: " + v.c.floors + " קומות, גובה " + fmt(v.c.h) + ' מ\', שטח כולל ' + fmt(v.c.gross, 0) + ' מ"ר, תכסית ' + fmt(v.c.cov, 0) + "%.",
      "כתובת: " + (C.addr || "לא הוזנה") + (has(C.lat) ? " (" + C.lat + ", " + C.lon + ")" : "") + ". החזית פונה ל" + dirName(C.front) + "."];
    var nb = nbList(v);
    L.push(nb.length ? "שכנים: " + nb.map(function (b) { return b.name + " " + fmt(b.h) + " מ'" + (b.est ? " (הערכה)" : ""); }).join(", ") + "." : "שכנים: לא הוזנו.");
    if (has(C.lat)) { var s = sunAt(C.date, C.hour); L.push("תאריך לניתוח: " + C.date + ", שעה " + hh(C.hour) + (s ? ", גובה שמש " + fmt(s.alt / RAD, 0) + " מעלות" : "") + "."); }
    return L.join("\n");
  }
  function setPrompt(id, q) { var pre = $("#" + id + " pre"); if (pre) pre.textContent = q + "\n\n" + packText(); }
  function paintPrompts() {
    setPrompt("cQ1", "מה הבניין הגבוה ביותר בטווח 50 מטר מהמגרש, ואיזו השפעה יש לו על ההצללה בין השעות 8:00 ל-10:00 בבוקר? ענה בעברית, בפסקה אחת, וציין מה בדקת ומה הנחת.");
    setPrompt("cQ4", "איזו בעיה בוולום הזה, אם לא תתוקן עכשיו, תעלה לי הכי הרבה זמן בשלב ההיתר? ענה בעברית, בשלוש שורות: הבעיה, למה, ומה לתקן.");
    setPrompt("cQ6", "מה הפרמטר הראשון שתרצה לדייק כשתפתח את הקובץ ב-Revit? ענה בעברית, בשורה אחת, ונמק במשפט.");
    var pre = $("#cQ5 pre");
    if (pre) pre.textContent = "תרגם את הכוונה העיצובית הבאה לשפה עיצובית של אדריכל, בעברית, ברשימה ממוספרת:\n1. אסתטיקה\n2. חומרי מעטפת מוצעים, עם סיבה לכל אחד\n3. חומרי פנים מוצעים\n4. פתחים: גודל והתמצאות לכל חזית\n5. גוון ופלטת צבעים\n6. אלמנטים ייחודיים (מרפסות, הצללות, כניסה)\nלכל סעיף: מה הנחת, ומה הייתי צריך לבדוק.\n\nהכוונה: " + (C.intentText || "[כאן מדביקים]") + "\nמילות מפתח: " + ((C.keys.style.concat(C.keys.mat, C.keys.tone ? [C.keys.tone] : [])).join(", ") || "אין") + "\n\n" + packText();
  }

  /* ---------- צומת 1: הצבת הוולום ---------- */
  function renderVol() {
    var st = aVolState(), v = C.useMan ? null : APP.volume(CMODE), box = $("#cVol"), html = "";
    if (v && !v.none && !C.useMan) {
      html = '<dl class="kv">' + [["מקור", "מפגש ב, " + (v.mode === "live" ? "הדגמה חיה" : "דוגמה, מגרש 633")], ["מגרש", v.plotId], ["חלופה", v.key + " · " + v.name], ["קומות", v.c.floors], ["גובה", fmt(v.c.h) + " מ'"], ['שטח כולל', fmt(v.c.gross, 0) + ' מ"ר'], ['יח"ד', v.c.units]]
        .map(function (r) { return "<div><dt>" + r[0] + "</dt><dd class=\"num\">" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" +
        '<div class="io-act"><button class="btn small" type="button" id="cUseMan">הזנה ידנית במקום</button></div>';
    } else {
      html = (st === "none" ? '<p class="small bad">בחלופות של מפגש ב אין חלופה שעומדת בכל הדרישות.</p>' : (C.useMan ? "" : '<p class="small muted">לא נבחרה חלופה במפגש ב. <a href="#a/decide">להכרעה במפגש ב</a>, או הזנה ידנית:</p>')) +
        '<div class="dev" id="cMan">' + [["W", 'רוחב המגרש, מ\''], ["D", "עומק המגרש, מ'"], ["floors", "קומות"], ["fp", 'שטח קומה, מ"ר'], ["flh", "גובה קומה, מ'"], ["sf", "קו בניין קדמי"], ["ss", "קו בניין צדדי"], ["sr", "קו בניין אחורי"],
          ["cov", "תכסית מרבית, %"], ["bp", "אחוזי בנייה, %"], ["maxFl", "קומות מרבי"], ["h", "גובה מרבי, מ'"], ["units", 'יח"ד מרבי']]
          .map(function (f) { return '<div><label>' + f[1] + '<input type="number" step="any" data-man="' + f[0] + '" value="' + esc(C.man[f[0]]) + '"></label></div>'; }).join("") + "</div>" +
        (C.useMan ? "" : '<div class="io-act"><button class="btn small" type="button" id="cUseManGo">שימוש בנתונים האלה</button></div>') + (st === "ok" ? '<div class="io-act"><button class="btn small" type="button" id="cUseA">חזרה לחלופה של מפגש ב</button></div>' : "");
    }
    box.innerHTML = html;
  }
  function renderNb() {
    var v = getVol();
    $("#cNb").innerHTML = C.nb.length ? C.nb.map(function (b, i) {
      var osm = b.kind === "osm";
      return "<tr><td><input type=\"text\" data-nb=\"name\" data-i=\"" + i + "\" value=\"" + esc(b.name || "") + "\" aria-label=\"שם\"></td>" +
        "<td><input type=\"number\" step=\"any\" min=\"0\" data-nb=\"h\" data-i=\"" + i + "\" value=\"" + esc(b.h) + "\" aria-label=\"גובה\">" + (b.est ? '<small class="muted"> הערכה</small>' : "") + "</td>" +
        (osm ? '<td colspan="4" class="muted small">OpenStreetMap · ' + (v ? fmt(Math.hypot.apply(null, centroid(b.pts)), 0) + " מ' מהמרכז" : "") + "</td>" :
          '<td><input type="number" step="any" min="0" data-nb="dist" data-i="' + i + '" value="' + esc(b.dist) + '" aria-label="מרחק"></td>' +
          '<td><select data-nb="dir" data-i="' + i + '" aria-label="כיוון">' + DIRS.map(function (d) { return '<option value="' + d[1] + '"' + (+b.dir === d[1] ? " selected" : "") + ">" + d[0] + "</option>"; }).join("") + "</select></td>" +
          '<td><input type="number" step="any" min="1" data-nb="w" data-i="' + i + '" value="' + esc(b.w) + '" aria-label="רוחב"></td><td><input type="number" step="any" min="1" data-nb="d" data-i="' + i + '" value="' + esc(b.d) + '" aria-label="עומק"></td>') +
        '<td><button class="btn small" type="button" data-nbdel="' + i + '">הסרה</button></td></tr>';
    }).join("") : '<tr><td colspan="7" class="muted small">עוד אין שכנים. שולפים מ-OpenStreetMap או מוסיפים ידנית.</td></tr>';
    $("#cNbMsg").textContent = C.osmMsg || "";
  }
  function centroid(pts) { var x = 0, y = 0; pts.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; }
  function renderLoc() {
    var sel = $("#cFront");
    if (!sel.children.length) sel.innerHTML = DIRS.map(function (d) { return '<option value="' + d[1] + '">' + d[0] + "</option>"; }).join("");
    $$("[data-c]").forEach(function (el) {
      if (document.activeElement === el) return;
      var k = el.getAttribute("data-c"), v = C[k];
      if (k === "front" || k === "hour") el.value = v; else if (el.type === "checkbox") el.checked = !!v; else el.value = has(v) ? v : "";
    });
    if (document.activeElement !== $("#cAddr")) $("#cAddr").value = C.addr || "";
    $("#cHourL").textContent = hh(C.hour);
  }
  function placeVerdict() {
    var v = getVol(); if (!v) return;
    var st = volStats(v), nbs = nbList(v), tall = null;
    nbs.forEach(function (b) { var c = centroid(b.pts), d = Math.hypot(c[0], c[1]); if (d <= 50 + Math.max(v.W, v.D) / 2 && (!tall || b.h > tall.h)) tall = { h: b.h, name: b.name, d: d, est: b.est }; });
    var html;
    if (tall) {
      var diff = st.H - tall.h;
      html = "<b>הוולום בגובה " + fmt(st.H) + " מ'. השכן הגבוה ביותר בטווח 50 מטר: " + esc(tall.name) + ", " + fmt(tall.h) + " מ'" + (tall.est ? " (הערכה)" : "") + ".</b> " +
        (diff > 0 ? "הוולום גבוה ממנו ב-" + fmt(diff) + " מ'." : "הוולום נמוך ממנו ב-" + fmt(-diff) + " מ'.");
    } else html = "<b>הוולום בגובה " + fmt(st.H) + " מ'.</b> לא הוזנו שכנים בטווח 50 מטר, ולכן אין עם מה להשוות.";
    $("#cPlaceVerdict").innerHTML = html;
    $("#cPlaceNote").textContent = nbs.some(function (b) { return b.est; }) ? "שכנים שמסומנים כהערכה חסרים נתון גובה ב-OpenStreetMap: צריך לתקן ידנית." : "";
  }

  /* ---------- שירותי רשת: כתובת, בניינים, גובה, מזג אוויר ---------- */
  function jget(url, opt) {
    return fetch(url, opt).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  function geocode() {
    var q = ($("#cAddr").value || "").trim(); if (!q) { $("#cGeoMsg").textContent = "מזינים כתובת."; return; }
    C.addr = q; $("#cGeoMsg").textContent = "מחפש...";
    function ask(text) { return jget("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=he&q=" + encodeURIComponent(text)); }
    ask(q).then(function (r) { return r.length ? r : ask(q.replace(/\d+/g, "").replace(/\s+/g, " ").trim()); }).then(function (r) {
      if (!r.length) { $("#cGeoMsg").textContent = "הכתובת לא נמצאה. אפשר להזין קואורדינטות ידנית."; return; }
      C.lat = Math.round(+r[0].lat * 1e6) / 1e6; C.lon = Math.round(+r[0].lon * 1e6) / 1e6;
      $("#cGeoMsg").textContent = "נמצא: " + r[0].display_name; save(); renderLoc(); refresh();
    }).catch(function () { $("#cGeoMsg").textContent = "שירות הכתובות לא ענה. אפשר להזין קואורדינטות ידנית."; });
  }
  function fetchOsm() {
    if (!has(C.lat)) { C.osmMsg = "קודם כתובת או קואורדינטות."; renderNb(); return; }
    var v = getVol(), q = '[out:json][timeout:25];way["building"](around:90,' + C.lat + "," + C.lon + ");out tags geom 60;";
    C.osmMsg = "שולף..."; renderNb();
    var mirrors = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
    function tryMirror(i) {
      if (i >= mirrors.length) return Promise.reject(new Error("x"));
      return jget(mirrors[i], { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } }).catch(function () { return tryMirror(i + 1); });
    }
    tryMirror(0).then(function (r) {
      var kx = 111320 * Math.cos(C.lat * RAD), ky = 110540, out = [], skipped = 0, plotPoly = v ? rectWorld(v, 0, 0, v.W, v.D) : null;
      (r.elements || []).forEach(function (e) {
        if (!e.geometry || e.geometry.length < 3) return;
        var pts = e.geometry.map(function (g) { return [Math.round((g.lon - C.lon) * kx * 10) / 10, Math.round((g.lat - C.lat) * ky * 10) / 10]; });
        if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
        var c = centroid(pts); if (plotPoly && inPoly(c[0], c[1], plotPoly)) { skipped++; return; }
        var t = e.tags || {}, h = parseFloat(t.height), est = false;
        if (!(h > 0)) { var lv = parseFloat(t["building:levels"]); if (lv > 0) h = lv * 3.2; else { h = 9.6; est = true; } }
        out.push({ kind: "osm", name: t.name || t["addr:housenumber"] && ("בניין " + t["addr:housenumber"]) || "בניין " + e.id, h: Math.round(h * 10) / 10, est: est, pts: pts });
      });
      C.nb = C.nb.filter(function (b) { return b.kind !== "osm"; }).concat(out);
      C.osmMsg = "נשלפו " + out.length + " בניינים" + (skipped ? ", " + skipped + " על המגרש עצמו דולגו" : "") + (out.some(function (b) { return b.est; }) ? ". בניינים בלי נתון גובה סומנו כהערכה." : ".");
      save(); renderNb(); refresh();
    }).catch(function () { C.osmMsg = "השירות לא ענה. מוסיפים שכנים ידנית."; renderNb(); });
  }
  function fetchDem() {
    if (!has(C.lat)) { $("#cDemMsg").textContent = "קודם כתובת או קואורדינטות."; return; }
    var d = 100, dlat = d / 110540, dlon = d / (111320 * Math.cos(C.lat * RAD)), la = [C.lat, C.lat, C.lat, C.lat + dlat, C.lat - dlat], lo = [C.lon, C.lon + dlon, C.lon - dlon, C.lon, C.lon];
    $("#cDemMsg").textContent = "שולף...";
    jget("https://api.open-meteo.com/v1/elevation?latitude=" + la.join(",") + "&longitude=" + lo.join(",")).then(function (r) {
      var e = r.elevation; if (!e || e.length < 5) throw new Error("x");
      var gx = (e[1] - e[2]) / (2 * d), gy = (e[3] - e[4]) / (2 * d), slope = Math.hypot(gx, gy) * 100, down = (Math.atan2(-gx, -gy) / RAD + 360) % 360;
      C.dem = { z: Math.round(e[0] * 10) / 10, slope: Math.round(slope * 10) / 10, down: slope < 0.3 ? null : Math.round(down) };
      $("#cDemMsg").textContent = ""; save(); renderCard();
    }).catch(function () { $("#cDemMsg").textContent = "השירות לא ענה. אפשר לנסות שוב."; });
  }
  function fetchWx() {
    if (!has(C.lat)) { $("#cWxMsg").textContent = "קודם כתובת או קואורדינטות."; return Promise.resolve(); }
    var y = new Date().getUTCFullYear() - 1, vars = "temperature_2m_mean,precipitation_sum,wind_direction_10m_dominant,shortwave_radiation_sum", q = "&latitude=" + C.lat + "&longitude=" + C.lon + "&daily=" + vars + "&timezone=Asia%2FJerusalem";
    $("#cWxMsg").textContent = "שולף נתוני אקלים...";
    function parse(r, partial) {
      var d = r.daily; if (!d || !d.time) throw new Error("x");
      var rain = 0, rdays = 0, rad = 0, nrad = 0, bins = []; for (var m = 0; m < 12; m++) bins.push([0, 0, 0, 0, 0, 0, 0, 0]);
      d.time.forEach(function (t, i) {
        var p = d.precipitation_sum[i]; if (p != null) { rain += p; if (p >= 1) rdays++; }
        var s = d.shortwave_radiation_sum[i]; if (s != null) { rad += s; nrad++; }
        var w = d.wind_direction_10m_dominant[i]; if (w != null) bins[+t.slice(5, 7) - 1][Math.round(w / 45) % 8]++;
      });
      C.wx = { year: y, partial: !!partial, days: d.time.length, rain: Math.round(rain), rdays: rdays, rad: nrad ? Math.round(rad / nrad / 3.6 * 100) / 100 : null,
        wind: bins.map(function (b) { var mx = Math.max.apply(null, b); return mx ? DIRS[b.indexOf(mx)][0] : null; }) };
      $("#cWxMsg").textContent = partial ? "נתוני השנה המלאה לא התקבלו. מוצגים 92 הימים האחרונים." : ""; save(); renderClim();
    }
    return jget("https://archive-api.open-meteo.com/v1/archive?start_date=" + y + "-01-01&end_date=" + y + "-12-31" + q).then(function (r) { parse(r, false); }).catch(function () {
      return jget("https://api.open-meteo.com/v1/forecast?past_days=92&forecast_days=1" + q).then(function (r) { parse(r, true); });
    }).catch(function () { C.wx = null; $("#cWxMsg").textContent = "נתוני האקלים לא התקבלו. מסלול השמש וההצללה מחושבים בכל מקרה."; });
  }

  function fetchWiki() {
    if (!has(C.lat)) { $("#cWikiMsg").textContent = "קודם כתובת או קואורדינטות."; return; }
    $("#cWikiMsg").textContent = "מחפש...";
    jget("https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=" + C.lat + "%7C" + C.lon + "&ggsradius=500&ggslimit=8&ggsnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=220&format=json&origin=*").then(function (r) {
      var pages = r.query ? Object.keys(r.query.pages).map(function (k) { return r.query.pages[k]; }) : [];
      C.wiki = pages.filter(function (p) { return p.imageinfo && p.imageinfo[0]; }).map(function (p) { return { t: p.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, ""), u: p.imageinfo[0].descriptionurl || p.imageinfo[0].url, th: p.imageinfo[0].thumburl || p.imageinfo[0].url }; });
      $("#cWikiMsg").textContent = C.wiki.length ? "" : "לא נמצאו תמונות ברדיוס 500 מטר."; save(); renderWiki();
    }).catch(function () { $("#cWikiMsg").textContent = "השירות לא ענה. אפשר לנסות שוב."; });
  }
  function renderWiki() {
    var el = $("#cWikiOut"); if (!el) return;
    el.innerHTML = C.wiki && C.wiki.length ? '<p class="io-q">תמונות מהסביבה, Wikimedia Commons, ברדיוס 500 מ\'</p><div class="wiki">' + C.wiki.map(function (w) { return '<a href="' + esc(w.u) + '" target="_blank" rel="noopener"><img src="' + esc(w.th) + '" alt="' + esc(w.t) + '" loading="lazy"><span>' + esc(w.t) + "</span></a>"; }).join("") + '</div><p class="tiny">התמונות שייכות לצלמים שלהן, ברישיונות שמפורטים בעמוד של כל תמונה.</p>' : "";
  }

  /* ---------- צומת 2: כרטיס שטח ---------- */
  var SITE_F = [["exist", "מבנה קיים", ["", "אין", "לשימור", "להריסה"]], ["soil", "סוג קרקע", ["", "לא ידוע", "סלע", "חול", "חרסית", "מילוי"]], ["trees", "עצים ופריטי גינה לשימור"], ["hist", "תכנון היסטורי על המגרש"],
    ["water", "מד מים וחיבור"], ["sewer", "כיוון ביוב"], ["elec", "עמדות חשמל"], ["comm", "תקשורת"]];
  function renderSiteF() {
    var box = $("#cSiteF");
    if (box.children.length) { $$("[data-site]").forEach(function (el) { if (document.activeElement !== el) el.value = C.site[el.getAttribute("data-site")] || ""; }); return; }
    box.innerHTML = SITE_F.map(function (f) {
      return '<div class="' + (f[2] ? "" : "wide2") + '"><label>' + f[1] + (f[2] ? '<select data-site="' + f[0] + '">' + f[2].map(function (o) { return "<option>" + o + "</option>"; }).join("") + "</select>" : '<input type="text" dir="rtl" data-site="' + f[0] + '">') + "</label></div>";
    }).join("");
    $$("[data-site]").forEach(function (el) { el.value = C.site[el.getAttribute("data-site")] || ""; });
  }
  function docsFor(prefix) { var all = APP.docs(), out = {}; Object.keys(all).forEach(function (k) { if (k.indexOf(prefix) === 0) out[k] = all[k]; }); return out; }
  function renderPhotos() {
    var d = docsFor(DK("photo:"));
    $("#cPhotos").innerHTML = PHOTOS.map(function (n, i) {
      var f = d[DK("photo:") + i];
      return '<li><div class="dn">' + esc(n) + "<small>" + (f ? esc(f.name) : "חסר") + '</small></div><div class="da">' +
        (f ? '<button class="btn small" type="button" data-pdel="' + DK("photo:") + i + '">הסרה</button>' : '<label class="btn small">העלאה<input type="file" accept="image/*" data-pup="' + DK("photo:") + i + '" aria-label="העלאת תמונה: ' + esc(n) + '"></label>') + "</div></li>";
    }).join("") + (function () {
      var g = d[DK("geo")];
      return '<li><div class="dn">דוח גיאוטכני<small>' + (g ? esc(g.name) : "אופציונלי, נשמר ואינו נקרא") + '</small></div><div class="da">' +
        (g ? '<button class="btn small" type="button" data-pdel="' + DK("geo") + '">הסרה</button>' : '<label class="btn small">העלאה<input type="file" data-pup="' + DK("geo") + '" aria-label="העלאת דוח גיאוטכני"></label>') + "</div></li>";
    })();
  }
  function siteReady() {
    var v = getVol(), items = [has(C.lat), !!C.dem, !!C.site.exist, !!C.site.soil, !!C.site.water, !!C.site.sewer, !!C.site.elec, !!v, nbList(v || { W: 1, D: 1, boxes: [] }).length > 0, Object.keys(docsFor(DK("photo:"))).length >= 6];
    return Math.round(items.filter(Boolean).length / items.length * 100);
  }
  function cardRows() {
    var v = getVol(), n = nbList(v || { W: 1, D: 1, boxes: [] }), photos = Object.keys(docsFor(DK("photo:"))).length, tall = n.reduce(function (m, b) { return Math.max(m, b.h); }, 0);
    return [
      ["מקום", C.addr || "לא הוזן", has(C.lat) ? "g" : "r"],
      ["קואורדינטות", has(C.lat) ? C.lat + ", " + C.lon : "חסר", has(C.lat) ? "g" : "r"],
      ["גובה קרקע (DEM)", C.dem ? fmt(C.dem.z) + " מ' מעל פני הים" : "טרם נשלף", C.dem ? "g" : "y"],
      ["שיפוע וניקוז", C.dem ? fmt(C.dem.slope) + "%" + (C.dem.down !== null ? ", ניקוז לכיוון " + dirName(C.dem.down) : ", כמעט מישורי") : "טרם נשלף", C.dem ? "g" : "y"],
      ["מגרש", v ? fmt(v.W) + " × " + fmt(v.D) + " מ', " + fmt(v.area, 0) + ' מ"ר' : "אין וולום", v ? "g" : "r"],
      ["שכנים", n.length ? n.length + " בניינים, הגבוה " + fmt(tall) + " מ'" : "לא הוזנו", n.length ? "g" : "y"],
      ["מבנה קיים", C.site.exist || "לא הוזן", C.site.exist ? "g" : "y"],
      ["עצים ופריטי גינה", C.site.trees || "לא הוזן", C.site.trees ? "g" : "n"],
      ["קרקע", C.site.soil || "לא הוזן", C.site.soil ? "g" : "y"],
      ["מים", C.site.water || "לא הוזן. חיבור לממשק עירוני לא קיים", C.site.water ? "g" : "y"],
      ["ביוב", C.site.sewer || "לא הוזן", C.site.sewer ? "g" : "y"],
      ["חשמל ותקשורת", [C.site.elec, C.site.comm].filter(Boolean).join(" · ") || "לא הוזן", C.site.elec || C.site.comm ? "g" : "y"],
      ["תכנון היסטורי", C.site.hist || "לא הוזן", C.site.hist ? "g" : "n"],
      ["דוח גיאוטכני", docsFor(DK("geo"))[DK("geo")] ? docsFor(DK("geo"))[DK("geo")].name : "לא הועלה", docsFor(DK("geo"))[DK("geo")] ? "g" : "n"],
      ["תיעוד שטח", photos + " מתוך 8 תמונות", photos >= 6 ? "g" : (photos ? "y" : "r")]
    ];
  }
  function renderCard() {
    if (!C.siteDone) { $("#cCardOut").innerHTML = ""; return; }
    var rows = cardRows();
    $("#cCardOut").innerHTML = '<p class="verdict"><mark><b>כרטיס שטח: ' + siteReady() + "% מהשדות מלאים.</b></mark></p>" +
      '<table class="t fit"><tbody>' + rows.map(function (r) { return "<tr><td>" + r[0] + '</td><td class="c"><i class="dot ' + (r[2] === "n" ? "" : r[2]) + '"></i>' + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table>" +
      '<div class="io-act"><button class="btn" type="button" id="cCardCopy">העתקת הכרטיס</button><span class="tiny" id="cCardToast" aria-live="polite"></span></div>';
  }

  /* ---------- צומת 3: סטטוטורי ואקלים ---------- */
  function renderStat() {
    var v = getVol(); if (!v) { $("#cRights").innerHTML = '<p class="small muted">אין וולום.</p>'; return; }
    var R = v.R, rows = [["תכסית מרבית", has(R.cov) ? R.cov + "%" : "חסר"], ["אחוזי בנייה", has(R.bp) ? R.bp + "%" : "חסר"], ["קומות מרבי", has(R.floors) ? R.floors : "חסר"], ["גובה מרבי", has(R.h) ? R.h + " מ'" : "חסר"], ["קווי בניין", has(R.sf) ? R.sf + " / " + R.ss + " / " + R.sr + " מ'" : "חסר"], ['יח"ד מרבי', has(R.units) ? R.units : "חסר"]];
    $("#cRights").innerHTML = '<dl class="kv">' + rows.map(function (r) { return "<div><dt>" + r[0] + '</dt><dd class="num">' + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>";
    var sf = $("#cStatF");
    if (!sf.children.length) {
      sf.innerHTML = [["app.maxH", "נספח בינוי: גובה מרבי, מ'"], ["app.maxFl", "נספח בינוי: קומות מרבי"], ["park", 'חניות ליח"ד'], ["sqm", 'מ"ר לחניה, כולל תנועה'], ["fireMin", "מרחק מינימלי לכיבוי אש, מ'"]]
        .map(function (f) { return '<div><label>' + f[1] + '<input type="number" step="any" data-c="' + f[0] + '"></label></div>'; }).join("") +
        '<div class="wide"><label class="chk"><input type="checkbox" data-c="acc"> נגישות לפי תקן 1918 נבדקה ידנית</label></div>';
    }
    $$("[data-c]", sf).concat($$("[data-c='rami']")).forEach(function (el) {
      if (document.activeElement === el) return;
      var k = el.getAttribute("data-c"), val = k.indexOf("app.") === 0 ? C.app[k.slice(4)] : C[k];
      if (k === "park" && !has(val)) val = parkRate();
      if (el.type === "checkbox") el.checked = !!val; else el.value = has(val) ? val : "";
    });
    $("#cStatOut").innerHTML = C.statDone ? '<p class="verdict"><mark><b>הנתונים הסטטוטוריים נשמרו.</b></mark></p><p class="small muted">נספח בינוי: ' + (has(C.app.maxH) || has(C.app.maxFl) ? "הוזן" : "לא הוזן") + ". חניה: " + fmt(parkRate()) + ' ליח"ד. מרחק כיבוי: ' + fmt(C.fireMin) + " מ'. נגישות: " + (C.acc ? "נבדקה ידנית" : "לא נבדקה") + ".</p>" : "";
  }
  function mode(list) { var c = {}, best = list[0]; list.forEach(function (x) { c[x] = (c[x] || 0) + 1; if (c[x] > c[best]) best = x; }); return best; }
  function parkRate() { return has(C.park) ? C.park : (APP.sys().park || 1.5); }
  function renderSunSvg() {
    var cx = 110, cy = 110, r = 96, h = "";
    function pt(az, alt) { var rr = r * (1 - alt / (Math.PI / 2)); return [cx + rr * Math.sin(az), cy - rr * Math.cos(az)]; }
    [0, 30, 60].forEach(function (a) { h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * (1 - a / 90)).toFixed(1) + '" fill="none" stroke="#d6d6d2"/>'; });
    DIRS.filter(function (d, i) { return i % 2 === 0; }).forEach(function (d) { var q = pt(d[1] * RAD, -0.12); h += '<text x="' + q[0].toFixed(1) + '" y="' + (q[1] + 4).toFixed(1) + '" font-size="12" fill="#4a4a46" text-anchor="middle" font-family="Heebo, Arial">' + d[0] + "</text>"; });
    function path(dateStr, col, w, dash) {
      var pts = [];
      for (var t = 3; t <= 21; t += 0.25) { var s = sunAt(dateStr, t); if (s && s.alt > 0) pts.push(pt(s.az, s.alt).map(function (n) { return n.toFixed(1); }).join(",")); }
      return pts.length ? '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="3 3"' : "") + "/>" : "";
    }
    h += path("2026-06-21", "#b8b8b3", 1, true) + path("2026-12-21", "#b8b8b3", 1, true) + path(C.date, "#151515", 1.8, false);
    for (var t = 6; t <= 19; t++) { var s = sunAt(C.date, t); if (s && s.alt > 0) { var q = pt(s.az, s.alt); h += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2.2" fill="#151515"/>'; if (t % 2 === 0) h += '<text x="' + (q[0] + 5).toFixed(1) + '" y="' + (q[1] - 4).toFixed(1) + '" font-size="9" fill="#6b6b6b" font-family="Heebo, Arial">' + t + "</text>"; } }
    var cur = sunAt(C.date, C.hour);
    if (cur && cur.alt > 0) { var c = pt(cur.az, cur.alt); h += '<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="6.5" fill="#ffe27a" stroke="#151515" stroke-width="1.2"/>'; }
    $("#cSun").innerHTML = '<svg viewBox="0 0 220 220" role="img" aria-label="מסלול השמש" style="max-width:260px;width:100%">' + h + "</svg>" +
      '<p class="small muted">' + (cur ? (cur.alt > 0 ? "בשעה " + hh(C.hour) + ": גובה " + fmt(cur.alt / RAD, 0) + " מעלות, כיוון " + dirName(cur.az / RAD) + "." : "בשעה " + hh(C.hour) + " השמש מתחת לאופק.") : "") + ' הקו הכהה: היום שנבחר. הקווים הדקים: 21.6 ו-21.12.</p>';
  }
  function renderClim() {
    if (!C.climDone) { $("#cClimOut").hidden = true; return; }
    var v = getVol(); $("#cClimOut").hidden = false; if (!v) return;
    renderSunSvg();
    var rows = facadeAll(v), best = rows.slice().sort(function (a, b) { return (b.win - b.sum) - (a.win - a.sum); })[0];
    $("#cFac").innerHTML = '<table class="t fit"><thead><tr><th>חזית</th><th>קיץ 21.6</th><th>חורף 21.12</th><th>' + esc(C.date) + "</th></tr></thead><tbody>" +
      rows.map(function (r) { return "<tr><td>" + esc(r.name) + '</td><td class="c num">' + fmt(r.sum, 1) + '</td><td class="c num">' + fmt(r.win, 1) + '</td><td class="c num">' + fmt(r.sel, 1) + "</td></tr>"; }).join("") + "</tbody></table>" +
      '<p class="small muted">שעות אור ישיר, אחרי חסימה בידי השכנים. <mark>חזית מועדפת לפתחים: ' + esc(best.name) + "</mark>, כי הפער בין חורף לקיץ בה הוא הגדול ביותר.</p>";
    var sh = nbShadow(v, C.date, 8, 10), bad = sh.filter(function (x) { return x.pct >= 10; });
    $("#cShadowAlert").innerHTML = sh.length ? (bad.length ? '<div class="warn"><b>הצללה על שכנים, בין 8:00 ל-10:00 ב-' + esc(C.date) + ":</b> " + bad.map(function (x) { return esc(x.name) + " " + fmt(x.pct, 0) + "%"; }).join(", ") + ". ההצללה מחושבת על שטח הקרקע של השכן.</div>" : '<p class="small muted">ביום שנבחר, בין 8:00 ל-10:00, הוולום מצל פחות מ-10% מהשטח של כל שכן.</p>') : '<p class="small muted">לא הוזנו שכנים, ולכן לא נבדקה הצללה עליהם.</p>';
    var w = C.wx, roof = volStats(v).roof, pv = w && w.rad ? Math.round(roof * 0.6 * w.rad * 365 * 0.18 * 0.8) : null, wd = w ? w.wind.filter(Boolean) : [];
    var span = w ? (w.example ? "נתוני דוגמה, אשדוד " + w.year : (w.partial ? "92 הימים האחרונים" : "שנת " + w.year)) : "";
    $("#cWx").innerHTML = w ? '<p class="io-q">אקלים, ' + span + " (Open-Meteo)</p><dl class=\"kv\">" + [[w.partial ? "גשם בתקופה" : "גשם שנתי", fmt(w.rain, 0) + ' מ"מ'], [w.partial ? "ימי גשם בתקופה" : "ימי גשם", w.rdays], ["קרינה ממוצעת", fmt(w.rad, 1) + " קוט\"ש למ\"ר ליום"], ["רוח שולטת", wd.length ? mode(wd) : "אין נתון"], ["פוטנציאל פנלים בגג", pv ? fmt(pv, 0) + " קוט\"ש בשנה" : "אין נתון"]].map(function (r) { return "<div><dt>" + r[0] + '</dt><dd class="num">' + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" +
      '<p class="small muted">רוח שולטת לפי חודש: ' + w.wind.map(function (x, i) { return x ? (i + 1) + " " + x : null; }).filter(Boolean).join(" · ") + ". הפנלים: 60% משטח הגג, נצילות 18%, ויחס ביצוע 0.8. הערכה גסה" + (w.partial ? ", ועל תקופה חלקית של השנה" : "") + ".</p>" : '<p class="small muted">נתוני האקלים (רוח, גשם, קרינה) לא נשלפו.</p>';
    if (window.update3Dc) window.update3Dc();
  }

  /* ---------- צומת 4: בדיקת היתכנות ---------- */
  function feasChecks() {
    var v = getVol(), out = []; if (!v) return out;
    var R = v.R, c = v.c, F = volStats(v), eps = 1e-6;
    function hard(n, val, max, fmtv, unit) { out.push({ n: n, lim: has(max) ? "עד " + max + unit : "חסר", val: fmtv, st: !has(max) ? "n" : (val > max + eps ? "r" : "g"), note: has(max) ? (val > max + eps ? "חורג ב-" + fmt(val - max) + unit : "עומד") : "הערך לא חולץ" }); }
    hard("תכסית", c.cov, R.cov, fmt(c.cov) + "%", "%"); hard("אחוזי בנייה", c.bp, R.bp, fmt(c.bp, 0) + "%", "%"); hard("קומות", c.floors, R.floors, String(c.floors), ""); hard("גובה", c.h, R.h, fmt(c.h) + " מ'", " מ'"); hard('יח"ד', c.units, R.units, String(c.units), "");
    var inside = has(R.ss) && has(R.sr) && has(R.sf) ? v.boxes.every(function (b) { return b.ox >= R.ss - eps && b.ox + b.w <= v.W - R.ss + eps && b.oy >= R.sr - eps && b.oy + b.d <= v.D - R.sf + eps; }) : null;
    out.push({ n: "קווי בניין", lim: inside === null ? "חסר" : R.sf + " / " + R.ss + " / " + R.sr + " מ'", val: inside === null ? "חסר" : (inside ? "בפנים" : "חורג"), st: inside === null ? "n" : (inside ? "g" : "r"), note: inside === null ? "הערך לא חולץ" : (inside ? "הוולום בתוך קווי הבניין" : "הוולום יוצא מקווי הבניין") });
    var rate = parkRate(), req = Math.ceil(c.units * rate), zone = has(R.ss) ? (v.W - 2 * R.ss) * (v.D - R.sf - R.sr) : v.W * v.D, per = Math.max(1, Math.floor(zone * 0.9 / (+C.sqm || 28))), lv = Math.ceil(req / per);
    out.push({ n: "חניה", lim: fmt(rate) + ' ליח"ד', val: req + " חניות, " + lv + " קומות מרתף", st: lv <= 1 ? "g" : (lv === 2 ? "y" : "r"), note: "קומת מרתף מכילה כ-" + per + " חניות (" + fmt(+C.sqm || 28, 0) + ' מ"ר לחניה). שיעור החניה הוא ערך שהוזן, לא תקן 19.' });
    var front = Math.min.apply(null, v.boxes.map(function (b) { return v.D - (b.oy + b.d); }));
    out.push({ n: "גישת כיבוי אש", lim: "לפחות " + fmt(C.fireMin) + " מ' מהחזית", val: fmt(front) + " מ'", st: front >= C.fireMin ? "g" : "r", note: front >= C.fireMin ? "המרחק מספיק, לפי המינימום שהוזן" : "המרחק קטן מהמינימום שהוזן. המינימום הוא הנחת עבודה." });
    if (has(C.lat) && C.nb.length) {
      var sh = nbShadow(v, C.date, 8, 10), mx = sh.reduce(function (m, x) { return x.pct > m.pct ? x : m; }, { pct: 0, name: "" });
      out.push({ n: "צל על שכנים", lim: "עד 10% ירוק, עד 40% אזהרה", val: fmt(mx.pct, 0) + "%" + (mx.name ? " · " + mx.name : ""), st: mx.pct < 10 ? "g" : (mx.pct < 40 ? "y" : "r"), note: "הצללה על שטח הקרקע של השכן, 8:00 עד 10:00, ב-" + C.date + ". הסף הוא הנחה של הכלי." });
    } else out.push({ n: "צל על שכנים", lim: "", val: "לא נבדק", st: "n", note: "חסרים קואורדינטות או שכנים" });
    if (has(C.app.maxH) || has(C.app.maxFl)) {
      var ok = (!has(C.app.maxH) || F.H <= C.app.maxH + eps) && (!has(C.app.maxFl) || c.floors <= C.app.maxFl);
      out.push({ n: "נספח בינוי", lim: [has(C.app.maxH) ? "גובה עד " + C.app.maxH + " מ'" : "", has(C.app.maxFl) ? "עד " + C.app.maxFl + " קומות" : ""].filter(Boolean).join(", "), val: ok ? "תואם" : "חורג", st: ok ? "g" : "r", note: ok ? "הוולום תואם את נספח הבינוי שהוזן" : "הוולום חורג מנספח הבינוי שהוזן" });
    } else out.push({ n: "נספח בינוי", lim: "", val: "לא הוזן", st: "n", note: "אם קיים נספח, מזינים את גבולותיו בצומת 3" });
    return out;
  }
  function feasCounts() { var ch = feasChecks(); return { g: ch.filter(function (x) { return x.st === "g"; }).length, y: ch.filter(function (x) { return x.st === "y"; }).length, r: ch.filter(function (x) { return x.st === "r"; }).length, n: ch.filter(function (x) { return x.st === "n"; }).length }; }
  function renderFeasIn() {
    var v = getVol(); $("#cFeasIn").innerHTML = v ? [["וולום", v.c.floors + " קומות · " + fmt(v.c.h) + " מ'"], ["שכנים", C.nb.length || "לא הוזנו"], ["קואורדינטות", has(C.lat) ? "הוזנו" : "חסר"], ['שיעור חניה', fmt(parkRate()) + ' ליח"ד']].map(function (r) { return "<div><dt>" + r[0] + '</dt><dd class="num">' + esc(r[1]) + "</dd></div>"; }).join("") : "";
  }
  function feasText() {
    var ch = feasChecks(), t = ["כרטיס בדיקת היתכנות", bar().replace(/<[^>]+>/g, "")];
    var W = { g: "עומד", y: "אזהרה", r: "חורג", n: "לא נבדק" };
    ch.forEach(function (x) { t.push(x.n + ": " + x.val + " (" + W[x.st] + ") " + x.note); });
    return t.join("\n");
  }
  function renderFeas() {
    if (!C.feasDone) { $("#cFeasOut").hidden = true; return; }
    var ch = feasChecks(), k = feasCounts(); $("#cFeasOut").hidden = false;
    $("#cFeasVerdict").innerHTML = k.r ? '<b class="bad">' + k.r + " חריגות, " + k.y + " אזהרות.</b> מתקנים לפני ששורטטה שורה." : (k.y ? "<mark><b>אין חריגות, ויש " + k.y + " אזהרות.</b></mark>" : "<mark><b>הוולום עומד בכל הבדיקות שנעשו.</b></mark>") + (k.n ? " " + k.n + " בדיקות לא נעשו, כי חסר נתון." : "");
    $("#cFeas").innerHTML = "<thead><tr><th>בדיקה</th><th>מגבלה</th><th>הוולום</th><th>הסבר</th></tr></thead><tbody>" + ch.map(function (x) { return "<tr><td>" + x.n + '</td><td class="muted small">' + esc(x.lim) + '</td><td class="c"><i class="dot ' + (x.st === "n" ? "" : x.st) + '"></i>' + esc(x.val) + '</td><td class="muted small">' + esc(x.note) + "</td></tr>"; }).join("") + "</tbody>";
  }

  /* ---------- צומת 5: כוונת עיצוב ---------- */
  var STYLES = {
    "תעשייתי": { re: /תעשייתי|מחסן|נמל|גס|חשוף/, env: ["בטון חשוף", "פח מגולוון", "זכוכית מחוספסת"], int: ["בטון מוחלק", "פלדה שחורה", "עץ ממוחזר"], tone: "אפור-חום-טבעי", open: 0.4 },
    "מינימליסטי": { re: /מינימליסט|נקי|חלק|פשוט/, env: ["טיח לבן חלק", "זכוכית שקופה", "אלומיניום מוסתר"], int: ["מיקרוסמנט", "אלון בהיר", "לבן מט"], tone: "לבן-אפור בהיר", open: 0.35 },
    "ים תיכוני": { re: /ים תיכוני|אבן|טרקוטה|ים\b/, env: ["אבן גיר", "טיח חם", "תריסי עץ"], int: ["אריחי טרקוטה", "עץ", "קרמיקה"], tone: "חול-לבן-תכלת", open: 0.3 },
    "טרופי": { re: /טרופי|ג'ונגל|צמחי/, env: ["עץ טבעי", "הצללות מחוררות", "צמחייה במעטפת"], int: ["במבוק", "אבן טבעית", "פשתן"], tone: "ירוק-חום-לבן", open: 0.45 },
    "עכשווי": { re: /עכשווי|מודרני|זכוכית גדולה/, env: ["פאנלים מרוכבים", "זכוכית גדולה", "אבן אדריכלית"], int: ["פרקט", "שיש מלאכותי", "שחור מט"], tone: "אפור פחם-לבן", open: 0.5 },
    "קלאסי": { re: /קלאסי|מסורתי|מסותת/, env: ["אבן מסותתת", "טיח עם פרופילים", "תריסי עץ"], int: ["שיש", "פרקט בדוגמה", "עץ כהה"], tone: "שמנת-זהב-חום", open: 0.28 }
  };
  var MATS = ["בטון", "עץ", "זכוכית", "אבן", "פח", "ברזל", "טיח", "לבנים"];
  var TONES = ["אפור", "לבן", "חום", "חול", "שחור", "ירוק", "תכלת"];
  function renderChips() {
    var box = $("#cChips");
    function grp(title, key, list, single) {
      return '<div class="chips"><span>' + title + "</span>" + list.map(function (x) {
        var on = single ? C.keys[key] === x : C.keys[key].indexOf(x) !== -1;
        return '<button type="button" class="btn small' + (on ? " on" : "") + '" data-chip="' + key + '" data-v="' + esc(x) + '" aria-pressed="' + on + '">' + esc(x) + "</button>";
      }).join("") + "</div>";
    }
    box.innerHTML = grp("סגנון", "style", Object.keys(STYLES)) + grp("חומרים ראשיים", "mat", MATS) + grp("גוון", "tone", TONES, true);
  }
  function renderMood() {
    var d = docsFor(DK("mood:")), keys = Object.keys(d).sort();
    $("#cMood").innerHTML = (keys.length ? keys.map(function (k) { return '<li><div class="dn">' + esc(d[k].name) + '<small>' + size(d[k].size) + '</small></div><div class="da"><button class="btn small" type="button" data-pdel="' + k + '">הסרה</button></div></li>'; }).join("") : "") +
      '<li><div class="dn">הוספת תמונות<small>' + keys.length + " מתוך 3 עד 10</small></div><div class=\"da\"><label class=\"btn small\">העלאה<input type=\"file\" accept=\"image/*\" multiple data-mood aria-label=\"העלאת תמונות השראה\"></label></div></li>";
  }
  function size(n) { return n > 1048576 ? fmt(n / 1048576) + " MB" : fmt(Math.max(1, (n || 0) / 1024), 0) + " KB"; }
  /* פלטת צבעים: ממוצעים בשלוש עד ארבע קבוצות, בדגימה מוקטנת של כל תמונה */
  function palette(files) {
    return Promise.all(files.map(function (f) {
      return new Promise(function (res) {
        var im = new Image(), u = URL.createObjectURL(f);
        im.onload = function () {
          var c = document.createElement("canvas"); c.width = c.height = 24; var x = c.getContext("2d"); x.drawImage(im, 0, 0, 24, 24);
          var d = x.getImageData(0, 0, 24, 24).data, px = []; for (var i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]); URL.revokeObjectURL(u); res(px);
        };
        im.onerror = function () { URL.revokeObjectURL(u); res([]); }; im.src = u;
      });
    })).then(function (all) {
      var px = [].concat.apply([], all); if (px.length < 8) return [];
      var k = 4, cen = [], i; for (i = 0; i < k; i++) cen.push(px[Math.floor(i * px.length / k)].slice());
      for (var it = 0; it < 8; it++) {
        var sum = cen.map(function () { return [0, 0, 0, 0]; });
        px.forEach(function (p) { var b = 0, bd = 1e9; cen.forEach(function (c, j) { var dd = (p[0] - c[0]) * (p[0] - c[0]) + (p[1] - c[1]) * (p[1] - c[1]) + (p[2] - c[2]) * (p[2] - c[2]); if (dd < bd) { bd = dd; b = j; } }); sum[b][0] += p[0]; sum[b][1] += p[1]; sum[b][2] += p[2]; sum[b][3]++; });
        cen = cen.map(function (c, j) { return sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c; });
      }
      return cen.map(function (c) { return "#" + c.map(function (n) { return ("0" + Math.round(n).toString(16)).slice(-2); }).join(""); });
    });
  }
  function translateIntent() {
    var t = C.intentText || "", styles = C.keys.style.slice(), mats = C.keys.mat.slice();
    Object.keys(STYLES).forEach(function (k) { if (STYLES[k].re.test(t) && styles.indexOf(k) === -1) styles.push(k); });
    MATS.forEach(function (m) { if (t.indexOf(m) !== -1 && mats.indexOf(m) === -1) mats.push(m); });
    if (!styles.length && !mats.length && !t.trim()) return null;
    var main = styles[0] ? STYLES[styles[0]] : null, env = [], int = [];
    mats.forEach(function (m) { env.push(m); });
    styles.forEach(function (s) { STYLES[s].env.forEach(function (x) { if (env.indexOf(x) === -1) env.push(x); }); STYLES[s].int.forEach(function (x) { if (int.indexOf(x) === -1) int.push(x); }); });
    var want = null;
    DIRS.forEach(function (d) { if (new RegExp("(ל|אל |לכיוון )?" + d[0].replace("-", "[- ]")).test(t) && d[1] % 90 === 0 && /פתוח|נוף|פתח|זכוכית|חלונות/.test(t)) want = want || d[1]; });
    if (/\bים\b|הים|לים/.test(t) && want === null) want = 270;
    var v = getVol(), rows = v && has(C.lat) ? facadeAll(v) : null, base = main ? main.open : 0.35, openings = [];
    var F = frame();
    [[0, "רחוב"], [180, "אחורית"], [90, "צד"], [270, "צד"]].forEach(function (s, i) {
      var vec = i === 0 ? F.f : i === 1 ? [-F.f[0], -F.f[1]] : i === 2 ? F.u : [-F.u[0], -F.u[1]], az = (Math.atan2(vec[0], vec[1]) / RAD + 360) % 360, ratio = base, why = "ברירת מחדל לפי הסגנון";
      if (rows) { var r = rows[i]; if (r && r.sum > 9) { ratio -= 0.08; why = "הרבה שמש בקיץ (" + fmt(r.sum, 1) + " שעות): מצמצמים"; } else if (r && r.win > 5) { ratio += 0.05; why = "שמש טובה בחורף: מגדילים מעט"; } }
      if (want !== null && Math.abs(((az - want + 540) % 360) - 180) < 46) { ratio += 0.2; why = "ביקשת פתיחות לכיוון הזה"; }
      openings.push({ facade: "חזית " + dirName(az) + (i === 0 ? " (רחוב)" : ""), ratio: Math.round(Math.max(0.15, Math.min(0.8, ratio)) * 100), why: why });
    });
    return { styles: styles, tone: C.keys.tone || (main ? main.tone : ""), env: env.slice(0, 3), int: int.slice(0, 3), openings: openings, palette: C.palette || [], source: "כללים לפי מילות מפתח" + (C.palette && C.palette.length ? " ופלטת צבעים מהתמונות" : "") + ", ללא בינה" };
  }
  function renderIntent() {
    var I = C.intent; if (!I) { $("#cIntentOut").innerHTML = ""; return; }
    $("#cIntentOut").innerHTML = '<p class="verdict"><mark><b>' + (I.styles.length ? "אסתטיקה: " + esc(I.styles.join(", ")) : "לא זוהה סגנון") + ".</b></mark></p>" +
      '<dl class="kv">' + [["גוון", I.tone || "לא נקבע"], ["חומרי מעטפת", I.env.join(", ") || "לא זוהו"], ["חומרי פנים", I.int.join(", ") || "לא זוהו"]].map(function (r) { return "<div><dt>" + r[0] + '</dt><dd>' + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" +
      '<p class="io-q">יחסי מלא וריק מוצעים: שיעור הפתחים בכל חזית</p><ol class="outlist req">' + I.openings.map(function (o) { return "<li><b>" + esc(o.facade) + ": " + o.ratio + "%</b><span>" + esc(o.why) + "</span></li>"; }).join("") + "</ol>" +
      (I.palette.length ? '<p class="io-q">פלטת צבעים מתמונות ההשראה</p><div class="swatches">' + I.palette.map(function (c) { return '<i style="background:' + c + '" title="' + c + '"></i>'; }).join("") + "</div>" : "") +
      '<p class="tiny">' + esc(I.source) + ". ההצעה לא מוחלת על המודל בגרסה זו. כדאי לבדוק אותה, ולהשתמש בפרומפט לתרגום עשיר.</p>" +
      '<div class="io-act"><button class="btn" type="button" id="cIntentCopy">העתקת השפה העיצובית</button><span class="tiny" id="cIntentToast" aria-live="polite"></span></div>';
  }
  function intentText() {
    var I = C.intent; if (!I) return "";
    return ["שפה עיצובית", "אסתטיקה: " + (I.styles.join(", ") || "לא זוהה"), "גוון: " + (I.tone || "לא נקבע"), "חומרי מעטפת: " + I.env.join(", "), "חומרי פנים: " + I.int.join(", "), "פתחים:"].concat(I.openings.map(function (o) { return "- " + o.facade + ": " + o.ratio + "% (" + o.why + ")"; })).join("\n");
  }

  /* ---------- צומת 6: ייצוא ---------- */
  function guid() { var ch = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$", s = ch.charAt(Math.floor(Math.random() * 4)); for (var i = 0; i < 21; i++) s += ch.charAt(Math.floor(Math.random() * 64)); return s; }
  function istr(s) {
    var o = ""; s = String(s);
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if (c === 39) o += "''"; else if (c === 92) o += "\\\\"; else if (c < 127 && c > 31) o += s.charAt(i); else o += "\\X2\\" + ("0000" + c.toString(16).toUpperCase()).slice(-4) + "\\X0\\"; }
    return "'" + o + "'";
  }
  function buildIFC() {
    var v = getVol(); if (!v) return null;
    var L = [], n = 0;
    function add(s) { n++; L.push("#" + n + "=" + s + ";"); return "#" + n; }
    function num(x) { var s = Number(x).toFixed(4).replace(/0+$/, "").replace(/\.$/, ".0"); return s.indexOf(".") === -1 ? s + ".0" : s; }
    function pt3(x, y, z) { return add("IFCCARTESIANPOINT((" + num(x) + "," + num(y) + "," + num(z) + "))"); }
    function pt2(x, y) { return add("IFCCARTESIANPOINT((" + num(x) + "," + num(y) + "))"); }
    var dirZ = add("IFCDIRECTION((0.,0.,1.))"), dirX = add("IFCDIRECTION((1.,0.,0.))"), dirN = add("IFCDIRECTION((0.,1.))");
    function axis(x, y, z) { return add("IFCAXIS2PLACEMENT3D(" + pt3(x, y, z) + "," + dirZ + "," + dirX + ")"); }
    var ctx = add("IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-5," + axis(0, 0, 0) + "," + dirN + ")");
    var body = add("IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*," + ctx + ",$,.MODEL_VIEW.,$)");
    var uL = add("IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)"), uA = add("IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)"), uV = add("IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)"), uR = add("IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)");
    var units = add("IFCUNITASSIGNMENT((" + [uL, uA, uV, uR].join(",") + "))");
    var proj = add("IFCPROJECT('" + guid() + "',$," + istr("פרויקט מפגש ג") + ",$,$,$,$,(" + ctx + ")," + units + ")");
    function place(rel, x, y, z) { return add("IFCLOCALPLACEMENT(" + (rel || "$") + "," + axis(x, y, z) + ")"); }
    function dms(deg) { var sg = deg < 0 ? -1 : 1, t = Math.round(Math.abs(deg) * 3600 * 1e6), d = Math.floor(t / 3600e6), m = Math.floor((t - d * 3600e6) / 60e6), sec = Math.floor((t - d * 3600e6 - m * 60e6) / 1e6), us = t - d * 3600e6 - m * 60e6 - sec * 1e6; return "(" + sg * d + "," + sg * m + "," + sg * sec + "," + sg * us + ")"; }
    var sitePl = place(null, 0, 0, 0), site = add("IFCSITE('" + guid() + "',$," + istr("אתר") + ",$,$," + sitePl + ",$,$,.ELEMENT.," + (has(C.lat) ? dms(C.lat) + "," + dms(C.lon) : "$,$") + ",$,$,$)");
    var bldPl = place(sitePl, 0, 0, 0), bld = add("IFCBUILDING('" + guid() + "',$," + istr(v.src === "a" ? "מגרש " + v.plotId + ", חלופה " + v.key : "וולום ידני") + ",$,$," + bldPl + ",$,$,.ELEMENT.,$,$,$)");
    function solid(pts, depth) {
      var ids = pts.map(function (p) { return pt2(p[0], p[1]); }); ids.push(ids[0]);
      var pl = add("IFCPOLYLINE((" + ids.join(",") + "))"), pr = add("IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$," + pl + ")");
      return add("IFCEXTRUDEDAREASOLID(" + pr + "," + axis(0, 0, 0) + "," + dirZ + "," + num(depth) + ")");
    }
    function proxy(name, pts, depth, rel, z) {
      var sol = solid(pts, depth), rep = add("IFCSHAPEREPRESENTATION(" + body + ",'Body','SweptSolid',(" + sol + "))"), def = add("IFCPRODUCTDEFINITIONSHAPE($,$,(" + rep + "))");
      return add("IFCBUILDINGELEMENTPROXY('" + guid() + "',$," + istr(name) + ",$,$," + place(rel, 0, 0, z || 0) + "," + def + ",$,.NOTDEFINED.)");
    }
    var storeys = [], flh = v.flh, fl = 0;
    v.boxes.forEach(function (b, bi) {
      var pts = rectWorld(v, b.ox, b.oy, b.ox + b.w, b.oy + b.d), cnt = Math.max(1, Math.round(b.H / flh));
      for (var i = 0; i < cnt; i++) {
        fl++; var z = b.z0 + i * flh, spl = place(bldPl, 0, 0, z);
        var st = add("IFCBUILDINGSTOREY('" + guid() + "',$," + istr("קומה " + fl) + ",$,$," + spl + ",$,$,.ELEMENT.," + num(z) + ")");
        var el = proxy("וולום קומה " + fl, pts, flh, spl, 0);
        storeys.push({ st: st, el: el });
      }
    });
    var nbEls = nbList(v).map(function (b, i) { return proxy("שכן: " + b.name, b.pts, Math.max(b.h, 1), sitePl, 0); });
    add("IFCRELAGGREGATES('" + guid() + "',$,$,$," + proj + ",(" + site + "))");
    add("IFCRELAGGREGATES('" + guid() + "',$,$,$," + site + ",(" + bld + "))");
    add("IFCRELAGGREGATES('" + guid() + "',$,$,$," + bld + ",(" + storeys.map(function (s) { return s.st; }).join(",") + "))");
    storeys.forEach(function (s) { add("IFCRELCONTAINEDINSPATIALSTRUCTURE('" + guid() + "',$,$,$,(" + s.el + ")," + s.st + ")"); });
    if (nbEls.length) add("IFCRELCONTAINEDINSPATIALSTRUCTURE('" + guid() + "',$,$,$,(" + nbEls.join(",") + ")," + site + ")");
    function prop(name, desc, val) { return add("IFCPROPERTYSINGLEVALUE(" + istr(name) + "," + istr(desc) + "," + val + ",$)"); }
    var R = v.R, c = v.c, props = [
      prop("GrossFloorArea", "שטח כולל, מ\"ר", "IFCAREAMEASURE(" + num(c.gross) + ")"), prop("Floors", "מספר קומות", "IFCINTEGER(" + c.floors + ")"), prop("Height", "גובה כולל, מ'", "IFCLENGTHMEASURE(" + num(c.h) + ")"),
      prop("Coverage", "תכסית, %", "IFCREAL(" + num(c.cov) + ")"), prop("BuildingPercent", "אחוזי בנייה, %", "IFCREAL(" + num(c.bp) + ")"), prop("Units", "יחידות דיור", "IFCINTEGER(" + (c.units | 0) + ")"),
      prop("PlotArea", "שטח מגרש, מ\"ר", "IFCAREAMEASURE(" + num(v.area) + ")")];
    if (has(R.cov)) props.push(prop("MaxCoverage", "תכסית מרבית, %", "IFCREAL(" + num(R.cov) + ")"));
    if (has(R.bp)) props.push(prop("MaxBuildingPercent", "אחוזי בנייה מרבי, %", "IFCREAL(" + num(R.bp) + ")"));
    if (has(R.floors)) props.push(prop("MaxFloors", "קומות מרבי", "IFCINTEGER(" + R.floors + ")"));
    if (has(R.h)) props.push(prop("MaxHeight", "גובה מרבי, מ'", "IFCLENGTHMEASURE(" + num(R.h) + ")"));
    if (v.src === "a") props.push(prop("Alternative", "חלופה נבחרת", "IFCLABEL(" + istr(v.key + " " + v.name) + ")"));
    var pset = add("IFCPROPERTYSET('" + guid() + "',$," + istr("Pset_Rights") + ",$,(" + props.join(",") + "))");
    add("IFCRELDEFINESBYPROPERTIES('" + guid() + "',$,$,$,(" + bld + ")," + pset + ")");
    var head = "ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('ViewDefinition [ReferenceView_V1.2]'),'2;1');\nFILE_NAME('project.ifc','" + new Date().toISOString().slice(0, 19) + "',('Anat'),(''),'mifgasshim1','mifgasshim1','');\nFILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n";
    return head + L.join("\n") + "\nENDSEC;\nEND-ISO-10303-21;\n";
  }
  function download(name, text, type) {
    var b = new Blob([text], { type: type || "text/plain" }), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }
  /* DXF (גרסה 12, טקסט): תוכנית קרקע וחזית סכמטית, בשכבות */
  function planBounds(v) {
    var pts = rectWorld(v, 0, 0, v.W, v.D).concat.apply(rectWorld(v, 0, 0, v.W, v.D), nbList(v).map(function (b) { return b.pts; }));
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    return { x1: Math.min.apply(null, xs), x2: Math.max.apply(null, xs), y1: Math.min.apply(null, ys), y2: Math.max.apply(null, ys) };
  }
  function buildDXF() {
    var v = getVol(); if (!v) return null;
    var o = [], layers = [["PLOT", 7], ["VOLUME", 1], ["NEIGHBOURS", 8], ["ELEVATION", 5], ["FLOORS", 3], ["TEXT", 7]];
    function g(c, val) { o.push(String(c)); o.push(String(val)); }
    function f(n) { return Number(n).toFixed(4); }
    g(0, "SECTION"); g(2, "HEADER"); g(9, "$ACADVER"); g(1, "AC1009"); g(9, "$INSUNITS"); g(70, 6); g(0, "ENDSEC");
    g(0, "SECTION"); g(2, "TABLES"); g(0, "TABLE"); g(2, "LTYPE"); g(70, 1); g(0, "LTYPE"); g(2, "CONTINUOUS"); g(70, 0); g(3, "Solid line"); g(72, 65); g(73, 0); g(40, 0); g(0, "ENDTAB");
    g(0, "TABLE"); g(2, "LAYER"); g(70, layers.length);
    layers.forEach(function (l) { g(0, "LAYER"); g(2, l[0]); g(70, 0); g(62, l[1]); g(6, "CONTINUOUS"); });
    g(0, "ENDTAB"); g(0, "ENDSEC"); g(0, "SECTION"); g(2, "ENTITIES");
    function poly(pts, layer, closed) {
      g(0, "POLYLINE"); g(8, layer); g(66, 1); g(70, closed ? 1 : 0);
      pts.forEach(function (p) { g(0, "VERTEX"); g(8, layer); g(10, f(p[0])); g(20, f(p[1])); g(30, 0); });
      g(0, "SEQEND"); g(8, layer);
    }
    function line(a, b, layer) { g(0, "LINE"); g(8, layer); g(10, f(a[0])); g(20, f(a[1])); g(30, 0); g(11, f(b[0])); g(21, f(b[1])); g(31, 0); }
    function text(x, y, h, str, layer) { g(0, "TEXT"); g(8, layer); g(10, f(x)); g(20, f(y)); g(30, 0); g(40, f(h)); g(1, str); }
    poly(rectWorld(v, 0, 0, v.W, v.D), "PLOT", true);
    v.boxes.forEach(function (b) { poly(rectWorld(v, b.ox, b.oy, b.ox + b.w, b.oy + b.d), "VOLUME", true); });
    nbList(v).forEach(function (b) { poly(b.pts, "NEIGHBOURS", true); });
    var bd = planBounds(v), N = [bd.x2 + 6, bd.y2 - 8];
    line(N, [N[0], N[1] + 8], "TEXT"); text(N[0] - 1, N[1] + 9, 2.5, "N", "TEXT");
    /* חזית סכמטית, לצד התוכנית, לאורך רוחב המגרש */
    var ox = bd.x2 + 40, oy = bd.y1, H = volStats(v).H;
    line([ox, oy], [ox + v.W, oy], "ELEVATION");
    v.boxes.forEach(function (b) {
      poly([[ox + b.ox, oy + b.z0], [ox + b.ox + b.w, oy + b.z0], [ox + b.ox + b.w, oy + b.z0 + b.H], [ox + b.ox, oy + b.z0 + b.H]], "ELEVATION", true);
      for (var z = b.z0 + v.flh; z < b.z0 + b.H - 0.2; z += v.flh) line([ox + b.ox, oy + z], [ox + b.ox + b.w, oy + z], "FLOORS");
    });
    text(ox, oy + H + 3, 2.5, "H=" + fmt(H) + "m", "TEXT");
    g(0, "ENDSEC"); g(0, "EOF");
    return o.join("\n") + "\n";
  }
  /* OBJ: גופים מוחלקים קומה אחר קומה, ושכנים. Y למעלה, וצפון הוא Z שלילי. */
  function buildOBJ() {
    var v = getVol(); if (!v) return null;
    var out = ["# mifgasshim1, units: meters, Y up, north is -Z"], base = 0;
    function area(p) { var a = 0; for (var i = 0; i < p.length; i++) { var j = (i + 1) % p.length; a += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } return a / 2; }
    function prism(name, pts, z0, H) {
      pts = area(pts) < 0 ? pts.slice().reverse() : pts; var n = pts.length;
      out.push("o " + name);
      pts.forEach(function (p) { out.push("v " + p[0].toFixed(3) + " " + z0.toFixed(3) + " " + (-p[1]).toFixed(3)); });
      pts.forEach(function (p) { out.push("v " + p[0].toFixed(3) + " " + (z0 + H).toFixed(3) + " " + (-p[1]).toFixed(3)); });
      var b = base, top = [], bot = [], i;
      for (i = 0; i < n; i++) { top.push(b + n + i + 1); bot.push(b + (n - 1 - i) + 1); }
      out.push("f " + top.join(" ")); out.push("f " + bot.join(" "));
      for (i = 0; i < n; i++) { var j = (i + 1) % n; out.push("f " + [b + i + 1, b + j + 1, b + n + j + 1, b + n + i + 1].join(" ")); }
      base += 2 * n;
    }
    var fl = 0;
    v.boxes.forEach(function (b) {
      var pts = rectWorld(v, b.ox, b.oy, b.ox + b.w, b.oy + b.d), cnt = Math.max(1, Math.round(b.H / v.flh));
      for (var k = 0; k < cnt; k++) { fl++; prism("Floor_" + fl, pts, b.z0 + k * v.flh, v.flh); }
    });
    nbList(v).forEach(function (b, i) { prism("Neighbour_" + (i + 1), b.pts, 0, Math.max(b.h, 1)); });
    return out.join("\n") + "\n";
  }
  /* תרשים מיקום להדפסה: תוכנית עם צפון */
  function sitePlanSvg(v) {
    var bd = planBounds(v), W = 560, Hh = 380, pad = 24, sc = Math.min((W - 2 * pad) / (bd.x2 - bd.x1 || 1), (Hh - 2 * pad) / (bd.y2 - bd.y1 || 1));
    function pt(p) { return ((p[0] - bd.x1) * sc + pad).toFixed(1) + "," + (Hh - ((p[1] - bd.y1) * sc + pad)).toFixed(1); }
    function pg(pts, fill, stroke, w) { return '<polygon points="' + pts.map(pt).join(" ") + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + w + '"/>'; }
    var h = nbList(v).map(function (b) { var c = centroid(b.pts), q = pt(c).split(","); return pg(b.pts, "#e3e3df", "#8b8b87", 1) + '<text x="' + q[0] + '" y="' + q[1] + '" font-size="11" text-anchor="middle" fill="#4a4a46">' + esc(b.name) + " " + fmt(b.h, 0) + " מ'</text>"; }).join("");
    h += pg(rectWorld(v, 0, 0, v.W, v.D), "#fff", "#151515", 1.6);
    v.boxes.forEach(function (b) { h += pg(rectWorld(v, b.ox, b.oy, b.ox + b.w, b.oy + b.d), "#f1f1ee", "#151515", 1.2); });
    h += '<g transform="translate(' + (W - 30) + ',40)"><path d="M0 18V-12M-5 -4L0 -14L5 -4" fill="none" stroke="#151515" stroke-width="1.5"/><text y="34" font-size="12" text-anchor="middle">צפון</text></g>';
    return '<svg viewBox="0 0 ' + W + " " + Hh + '" width="100%" style="max-width:640px;border:1px solid #ddd">' + h + "</svg>";
  }
  function printSummary() {
    var v = getVol(); if (!v) return false;
    var w = window.open("", "_blank"); if (!w) return false;
    var ch = C.feasDone ? feasChecks() : [], W = { g: "עומד", y: "אזהרה", r: "חורג", n: "לא נבדק" };
    var html = '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>סיכום פרויקט</title><style>body{font-family:Heebo,Arial,sans-serif;margin:24px;color:#151515;line-height:1.5}h1{font-size:22px}h2{font-size:16px;margin-top:22px;border-bottom:1px solid #151515}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #ddd;padding:4px 6px;text-align:right}.s{font-size:12px;color:#666}</style></head><body>' +
      "<h1>סיכום פרויקט</h1><p>" + bar() + "</p><h2>תרשים מיקום</h2>" + sitePlanSvg(v) +
      "<h2>טבלת שטחים</h2><pre style=\"font-family:inherit\">" + esc(areaTable()) + "</pre>" +
      (ch.length ? "<h2>בדיקת היתכנות</h2><table>" + ch.map(function (x) { return "<tr><td>" + esc(x.n) + "</td><td>" + esc(x.val) + "</td><td>" + W[x.st] + "</td><td class=\"s\">" + esc(x.note) + "</td></tr>"; }).join("") + "</table>" : "") +
      (C.intent ? "<h2>מפרט חומרים ראשוני</h2><pre style=\"font-family:inherit\">" + esc(specText()) + "</pre>" : "") +
      '<p class="s">הופק באפליקציה "בינה מלאכותית לאדריכלים". ההנחות והמגבלות מפורטות בכרטיס ההיתכנות.</p></body></html>';
    w.document.open(); w.document.write(html); w.document.close(); w.focus();
    setTimeout(function () { try { w.print(); } catch (e) { /* המשתמש מדפיס ידנית */ } }, 400);
    return true;
  }
  function areaTable() {
    var v = getVol(); if (!v) return "";
    var rows = ["קומה\tשטח, מ\"ר\tגובה, מ'"], i = 0, fl = 0;
    v.boxes.forEach(function (b) { var cnt = Math.max(1, Math.round(b.H / v.flh)); for (var k = 0; k < cnt; k++) { fl++; rows.push(fl + "\t" + fmt(b.w * b.d, 0) + "\t" + fmt(b.z0 + k * v.flh + v.flh)); } });
    rows.push('סה"כ\t' + fmt(v.c.gross, 0) + "\t" + fmt(v.c.h));
    return rows.join("\n");
  }
  function specText() {
    var I = C.intent; if (!I) return "";
    return "מפרט חומרים ראשוני\nמעטפת:\n" + I.env.map(function (x, i) { return (i + 1) + ". " + x; }).join("\n") + "\nפנים:\n" + I.int.map(function (x, i) { return (i + 1) + ". " + x; }).join("\n");
  }
  function projectJson() {
    var v = getVol();
    return JSON.stringify({ project: bar().replace(/<[^>]+>/g, ""), address: C.addr, lat: C.lat, lon: C.lon, frontAzimuth: C.front, volume: v ? { plot: v.plotId, alternative: v.key, floors: v.c.floors, height: v.c.h, grossArea: v.c.gross, boxes: v.boxes } : null,
      rights: v ? v.R : null, neighbours: v ? nbList(v) : [], dem: C.dem, climate: C.wx, feasibility: C.feasDone ? feasChecks() : null, intent: C.intent }, null, 1);
  }
  function renderExp() {
    var v = getVol(), layers = [
      ["גאומטריה", v ? "g" : "r", v ? v.c.floors + " קומות, וולום לפי " + (v.src === "a" ? "מפגש ב" : "הזנה ידנית") : "אין וולום"],
      ["סביבה", C.nb.length ? "g" : "y", C.nb.length ? C.nb.length + " שכנים" : "בלי שכנים"],
      ["מיקום גאוגרפי", has(C.lat) ? "g" : "y", has(C.lat) ? "הקואורדינטות בקובץ" : "בלי קואורדינטות"],
      ["שמש ורוח", C.climDone ? "g" : "y", C.climDone ? "נותחו, ונשמרים בנתוני הפרויקט" : "לא הורצו"],
      ["פרמטרי זכויות", v ? "g" : "r", "כקבוצת מאפיינים בבניין"],
      ["היתכנות", C.feasDone ? "g" : "y", C.feasDone ? "בנתוני הפרויקט" : "לא הורצה"],
      ["תצלום אווירי", C.aerial !== false && has(C.lat) ? "g" : "n", "מוצג במודל. לא נכלל בקבצי הייצוא"],
      ["חומרים", "n", "גרסה שנייה. המפרט הראשוני נפרד"]];
    $("#cExpOut").innerHTML = '<p class="verdict"><mark><b>המודל מכיל ' + layers.filter(function (l) { return l[1] === "g"; }).length + " מתוך " + layers.length + " שכבות.</b></mark></p>" +
      '<ol class="outlist req">' + layers.map(function (l) { return "<li><b>" + l[0] + '</b><span><i class="dot ' + (l[1] === "n" ? "" : l[1]) + '"></i>' + esc(l[2]) + "</span></li>"; }).join("") + "</ol>" +
      '<p class="tiny">IFC 4 נפתח ב-Revit ובשאר התוכנות. DXF נפתח ב-AutoCAD וב-DWG TrueView, ו-OBJ ב-SketchUp וב-Blender. קובצי rvt, skp ו-dwg מקוריים לא נוצרים.</p>' +
      (C.expDone ? '<p class="small"><mark>הקובץ הורד.</mark></p>' : "");
  }

  /* ---------- שלד: חיבור לניווט ---------- */
  function refresh() { paintBars(); paintPrompts(); APP.refresh(); }
  function mountVpc(v, step) {
    var vp = $("#vpc"), id = step ? step.getAttribute("data-step") : "", slot = step && $('[data-slot="vpc"]', step);
    var ok = slot && ((id === "vol" && C.placed && getVol()) || (id === "clim" && C.climDone && getVol()));
    if (ok) { if (vp.parentNode !== slot) slot.appendChild(vp); } else if (vp.parentNode !== $("#vpcStore")) $("#vpcStore").appendChild(vp);
  }
  window.CTOOL = {
    visible: function () { var h = $("#iso3dc"); return document.body.getAttribute("data-page") === "c" && !!h && h.offsetParent !== null; },
    scene: function () {
      var v = getVol(); if (!v) return null;
      var vols = volPrisms(v), nbs = nbList(v), ext = Math.max(v.W, v.D, volStats(v).H);
      nbs.forEach(function (b) { b.pts.forEach(function (p) { ext = Math.max(ext, Math.hypot(p[0], p[1])); }); });
      var cur = $(".view:not([hidden]) .step:not([hidden])"), id = cur ? cur.getAttribute("data-step") : "";
      return { plot: rectWorld(v, 0, 0, v.W, v.D), boxes: vols.map(function (p) { return { pts: p.pts, z0: p.z0, H: p.h - p.z0 }; }), nbs: nbs.map(function (b) { return { pts: b.pts, h: b.h, est: b.est }; }),
        radius: Math.max(40, Math.ceil(ext * 1.25 / 10) * 10), aerial: C.aerial !== false && has(C.lat), lat: has(C.lat) ? C.lat : null, lon: has(C.lon) ? C.lon : null, sun: id === "clim" || id === "vol" ? (id === "clim" ? sunAt(C.date, C.hour) : sunAt("2026-12-21", 9)) : null };
    }
  };
  function paintCMode() {
    document.body.setAttribute("data-cmode", CMODE);
    $$("button[data-cmode]").forEach(function (b) { var on = b.getAttribute("data-cmode") === CMODE; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  }
  function syncOut() {
    var show = !!(C.placed && getVol() && has(C.lat));
    $("#cPlaceOut").hidden = !show; if (show) placeVerdict();
    $("#cGeoMsg").textContent = ""; $("#cWikiMsg").textContent = ""; $("#cDemMsg").textContent = ""; $("#cWxMsg").textContent = "";
  }
  function setCMode(m) {
    if (m === CMODE) return;
    clearTimeout(saveT); save(); CMODE = m; APP.save("cmode", m);
    C = fixC(APP.load(ckey(), freshFor(m)));
    paintCMode(); sync(); syncOut(); APP.refresh();
    var cur = APP.current();
    if (cur && cur.page === "c" && cur.id !== "start") location.hash = "c/start";
  }
  /* הרצת כל הדוגמה בבת אחת, כדי לראות את התוצאות בכל הצמתים */
  function runAll() {
    C.placed = true; C.siteDone = true; C.statDone = true; C.climDone = true; C.feasDone = true; C.intent = translateIntent();
    save(); sync(); syncOut(); APP.refresh(); location.hash = "c/volume";
  }
  var weekT = null;
  function runWeek() {
    var w = $("#cWeek"); if (!w) return;
    w.classList.remove("run"); void w.offsetWidth; w.classList.add("run");
  }
  function sync() { renderWiki(); renderVol(); renderNb(); renderLoc(); renderSiteF(); renderPhotos(); renderCard(); renderStat(); renderClim(); renderFeasIn(); renderFeas(); renderChips(); renderMood(); renderIntent(); renderExp(); paintBars(); paintPrompts(); }

  APP.ext.b = { show: function (v) { if (v.id === "start") APP.ext.c.bshow(); } };
  APP.ext.c = {
    done: {
      vol: function () { return !!C.placed && !!getVol(); }, site: function () { return !!C.siteDone; }, stat: function () { return !!C.statDone; },
      clim: function () { return !!C.climDone; }, check: function () { return !!C.feasDone; }, intent: function () { return !!C.intent; }, exp: function () { return !!C.expDone; }
    },
    show: function (v) { if (v.id === "start") { runWeek(); paintBars(); } },
    bshow: function () { var el = $("#bProj"); if (!el) return; var v = C.placed ? getVol() : null; el.hidden = !v; if (v) el.innerHTML = "<b>פרויקט פעיל:</b> " + bar().replace(/^<b>פרויקט:<\/b> /, "") + ' · <a href="#c/volume">פתיחת המודל</a>'; },
    render: function (v, step) { sync(); mountVpc(v, step); if (window.update3Dc) window.update3Dc(); }
  };
  var need = { ok: function () { return placedOk(); }, text: "קודם מציבים את הוולום במרחב.", to: "#c/volume" };
  ["c/site", "c/climate", "c/feasibility", "c/intent", "c/export"].forEach(function (k) { APP.needs[k] = need; });

  /* ---------- אירועים ---------- */
  function wire() {
    document.addEventListener("click", function (e) {
      var t = e.target; if (!t.closest) return;
      var b;
      if ((b = t.closest("[data-date]"))) { C.date = b.getAttribute("data-date"); save(); renderLoc(); renderClim(); return; }
      if ((b = t.closest("[data-nbdel]"))) { C.nb.splice(+b.getAttribute("data-nbdel"), 1); save(); renderNb(); refresh(); return; }
      if ((b = t.closest("[data-chip]"))) {
        var k = b.getAttribute("data-chip"), val = b.getAttribute("data-v");
        if (k === "tone") C.keys.tone = C.keys.tone === val ? "" : val; else { var i = C.keys[k].indexOf(val); if (i === -1) C.keys[k].push(val); else C.keys[k].splice(i, 1); }
        save(); renderChips(); paintPrompts(); return;
      }
      if ((b = t.closest("[data-pdel]"))) { var key = b.getAttribute("data-pdel"); APP.docDel(key); delete APP.docs()[key]; if (key.indexOf(DK("mood:")) === 0) updatePalette(); renderPhotos(); renderMood(); renderCard(); APP.refresh(); return; }
      if ((b = t.closest("button[data-cmode]"))) { setCMode(b.getAttribute("data-cmode")); return; }
      if (t.closest("#cRunAll")) { runAll(); return; }
      if (t.closest("#cUseManGo")) { C.useMan = true; save(); sync(); refresh(); return; }
      if (t.closest("#cUseMan")) { C.useMan = true; save(); refresh(); sync(); return; }
      if (t.closest("#cUseA")) { C.useMan = false; save(); refresh(); sync(); return; }
    });
    $("#cWeekReplay").addEventListener("click", runWeek);
    $("#cGeo").addEventListener("click", geocode);
    $("#cAddr").addEventListener("keydown", function (e) { if (e.key === "Enter") geocode(); });
    $("#cOsm").addEventListener("click", fetchOsm);
    $("#cNbAdd").addEventListener("click", function () { C.nb.push({ kind: "man", name: "שכן " + (C.nb.length + 1), h: 18, dist: 10, dir: 0, w: 20, d: 20 }); save(); renderNb(); refresh(); });
    $("#cPlace").addEventListener("click", function () {
      if (!getVol()) { $("#cGeoMsg").textContent = "אין וולום. מכריעים חלופה במפגש ב, או מזינים וולום ידנית."; return; }
      if (!has(C.lat)) { $("#cGeoMsg").textContent = "חסרים מיקום: כתובת או קואורדינטות."; return; }
      C.placed = true; save(); placeVerdict(); $("#cPlaceOut").hidden = false; refresh();
    });
    $("#cDem").addEventListener("click", fetchDem);
    $("#cWiki").addEventListener("click", fetchWiki);
    $("#cSiteGo").addEventListener("click", function () { C.siteDone = true; save(); renderCard(); refresh(); });
    $("#cStatGo").addEventListener("click", function () { C.statDone = true; save(); renderStat(); refresh(); });
    $("#cClimGo").addEventListener("click", function () { C.climDone = true; save(); renderClim(); refresh(); if (!C.wx && CMODE === "live") fetchWx(); });
    $("#cFeasGo").addEventListener("click", function () { C.feasDone = true; save(); renderFeas(); refresh(); });
    $("#cFeasCopy").addEventListener("click", function () { copy(feasText(), $("#cFeasToast")); });
    $("#cIntentGo").addEventListener("click", function () { var I = translateIntent(); if (!I) { $("#cIntentOut").innerHTML = '<p class="small bad">אין מה לתרגם. כותבים תיאור או בוחרים מילות מפתח.</p>'; return; } C.intent = I; save(); renderIntent(); refresh(); });
    $("#cExIfc").addEventListener("click", function () { var s = buildIFC(); if (!s) { $("#cExToast").textContent = "אין וולום לייצוא."; return; } download("project.ifc", s, "application/x-step"); C.expDone = true; save(); renderExp(); refresh(); });
    $("#cExJson").addEventListener("click", function () { download("project.json", projectJson(), "application/json"); C.expDone = true; save(); renderExp(); refresh(); });
    $("#cExDxf").addEventListener("click", function () { var t = buildDXF(); if (!t) { $("#cExToast").textContent = "אין וולום לייצוא."; return; } download("project.dxf", t, "application/dxf"); C.expDone = true; save(); renderExp(); refresh(); });
    $("#cExObj").addEventListener("click", function () { var t = buildOBJ(); if (!t) { $("#cExToast").textContent = "אין וולום לייצוא."; return; } download("project.obj", t, "text/plain"); C.expDone = true; save(); renderExp(); refresh(); });
    $("#cExPrint").addEventListener("click", function () { if (!printSummary()) $("#cExToast").textContent = "החלון נחסם, או שאין וולום."; else { C.expDone = true; save(); renderExp(); } });
    $("#cExArea").addEventListener("click", function () { var t = areaTable(); if (t) { copy(t, $("#cExToast")); C.expDone = true; save(); renderExp(); refresh(); } });
    $("#cExSpec").addEventListener("click", function () { var t = specText(); if (!t) { $("#cExToast").textContent = "טרם הוגדרה כוונת עיצוב."; return; } copy(t, $("#cExToast")); });
    document.addEventListener("click", function (e) {
      if (e.target.closest("#cCardCopy")) copy(cardRows().map(function (r) { return r[0] + ": " + r[1]; }).join("\n"), $("#cCardToast"));
      if (e.target.closest("#cIntentCopy")) copy(intentText(), $("#cIntentToast"));
    });
    document.addEventListener("input", function (e) {
      var t = e.target; if (!t.matches) return;
      var k = t.getAttribute("data-c"), x;
      if (k) {
        if (k.indexOf("app.") === 0) C.app[k.slice(4)] = parseNum(t.value);
        else if (k === "date" || k === "addr" || k === "intentText" || k === "rami") C[k] = t.value;
        else if (t.type === "checkbox") C[k] = t.checked;
        else if (k === "front" || k === "hour" || k === "lat" || k === "lon" || k === "park" || k === "sqm" || k === "fireMin") C[k] = parseNum(t.value);
        else C[k] = t.value;
        clearTimeout(saveT); saveT = setTimeout(save, 200);
        if (k === "hour") $("#cHourL").textContent = hh(C.hour);
        if (k === "hour" || k === "date") { if (C.climDone) { renderSunSvg(); if (k === "date") renderClim(); else if (window.update3Dc) window.update3Dc(); } }
        else if (k === "front" || k === "lat" || k === "lon") { if (C.placed) placeVerdict(); renderNb(); if (window.update3Dc) window.update3Dc(); paintBars(); paintPrompts(); if (C.climDone) renderClim(); }
        else if (k === "aerial") { if (window.update3Dc) window.update3Dc(); }
        else paintPrompts();
        if (t.id === "cIntentText") paintPrompts();
        return;
      }
      if ((x = t.getAttribute("data-man"))) { C.man[x] = t.value; clearTimeout(saveT); saveT = setTimeout(save, 200); paintBars(); if (C.placed) { placeVerdict(); if (window.update3Dc) window.update3Dc(); } return; }
      if ((x = t.getAttribute("data-site"))) { C.site[x] = t.value; clearTimeout(saveT); saveT = setTimeout(save, 200); return; }
      if ((x = t.getAttribute("data-nb"))) {
        var b = C.nb[+t.getAttribute("data-i")]; if (!b) return;
        b[x] = x === "name" ? t.value : parseNum(t.value); if (x === "h") b.est = false;
        clearTimeout(saveT); saveT = setTimeout(save, 200); if (C.placed) placeVerdict(); if (window.update3Dc) window.update3Dc(); paintPrompts(); if (C.climDone) renderClim(); return;
      }
    });
    document.addEventListener("change", function (e) {
      var t = e.target; if (!t.matches) return;
      if (t.matches("[data-nb='dir']")) { var b = C.nb[+t.getAttribute("data-i")]; if (b) { b.dir = +t.value; save(); if (window.update3Dc) window.update3Dc(); if (C.climDone) renderClim(); } }
      if (t.matches("[data-pup]") && t.files && t.files[0]) {
        var f = t.files[0], k = t.getAttribute("data-pup"), rec = { name: f.name, size: f.size, type: f.type, file: f, ts: Date.now() };
        APP.docs()[k] = rec; APP.docPut(k, rec); renderPhotos(); renderCard(); APP.refresh();
      }
      if (t.matches("[data-mood]") && t.files && t.files.length) {
        var have = Object.keys(docsFor(DK("mood:"))).length, files = Array.prototype.slice.call(t.files, 0, Math.max(0, 10 - have));
        files.forEach(function (f, i) { var k = DK("mood:") + (Date.now() + i), rec = { name: f.name, size: f.size, type: f.type, file: f, ts: Date.now() }; APP.docs()[k] = rec; APP.docPut(k, rec); });
        renderMood(); updatePalette();
      }
    });
    /* הקלטה בעברית, כשהדפדפן תומך */
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, btn = $("#cRec");
    if (SR) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        if (rec) { rec.stop(); return; }
        rec = new SR(); rec.lang = "he-IL"; rec.interimResults = false; rec.continuous = true; btn.textContent = "עצירה"; btn.classList.add("on");
        rec.onresult = function (ev) { var txt = ""; for (var i = ev.resultIndex; i < ev.results.length; i++) txt += ev.results[i][0].transcript; var box = $("#cIntentText"); box.value = (box.value ? box.value + " " : "") + txt.trim(); C.intentText = box.value; save(); paintPrompts(); };
        rec.onend = rec.onerror = function () { rec = null; btn.textContent = "הקלטה"; btn.classList.remove("on"); };
        try { rec.start(); } catch (err) { rec = null; btn.textContent = "הקלטה"; btn.classList.remove("on"); }
      });
    }
  }
  function updatePalette() {
    var d = docsFor(DK("mood:")), files = Object.keys(d).map(function (k) { return d[k].file; }).filter(Boolean);
    palette(files).then(function (p) { C.palette = p; save(); if (C.intent) { C.intent.palette = p; renderIntent(); } });
  }
  paintCModeEarly();
  function paintCModeEarly() { document.body.setAttribute("data-cmode", CMODE); }
  document.addEventListener("DOMContentLoaded", function () { wire(); paintCMode(); sync(); syncOut(); setTimeout(function () { sync(); if (!window.update3Dc) { var n = $("#noThreeC"); if (n) n.hidden = false; } }, 1500); });
  window.SESSIONC = { state: function () { return C; }, mode: function () { return CMODE; }, sunAt: sunAt, buildIFC: buildIFC, feasChecks: feasChecks, facadeHours: facadeHours, nbShadow: nbShadow, translate: translateIntent };
})();
