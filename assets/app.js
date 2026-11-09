/* בינה מלאכותית לאדריכלים: ניווט, סרגל השלבים, פרומפטים, כלי המגרש ומפגש ב. */
(function () {
  "use strict";

  var LS = "mifgasshim1:";
  function load(k, d) { try { var v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) { /* בלי שמירה מקומית הדף עובד כרגיל */ } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n, d) { return Number(n).toLocaleString("he-IL", { maximumFractionDigits: d === undefined ? 1 : d }); }
  function has(v) { return v !== null && v !== undefined && v !== "" && !(typeof v === "number" && isNaN(v)); }

  /* ---------- העתקה, גם בלי HTTPS ---------- */
  function copy(text, toast) {
    function done(ok) {
      if (!toast) return;
      toast.textContent = ok ? "הועתק" : "ההעתקה נחסמה";
      setTimeout(function () { toast.textContent = ""; }, 1800);
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove(); done(ok);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    else fallback();
  }

  /* ---------- תוכן: פרומפטים של מפגש א ---------- */
  var PROMPTS = {
    p1h: 'אתה מנתח תב"ע ישראלית. קלט: כל מסמכי התכנית שהועלו (הוראות, תשריט, טבלת זכויות, נספחים) ומספר המגרש או תא השטח.\n1. אתר ופענח את המגרש בטבלת הזכויות ובתשריט. אם הם לא מסכימים, עצור והצג את הסתירה.\n2. חלץ לכל מגרש: שטח מגרש; תכסית מרבית; אחוזי בנייה מרביים (ציין אם מוגדרים כשטח כולל או מפוצלים לעיקרי ושירות, לפי תקנות חישוב השטחים, התשנ"ב-1992); מספר קומות מרבי מעל ומתחת לקרקע; גובה מרבי והגדרתו; קווי בניין קדמי, צדדי ואחורי; מספר יח"ד מרבי וצפיפות; שימושים מותרים; דרישות חניה.\n3. לכל ערך החזר: ערך, יחידה, מקור (מסמך, עמוד, סעיף או תא), ורמת ודאות: מלאה, חלקית או חסרה.\n4. בצע בדיקות עקביות: רכיבי השטח מסתכמים לסה"כ; אחוזי הבנייה תואמים לשטחים; שטח השייפ תואם לשטח הטבלה בסטייה עד 0.5%.\n5. אל תנחש ערך חסר. סמן "לא נמצא" ורשום איזה מסמך לבדוק.\n6. הפלט: טבלה אחת, וממצאי עקביות בסוף.',
    p1e: 'You are an analyst of Israeli detailed plans (TABA). Input: all uploaded plan documents (ordinances, zoning map, rights table, appendices) and the plot or sub-plot number.\n1. Locate the plot in the rights table and on the map. If they disagree, stop and show the conflict.\n2. Extract and decode, for this plot: plot area; maximum coverage; maximum building rights (state whether expressed as total area or split into main and service areas under the 1992 area-calculation regulations); maximum floors above and below ground; maximum height and its definition; front, side and rear setbacks; maximum dwelling units and density; permitted uses; parking requirements.\n3. For each value return: value, unit, source (document, page, section or table cell), and confidence (full, partial or missing).\n4. Run consistency checks: components sum to the total; percentages match the areas; plot shape area matches the table area within 0.5%.\n5. Never guess a missing value. Mark it "not found" and name the document to check.\n6. Output one table, followed by the consistency findings.',
    pjson: 'בסיום, החזר גם בלוק JSON אחד, בלי טקסט נוסף בתוכו, במבנה הזה:\n{"plot": שטח המגרש במ"ר, "cov": תכסית מרבית באחוזים, "bp": אחוזי בנייה מרביים, "floors": קומות מרבי מעל הקרקע, "h": גובה מרבי במטרים, "units": יח"ד מרבי, "sf": קו בניין קדמי במטרים, "ss": קו בניין צדדי, "sr": קו בניין אחורי, "parking": "דרישת החניה כטקסט", "sources": {"plot": "מסמך, עמוד, סעיף", "cov": "..."}}\nערך שלא נמצא במסמכים: null. אל תנחש.',
    p2h: "בנה מודל מסה תלת-ממדי מתוך הזכויות שחולצו בשלב 1 בלבד. קלט: גבולות המגרש, קווי הבניין, התכסית המרבית, מספר הקומות, הגובה המרבי, ושלוש חלופות שמוגדרות לפי שטח קומה ומספר קומות.\n1. בנה את חלופות א', ב' ו-ג' כנפחים שנשארים בתוך אזור הבנייה המותר, ומפה כל אחת מהן מול קווי הבניין.\n2. הצג שלוש תצוגות: איזומטרית, תוכנית על וחזית. במודל התלת-ממדי אפשר לסובב, להזיז ולזום בעכבר.\n3. רמת פירוט בינונית: רצפות, רצועות חלונות, גג וקו מגרש מסומן.\n4. לכל חלופה חשב: תכסית באחוזים, אחוזי בנייה, מספר קומות, גובה ושטח כולל. גובה קומה 3.2 מ', אלא אם המסמכים קובעים אחרת.\n5. חשוף כל חריגה מקו בניין או מתכסית, וסמן אותה באדום עם המספר המדויק.\n6. כל המספרים נפתחים בפאנלים מתקפלים, כדי שהמסך לא יהיה צפוף.",
    p2e: "Build a 3D massing model from the rights extracted in stage 1 only. Inputs: plot boundary, setbacks, maximum coverage, floors, maximum height, and three alternatives defined by footprint area and floor count.\n1. Build alternatives A, B and C as extruded footprints, and map each one against the permitted building zone.\n2. Show isometric, plan and elevation views. The 3D view supports orbit, pan and zoom with the mouse (three.js OrbitControls).\n3. Medium detail: slabs, window bands, roof, and a marked plot boundary.\n4. For each alternative calculate coverage %, building rights %, floors, height and gross area. Floor-to-floor height is 3.2 m unless the documents state otherwise.\n5. Expose any setback or coverage breach, and mark it in red with the exact figure.\n6. Place all numbers in collapsible panels so the screen stays uncluttered.",
    p3h: 'בחן כל חלופה לאורך שני צירים.\nציר תב"ע ועירייה: כל פרמטר מהשלב הראשון מול החלופה. ירוק: עומד בתנאי עם מרווח של לפחות 5%. צהוב: עומד בתנאי עם מרווח קטן מ-5%. אדום: חורג.\nציר יזם: שטח נטו למכירה מתוך השטח הכולל (ברירת מחדל 80%, ניתן לשינוי); מספר יח"ד מול יעד היזם (שדה קלט); שטח יח"ד ממוצע (ברירת מחדל 90 מ"ר); ניצול זכויות מתוך המותר. ניצול מעל 90% ירוק, בין 75% ל-90% צהוב, מתחת ל-75% אדום.\nחשב אחוזי התאמה: ירוק = 1, צהוב = 0.5, אדום = 0, ממוצע על כל הבדיקות כפול 100.\nלכל חלופה: טבלה, אחוזי התאמה, יתרון אחד, חיסרון אחד, ומה לבדוק מול הרשות. אם נתון מהשלב הראשון חסר, זקק את הפער וסמן אותו, ואל תשלים אותו.',
    p3e: "Examine each alternative on two axes.\nPlanning axis: each parameter from stage 1 against the alternative. Green: meets the limit with at least 5% margin. Yellow: meets the limit with less than 5% margin. Red: exceeds the limit.\nDeveloper axis: net sellable share of gross area (default 80%, editable); unit count against the developer target (input field); average unit size (default 90 sqm, editable); rights utilization as a share of permitted rights: green above 90%, yellow 75% to 90%, red below 75%.\nFit score: green = 1, yellow = 0.5, red = 0, averaged over all checks, times 100.\nFor each alternative show the table, the score, one advantage, one disadvantage, and what to verify with the planning authority. Distill the gap if a stage 1 value is missing, and do not fill it in.",
    p4h: "סנתז דוח השוואה בין החלופות. מבנה הדוח:\n1. מסקנה: החלופה המומלצת בשלושה משפטים.\n2. טבלת השוואה: פרמטר, חלופה א', ב', ג', סטטוס.\n3. יתרונות וחסרונות לכל חלופה.\n4. המלצה, וההנחות שעליה היא נשענת. חשוף במפורש כל הנחה שלא הגיעה ממסמך.\n5. מקור לכל מספר.\nכתוב בעברית תקינה ורציפה, בלי הקדמות. אל תציג מסקנה בלי לציין את הנתונים שעליה היא נשענת.",
    p4e: "Synthesize a comparison report for the alternatives. Structure: 1. Conclusion: the recommended alternative in three sentences. 2. Comparison table: parameter, A, B, C, status. 3. Advantages and disadvantages per alternative. 4. Recommendation and the assumptions behind it; expose every assumption not taken from a document. 5. Source for every number. Write plainly, with no preamble. Do not present a conclusion without naming the data it rests on."
  };

  /* ---------- תוכן: מפגש ב ---------- */
  var NODES = [
    { id: "n1", g: "learn", t: "מה הכלי מחזיק", lead: "חמש ישויות ושדות החובה של כל אחת: פרויקט, איש מקצוע, עלות, שלב ביצוע ותקציב.",
      works: "רשומת פרויקט אחת עם שם, מזמין, סטטוס ותקציב.",
      ask: "איזה שדות חסרים בכל רשומת פרויקט כדי שאדע את מצבו בלי לפתוח אותו?",
      prompt: "אני מנהל משרד אדריכלות. עזור לי לפרק את המשרד לחמש ישויות, ולכל ישות הצע שדות חובה בלבד, בטבלה קצרה." },
    { id: "n2", g: "learn", t: "שלבים ועלויות", lead: "שלבי הפרויקט במשרד (תכנון, היתר, ליווי ביצוע, סגירה) וסוגי העלות הפנימיות: שעות צוות, יועצים, הוצאות ישירות.",
      works: "עץ של פרויקט אחד עם ארבעה שלבים ורשימת עלויות מסווגת.",
      ask: "אילו שלבים קבועים בכל פרויקט, ואילו משתנים לפי סוג הפרויקט?",
      prompt: "הצע רשימת שלבי עבודה טיפוסית של משרד אדריכלות לפרויקט מסוג [סוג פרויקט], ולכל שלב שלוש עלויות פנימיות אופייניות." },
    { id: "n3", g: "understand", t: "הקשרים בין הישויות", lead: "כל שלב שייך לפרויקט, כל עלות משויכת לשלב ולאיש מקצוע, והתקציב הוא המסגרת שמעל הכול.",
      works: "עלות אחת מקושרת לשלב אחד ולאיש מקצוע אחד, וסכומה מופיע בתקציב הפרויקט.",
      ask: "מה קורה לתקציב הפרויקט כשעלות נרשמת בלי שלב?",
      prompt: "הסבר בשפה פשוטה איך פרויקט, שלבים, אנשי מקצוע, עלויות ותקציב מקושרים זה לזה. הדגם עם פרויקט בן שלושה שלבים." },
    { id: "n4", g: "understand", t: "סטיות ורמזור", lead: "מתי תקציב או לוח זמנים הופכים לסיכון: ירוק עד 80 אחוז, צהוב מעל 80 בשלב פתוח, אדום מעל 100.",
      works: "ניצול תקציב מעל 80 אחוז לפני סיום שלב מסומן צהוב.",
      ask: "מאיזה סף סטיית תקציב דורשת החלטה של מנהל המשרד ולא רק הערה?",
      prompt: "הצע שלושה ספי סטייה לתקציב ולוח זמנים של פרויקט במשרד אדריכלות (ירוק, צהוב, אדום). לכל סף פעולה מומלצת אחת." },
    { id: "n5", g: "do", t: "בניית הכלי", lead: "להזין פרויקט אחד במלואו: שלבים, אנשי מקצוע, עלויות ותקציב המשרד. אפשר פרויקט משלך או פרויקט הדוגמה שמשמאל.",
      works: "הפרויקט מוזן, והמספרים מתיישבים עם הכסף בפועל.",
      ask: "אילו שלושה נתונים חסרים לי כדי לסגור את התקציב של הפרויקט הזה?",
      prompt: "בנה טבלה אחת לפרויקט שלי עם העמודות: שלב, איש מקצוע, תקציב מתוכנן, עלות בפועל, סטטוס. אחרי שאמלא, סכם לי את הסטייה הכוללת." },
    { id: "n6", g: "do", t: "סקירה שבועית", lead: "עמוד אחד שמציג לכל הפרויקטים סטטוס, סטייה ופעולה הבאה.",
      works: "עמוד אחד שמציג לכל פרויקט סטטוס, סטייה והפעולה הבאה.",
      ask: "איזה מידע בעמוד השבועי משנה החלטה, ואיזה רק מוסיף רעש?",
      prompt: "צור עמוד סקירה שבועית לכל הפרויקטים. לכל פרויקט שלושה שדות בלבד: סטטוס, סטייה מתקציב, הפעולה הבאה." }
  ];
  var EXAMPLE = [
    { n: "תכנון", b: 90000, a: 98000, st: "r", note: "חריגה" },
    { n: "היתר", b: 30000, a: 30000, st: "g", note: "נסגר בתקציב" },
    { n: "ליווי ביצוע", b: 50000, a: 36000, st: "g", note: "בתהליך" },
    { n: "סגירה ומסירה", b: 10000, a: 0, st: "", note: "לא התחיל" }
  ];

  var APPS = [
    { group: "פרטי והשראה", items: [
      { n: "נקודות מבט", level: "פשוטה", d: "סדרת כלים לתהליכי התפתחות ושינוי.", gh: "https://github.com/Anat1969/PointOfView" },
      { n: "שלוש טבעות: פלייסמייקינג אשדוד", level: "בינונית", d: "אטלס של מסלולים, סיפורים ומרחבי שהייה, נמדדים ביצר, רגש ושכל.", url: "https://placemaking-ashdod.vercel.app", gh: "https://github.com/Anat1969/PlaceMaking-GH" },
      { n: "moment", level: "מורכבת", d: "תיאור טרם נכתב.", gh: "https://github.com/Anat1969/moment" }
    ] },
    { group: "מקצועי", items: [
      { n: "ארכיטייפ: DNA תרבותי", level: "פשוטה", d: "מסע אל עולמות התרבות וההיסטוריה.", url: "https://architaip.vercel.app", gh: "https://github.com/Anat1969/ARCHITAIP-GH" },
      { n: "מד הפרופורציות", level: "בינונית", d: "מכשיר מדידה לקומפוזיציה, מול חמש שיטות פרופורציה.", url: "https://propotions-gh.vercel.app", gh: "https://github.com/Anat1969/Propotions-GH" },
      { n: "דשבורד עסקים", level: "מורכבת", d: "דשבורד נתוני עסקים באשדוד.", url: "https://deshbord-gh.vercel.app", gh: "https://github.com/Anat1969/DESHBORD-GH" }
    ] }
  ];

  var PAGES = { guide: "כללי", a: 'מפגש א: מבחן התב"ע', b: "מפגש ב: ניהול הסטודיו" };
  var GROUPS = { open: ["פתיחה", ""], learn: ["נלמד", "ידע"], understand: ["נבין", "הבנה"], do: ["נעשה", "יישום"] };
  var GROUP_ORDER = ["open", "learn", "understand", "do"];

  /* ---------- בניית הדפים שנגזרים מנתונים ---------- */
  function buildB() {
    var html = NODES.map(function (n, i) {
      return '<section class="view" data-page="b" data-group="' + n.g + '" data-id="' + n.id + '" data-title="' + esc(n.t) + '" hidden>' +
        "<h1>" + esc(n.t) + "</h1>" +
        '<p class="lead">' + esc(n.lead) + "</p>" + track(i) +
        '<div class="prompt" data-open data-label="פרומפט לתחנה ' + (i + 1) + '"><pre>' + esc(n.prompt) + "</pre></div>" +
        '<div class="out2"><div><span>יוצאים עם דבר אחד שעובד</span><p>' + esc(n.works) + "</p></div><div><span>ושאלה אחת לבינה</span><p>" + esc(n.ask) + "</p></div></div>" +
        "</section>";
    }).join("");
    html += '<section class="view" data-page="b" data-group="do" data-id="materials" data-title="חומרים ל-MVP" hidden>' +
      "<h1>שלושה פרומפטים בונים את הגרסה הראשונה של הכלי.</h1>" +
      '<p class="lead">אחד לכל שלב. פרויקט הדוגמה שמשמאל משמש כנתוני הבדיקה.</p>' +
      '<table class="t"><thead><tr><th>שלב</th><th>הפרומפט</th><th>מצב</th></tr></thead><tbody>' +
      "<tr><td>נלמד</td><td>מודל הנתונים והמסכים</td><td class=\"muted\">הנוסח טרם התקבל</td></tr>" +
      "<tr><td>נבין</td><td>הקשרים, חישובים וכללים</td><td class=\"muted\">הנוסח טרם התקבל</td></tr>" +
      "<tr><td>נעשה</td><td>בניית ה-MVP המלא</td><td class=\"muted\">הנוסח טרם התקבל</td></tr>" +
      "</tbody></table>" +
      '<div class="warn">במסמך המקור מופיעות רק הכותרות של שלושת הפרומפטים. כפתורי ההעתקה יתווספו כשיתקבל הנוסח.</div>' +
      "</section>";
    $("#viewsB").innerHTML = html;

    var total = { b: 0, a: 0 };
    var rows = EXAMPLE.map(function (r) {
      total.b += r.b; total.a += r.a;
      var pct = r.b ? Math.round(r.a / r.b * 100) : 0;
      return barRow(r.n, r.a, r.b, pct, r.st, r.note, "");
    }).join("");
    var tp = Math.round(total.a / total.b * 100);
    rows += barRow('סה"כ', total.a, total.b, tp, "", "", " bar-total");
    rows += '<div class="legend"><span>הקו הדק: 80% מהתקציב</span><span>הקו הכהה: 100% מהתקציב</span></div>' +
      '<div class="legend"><span><i class="dot g"></i>בתקציב</span><span><i class="dot y"></i>מעל 80% בשלב פתוח</span><span><i class="dot r"></i>מעל 100%</span></div>';
    $("#bars").innerHTML = rows;
  }
  function track(cur) {
    return '<nav class="track" aria-label="מסלול המפגש">' + NODES.map(function (n, i) {
      return '<a href="#b/' + n.id + '"' + (i === cur ? ' class="on" aria-current="step"' : "") + "><span>" + (i + 1) + " · " + GROUPS[n.g][0] + "</span>" + esc(n.t) + "</a>";
    }).join("") + "</nav>";
  }
  function barRow(n, a, b, pct, st, note, cls) {
    var w = Math.min(pct, 120) / 120 * 100;
    return '<div class="bar-row' + cls + '"><div class="bar-top"><b>' + esc(n) + "</b><span>" +
      (st ? '<i class="dot ' + st + '"></i>' : "") + esc(note) + '</span></div>' +
      '<div class="bar"><i class="' + st + '" style="width:' + w.toFixed(1) + '%"></i></div>' +
      '<div class="bar-nums"><span class="num">' + fmt(a, 0) + " מתוך " + fmt(b, 0) + ' ש"ח</span><span class="num">' + pct + "%</span></div></div>";
  }

  function buildApps() {
    $("#appsList").innerHTML = APPS.map(function (g) {
      return "<div><h2>" + esc(g.group) + "</h2>" + g.items.map(function (a) {
        return '<div class="app-row"><div><b>' + esc(a.n) + '</b> <span class="tiny">· ' + esc(a.level) + '</span><div class="small muted">' + esc(a.d) + "</div></div>" +
          '<div class="links">' +
          (a.url ? '<a class="btn small dark" href="' + a.url + '" target="_blank" rel="noopener">פתיחה</a>' : "") +
          '<a class="btn small" href="' + a.gh + '" target="_blank" rel="noopener">קוד</a></div></div>';
      }).join("") + "</div>";
    }).join("");
  }

  /* ---------- פרומפט: הצגה, הסתרה, העתקה ---------- */
  function initPrompts() {
    $$(".prompt").forEach(function (box) {
      var he = box.getAttribute("data-he"), en = box.getAttribute("data-en");
      var pre = $("pre", box);
      if (!pre) { pre = document.createElement("pre"); pre.textContent = PROMPTS[he] || ""; }
      var open = box.hasAttribute("data-open");
      pre.hidden = !open;
      pre.setAttribute("dir", "rtl");
      var bar = document.createElement("div");
      bar.className = "prompt-bar";
      bar.innerHTML = '<span class="lbl">' + esc(box.getAttribute("data-label") || "פרומפט") + "</span>" +
        '<span class="toast" aria-live="polite"></span>' +
        '<button class="btn small" type="button" data-act="toggle">' + (open ? "הסתר" : "הצג") + "</button>" +
        '<button class="btn small dark" type="button" data-act="he">העתק</button>' +
        (en ? '<button class="btn small" type="button" data-act="en">העתק באנגלית</button>' : "");
      box.innerHTML = "";
      box.appendChild(bar);
      box.appendChild(pre);
      bar.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        var act = b.getAttribute("data-act"), toast = $(".toast", bar);
        if (act === "toggle") { pre.hidden = !pre.hidden; b.textContent = pre.hidden ? "הצג" : "הסתר"; }
        if (act === "he") copy(pre.textContent, toast);
        if (act === "en") copy(PROMPTS[en], toast);
      });
    });
  }

  /* ---------- ניווט: שלושה דפים, סרגל שלבים, הקודם והבא ---------- */
  var views = [], current = null;
  var done = load("done", []);
  var last = load("last", {});

  function collectViews() {
    views = $$(".view").map(function (el) {
      return { el: el, page: el.getAttribute("data-page"), group: el.getAttribute("data-group"), id: el.getAttribute("data-id"), title: el.getAttribute("data-title") };
    });
  }
  function key(v) { return v.page + "/" + v.id; }
  function pageViews(p) { return views.filter(function (v) { return v.page === p; }); }
  function find(p, id) { return views.filter(function (v) { return v.page === p && v.id === id; })[0]; }

  function buildRail(page) {
    var list = pageViews(page), html = "", step = 0;
    GROUP_ORDER.forEach(function (g) {
      var items = list.filter(function (v) { return v.group === g; });
      if (!items.length) return;
      if (g !== "open") step++;
      html += '<div class="rail-group">' +
        (g === "open" ? "" : '<div class="rail-head"><b>' + GROUPS[g][0] + "</b><span>" + step + " · " + GROUPS[g][1] + "</span></div>") +
        items.map(function (v) {
          return '<a href="#' + key(v) + '" data-key="' + key(v) + '"><i class="tick"></i><span>' + esc(v.title) + "</span></a>";
        }).join("") + "</div>";
    });
    html += '<div class="rail-foot">נקודה מלאה: תחנה שסומנה כנלמדה. הסימון נשמר בדפדפן הזה בלבד.</div>';
    $("#rail").innerHTML = html;
  }
  function paintRail() {
    $$("#rail a").forEach(function (a) {
      var k = a.getAttribute("data-key");
      a.classList.toggle("on", !!current && key(current) === k);
      a.classList.toggle("done", done.indexOf(k) !== -1);
      if (current && key(current) === k) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var act = $("#rail a.on");
    if (act && window.matchMedia("(max-width: 900px)").matches) { var rl = $("#rail"); rl.scrollLeft = act.offsetLeft - rl.clientWidth / 2 + act.offsetWidth / 2; }
    var isDone = current && done.indexOf(key(current)) !== -1;
    var mark = $("#mark");
    mark.textContent = isDone ? "נלמד. בטל" : "סמן כנלמד";
    mark.classList.toggle("on", !!isDone);
    $("#progress").textContent = done.length + " מתוך " + views.length + " נלמדו";
  }

  function show(v) {
    var pageChanged = !current || current.page !== v.page;
    current = v;
    document.body.setAttribute("data-page", v.page);
    views.forEach(function (x) { x.el.hidden = x !== v; });
    if (pageChanged) buildRail(v.page);
    $$(".tabs a").forEach(function (a) {
      var on = a.getAttribute("data-tab") === v.page;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var list = pageViews(v.page), i = list.indexOf(v);
    $("#kicker").textContent = PAGES[v.page] + (v.group === "open" ? "" : " · " + GROUPS[v.group][0] + " · " + GROUPS[v.group][1]);
    $("#where").textContent = (i + 1) + " מתוך " + list.length;
    $("#prev").disabled = i === 0;
    $("#next").disabled = i === list.length - 1;
    paintRail();
    last[v.page] = v.id; save("last", last);
    $("#pane").scrollTop = 0;
    if (pageChanged) window.scrollTo(0, 0);
    document.title = v.title + " · בינה מלאכותית לאדריכלים";
    if (v.page === "a") refreshA();
  }

  function route() {
    var h = decodeURIComponent((location.hash || "").slice(1)).split("/");
    var page = PAGES[h[0]] ? h[0] : (current ? current.page : "guide");
    var v = (h[1] && find(page, h[1])) || (last[page] && h.length < 2 && find(page, last[page])) || pageViews(page)[0];
    show(v);
  }
  function step(d) {
    var list = pageViews(current.page), i = list.indexOf(current) + d;
    if (list[i]) location.hash = key(list[i]);
  }

  function buildMap() {
    var html = '<div class="mh"></div>';
    ["learn", "understand", "do"].forEach(function (g, i) {
      html += '<div class="mh"><b>' + GROUPS[g][0] + "</b>" + (i + 1) + " · " + GROUPS[g][1] + "</div>";
    });
    var sub = { guide: "מידע, תובנות ותבניות", a: "מזכויות בנייה למודל ולבדיקה", b: "מהנתון לשליטה במשרד" };
    Object.keys(PAGES).forEach(function (p) {
      html += '<div class="mr">' + PAGES[p].split(":")[0] + "<small>" + sub[p] + "</small></div>";
      ["learn", "understand", "do"].forEach(function (g) {
        html += '<div data-g="' + GROUPS[g][0] + '">' + views.filter(function (v) { return v.page === p && v.group === g; }).map(function (v) {
          var h1 = $("h1", v.el), lead = $(".lead", v.el);
          var d = p === "b" && lead ? lead.textContent : (h1 ? h1.textContent : "");
          return '<a href="#' + key(v) + '">' + esc(v.title) + (d && d !== v.title ? "<small>" + esc(d) + "</small>" : "") + "</a>";
        }).join("") + "</div>";
      });
    });
    $("#courseMap").innerHTML = html;
  }

  /* ---------- לשוניות בתוך שלב: הכלי, ההסבר, הפרומפט ---------- */
  function initSubtabs() {
    $$("[data-subtabs]").forEach(function (bar) {
      var view = bar.closest(".view");
      bar.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-sub]"); if (!b) return;
        var name = b.getAttribute("data-sub");
        $$("button", bar).forEach(function (x) { x.classList.toggle("on", x === b); });
        $$("[data-subview]", view).forEach(function (s) { s.hidden = s.getAttribute("data-subview") !== name; });
      });
    });
  }

  /* =====================================================================
     מפגש א: מגרש, מסמכים, פרמטרים, חלופות ובדיקת התאמה
     ===================================================================== */
  var PARAMS = [
    { k: "plot", n: "שטח מגרש", u: 'מ"ר' },
    { k: "cov", n: "תכסית מרבית", u: "%" },
    { k: "bp", n: "אחוזי בנייה", u: "%" },
    { k: "floors", n: "קומות מרבי", u: "" },
    { k: "h", n: "גובה מרבי", u: "מ'" },
    { k: "sf", n: "קו בניין קדמי", u: "מ'" },
    { k: "ss", n: "קו בניין צדדי", u: "מ'" },
    { k: "sr", n: "קו בניין אחורי", u: "מ'" },
    { k: "units", n: 'יח"ד מרבי', u: "" },
    { k: "parking", n: "חניה", u: "", text: true }
  ];
  var DEMO = {
    "633": { plot: 2000, cov: 35, bp: 250, floors: 8, h: 28, sf: 5, ss: 4, sr: 4, units: 40, parking: "" },
    "634": { plot: 1500, cov: 40, bp: 200, floors: 6, h: 22, sf: 5, ss: 3, sr: 4, units: 28, parking: "" },
    "635": { plot: 3200, cov: 30, bp: 300, floors: 12, h: 42, sf: 6, ss: 5, sr: 5, units: 80, parking: "" }
  };
  var DEV = [
    { k: "target", n: 'יעד יח"ד', d: 32 },
    { k: "sell", n: "נטו למכירה %", d: 80 },
    { k: "avg", n: 'יח"ד ממוצעת מ"ר', d: 90 },
    { k: "fl", n: "גובה קומה מ'", d: 3.2 }
  ];
  var ALT_KEYS = ["א", "ב", "ג"];
  var DOCS = [
    { id: "rules", n: "הוראות התכנית", req: true },
    { id: "map", n: "תשריט", req: true },
    { id: "table", n: "טבלת זכויות", req: true },
    { id: "cells", n: "דוח תאי שטח", req: true },
    { id: "layer", n: "שכבת מגרש", hint: "SHP / DXF", req: true },
    { id: "annex", n: "נספחים", hint: "מים, ביוב, תנועה", req: false }
  ];

  var A = load("a", { plot: "633", alt: "א", mode: "iso", data: {} });
  function r10(n) { return Math.max(10, Math.round(n / 10) * 10); }
  function defaultAlts(R) {
    var max = (R.plot || 1000) * (R.cov || 30) / 100, f = R.floors || 6;
    return { "א": { fp: r10(max * 0.93), fl: Math.max(1, f - 2) }, "ב": { fp: r10(max * 0.857), fl: f }, "ג": { fp: r10(max), fl: Math.max(1, f - 1) } };
  }
  function defaultDev(R) {
    var d = {}; DEV.forEach(function (x) { d[x.k] = x.d; });
    d.target = Math.round((R.units || 40) * 0.8);
    return d;
  }
  function plotData(id) {
    if (!A.data[id]) {
      var R = JSON.parse(JSON.stringify(DEMO[id]));
      A.data[id] = { R: R, src: {}, alts: defaultAlts(R), dev: defaultDev(R) };
    }
    return A.data[id];
  }
  function P() { return plotData(A.plot); }
  var savedTimer = null;
  function saveA() {
    save("a", A);
    var s = $("#savedA"); if (s) { s.textContent = "נשמר"; clearTimeout(savedTimer); savedTimer = setTimeout(function () { s.textContent = ""; }, 1500); }
    var m = $("ai-menu"); if (m) { try { m.status = "נשמר"; } catch (e) { /* הרכיב עוד לא נטען */ } }
  }

  function calc(a) {
    var p = P(), R = p.R, d = p.dev;
    var gross = a.fp * a.fl;
    return {
      gross: gross,
      cov: has(R.plot) ? a.fp / R.plot * 100 : NaN,
      bp: has(R.plot) ? gross / R.plot * 100 : NaN,
      h: a.fl * d.fl,
      units: Math.floor(gross * (d.sell / 100) / d.avg),
      use: has(R.plot) && has(R.bp) ? (gross / R.plot * 100) / R.bp * 100 : NaN
    };
  }
  function geom(a) {
    var p = P(), R = p.R;
    var side = Math.sqrt(has(R.plot) ? R.plot : 1000), w = Math.sqrt(a.fp * 1.4), d = a.fp / w;
    return { P: side, w: w, d: d, H: a.fl * p.dev.fl, ox: (side - w) / 2, oy: (side - d) / 2 };
  }
  function stMax(v, m) { if (!has(m) || !has(v)) return "n"; return v > m ? "r" : (v >= m * 0.95 ? "y" : "g"); }
  function stMin(v, m) { if (!has(m)) return "n"; return v < m ? "r" : (v < m * 1.05 ? "y" : "g"); }
  function noteMax(v, m, u) {
    if (!has(m)) return "לא נבדק: הערך חסר";
    if (v > m) return "חורג ב-" + fmt(v - m) + u;
    if (v >= m * 0.95) return "עומד, מרווח קטן מ-5%";
    return "עומד";
  }
  function checks(a) {
    var p = P(), R = p.R, d = p.dev, c = calc(a), g = geom(a), out = [];
    function lim(v, pre, u) { return has(v) ? pre + fmt(v) + u : "חסר"; }
    out.push({ n: "תכסית מרבית", lim: lim(R.cov, "עד ", "%"), val: fmt(c.cov) + "%", st: stMax(c.cov, R.cov), note: noteMax(c.cov, R.cov, "%") });
    out.push({ n: "אחוזי בנייה", lim: lim(R.bp, "עד ", "%"), val: fmt(c.bp, 0) + "%", st: stMax(c.bp, R.bp), note: noteMax(c.bp, R.bp, "%") });
    out.push({ n: "מספר קומות", lim: lim(R.floors, "עד ", ""), val: String(a.fl), st: stMax(a.fl, R.floors), note: noteMax(a.fl, R.floors, " קומות") });
    out.push({ n: "גובה מרבי", lim: lim(R.h, "עד ", " מ'"), val: fmt(c.h) + " מ'", st: stMax(c.h, R.h), note: noteMax(c.h, R.h, " מ'") });
    var sb = has(R.ss) && has(R.sr) && has(R.sf);
    var inside = sb && g.ox >= R.ss - 1e-9 && g.ox + g.w <= g.P - R.ss + 1e-9 && g.oy >= R.sr - 1e-9 && g.oy + g.d <= g.P - R.sf + 1e-9;
    out.push({ n: "קווי בניין", lim: sb ? "קדמי " + R.sf + ", צד " + R.ss + ", אחורי " + R.sr : "חסר", val: !sb ? "חסר" : (inside ? "בפנים" : "חורג"), dims: fmt(g.w) + " × " + fmt(g.d) + " מ'", st: !sb ? "n" : (inside ? "g" : "r"), note: !sb ? "לא נבדק: הערך חסר" : (inside ? "המסה בתוך אזור הבנייה" : "המסה חורגת מקו הבניין") });
    out.push({ n: 'יח"ד מרבי', lim: lim(R.units, "עד ", ""), val: String(c.units), st: stMax(c.units, R.units), note: noteMax(c.units, R.units, ' יח"ד') });
    out.push({ n: 'יח"ד מול יעד', lim: "לפחות " + d.target, val: String(c.units), st: stMin(c.units, d.target), note: c.units < d.target ? "מתחת ליעד" : "עומד ביעד" });
    out.push({ n: "ניצול זכויות", lim: "מעל 90%", val: has(c.use) ? fmt(c.use, 0) + "%" : "חסר", st: !has(c.use) ? "n" : (c.use >= 90 ? "g" : (c.use >= 75 ? "y" : "r")), note: !has(c.use) ? "לא נבדק" : (c.use < 75 ? "מתחת ל-75%" : (c.use < 90 ? "בין 75% ל-90%" : "עומד")) });
    out.push({ n: "חניה", lim: 'לפי התב"ע', val: has(R.parking) ? "ידני" : "חסר", st: "n", note: has(R.parking) ? "לבדיקה ידנית: " + R.parking : "לא נבדק: הדרישה חסרה במסמכים" });
    return out;
  }
  function score(ch) {
    var s = ch.filter(function (x) { return x.st !== "n"; });
    if (!s.length) return 0;
    return Math.round(s.reduce(function (t, x) { return t + (x.st === "g" ? 1 : x.st === "y" ? 0.5 : 0); }, 0) / s.length * 100);
  }
  function summary() {
    var p = P(), best = null, all = {};
    ALT_KEYS.forEach(function (k) {
      var ch = checks(p.alts[k]), s = score(ch), reds = ch.filter(function (x) { return x.st === "r"; });
      all[k] = { ch: ch, s: s, reds: reds };
      if (!best || reds.length < all[best].reds.length || (reds.length === all[best].reds.length && s > all[best].s)) best = k;
    });
    return { all: all, best: best };
  }

  /* מסמכים: נשמרים ב-IndexedDB של הדפדפן */
  var idb = null, mem = {}, docsCache = {};
  function db() {
    return new Promise(function (res) {
      if (idb) return res(idb);
      try {
        var rq = indexedDB.open("mifgasshim1", 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore("docs"); };
        rq.onsuccess = function () { idb = rq.result; res(idb); };
        rq.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function docPut(k, v) {
    mem[k] = v;
    return db().then(function (d) {
      if (!d) return;
      return new Promise(function (res) {
        try { var tx = d.transaction("docs", "readwrite"); tx.objectStore("docs").put(v, k); tx.oncomplete = res; tx.onerror = res; tx.onabort = res; } catch (e) { res(); }
      });
    });
  }
  function docDel(k) {
    delete mem[k];
    return db().then(function (d) {
      if (!d) return;
      return new Promise(function (res) {
        try { var tx = d.transaction("docs", "readwrite"); tx.objectStore("docs").delete(k); tx.oncomplete = res; tx.onerror = res; } catch (e) { res(); }
      });
    });
  }
  function docAll() {
    return db().then(function (d) {
      if (!d) return Object.assign({}, mem);
      return new Promise(function (res) {
        var out = {};
        try {
          var c = d.transaction("docs").objectStore("docs").openCursor();
          c.onsuccess = function () { var cur = c.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } else res(Object.assign(out, mem)); };
          c.onerror = function () { res(Object.assign({}, mem)); };
        } catch (e) { res(Object.assign({}, mem)); }
      });
    });
  }
  function size(n) { return n > 1048576 ? fmt(n / 1048576) + " MB" : fmt(Math.max(1, n / 1024), 0) + " KB"; }
  function renderDocs() {
    var loaded = 0, req = 0;
    $("#docs").innerHTML = DOCS.map(function (d) {
      var f = docsCache[A.plot + ":" + d.id];
      if (d.req) { req++; if (f) loaded++; }
      return '<li><div class="dn">' + esc(d.n) + "<small>" + (f ? esc(f.name) + " · " + size(f.size) : (d.hint ? d.hint : (d.req ? "לא נטען" : "אופציונלי"))) + "</small></div>" +
        '<div class="da">' + (f
          ? '<button class="btn small" type="button" data-open="' + d.id + '">פתיחה</button><button class="btn small" type="button" data-del="' + d.id + '">הסרה</button>'
          : '<label class="btn small">העלאה<input type="file" data-up="' + d.id + '" aria-label="העלאת ' + esc(d.n) + '"></label>') +
        "</div></li>";
    }).join("");
    $("#docsCount").textContent = "· " + loaded + " מתוך " + req + " נטענו · נשמרים בדפדפן בלבד";
  }
  function loadDocs() { return docAll().then(function (all) { docsCache = all; renderDocs(); }); }

  function srcStatus(k) {
    var p = P();
    if (!has(p.R[k])) return "r";
    return has(p.src[k]) ? "g" : "y";
  }
  function srcCoverage() {
    var n = PARAMS.filter(function (x) { return srcStatus(x.k) === "g"; }).length;
    return Math.round(n / PARAMS.length * 100);
  }
  function paintRightsStatus() {
    PARAMS.forEach(function (x) {
      var d = $('#rights [data-st="' + x.k + '"]'); if (d) d.className = "dot " + srcStatus(x.k);
    });
    var c = srcCoverage();
    $("#srcCount").textContent = "· " + c + "% מקושרים למקור";
    $("#trustSrc").textContent = c + "%";
  }
  function renderPlotSeg() {
    $("#plotSeg").innerHTML = Object.keys(DEMO).map(function (id) {
      return '<button class="btn' + (id === A.plot ? " on" : "") + '" type="button" data-plot="' + id + '">מגרש ' + id + "</button>";
    }).join("") + '<button class="btn" type="button" data-reset>איפוס לדמו</button>';
  }
  function renderRights() {
    var p = P();
    $("#rights").innerHTML = PARAMS.map(function (x) {
      var v = p.R[x.k];
      return "<tr><td>" + x.n + "</td>" +
        '<td><input class="val" ' + (x.text ? 'type="text" style="width:78px;direction:rtl;text-align:right"' : 'type="number" step="any" inputmode="decimal"') + ' data-k="' + x.k + '" value="' + (has(v) ? esc(v) : "") + '" placeholder="חסר" aria-label="' + esc(x.n) + '"></td>' +
        '<td class="unit">' + x.u + "</td>" +
        '<td><input type="text" data-src="' + x.k + '" value="' + esc(p.src[x.k] || "") + '" placeholder="מסמך, עמוד, סעיף" aria-label="מקור: ' + esc(x.n) + '"></td>' +
        '<td class="st"><i class="dot" data-st="' + x.k + '"></i></td></tr>';
    }).join("");
    paintRightsStatus();
  }
  function renderAlts() {
    var p = P(), maxFp = r10((p.R.plot || 1000) * 0.6), maxFl = (p.R.floors || 8) + 4;
    $("#alts").innerHTML = ALT_KEYS.map(function (k) {
      var a = p.alts[k];
      return '<div class="alt"><div class="alt-head"><button class="btn' + (k === A.alt ? " on" : "") + '" type="button" data-alt="' + k + '">חלופה ' + k + '</button><span class="sum num" data-sum="' + k + '"></span></div>' +
        '<div class="slide"><span>שטח קומה</span><input type="range" min="100" max="' + maxFp + '" step="10" value="' + a.fp + '" data-fp="' + k + '" aria-label="שטח קומה, חלופה ' + k + '"><output class="num" data-ofp="' + k + '"></output></div>' +
        '<div class="slide"><span>קומות</span><input type="range" min="1" max="' + maxFl + '" step="1" value="' + a.fl + '" data-fl="' + k + '" aria-label="קומות, חלופה ' + k + '"><output class="num" data-ofl="' + k + '"></output></div></div>';
    }).join("");
    $("#dev").innerHTML = DEV.map(function (x) {
      return "<div><label>" + x.n + '<input type="number" step="any" data-dev="' + x.k + '" value="' + p.dev[x.k] + '"></label></div>';
    }).join("");
    paintAlts();
  }
  function paintAlts() {
    var p = P();
    ALT_KEYS.forEach(function (k) {
      var a = p.alts[k], c = calc(a);
      $('[data-ofp="' + k + '"]').textContent = fmt(a.fp, 0) + ' מ"ר';
      $('[data-ofl="' + k + '"]').textContent = a.fl;
      $('[data-sum="' + k + '"]').textContent = "שטח כולל " + fmt(c.gross, 0) + ' מ"ר · ' + c.units + ' יח"ד';
      var b = $('[data-alt="' + k + '"]'); if (b) b.classList.toggle("on", k === A.alt);
    });
  }
  function renderFit(sum) {
    var names = sum.all[ALT_KEYS[0]].ch;
    var head = "<thead><tr><th>בדיקה</th>" + ALT_KEYS.map(function (k) {
      return '<th class="alt-col"><button class="btn' + (k === A.alt ? " on" : "") + '" type="button" data-alt="' + k + '"><span>חלופה ' + k + "</span><b>" + sum.all[k].s + "%</b></button></th>";
    }).join("") + "</tr></thead>";
    var body = "<tbody>" + names.map(function (row, i) {
      return "<tr><td>" + row.n + "<small>" + esc(row.lim) + "</small></td>" + ALT_KEYS.map(function (k) {
        var x = sum.all[k].ch[i];
        return '<td class="c" title="' + esc(x.note + (x.dims ? " · " + x.dims : "")) + '"><i class="dot ' + (x.st === "n" ? "" : x.st) + '"></i>' + esc(x.val) + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody>";
    $("#fit").innerHTML = head + body;
    var b = sum.all[sum.best];
    $("#fitTitle").textContent = "חלופה " + sum.best + " מובילה: " + b.s + "% התאמה, " + (b.reds.length ? b.reds.length + " חריגות." : "בלי חריגות.");
    $("#reco").innerHTML = "<b>המלצה לתצוגה:</b> חלופה " + sum.best + ". הכלי מציג את ההמלצה ואת הנתונים שמאחוריה, ולא מחליט במקום היזם או הרשות.";
  }
  function renderFocus(sum) {
    var p = P(), a = p.alts[A.alt], c = calc(a), cur = sum.all[A.alt], R = p.R;
    $("#headline").innerHTML = cur.reds.length
      ? "<b>חלופה " + A.alt + " חורגת ב-" + cur.reds.length + (cur.reds.length === 1 ? " דרישה" : " דרישות") + ":</b> " + cur.reds.map(function (x) { return x.n; }).join(", ") + "."
      : "<b>חלופה " + A.alt + " עומדת בכל הדרישות שנבדקו.</b> " + cur.s + "% התאמה, מגרש " + A.plot + ".";
    $("#altSeg").innerHTML = ALT_KEYS.map(function (k) {
      return '<button class="btn' + (k === A.alt ? " on" : "") + '" type="button" data-alt="' + k + '">חלופה ' + k + "</button>";
    }).join("");
    $$("#viewSeg button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === A.mode); });
    function lim(v, u) { return has(v) ? "עד " + fmt(v) + u : "הגבול חסר"; }
    var tested = cur.ch.filter(function (x) { return x.st !== "n"; }).length;
    var m = [
      ["תכסית", fmt(c.cov) + "%", lim(R.cov, "%"), stMax(c.cov, R.cov)],
      ["בנייה", fmt(c.bp, 0) + "%", lim(R.bp, "%"), stMax(c.bp, R.bp)],
      ["קומות", a.fl, lim(R.floors, ""), stMax(a.fl, R.floors)],
      ["גובה", fmt(c.h) + " מ'", lim(R.h, " מ'"), stMax(c.h, R.h)],
      ['יח"ד', c.units, lim(R.units, ""), stMax(c.units, R.units)],
      ["התאמה", cur.s + "%", tested + " בדיקות", cur.reds.length ? "r" : (cur.s >= 90 ? "g" : "y")]
    ];
    $("#metrics").innerHTML = m.map(function (x) {
      return '<div class="metric"><div class="v num"><i class="dot ' + (x[3] === "n" ? "" : x[3]) + '"></i>' + x[1] + '</div><div class="l">' + x[0] + " · " + x[2] + "</div></div>";
    }).join("");
    var iso = A.mode === "iso";
    $("#iso3d").hidden = !iso;
    $("#flat").hidden = iso;
    $("#hint").hidden = !iso;
    if (iso) { if (window.update3D) window.update3D(); } else renderFlat();
  }
  function renderFlat() {
    var p = P(), R = p.R, a = p.alts[A.alt], c = calc(a), g = geom(a), S = g.P, X = function (v) { return v * 7; }, svg;
    if (A.mode === "plan") {
      var sb = has(R.ss) && has(R.sr) && has(R.sf);
      svg = '<svg viewBox="-12 -12 ' + (X(S) + 24) + " " + (X(S) + 24) + '" xmlns="http://www.w3.org/2000/svg" direction="rtl" font-family="Heebo, Arial">' +
        '<rect x="0" y="0" width="' + X(S) + '" height="' + X(S) + '" fill="#fafafa" stroke="#111" stroke-dasharray="4 3"/>' +
        (sb ? '<rect x="' + X(R.ss) + '" y="' + X(R.sr) + '" width="' + X(S - 2 * R.ss) + '" height="' + X(S - R.sf - R.sr) + '" fill="none" stroke="#8a8a8a" stroke-dasharray="2 3"/>' +
          '<text x="' + (X(S - R.ss) - 4) + '" y="' + (X(R.sr) + 12) + '" font-size="9" fill="#6b6b6b" text-anchor="start">קו בניין</text>' : "") +
        '<rect x="' + X(g.ox) + '" y="' + X(g.oy) + '" width="' + X(g.w) + '" height="' + X(g.d) + '" fill="' + (stMax(c.cov, R.cov) === "r" ? "#e7b8b3" : "#cfcfcf") + '" stroke="#111"/>' +
        '<text x="' + (X(g.ox + g.w) - 5) + '" y="' + (X(g.oy) + 14) + '" font-size="10" fill="#111" text-anchor="start">תכסית ' + fmt(c.cov) + "%</text>" +
        '<text x="' + (X(S) - 4) + '" y="' + (X(S) - 5) + '" font-size="9" fill="#6b6b6b" text-anchor="start">גבול מגרש · חזית</text></svg>';
    } else {
      var top = Math.max(has(R.h) ? R.h : 0, c.h), floors = "";
      for (var i = 1; i < a.fl; i++) floors += '<line x1="0" x2="' + X(g.w) + '" y1="' + (-X(i * p.dev.fl)) + '" y2="' + (-X(i * p.dev.fl)) + '" stroke="#6b6b6b" stroke-width=".6"/>';
      svg = '<svg viewBox="-70 ' + (-X(top) - 30) + " " + (X(g.w) + 140) + " " + (X(top) + 50) + '" xmlns="http://www.w3.org/2000/svg" direction="rtl" font-family="Heebo, Arial">' +
        '<line x1="-300" x2="' + (X(g.w) + 300) + '" y1="0" y2="0" stroke="#111"/>' +
        (has(R.h) ? '<line x1="-300" x2="' + (X(g.w) + 300) + '" y1="' + (-X(R.h)) + '" y2="' + (-X(R.h)) + '" stroke="#d4a017" stroke-dasharray="4 3"/>' +
          '<text x="-8" y="' + (-X(R.h) - 5) + '" font-size="10" fill="#8a6a10" text-anchor="start">גובה מרבי ' + R.h + " מ'</text>" : "") +
        '<rect x="0" y="' + (-X(c.h)) + '" width="' + X(g.w) + '" height="' + X(c.h) + '" fill="' + (stMax(c.h, R.h) === "r" ? "#e7b8b3" : "#cfcfcf") + '" stroke="#111"/>' + floors +
        '<text x="' + (X(g.w) + 60) + '" y="' + (-X(c.h) + 12) + '" font-size="10" fill="#111" text-anchor="start">' + fmt(c.h) + " מ'</text></svg>";
    }
    $("#flat").innerHTML = svg;
  }

  function refreshA(opts) {
    opts = opts || {};
    var sum = summary();
    if (!opts.keepRights) { renderPlotSeg(); renderRights(); renderDocs(); }
    else paintRightsStatus();
    if (!opts.keepAlts) renderAlts(); else paintAlts();
    renderFit(sum);
    renderFocus(sum);
  }

  /* המודל התלת-ממדי קורא מכאן את המצב */
  window.TOOL = {
    snapshot: function () {
      var p = P(), a = p.alts[A.alt], c = calc(a), ch = checks(a);
      return { R: p.R, a: a, c: c, g: geom(a), fl: p.dev.fl, plot: A.plot, breach: ch.some(function (x) { return x.st === "r"; }) };
    },
    visible: function () { return document.body.getAttribute("data-page") === "a" && A.mode === "iso"; }
  };

  function wireA() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-alt],[data-plot],[data-reset],[data-v],[data-open],[data-del]");
      if (!t) return;
      if (t.hasAttribute("data-alt")) { A.alt = t.getAttribute("data-alt"); saveA(); refreshA({ keepRights: true, keepAlts: true }); }
      else if (t.hasAttribute("data-plot")) { A.plot = t.getAttribute("data-plot"); saveA(); refreshA(); }
      else if (t.hasAttribute("data-reset")) { delete A.data[A.plot]; saveA(); refreshA(); }
      else if (t.hasAttribute("data-v")) { A.mode = t.getAttribute("data-v"); saveA(); refreshA({ keepRights: true, keepAlts: true }); }
      else if (t.hasAttribute("data-open")) {
        var f = docsCache[A.plot + ":" + t.getAttribute("data-open")];
        if (f && f.file) { var u = URL.createObjectURL(f.file); window.open(u, "_blank", "noopener"); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }
      } else if (t.hasAttribute("data-del")) {
        var k = A.plot + ":" + t.getAttribute("data-del");
        delete docsCache[k]; renderDocs(); docDel(k);
      }
    });
    document.addEventListener("change", function (e) {
      var up = e.target.closest("input[data-up]");
      if (!up || !up.files || !up.files[0]) return;
      var file = up.files[0], k = A.plot + ":" + up.getAttribute("data-up");
      var rec = { name: file.name, size: file.size, type: file.type, file: file, ts: Date.now() };
      docsCache[k] = rec; renderDocs(); docPut(k, rec);
    });
    document.addEventListener("input", function (e) {
      var t = e.target, p = P(), k;
      if (t.matches("[data-k]")) {
        k = t.getAttribute("data-k");
        var x = PARAMS.filter(function (q) { return q.k === k; })[0];
        p.R[k] = x.text ? t.value.trim() : (t.value === "" ? null : Number(t.value));
        saveA(); refreshA({ keepRights: true, keepAlts: true });
      } else if (t.matches("[data-src]")) {
        p.src[t.getAttribute("data-src")] = t.value.trim(); saveA(); paintRightsStatus();
      } else if (t.matches("[data-fp]")) {
        p.alts[t.getAttribute("data-fp")].fp = Number(t.value); A.alt = t.getAttribute("data-fp"); saveA(); refreshA({ keepRights: true, keepAlts: true });
      } else if (t.matches("[data-fl]")) {
        p.alts[t.getAttribute("data-fl")].fl = Number(t.value); A.alt = t.getAttribute("data-fl"); saveA(); refreshA({ keepRights: true, keepAlts: true });
      } else if (t.matches("[data-dev]")) {
        var v = Number(t.value); if (!(v > 0)) return;
        p.dev[t.getAttribute("data-dev")] = v; saveA(); refreshA({ keepRights: true, keepAlts: true });
      }
    });
    $("#importBtn").addEventListener("click", function () {
      var msg = $("#importMsg"), raw = $("#importBox").value, m = raw.match(/\{[\s\S]*\}/), obj;
      try { obj = JSON.parse(m ? m[0] : raw); } catch (err) { msg.textContent = "לא נמצא JSON תקין. מדביקים את הבלוק שבין הסוגריים המסולסלים."; return; }
      var p = P(), n = 0;
      PARAMS.forEach(function (x) {
        if (!(x.k in obj)) return;
        var v = obj[x.k];
        if (v === null) { p.R[x.k] = x.text ? "" : null; n++; return; }
        if (x.text) { p.R[x.k] = String(v); n++; }
        else if (typeof v === "number" && isFinite(v)) { p.R[x.k] = v; n++; }
      });
      if (obj.sources && typeof obj.sources === "object") PARAMS.forEach(function (x) { if (typeof obj.sources[x.k] === "string") p.src[x.k] = obj.sources[x.k]; });
      if (!n) { msg.textContent = "לא נמצאו שדות מוכרים ב-JSON."; return; }
      p.alts = defaultAlts(p.R);
      saveA(); refreshA();
      msg.textContent = "נקלטו " + n + " ערכים למגרש " + A.plot + ". החלופות חושבו מחדש.";
    });
  }

  /* ---------- כפתור הלוגו: פעולות המערכת בתוכו ---------- */
  function wireMenu() {
    if (!window.customElements || !customElements.whenDefined) return;
    customElements.whenDefined("ai-menu").then(function () {
      var m = $("ai-menu"); if (!m) return;
      m.items = [
        { label: "איפוס סימוני נלמד", onSelect: function () { done = []; save("done", done); paintRail(); } },
        { label: "איפוס המגרש לערכי הדמו", onSelect: function () { delete A.data[A.plot]; saveA(); refreshA(); } }
      ];
    });
  }

  /* ---------- הפעלה ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildB();
    buildApps();
    initPrompts();
    initSubtabs();
    collectViews();
    buildMap();
    wireA();
    wireMenu();
    $("#prev").addEventListener("click", function () { step(-1); });
    $("#next").addEventListener("click", function () { step(1); });
    $("#mark").addEventListener("click", function () {
      var k = key(current), i = done.indexOf(k);
      if (i === -1) done.push(k); else done.splice(i, 1);
      save("done", done); paintRail();
    });
    window.addEventListener("hashchange", route);
    route();
    loadDocs();
    setTimeout(function () { if (!window.update3D) $("#noThree").hidden = false; }, 6000);
  });
})();
