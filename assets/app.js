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
      { n: "נקודות מבט", level: "פשוטה", d: "סדרת כלים לתהליכי התפתחות ושינוי.", gh: "https://github.com/Anat1969/PointOfView", sk: ["React", "Supabase", "GitHub"] },
      { n: "שלוש טבעות: פלייסמייקינג אשדוד", level: "בינונית", d: "אטלס של מסלולים, סיפורים ומרחבי שהייה, נמדדים ביצר, רגש ושכל.", url: "https://placemaking-ashdod.vercel.app", gh: "https://github.com/Anat1969/PlaceMaking-GH", sk: ["React", "מפה", "GitHub", "Vercel"] },
      { n: "moment", level: "מורכבת", d: "תיאור טרם נכתב.", gh: "https://github.com/Anat1969/moment", sk: ["React", "Supabase", "מפה", "GitHub"] }
    ] },
    { group: "מקצועי", items: [
      { n: "ארכיטייפ: DNA תרבותי", level: "פשוטה", d: "מסע אל עולמות התרבות וההיסטוריה.", url: "https://architaip.vercel.app", gh: "https://github.com/Anat1969/ARCHITAIP-GH", sk: ["GitHub", "Vercel"] },
      { n: "מד הפרופורציות", level: "בינונית", d: "מכשיר מדידה לקומפוזיציה, מול חמש שיטות פרופורציה.", url: "https://propotions-gh.vercel.app", gh: "https://github.com/Anat1969/Propotions-GH", sk: ["React", "בדיקות", "GitHub", "Vercel"] },
      { n: "דשבורד עסקים", level: "מורכבת", d: "דשבורד נתוני עסקים באשדוד.", url: "https://deshbord-gh.vercel.app", gh: "https://github.com/Anat1969/DESHBORD-GH", sk: ["React", "גרפים", "מפה", "בדיקות", "GitHub", "Vercel"] }
    ] }
  ];

  /* ---------- תוכן: כישורים ורשימות הדף הכללי ----------
     סימון בטקסט: ==תובנה==  **פרמטר**  ++פתרון++  !!בעיה!!  */
  var SKILLS = [
    { n: "צ'אט של Claude", icon: "claude", url: "https://claude.ai", yes: "**חשיבה**, **אפיון**, ניסוח פרומפטים, חקירה ושאלות על מושגים.", no: "בנייה מתמשכת של קוד או פריסה." },
    { n: "Cowork", icon: "claude", yes: "עבודה מתמשכת על **מסמכים ומקורות** לאורך זמן.", no: "בנייה ופריסה של אפליקציה." },
    { n: "Claude Code", icon: "claude", url: "https://claude.ai/code", yes: "**בנייה**, תיקון, בדיקות, מיזוג, **פריסה** ואוטומציה בתוך מאגר הקוד.", no: "החלטה על מה לבנות. זה נעשה לפני." },
    { n: "GitHub", icon: "github", url: "https://github.com", yes: "**מאגר הקוד**, ענפים, Pull Requests והיסטוריית שינויים.", no: "שמירת מפתחות סודיים." },
    { n: "Vercel", icon: "vercel", url: "https://vercel.com", yes: "**פריסה** של האפליקציה, תצוגה מקדימה לכל ענף ו**כתובת ציבורית**.", no: "אחסון נתונים. הנתונים נשמרים ב-Supabase." },
    { n: "Supabase", icon: "supabase", url: "https://supabase.com", yes: "**בסיס נתונים**, אימות משתמשים ואחסון קבצים, עם Row Level Security.", no: "לוגיקת ממשק." },
    { n: "Lovable", icon: "lovable", url: "https://lovable.dev", yes: "**אב טיפוס מהיר** של אפליקציה מלאה, לפי פרומפטים חדים.", no: "מערכות שדורשות שליטה מלאה בקוד ובתשתית." },
    { n: "Canva", icon: "canva", url: "https://www.canva.com", yes: "**תוצרים עיצוביים** שנשמרים כקובץ שניתן לעריכה: פלייר, פוסט, מצגת קצרה.", no: "לוגיקה או נתונים." }
  ];
  var LIST_META = {
    principles: { titles: true, ex: true, add: "הוספת תובנה" },
    choose: { titles: false, ex: true, add: "הוספת שורה" },
    flow: { titles: true, add: "הוספת שלב" },
    tips: { titles: true, add: "הוספת טיפ" },
    envs: { titles: true, add: "הוספת סביבה" },
    safety: { titles: true, add: "הוספת כלל" },
    verify: { titles: false, add: "הוספת נקודה" }
  };
  var LISTS = {
    principles: [
      { t: "אפיון לפני קוד", x: "==**שלוש שורות** על הבעיה, המשתמש והתוצר הרצוי.== !!בלי אפיון, הקוד מתחיל לנחש.!!", ex: "\"אדריכל במשרד קטן מזין מספר מגרש, ומקבל טבלת זכויות עם מקור לכל ערך.\"" },
      { t: "בדיקה לפני הבא", x: "==כל צעד נבדק לפני שממשיכים.== !!בדיקה שנדחית לסוף מכפילה את התיקונים.!!", ex: "משווים **שלושה ערכים** מהטבלה לתב\"ע, ורק אז בונים את המודל." },
      { t: "קובץ הכללים כחוזה", x: "==כל מה שחוזר **פעם שנייה** נכנס לקובץ הכללים של הפרויקט.== הוא לא נאמר שוב בצ'אט.", ex: "\"תמיד בעברית, מימין לשמאל\" נכתב פעם אחת ב-CLAUDE.md." },
      { t: "קטן וברור", x: "==**משימה אחת** בכל פעם, עם תוצאה שאפשר לבדוק.== !!משימה גדולה מקבלת תוצאה מטושטשת.!!", ex: "++\"הוסף עמודת מקור לטבלה\"++, ולא !!\"שפר את הכלי\"!!." },
      { t: "לא מדמיינים קבצים", x: "==אם לא בטוחים במה שיש בקובץ, פותחים אותו.== !!ניחוש על קוד או נתונים יוצר באגים שאי אפשר לאתר.!!", ex: "לפני שמחשבים אחוזי בנייה, פותחים את טבלת הזכויות עצמה." },
      { t: "כל כלי לתפקיד שלו", x: "==ייעוץ וניסוח ב**צ'אט**, מסמכים מתמשכים ב**קוורק**, בנייה ופריסה ב**קלוד קוד**.==", ex: "השאלה \"מה לבנות\" נשאלת בצ'אט, והבנייה עצמה נעשית ב-Claude Code." }
    ],
    choose: [
      { x: "**שאלה או החלטה:** ==צ'אט.==", ex: "\"איזה מבנה נתונים מתאים למעקב היתרים?\"" },
      { x: "**מסמך שחוזר לאורך זמן:** ==קוורק.==", ex: "פרוגרמה שמתעדכנת מפגישה לפגישה." },
      { x: "**אפליקציה שתיבנה, תיבדק ותיפרס:** ==Claude Code==, עם GitHub, Vercel ו-Supabase.", ex: "כלי מיפוי הזכויות של מפגש א." },
      { x: "**אב טיפוס מהיר לפני בנייה אמיתית:** ==Lovable.==", ex: "מסך אחד להדגמה ללקוח." },
      { x: "**תוצר שמודפס או מופץ:** ==Canva.==", ex: "פלייר לערב תושבים." }
    ],
    flow: [
      { t: "הגדרת הבעיה", x: "==**משפט אחד**: מי משתמש, במה, ומה התוצר.== !!אם אי אפשר לנסח, הבעיה עוד לא מוגדרת.!!" },
      { t: "אפיון", x: "קובץ **SPEC.md** קצר: מטרה, משתמשים, מסכים, נתונים, ומה לא נבנה. ==מאושר לפני קוד.==" },
      { t: "מבנה נתונים", x: "טבלאות וקשרים ב-**Supabase**, עם **Row Level Security** מההתחלה. ==מיגרציות נשמרות כקבצים.==" },
      { t: "בנייה בשלבים", x: "קודם הלוגיקה והנתונים, אחר כך הממשק. ==כל שלב נבדק לפני שממשיכים.==" },
      { t: "בדיקה", x: "בדיקות אוטומטיות על הלוגיקה, ובדיקה ידנית של כל כפתור ומסך. ==בדיקה ירוקה היא תנאי למיזוג.==" },
      { t: "מיזוג ל-main", x: "==רק אחרי בדיקה ירוקה.== הודעת commit ברורה, ו-**Pull Request** עם תיאור של מה שהשתנה." },
      { t: "פריסה ב-Vercel", x: "מיד אחרי המיזוג. ==בודקים את הכתובת הסופית.== !!לא רק את התצוגה המקדימה.!!" },
      { t: "תיעוד", x: "האפליקציה נרשמת באפליקציית האפליקציות, עם כתובת **GitHub** וכתובת **Vercel**." },
      { t: "מסירה", x: "==כתובת סופית ו**שורה אחת** שמסבירה מה נבנה.== !!בלי סיכום של כל הצעדים.!!" }
    ],
    tips: [
      { t: "תנו הקשר בתחילת השיחה", x: "==מטרה, מסכים קיימים והכללים.== !!מה שלא כתוב, המודל ינחש.!!" },
      { t: "בקשו תוצאה שאפשר לבדוק", x: "++\"הרץ את הבדיקות והחזר את הפלט\"++ עדיף על !!\"תוודא שזה עובד\"!!." },
      { t: "פצלו שיחות", x: "==שיחה אחת לאפיון, ושיחה נפרדת לכל מודול.== !!שיחה ארוכה מאבדת הקשר.!!" },
      { t: "שמרו תמיד", x: "==commit קטן אחרי כל משימה שעובדת.== חזרה לנקודה טובה צריכה להיות פשוטה." },
      { t: "בדקו את התוצאה במקום המקורי", x: "דף שנבנה נפתח בדפדפן. ==מספר שחושב נבדק מול חישוב ידני.==" },
      { t: "אל תסמכו על \"זה עובד\"", x: "==בקשו הוכחה: פלט בדיקה, צילום מסך, או מספר מהמקור.==" },
      { t: "כשמשהו משתבש, חזרו לאפיון", x: "לעיתים !!האפיון לא ברור!!, ולא הקוד שבור." },
      { t: "מילות חשיבה מדויקות", x: "==**זקק**, **חלץ**, **בחן**.== הן מכוונות את המודל יותר מ\"תעשה טוב\"." }
    ],
    envs: [
      { t: "צ'אט", x: "שיחה חד-פעמית. ==ההקשר כולו חייב להיות בפרומפט.==" },
      { t: "פרויקט", x: "הוראות ומסמכים שנשארים. ==הכללים הקבועים שייכים לכאן.==" },
      { t: "ניסוי", x: "==בדיקה על קלט ידוע== לפני שמשתמשים בפרומפט בתוצר אמיתי." }
    ],
    safety: [
      { t: "מפתחות", x: "!!אף מפתח סודי לא נכנס לקוד, לשיחה או ל-Git.!! ++מפתחות נשמרים ב-.env או בהגדרות הפריסה.++" },
      { t: "Row Level Security", x: "++מופעל בכל טבלה ב-Supabase.++ !!טבלה בלי RLS היא טבלה שכל אחד יכול לקרוא.!!" },
      { t: "סקילים ממאגרים לא מוכרים", x: "++קוראים ומסכמים לפני התקנה.++ !!לא מריצים סקריפטים שמגיעים איתם בלי בדיקה.!!" },
      { t: "מחיקה", x: "מחיקה של נתונים או של קבצים דורשת ==אישור מפורש.==" },
      { t: "פריסה", x: "לפני פרסום, ++בודקים שאין נתונים אישיים או סודיים בתצוגה הציבורית.++" }
    ],
    verify: [
      { x: "שמות הפקודות, הקבצים שנקראים אוטומטית, ואופן טעינת הסקילים ב-Claude Code, ==מול התיעוד הרשמי.==" },
      { x: "מגבלות החינם והמכסות של **Vercel**, **Supabase** ו-**Lovable** לסטודנטים." },
      { x: "תהליך ההתקנה של gh ושל Supabase CLI על מחשבי הסטודנטים, במיוחד ב-**Windows**." },
      { x: "התבניות בדף נבדקו רק בתוך הדף. !!הן עוד לא הורצו על פרויקט אמיתי.!!" }
    ]
  };

  var HOME = {
    name: "אד' ענת שטיבלמן",
    photo: "assets/anat.png",
    post: "רומא, מילאנו, וונציה. אשדוד.\n\nקולנוע, הדרכת טיולים... תמיד לספר את הסיפור. ואני, מתלבטת אם זה תפקיד או הרגל.\n\nעכשיו כלים. לא עוד תוכנית."
  };
  var PAGES = { home: "בית", guide: "כללי", a: 'מפגש א: מבחן התב"ע', b: "מפגש ב: ניהול הסטודיו" };
  var GROUPS = { open: ["פתיחה", ""], learn: ["נלמד", "ידע"], understand: ["נבין", "הבנה"], do: ["נעשה", "יישום"] };
  var GROUP_ORDER = ["open", "learn", "understand", "do"];

  /* ---------- בניית הדפים שנגזרים מנתונים ---------- */
  var STAGE_INTRO = {
    a: {
      learn: { t: "ממסמכים לטבלה אחת.", x: "מעלים את מסמכי התכנית. מזינים מספר מגרש. ==הבינה מחלצת טבלת זכויות, עם מקור לכל ערך.==" },
      understand: { t: "מהטבלה למודל.", x: "==המודל נבנה רק מהטבלה.== קודם מעטפת הבנייה, ובתוכה **שלוש חלופות**." },
      do: { t: "מהמודל להכרעה.", x: "כל חלופה נבדקת מול התב\"ע ומול היזם. ==בוחרים אחת, בנימוק.==" }
    },
    b: {
      learn: { t: "מה הכלי מחזיק.", x: "מפרקים את המשרד ל**חמש ישויות**. ==לכל ישות שדות חובה בלבד.==" },
      understand: { t: "איך הדברים קשורים.", x: "מחברים את הישויות זו לזו. ==קובעים מתי סטייה הופכת לסיכון.==" },
      do: { t: "בונים ומפעילים.", x: "מזינים **פרויקט אחד** במלואו. ==בונים סקירה שבועית בעמוד אחד.==" }
    }
  };
  function barsHTML() {
    var total = { b: 0, a: 0 };
    var rows = EXAMPLE.map(function (r) {
      total.b += r.b; total.a += r.a;
      return barRow(r.n, r.a, r.b, r.b ? Math.round(r.a / r.b * 100) : 0, r.st, r.note, "");
    }).join("");
    rows += barRow('סה"כ', total.a, total.b, Math.round(total.a / total.b * 100), "", "", " bar-total");
    return '<p class="verdict"><b class="bad">התכנון חרג ב-8,000 ש"ח.</b> הפרויקט כולו ניצל 91% מהתקציב.</p><div class="bars">' + rows + "</div>" +
      '<div class="legend"><span>הקו הדק: 80% מהתקציב</span><span>הקו הכהה: 100% מהתקציב</span><span><i class="dot g"></i>בתקציב</span><span><i class="dot r"></i>מעל 100%</span></div>';
  }
  function buildB() {
    var html = NODES.map(function (n, i) {
      var k = "b/" + n.id;
      return '<section class="view flow" data-page="b" data-group="' + n.g + '" data-id="' + n.id + '" data-title="' + esc(n.t) + '" hidden>' +
        "<h1>" + esc(n.t) + "</h1>" +
        '<div class="step" data-step="explain" data-label="ההסבר"><p class="what">' + rich(n.lead) + "</p></div>" +
        '<div class="step io" data-step="prompt" data-label="פרומפט">' +
          '<div class="io-in"><h3>קלט</h3><p class="io-q">הפרומפט לבינה</p><div class="prompt" data-open data-label="פרומפט לתחנה ' + (i + 1) + '"><pre>' + esc(n.prompt) + '</pre></div>' +
          '<div class="io-act"><button class="btn dark" type="button" data-reveal>מה אמור לצאת</button></div></div>' +
          '<div class="io-out"><h3>פלט</h3><div data-revealed' + (visited.indexOf(k + ":prompt") === -1 ? " hidden" : "") + '><p class="io-q">דבר אחד שעובד</p><p class="big">' + rich(n.works) + "</p></div></div>" +
        "</div>" +
        '<div class="step io" data-step="ask" data-label="שאלה לבינה">' +
          '<div class="io-in"><h3>קלט</h3><p class="io-q">שאלה אחת לבינה</p><p class="big">' + esc(n.ask) + "</p>" +
          '<div class="io-act"><button class="btn dark" type="button" data-reveal>כתיבת התשובה</button></div></div>' +
          '<div class="io-out"><h3>פלט</h3><div data-revealed' + (visited.indexOf(k + ":ask") === -1 ? " hidden" : "") + '><p class="io-q">התשובה שקיבלתי, נשמרת בדפדפן הזה</p><textarea data-note="' + k + '" rows="6" aria-label="התשובה שקיבלתי">' + esc(notes[k] || "") + "</textarea></div></div>" +
        "</div>" +
        (n.id === "n4" || n.id === "n5" ? '<div class="step io ex" data-step="example" data-label="דוגמה">' +
          '<div class="io-in"><h3>קלט</h3><p class="io-q">פרויקט לדוגמה <span class="demo-tag">דוגמה · בדיוני</span></p><p>תקציב משרד לבית פרטי. שכר טרחה מאושר: <b>180,000 ש"ח</b>. העלויות הן של המשרד בלבד.</p>' +
          '<div class="io-act"><button class="btn dark" type="button" data-reveal>תקציב מול ביצוע</button></div></div>' +
          '<div class="io-out"><h3>פלט</h3><div data-revealed' + (visited.indexOf(k + ":example") === -1 ? " hidden" : "") + ">" + barsHTML() + "</div></div></div>" : "") +
        "</section>";
    }).join("");
    html += '<section class="view" data-page="b" data-group="do" data-id="materials" data-title="חומרים ל-MVP" hidden>' +
      "<h1>שלושה פרומפטים בונים את הגרסה הראשונה של הכלי.</h1>" +
      '<table class="t"><thead><tr><th>שלב</th><th>הפרומפט</th><th>מצב</th></tr></thead><tbody>' +
      "<tr><td>נלמד</td><td>מודל הנתונים והמסכים</td><td class=\"muted\">הנוסח טרם התקבל</td></tr>" +
      "<tr><td>נבין</td><td>הקשרים, חישובים וכללים</td><td class=\"muted\">הנוסח טרם התקבל</td></tr>" +
      "<tr><td>נעשה</td><td>בניית ה-MVP המלא</td><td class=\"muted\">הנוסח טרם התקבל</td></tr>" +
      "</tbody></table>" +
      '<div class="warn">במסמך המקור מופיעות רק הכותרות של שלושת הפרומפטים. כפתורי ההעתקה יתווספו כשיתקבל הנוסח.</div>' +
      "</section>";
    $("#viewsB").innerHTML = html;
  }
  function buildIntros() {
    ["a", "b"].forEach(function (p) {
      ["learn", "understand", "do"].forEach(function (g) {
        var items = $$('.view[data-page="' + p + '"][data-group="' + g + '"]');
        if (!items.length) return;
        var sec = document.createElement("section");
        sec.className = "view intro";
        sec.setAttribute("data-page", p); sec.setAttribute("data-group", g); sec.setAttribute("data-id", "_" + g);
        sec.setAttribute("data-title", GROUPS[g][0]); sec.setAttribute("data-intro", "");
        sec.innerHTML = "<h1>" + GROUPS[g][0] + ": " + esc(STAGE_INTRO[p][g].t) + '</h1><p class="what">' + rich(STAGE_INTRO[p][g].x) + '</p><ol class="chain">' +
          items.map(function (v) { return "<li><span>תחנה</span>" + esc(v.getAttribute("data-title")) + "</li>"; }).join("") + "</ol>";
        items[0].parentNode.insertBefore(sec, items[0]);
      });
    });
  }
  function barRow(n, a, b, pct, st, note, cls) {
    var w = Math.min(pct, 120) / 120 * 100;
    return '<div class="bar-row' + cls + '"><div class="bar-top"><b>' + esc(n) + "</b><span>" +
      (st ? '<i class="dot ' + st + '"></i>' : "") + esc(note) + '</span></div>' +
      '<div class="bar"><i class="' + st + '" style="width:' + w.toFixed(1) + '%"></i></div>' +
      '<div class="bar-nums"><span class="num">' + fmt(a, 0) + " מתוך " + fmt(b, 0) + ' ש"ח</span><span class="num">' + pct + "%</span></div></div>";
  }
  function icon(k, name) {
    var p = window.ICONS && window.ICONS[String(k).toLowerCase()];
    return p ? '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' + p + '"/></svg>'
      : '<span class="ico tile" aria-hidden="true">' + esc(String(name).charAt(0)) + "</span>";
  }
  function buildApps() {
    $("#appsList").innerHTML = APPS.map(function (g) {
      return "<div><h3>" + esc(g.group) + "</h3>" + g.items.map(function (a) {
        return '<div class="app-row"><div><b>' + esc(a.n) + '</b> <span class="tiny">· ' + esc(a.level) + '</span><div class="small muted">' + esc(a.d) + "</div></div>" +
          '<div class="chips" aria-label="כישורים">' + a.sk.map(function (k) {
            return '<span class="chip">' + (window.ICONS && window.ICONS[k.toLowerCase()] ? icon(k, k) : "") + esc(k) + "</span>";
          }).join("") + "</div>" +
          '<div class="links">' +
          (a.url ? '<a class="btn small dark" href="' + a.url + '" target="_blank" rel="noopener">פתיחה</a>' : "") +
          '<a class="btn small" href="' + a.gh + '" target="_blank" rel="noopener">קוד</a></div></div>';
      }).join("") + "</div>";
    }).join("");
  }

  /* ---------- טקסט עשיר, משפט בשורה, רשימות ועריכה ---------- */
  function lines(h) {
    return h.replace(/(?<!\.)([.?!])((?:<\/[a-z]+>)*)\s+(?=\S)/g, function (m, p1, p2) { return p1 + p2 + "<br>"; });
  }
  function rich(t) {
    var h = esc(t || "");
    h = h.replace(/==(.+?)==/g, "<mark>$1</mark>").replace(/\+\+(.+?)\+\+/g, '<span class="good">$1</span>')
      .replace(/!!(.+?)!!/g, '<span class="bad">$1</span>').replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    return lines(h);
  }
  var edits = load("edits", { lists: {}, texts: {} });
  if (!edits.lists) edits.lists = {};
  if (!edits.texts) edits.texts = {};
  var seen = load("seen", []);
  var editing = false;
  function getList(id) { return edits.lists[id] || LISTS[id]; }
  function ownList(id) { if (!edits.lists[id]) edits.lists[id] = JSON.parse(JSON.stringify(LISTS[id])); return edits.lists[id]; }
  function saved() {
    save("edits", edits);
    var m = $("ai-menu"); if (m) { try { m.status = "נשמר"; } catch (e) { /* הרכיב עוד לא נטען */ } }
  }
  function renderLists() {
    $$("ol[data-list]").forEach(function (ol) {
      var id = ol.getAttribute("data-list"), meta = LIST_META[id], list = getList(id);
      ol.classList.toggle("titled", !!meta.titles);
      if (editing) {
        ol.innerHTML = list.map(function (it, i) {
          return '<li class="ed">' +
            (meta.titles ? '<input type="text" data-f="t" data-i="' + i + '" value="' + esc(it.t || "") + '" placeholder="כותרת" aria-label="כותרת">' : "") +
            '<textarea rows="2" data-f="x" data-i="' + i + '" placeholder="הטקסט" aria-label="טקסט">' + esc(it.x || "") + "</textarea>" +
            (meta.ex ? '<input type="text" data-f="ex" data-i="' + i + '" value="' + esc(it.ex || "") + '" placeholder="דוגמה (לא חובה)" aria-label="דוגמה">' : "") +
            '<button class="btn small" type="button" data-del="' + i + '">מחיקה</button></li>';
        }).join("") + '<li class="ed-foot"><button class="btn dark" type="button" data-add>' + meta.add + '</button><span>סימון בטקסט: ==תובנה== · **פרמטר** · ++פתרון++ · !!בעיה!!</span></li>';
        return;
      }
      ol.innerHTML = list.map(function (it, i) {
        var body = rich(it.x) + (it.ex ? '<span class="ex"><i>דוגמה</i>' + rich(it.ex) + "</span>" : "");
        if (!meta.titles) return "<li><div class=\"line\">" + body + "</div></li>";
        var k = "l:" + id + ":" + i;
        return '<li class="fold' + (seen.indexOf(k) !== -1 ? " seen" : "") + '" data-seen="' + k + '"><b class="fold-t" role="button" tabindex="0" aria-expanded="false">' + esc(it.t) + '</b><div class="more">' + body + "</div></li>";
      }).join("");
    });
  }
  function buildSkills() {
    $("#skills").innerHTML = "<thead><tr><th></th><th>כישור</th><th>למה כן</th><th>למה לא</th></tr></thead><tbody>" + SKILLS.map(function (k, i) {
      var name = icon(k.icon, k.n) + (k.url ? '<a href="' + k.url + '" target="_blank" rel="noopener">' + esc(k.n) + "</a>" : esc(k.n));
      return '<tr><td class="num muted">' + (i + 1) + '</td><td class="sk">' + name + '</td><td class="yes"><i>✓</i><span>' + rich(k.yes) + '</span></td><td class="no"><i>✕</i><span>' + rich(k.no) + "</span></td></tr>";
    }).join("") + "</tbody>";
  }
  function splitSentences() {
    $$(".view p, .view dd, .view .warn, .view li, .focus-head p").forEach(function (el) {
      if (el.closest("pre, .prompt, ol[data-list], .home-post") || el.querySelector("div, p, ol, ul, input, button, table, label")) return;
      el.innerHTML = lines(el.innerHTML);
    });
  }
  function paintEditable() {
    $$(".view > h1").forEach(function (h) {
      if (h.id === "fitTitle") return;
      if (editing) h.setAttribute("contenteditable", "plaintext-only"); else h.removeAttribute("contenteditable");
    });
    var post = $("#post");
    if (editing) post.setAttribute("contenteditable", "plaintext-only"); else post.removeAttribute("contenteditable");
  }
  function applyTexts() {
    views.forEach(function (v) {
      var t = edits.texts["h1:" + key(v)], h = $("h1", v.el);
      if (t && h && h.id !== "fitTitle") h.textContent = t;
    });
  }
  function setEditing(v) {
    editing = v;
    document.body.classList.toggle("editing", v);
    $("#editNote").hidden = !v; $("#editDone").hidden = !v;
    renderLists(); paintEditable(); setMenu();
  }
  function wireEditing() {
    document.addEventListener("input", function (e) {
      var t = e.target, ol = t.closest && t.closest("ol[data-list]");
      if (ol && t.matches("[data-f]")) {
        ownList(ol.getAttribute("data-list"))[Number(t.getAttribute("data-i"))][t.getAttribute("data-f")] = t.value;
        saved(); return;
      }
      if (!editing) return;
      if (t.matches && t.matches(".view > h1")) { edits.texts["h1:" + key(current)] = t.textContent.trim(); saved(); }
      if (t.id === "post") { edits.texts.post = t.innerText.trim(); saved(); }
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-add], [data-del]"); if (!b) return;
      var ol = b.closest("ol[data-list]"); if (!ol) return;
      var id = ol.getAttribute("data-list"), list = ownList(id);
      if (b.hasAttribute("data-add")) list.push(LIST_META[id].titles ? { t: "", x: "" } : { x: "" });
      else { if (!window.confirm("למחוק את הפריט?")) return; list.splice(Number(b.getAttribute("data-del")), 1); }
      saved(); renderLists();
      if (b.hasAttribute("data-add")) { var f = $$("li.ed", ol).pop(); if (f) $("input, textarea", f).focus(); }
    });
    $("#editDone").addEventListener("click", function () { setEditing(false); });
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

  function collectViews() {
    views = $$(".view").map(function (el) {
      return { el: el, page: el.getAttribute("data-page"), group: el.getAttribute("data-group"), id: el.getAttribute("data-id"), title: el.getAttribute("data-title"), intro: el.hasAttribute("data-intro") };
    });
  }
  function key(v) { return v.page + "/" + v.id; }
  function pageViews(p) { return views.filter(function (v) { return v.page === p; }); }
  function find(p, id) { return views.filter(function (v) { return v.page === p && v.id === id; })[0]; }

  var openGroup = null;
  function stations() { return views.filter(function (v) { return v.group !== "open" && !v.intro; }); }
  function buildRail(page) {
    var list = pageViews(page), html = "";
    ["learn", "understand", "do"].forEach(function (g, n) {
      var items = list.filter(function (v) { return v.group === g && !v.intro; });
      if (!items.length) return;
      var open = openGroup === g;
      html += '<div class="rail-group' + (open ? " open" : "") + '">' +
        '<button class="rail-head" type="button" data-group="' + g + '" aria-expanded="' + open + '"><b>' + GROUPS[g][0] + "</b><span>" + (n + 1) + " · " + GROUPS[g][1] + "</span><i>" + items.length + "</i></button>" +
        '<div class="rail-items"' + (open ? "" : " hidden") + ">" + items.map(function (v) {
          return '<a href="#' + key(v) + '" data-key="' + key(v) + '"><i class="tick"></i><span>' + esc(v.title) + "</span></a>";
        }).join("") + "</div></div>";
    });
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
    mark.hidden = !current || current.group === "open" || current.intro || current.el.classList.contains("flow");
    $("#progress").textContent = done.length + " מתוך " + stations().length + " נלמדו";
  }

  function show(v) {
    var pageChanged = !current || current.page !== v.page;
    current = v;
    document.body.setAttribute("data-page", v.page);
    views.forEach(function (x) { x.el.hidden = x !== v; });
    openGroup = v.group === "open" ? (pageChanged ? null : openGroup) : v.group;
    buildRail(v.page);
    $$(".tabs a").forEach(function (a) {
      var on = a.getAttribute("data-tab") === v.page;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var list = pageViews(v.page), i = list.indexOf(v);
    var st = stations().filter(function (x) { return x.page === v.page; });
    $("#kicker").textContent = PAGES[v.page] + (v.group === "open" ? "" : " · " + GROUPS[v.group][0] + " · " + GROUPS[v.group][1]);
    $("#where").textContent = v.group === "open" || v.intro ? "" : (st.indexOf(v) + 1) + " מתוך " + st.length;
    $("#prev").disabled = i === 0;
    $("#next").disabled = i === list.length - 1;
    paintRail();
    paintCover();
    $("#pane").scrollTop = 0;
    if (pageChanged) window.scrollTo(0, 0);
    document.title = (v.page === "home" ? "" : v.title + " · ") + "בינה מלאכותית לאדריכלים";
    if (v.page === "a") refreshA();
    renderFlow();
    if (v.page === "home") story();
  }

  function route() {
    var h = decodeURIComponent((location.hash || "").slice(1)).split("/");
    var page = PAGES[h[0]] ? h[0] : "home";
    show((h[1] && find(page, h[1])) || pageViews(page)[0]);
  }
  function step(d) {
    var list = pageViews(current.page), i = list.indexOf(current) + d;
    if (list[i]) location.hash = key(list[i]);
  }

  /* דף הפתיחה של כל דף: שלושה שלבים, והתחנות נפתחות רק בלחיצה */
  function buildCovers() {
    $$("[data-stages]").forEach(function (box) {
      var page = box.getAttribute("data-stages");
      box.innerHTML = ["learn", "understand", "do"].map(function (g, n) {
        var items = views.filter(function (v) { return v.page === page && v.group === g; });
        return '<div class="stage3" data-g="' + g + '"><button class="btn" type="button" data-group="' + g + '" aria-expanded="false"><span>' + (n + 1) + " · " + GROUPS[g][1] + "</span><b>" + GROUPS[g][0] + "</b><i>" + items.length + (items.length === 1 ? " תחנה" : " תחנות") + "</i></button>" +
          '<div class="stage3-items" hidden>' + items.map(function (v) { return '<a class="btn" href="#' + key(v) + '">' + esc(v.title) + "</a>"; }).join("") + "</div></div>";
      }).join("");
    });
  }
  function paintCover() {
    $$(".stage3").forEach(function (s) {
      var open = s.getAttribute("data-g") === openGroup;
      $(".stage3-items", s).hidden = !open;
      var b = $("button", s); b.classList.toggle("on", open); b.setAttribute("aria-expanded", String(open));
    });
  }
  function toggleGroup(g) {
    openGroup = openGroup === g ? null : g;
    buildRail(current.page); paintRail(); paintCover();
  }

  /* תצוגה בשלבים: רואים כותרות, והפירוט נפתח בלחיצה */
  function makeFold(item, title) {
    if (!title || item.classList.contains("fold")) return;
    var more = document.createElement(item.tagName === "LI" || item.tagName === "DIV" ? "div" : "span");
    more.className = "more";
    var n = title.nextSibling, moved = false;
    while (n) { var nx = n.nextSibling; more.appendChild(n); moved = true; n = nx; }
    if (!moved || !more.textContent.trim()) return;
    item.appendChild(more);
    item.classList.add("fold");
    title.classList.add("fold-t");
    title.setAttribute("role", "button"); title.setAttribute("tabindex", "0"); title.setAttribute("aria-expanded", "false");
  }
  function stagify() {
    $$(".view").forEach(function (view) {
      if (view.classList.contains("home")) return;
      /* כותרת משנה ומה שמתחתיה */
      $$("h2", view).forEach(function (h) {
        if (h.closest("[data-subview]")) return;
        var box = document.createElement("div"); box.className = "sec-more"; box.hidden = true;
        var n = h.nextElementSibling;
        while (n && n.tagName !== "H2") { var nx = n.nextElementSibling; box.appendChild(n); n = nx; }
        if (!box.children.length) return;
        h.parentNode.insertBefore(box, h.nextSibling);
        h.classList.add("sec-t"); h.setAttribute("role", "button"); h.setAttribute("tabindex", "0"); h.setAttribute("aria-expanded", "false");
      });
      $$(".grid3 > div, .steps > div > div, ul.plain > li, .gloss, .out2 > div, .app-row > div:first-child, .explain > li > div", view).forEach(function (it) {
        if (it.closest(".sec-more") || it.closest("[data-subview]")) return;
        makeFold(it, it.firstElementChild);
      });
      var vk = view.getAttribute("data-page") + "/" + view.getAttribute("data-id");
      $$(".fold:not([data-seen]), .sec-t", view).forEach(function (el, i) {
        if (el.closest("ol[data-list]")) return;
        var k = "s:" + vk + ":" + i; el.setAttribute("data-seen", k);
        if (seen.indexOf(k) !== -1) el.classList.add("seen");
      });
      $$(":scope > .lead, :scope > p, .warn, .tiny", view).forEach(function (el) {
        if (el.closest(".sec-more") || el.classList.contains("reco") || el.classList.contains("what") || el.closest(".io-out")) return;
        el.classList.add("more-all");
      });
    });
    $$(".focus .tiny").forEach(function (el) { el.classList.add("more-all"); });
    function markSeen(el) {
      var k = el.getAttribute("data-seen"); if (!k) return;
      el.classList.add("seen");
      if (seen.indexOf(k) === -1) { seen.push(k); save("seen", seen); }
      /* כשכל הרשומות בתחנה נפתחו, התחנה מסומנת כנלמדה */
      if (!current || current.group === "open" || current.intro || current.el.classList.contains("flow")) return;
      var all = $$("[data-seen]", current.el);
      if (all.length && all.every(function (x) { return x.classList.contains("seen"); }) && done.indexOf(key(current)) === -1) {
        done.push(key(current)); save("done", done); paintRail();
      }
    }
    function toggle(t) {
      if (t.classList.contains("sec-t")) {
        var box = t.nextElementSibling; box.hidden = !box.hidden; t.setAttribute("aria-expanded", String(!box.hidden)); t.classList.toggle("open", !box.hidden);
        if (!box.hidden) markSeen(t);
      } else {
        var it = t.closest(".fold"); var open = it.classList.toggle("open"); t.setAttribute("aria-expanded", String(open));
        if (open) markSeen(it);
      }
    }
    document.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      var t = e.target.closest(".fold-t, .sec-t"); if (t) toggle(t);
    });
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".fold-t, .sec-t")) { e.preventDefault(); toggle(e.target); }
    });
    var all = load("all", false);
    function paintAll() {
      document.body.classList.toggle("all", all);
      var b = $("#allBtn"); b.textContent = all ? "הסתר פירוט" : "הצג הכול"; b.classList.toggle("on", all); b.setAttribute("aria-pressed", String(all));
    }
    $("#allBtn").addEventListener("click", function () { all = !all; save("all", all); paintAll(); });
    paintAll();
  }

  function buildHome() {
    $("#homeName").textContent = HOME.name;
    if (HOME.photo) { var img = $("#homePhoto"); img.alt = HOME.name; img.src = HOME.photo; img.hidden = false; }
    var text = edits.texts.post || HOME.post;
    if (text) {
      var post = $("#post");
      post.innerHTML = text.split(/\n+/).map(function (l) { return "<p>" + lines(esc(l)) + "</p>"; }).join("");
      post.hidden = false;
    }
    $$("[data-count]").forEach(function (el) {
      var n = stations().filter(function (v) { return v.page === el.getAttribute("data-count"); }).length;
      el.textContent = n + " תחנות";
    });
  }

  /* ---------- דף הבית: סיפור החלופות בהנפשה, מנתוני מגרש 633 ---------- */
  var storyRun = 0;
  function story() {
    var svg = $("#story"), cap = $("#storyCap"); if (!svg) return;
    var run = ++storyRun;
    var R = JSON.parse(JSON.stringify(DEMO["633"])), p = { R: R, src: {}, alts: defaultAlts(R), dev: defaultDev(R) };
    var S = Math.sqrt(R.plot), sc = 4.1, CX = 200, CY = 196;
    function pt(x, y, z) { return ((x - y) * 0.866 * sc + CX).toFixed(1) + "," + ((x + y) * 0.5 * sc - z * sc + CY).toFixed(1); }
    function poly(a) { return a.map(function (q) { return pt(q[0], q[1], q[2]); }).join(" "); }
    function rect(x1, y1, x2, y2, z) { return poly([[x1, y1, z], [x2, y1, z], [x2, y2, z], [x1, y2, z]]); }
    var info = ALT_KEYS.map(function (k) {
      var a = p.alts[k], ch = checks(a, p), g = geom(a, p), reds = ch.filter(function (x) { return x.st === "r"; });
      return { k: k, a: a, g: g, reds: reds, s: score(ch), units: calc(a, p).units };
    });
    var best = info.slice().sort(function (x, y) { return x.reds.length - y.reds.length || y.s - x.s; })[0];
    function draw(st) {
      var h = "";
      h += '<polygon points="' + rect(0, 0, S, S, 0) + '" fill="#f1f1ef" stroke="#151515" stroke-width="1.5" opacity="' + st.ground + '"/>';
      h += '<polygon points="' + rect(R.ss, R.sr, S - R.ss, S - R.sf, 0) + '" fill="none" stroke="#8a8a8a" stroke-dasharray="5 5" opacity="' + st.setb + '"/>';
      if (st.m > 0) {
        var w = st.w, d = st.d, H = st.H * st.m, ox = (S - w) / 2, oy = (S - d) / 2, x2 = ox + w, y2 = oy + d;
        var side = st.red ? "#e3b0aa" : "#cfcfcc", front = st.red ? "#eccac6" : "#e9e9e6", line = st.red ? "#7a2219" : "#6b6b6b";
        h += '<polygon points="' + poly([[ox, y2, 0], [x2, y2, 0], [x2, y2, H], [ox, y2, H]]) + '" fill="' + front + '" stroke="#151515" stroke-width="1.5" stroke-linejoin="round"/>';
        h += '<polygon points="' + poly([[x2, oy, 0], [x2, y2, 0], [x2, y2, H], [x2, oy, H]]) + '" fill="' + side + '" stroke="#151515" stroke-width="1.5" stroke-linejoin="round"/>';
        h += '<polygon points="' + rect(ox, oy, x2, y2, H) + '" fill="#fff" stroke="#151515" stroke-width="1.5" stroke-linejoin="round"/>';
        for (var f = 1; f * p.dev.fl < H - 0.2; f++) h += '<polyline points="' + poly([[ox, y2, f * p.dev.fl], [x2, y2, f * p.dev.fl], [x2, oy, f * p.dev.fl]]) + '" fill="none" stroke="' + line + '" stroke-width=".8"/>';
      }
      h += '<polygon points="' + rect(0, 0, S, S, R.h * st.ring) + '" fill="none" stroke="#d4a017" stroke-width="1.5" opacity="' + (st.ring > 0 ? 1 : 0) + '"/>';
      svg.innerHTML = h;
    }
    function shape(i) { return { w: i.g.w, d: i.g.d, H: i.g.H, red: i.reds.length > 0 }; }
    function altCap(i) { return "<b>חלופה " + i.k + ".</b> " + i.a.fl + " קומות, " + fmt(i.a.fp, 0) + ' מ"ר לקומה. ' + (i.reds.length ? '<span class="bad">' + i.units + ' יח"ד, מעל המותר.</span>' : '<span class="good">עומדת בכל הדרישות.</span>'); }
    var A0 = shape(info[0]);
    var scenes = [
      { t: 900, cap: "<b>המגרש.</b> " + fmt(R.plot, 0) + ' מ"ר.', to: { ground: 1 } },
      { t: 900, cap: "<b>קווי הבניין.</b> " + R.sf + ", " + R.ss + ", " + R.sr + " מ'.", to: { setb: 1 } },
      { t: 1100, cap: "<b>הגובה המרבי.</b> " + R.h + " מ'.", to: { ring: 1 } },
      { t: 1300, cap: altCap(info[0]), to: { m: 1, w: A0.w, d: A0.d, H: A0.H }, red: A0.red, set: { w: A0.w, d: A0.d, H: A0.H } },
      { t: 1300, cap: altCap(info[1]), to: shape(info[1]), red: info[1].reds.length > 0 },
      { t: 1300, cap: altCap(info[2]), to: shape(info[2]), red: info[2].reds.length > 0 },
      { t: 1300, cap: "<mark><b>ההכרעה: חלופה " + best.k + ".</b> " + best.s + "% התאמה.</mark>", to: shape(best), red: false }
    ];
    var st = { ground: 0, setb: 0, ring: 0, m: 0, w: A0.w, d: A0.d, H: A0.H, red: false };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var b = shape(best); draw({ ground: 1, setb: 1, ring: 1, m: 1, w: b.w, d: b.d, H: b.H, red: false }); cap.innerHTML = scenes[6].cap; return;
    }
    var idx = 0;
    function play() {
      if (run !== storyRun) return;
      if (idx >= scenes.length) return;
      var sn = scenes[idx++], from = {}, keys = Object.keys(sn.to).filter(function (k) { return k !== "red"; }), t0 = null;
      if (sn.set) Object.keys(sn.set).forEach(function (k) { st[k] = sn.set[k]; });
      keys.forEach(function (k) { from[k] = st[k]; });
      if (typeof sn.red === "boolean") st.red = sn.red;
      cap.innerHTML = sn.cap;
      function frame(ts) {
        if (run !== storyRun) return;
        if (t0 === null) t0 = ts;
        var u = Math.min(1, (ts - t0) / sn.t), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        keys.forEach(function (k) { st[k] = from[k] + (sn.to[k] - from[k]) * e; });
        draw(st);
        if (u < 1) requestAnimationFrame(frame); else setTimeout(play, idx >= scenes.length ? 0 : 1100);
      }
      requestAnimationFrame(frame);
    }
    draw(st); play();
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

  var A = load("a2", { plot: null, alt: "א", mode: "iso", data: {}, demoDocs: false });
  var notes = load("notes", {});
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
      var R = {};
      PARAMS.forEach(function (x) { R[x.k] = x.text ? "" : null; });
      A.data[id] = { R: R, src: {}, alts: defaultAlts(R), dev: defaultDev(R) };
    }
    return A.data[id];
  }
  function P() { return plotData(A.plot || "_"); }
  var savedTimer = null;
  function saveA() {
    save("a2", A);
    var s = $("#savedA"); if (s) { s.textContent = "נשמר"; clearTimeout(savedTimer); savedTimer = setTimeout(function () { s.textContent = ""; }, 1500); }
    var m = $("ai-menu"); if (m) { try { m.status = "נשמר"; } catch (e) { /* הרכיב עוד לא נטען */ } }
  }

  function calc(a, p) {
    p = p || P(); var R = p.R, d = p.dev;
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
  function geom(a, p) {
    p = p || P(); var R = p.R;
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
  function checks(a, p) {
    p = p || P(); var R = p.R, d = p.dev, c = calc(a, p), g = geom(a, p), out = [];
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
  var REQ_DOCS = DOCS.filter(function (d) { return d.req; });
  function docOf(id) { return docsCache["plan:" + id] || (A.demoDocs ? { name: "מסמך דמו", demo: true } : null); }
  function docsLoaded() { return REQ_DOCS.filter(function (d) { return !!docOf(d.id); }).length; }
  function renderDocs() {
    $("#docs").innerHTML = DOCS.map(function (d) {
      var f = docsCache["plan:" + d.id];
      return '<li><div class="dn">' + esc(d.n) + "<small>" + (d.hint ? d.hint : (d.req ? "חובה" : "אופציונלי")) + "</small></div>" +
        '<div class="da">' + (f
          ? '<button class="btn small" type="button" data-open="' + d.id + '">פתיחה</button><button class="btn small" type="button" data-del="' + d.id + '">הסרה</button>'
          : '<label class="btn small">העלאה<input type="file" data-up="' + d.id + '" aria-label="העלאת ' + esc(d.n) + '"></label>') +
        "</div></li>";
    }).join("");
    var got = DOCS.filter(function (d) { return !!docOf(d.id); });
    $("#docsOut").innerHTML = got.length ? '<p class="io-q">' + docsLoaded() + " מתוך " + REQ_DOCS.length + " מסמכי חובה נטענו</p><ol class=\"outlist\">" + got.map(function (d) {
      var f = docOf(d.id);
      return "<li><b>" + esc(d.n) + "</b><span>" + (f.demo ? '<span class="demo-tag">דוגמה</span>' : esc(f.name) + " · " + size(f.size)) + "</span></li>";
    }).join("") + "</ol>" : "";
  }
  function loadDocs() { return docAll().then(function (all) { docsCache = all; renderDocs(); renderFlow(); }); }

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
    $("#trustSrc").textContent = A.plot ? c + "%" : "טרם נבחר מגרש";
  }
  function renderPlotStep() {
    $("#plotSeg").innerHTML = Object.keys(DEMO).map(function (id) {
      return '<button class="btn' + (id === A.plot ? " on" : "") + '" type="button" data-plot="' + id + '">מגרש ' + id + "</button>";
    }).join("");
    $("#plotOut").innerHTML = A.plot
      ? '<p class="verdict"><b>מגרש ' + esc(A.plot) + " נבחר.</b></p><p>" + (DEMO[A.plot] ? 'הכלי יאתר אותו בטבלת הזכויות ובתשריט. <span class="demo-tag">דוגמה · מגרש דמו</span>' : "אין למגרש הזה ערכי דמו. הערכים ייקלטו מהתשובה של הבינה.") + "</p>"
      : "";
  }
  function renderRights() {
    var p = P();
    $("#rightsWrap").hidden = !(A.plot && p.extracted);
    $("#demoTag").hidden = !p.fromDemo;
    $("#demoExtract").hidden = !DEMO[A.plot];
    $("#rights").innerHTML = PARAMS.map(function (x, i) {
      var v = p.R[x.k];
      return '<tr style="animation-delay:' + (i * 70) + 'ms"><td>' + x.n + "</td>" +
        '<td><input class="val" ' + (x.text ? 'type="text" style="width:78px;direction:rtl;text-align:right"' : 'type="number" step="any" inputmode="decimal"') + ' data-k="' + x.k + '" value="' + (has(v) ? esc(v) : "") + '" placeholder="חסר" aria-label="' + esc(x.n) + '"></td>' +
        '<td class="unit">' + x.u + "</td>" +
        '<td><input type="text" data-src="' + x.k + '" value="' + esc(p.src[x.k] || "") + '" placeholder="מסמך, עמוד, סעיף" aria-label="מקור: ' + esc(x.n) + '"></td>' +
        '<td class="st"><i class="dot" data-st="' + x.k + '"></i></td></tr>';
    }).join("");
    paintRightsStatus();
  }
  function kv(rows) { return rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd class=\"num\">" + r[1] + "</dd></div>"; }).join(""); }
  function renderKV(sum) {
    var p = P(), R = p.R;
    function v(x, u) { return has(x) ? fmt(x) + u : "חסר"; }
    $("#envIn").innerHTML = kv([["שטח מגרש", v(R.plot, ' מ"ר')], ["תכסית מרבית", v(R.cov, "%")], ["קומות מרבי", v(R.floors, "")], ["גובה מרבי", v(R.h, " מ'")], ["קווי בניין", [R.sf, R.ss, R.sr].map(function (x) { return has(x) ? x : "?"; }).join(" / ") + " מ'"]]);
    $("#checkIn").innerHTML = kv(ALT_KEYS.map(function (k) { var a = p.alts[k]; return ["חלופה " + k, fmt(a.fp, 0) + ' מ"ר × ' + a.fl + " קומות"]; }));
    $("#decideIn").innerHTML = kv(ALT_KEYS.map(function (k) { return ["חלופה " + k, sum.all[k].s + "% התאמה · " + sum.all[k].reds.length + " חריגות"]; }));
  }
  function renderAlts() {
    var p = P(), maxFp = r10((p.R.plot || 1000) * 0.6), maxFl = (p.R.floors || 8) + 4;
    $("#alts").innerHTML = ALT_KEYS.map(function (k) {
      var a = p.alts[k];
      return '<div class="alt"><div class="alt-head"><button class="btn' + (p.mass && k === A.alt ? " on" : "") + '" type="button" data-alt="' + k + '">חלופה ' + k + '</button><span class="sum num" data-sum="' + k + '"></span></div>' +
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
      var b = $('#alts [data-alt="' + k + '"]'); if (b) b.classList.toggle("on", !!p.mass && k === A.alt);
    });
  }
  function renderFit(sum) {
    var p = P(), names = sum.all[ALT_KEYS[0]].ch;
    var head = "<thead><tr><th>בדיקה</th>" + ALT_KEYS.map(function (k) {
      return '<th class="alt-col"><span>חלופה ' + k + "</span><b>" + sum.all[k].s + "%</b></th>";
    }).join("") + "</tr></thead>";
    var body = "<tbody>" + names.map(function (row, i) {
      return "<tr><td>" + row.n + "<small>" + esc(row.lim) + "</small></td>" + ALT_KEYS.map(function (k) {
        var x = sum.all[k].ch[i];
        return '<td class="c" title="' + esc(x.note + (x.dims ? " · " + x.dims : "")) + '"><i class="dot ' + (x.st === "n" ? "" : x.st) + '"></i>' + esc(x.val) + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody>";
    $("#fit").innerHTML = head + body;
    $("#fitWrap").hidden = !p.check;
    var b = sum.all[sum.best];
    $("#fitTitle").innerHTML = "<b>חלופה " + sum.best + " מובילה.</b> " + b.s + "% התאמה, " + (b.reds.length ? b.reds.length + " חריגות." : "בלי חריגות.");
    $("#reco").textContent = "הכלי מציג את ההמלצה ואת הנתונים שמאחוריה. הוא לא מחליט במקום היזם או הרשות.";
    $("#decideWrap").hidden = !p.decided;
  }
  function renderFocus(sum) {
    var p = P(), a = p.alts[A.alt], c = calc(a), cur = sum.all[A.alt], R = p.R, mass = showMass();
    $("#vp").classList.toggle("env-only", !mass);
    $("#vpDemo").hidden = !p.fromDemo;
    $("#headline").innerHTML = !mass ? "<b>מעטפת הבנייה של מגרש " + esc(A.plot || "") + ".</b> המגרש, קווי הבניין והגובה המרבי."
      : (cur.reds.length
        ? '<b class="bad">חלופה ' + A.alt + " חורגת ב-" + cur.reds.length + (cur.reds.length === 1 ? " דרישה" : " דרישות") + ":</b> " + cur.reds.map(function (x) { return x.n; }).join(", ") + "."
        : '<b class="good">חלופה ' + A.alt + " עומדת בכל הדרישות שנבדקו.</b> " + cur.s + "% התאמה.");
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
    var p = P(), R = p.R, a = p.alts[A.alt], c = calc(a), g = geom(a), S = g.P, X = function (v) { return v * 7; }, svg, mass = showMass();
    if (A.mode === "plan") {
      var sb = has(R.ss) && has(R.sr) && has(R.sf);
      svg = '<svg viewBox="-12 -12 ' + (X(S) + 24) + " " + (X(S) + 24) + '" xmlns="http://www.w3.org/2000/svg" direction="rtl" font-family="Heebo, Arial">' +
        '<rect x="0" y="0" width="' + X(S) + '" height="' + X(S) + '" fill="#fafafa" stroke="#111" stroke-dasharray="4 3"/>' +
        (sb ? '<rect x="' + X(R.ss) + '" y="' + X(R.sr) + '" width="' + X(S - 2 * R.ss) + '" height="' + X(S - R.sf - R.sr) + '" fill="none" stroke="#8a8a8a" stroke-dasharray="2 3"/>' +
          '<text x="' + (X(S - R.ss) - 4) + '" y="' + (X(R.sr) + 12) + '" font-size="9" fill="#6b6b6b" text-anchor="start">קו בניין</text>' : "") +
        (mass ? '<rect x="' + X(g.ox) + '" y="' + X(g.oy) + '" width="' + X(g.w) + '" height="' + X(g.d) + '" fill="' + (stMax(c.cov, R.cov) === "r" ? "#e7b8b3" : "#cfcfcf") + '" stroke="#111"/>' +
          '<text x="' + (X(g.ox + g.w) - 5) + '" y="' + (X(g.oy) + 14) + '" font-size="10" fill="#111" text-anchor="start">תכסית ' + fmt(c.cov) + "%</text>" : "") +
        '<text x="' + (X(S) - 4) + '" y="' + (X(S) - 5) + '" font-size="9" fill="#6b6b6b" text-anchor="start">גבול מגרש · חזית</text></svg>';
    } else {
      var top = Math.max(has(R.h) ? R.h : 0, mass ? c.h : 0, 6), floors = "";
      for (var i = 1; i < a.fl; i++) floors += '<line x1="0" x2="' + X(g.w) + '" y1="' + (-X(i * p.dev.fl)) + '" y2="' + (-X(i * p.dev.fl)) + '" stroke="#6b6b6b" stroke-width=".6"/>';
      svg = '<svg viewBox="-70 ' + (-X(top) - 30) + " " + (X(g.w) + 140) + " " + (X(top) + 50) + '" xmlns="http://www.w3.org/2000/svg" direction="rtl" font-family="Heebo, Arial">' +
        '<line x1="-300" x2="' + (X(g.w) + 300) + '" y1="0" y2="0" stroke="#111"/>' +
        (has(R.h) ? '<line x1="-300" x2="' + (X(g.w) + 300) + '" y1="' + (-X(R.h)) + '" y2="' + (-X(R.h)) + '" stroke="#d4a017" stroke-dasharray="4 3"/>' +
          '<text x="-8" y="' + (-X(R.h) - 5) + '" font-size="10" fill="#8a6a10" text-anchor="start">גובה מרבי ' + R.h + " מ'</text>" : "") +
        (mass ? '<rect x="0" y="' + (-X(c.h)) + '" width="' + X(g.w) + '" height="' + X(c.h) + '" fill="' + (stMax(c.h, R.h) === "r" ? "#e7b8b3" : "#cfcfcf") + '" stroke="#111"/>' + floors +
          '<text x="' + (X(g.w) + 60) + '" y="' + (-X(c.h) + 12) + '" font-size="10" fill="#111" text-anchor="start">' + fmt(c.h) + " מ'</text>" : "") + "</svg>";
    }
    $("#flat").innerHTML = svg;
  }

  function refreshA(opts) {
    opts = opts || {};
    var sum = summary();
    if (!opts.keepRights) { renderPlotStep(); renderRights(); renderDocs(); }
    else paintRightsStatus();
    if (!opts.keepAlts) renderAlts(); else paintAlts();
    renderKV(sum);
    renderFit(sum);
    renderFocus(sum);
  }

  /* ---------- מהלך בצעדים: הסבר, ואז קלט ופלט ---------- */
  var visited = load("flowv", []);
  var flowPos = {};
  var STEP_DONE = {
    docs: function () { return docsLoaded() >= REQ_DOCS.length; },
    plot: function () { return !!A.plot; },
    extract: function () { return !!A.plot && !!P().extracted; },
    envelope: function () { return !!A.plot && !!P().env; },
    mass: function () { return !!A.plot && !!P().mass; },
    check: function () { return !!A.plot && !!P().check; },
    decide: function () { return !!A.plot && !!P().decided; }
  };
  var VIEW_NEEDS = {
    "a/model": { ok: function () { return STEP_DONE.extract(); }, text: "קודם משלימים את מיפוי הזכויות.", to: "#a/rights" },
    "a/fit": { ok: function () { return STEP_DONE.extract() && STEP_DONE.mass(); }, text: "קודם בונים את המודל ואת החלופות.", to: "#a/model" }
  };
  function flowSteps(v) { return $$(":scope > .step", v.el); }
  function stepId(st) { return st.getAttribute("data-step"); }
  function stepKey(v, st) { return key(v) + ":" + stepId(st); }
  function isDone(v, st) {
    var f = v.page === "a" && STEP_DONE[stepId(st)];
    return f ? f() : visited.indexOf(stepKey(v, st)) !== -1;
  }
  function markVisited(k) { if (visited.indexOf(k) === -1) { visited.push(k); save("flowv", visited); } }
  function unlocked(v, steps, i) {
    if (i === 0) return true;
    var need = VIEW_NEEDS[key(v)];
    if (need && !need.ok()) return false;
    for (var j = 0; j < i; j++) if (!isDone(v, steps[j])) return false;
    return true;
  }
  function curStep() {
    if (!current || !current.el.classList.contains("flow")) return null;
    var steps = flowSteps(current);
    return steps[flowPos[key(current)] || 0] || null;
  }
  function showMass() { var st = curStep(); return !!st && stepId(st) === "mass" && !!P().mass; }
  function mountVP() {
    var st = curStep(), vp = $("#vp"), slot = st && $('[data-slot="vp"]', st), p = P();
    var ok = slot && A.plot && (slot.getAttribute("data-when") === "env" ? p.env : p.mass);
    if (ok) { if (vp.parentNode !== slot) slot.appendChild(vp); }
    else if (vp.parentNode !== $("#vpStore")) $("#vpStore").appendChild(vp);
  }
  function renderFlow() {
    var v = current;
    if (!v || !v.el.classList.contains("flow")) { mountVP(); return; }
    var steps = flowSteps(v), k = key(v), pos = Math.min(flowPos[k] || 0, steps.length - 1);
    while (pos > 0 && !unlocked(v, steps, pos)) pos--;
    flowPos[k] = pos;
    var bar = $(":scope > .flow-bar", v.el);
    if (!bar) { bar = document.createElement("nav"); bar.className = "flow-bar"; bar.setAttribute("aria-label", "צעדי התחנה"); v.el.insertBefore(bar, steps[0]); }
    bar.innerHTML = steps.map(function (st, i) {
      var d = isDone(v, st), io = st.classList.contains("io");
      return '<button class="btn' + (i === pos ? " on" : "") + (d ? " done" : "") + '" type="button" data-go="' + i + '"' + (unlocked(v, steps, i) ? "" : " disabled") + "><span>" + (i + 1) + "</span>" + esc(st.getAttribute("data-label")) + (io ? "<em>כלי</em>" : "") + "</button>";
    }).join("");
    steps.forEach(function (st, i) { st.hidden = i !== pos; });
    var foot = $(":scope > .flow-foot", v.el);
    if (!foot) { foot = document.createElement("div"); foot.className = "flow-foot"; v.el.appendChild(foot); }
    var cur = steps[pos], need = VIEW_NEEDS[k], needOk = !need || need.ok(), last = pos === steps.length - 1;
    var canNext = stepId(cur) === "explain" ? needOk : isDone(v, cur);
    var list = pageViews(v.page), nextView = list[list.indexOf(v) + 1];
    foot.innerHTML = (pos > 0 ? '<button class="btn" type="button" data-go="' + (pos - 1) + '">חזרה</button>' : "<span></span>") +
      (!needOk ? '<span class="need">' + need.text + ' <a href="' + need.to + '">לתחנה</a></span>' : "<span></span>") +
      (last ? (nextView ? '<a class="btn dark' + (canNext ? "" : " off") + '" href="#' + key(nextView) + '">הלאה: ' + esc(nextView.title) + "</a>" : "<span></span>")
        : '<button class="btn dark" type="button" data-next' + (canNext ? "" : " disabled") + ">המשך: " + esc(steps[pos + 1].getAttribute("data-label")) + "</button>");
    if (steps.every(function (st) { return isDone(v, st); }) && done.indexOf(k) === -1) { done.push(k); save("done", done); paintRail(); }
    mountVP();
    if (v.page === "a") renderFocus(summary());
  }
  function wireFlow() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-go], [data-next], [data-reveal]");
      if (!t || !current) return;
      var k = key(current), steps = flowSteps(current);
      if (t.hasAttribute("data-reveal")) {
        var st = t.closest(".step"), out = $("[data-revealed]", st);
        if (out) out.hidden = false;
        markVisited(stepKey(current, st)); renderFlow(); return;
      }
      if (t.hasAttribute("data-next")) { markVisited(stepKey(current, steps[flowPos[k] || 0])); flowPos[k] = (flowPos[k] || 0) + 1; }
      else flowPos[k] = Number(t.getAttribute("data-go"));
      renderFlow();
      $("#pane").scrollTop = 0;
    });
    document.addEventListener("input", function (e) {
      var t = e.target;
      if (t.matches && t.matches("textarea[data-note]")) { notes[t.getAttribute("data-note")] = t.value; save("notes", notes); }
    });
  }

  /* המודל התלת-ממדי קורא מכאן את המצב */
  window.TOOL = {
    snapshot: function () {
      var p = P(), a = p.alts[A.alt], c = calc(a), ch = checks(a), mass = showMass();
      return { R: p.R, a: a, c: c, g: geom(a), fl: p.dev.fl, plot: A.plot, mass: mass, breach: mass && ch.some(function (x) { return x.st === "r"; }) };
    },
    visible: function () { var h = $("#iso3d"); return document.body.getAttribute("data-page") === "a" && A.mode === "iso" && !!h && h.offsetParent !== null; }
  };

  function choosePlot(id) {
    id = String(id).trim(); if (!id) return;
    A.plot = id; saveA(); refreshA(); renderFlow();
  }
  function wireA() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-alt],[data-plot],[data-v],[data-open],[data-del]");
      if (!t) return;
      if (t.hasAttribute("data-alt")) { A.alt = t.getAttribute("data-alt"); P().mass = true; saveA(); refreshA({ keepRights: true, keepAlts: true }); renderFlow(); }
      else if (t.hasAttribute("data-plot")) choosePlot(t.getAttribute("data-plot"));
      else if (t.hasAttribute("data-v")) { A.mode = t.getAttribute("data-v"); saveA(); refreshA({ keepRights: true, keepAlts: true }); }
      else if (t.hasAttribute("data-open")) {
        var f = docsCache["plan:" + t.getAttribute("data-open")];
        if (f && f.file) { var u = URL.createObjectURL(f.file); window.open(u, "_blank", "noopener"); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }
      } else if (t.hasAttribute("data-del")) {
        var k = "plan:" + t.getAttribute("data-del");
        delete docsCache[k]; renderDocs(); renderFlow(); docDel(k);
      }
    });
    document.addEventListener("change", function (e) {
      var up = e.target.closest("input[data-up]");
      if (!up || !up.files || !up.files[0]) return;
      var file = up.files[0], k = "plan:" + up.getAttribute("data-up");
      var rec = { name: file.name, size: file.size, type: file.type, file: file, ts: Date.now() };
      docsCache[k] = rec; renderDocs(); renderFlow(); docPut(k, rec);
    });
    document.addEventListener("input", function (e) {
      var t = e.target, p = P(), k;
      if (!t.matches) return;
      if (t.matches("[data-k]")) {
        k = t.getAttribute("data-k");
        var x = PARAMS.filter(function (q) { return q.k === k; })[0];
        p.R[k] = x.text ? t.value.trim() : (t.value === "" ? null : Number(t.value));
        p.fromDemo = false;
        saveA(); refreshA({ keepRights: true, keepAlts: true });
      } else if (t.matches("[data-src]")) {
        p.src[t.getAttribute("data-src")] = t.value.trim(); saveA(); paintRightsStatus();
      } else if (t.matches("[data-fp]")) {
        p.alts[t.getAttribute("data-fp")].fp = Number(t.value); A.alt = t.getAttribute("data-fp"); p.mass = true; saveA(); refreshA({ keepRights: true, keepAlts: true }); renderFlow();
      } else if (t.matches("[data-fl]")) {
        p.alts[t.getAttribute("data-fl")].fl = Number(t.value); A.alt = t.getAttribute("data-fl"); p.mass = true; saveA(); refreshA({ keepRights: true, keepAlts: true }); renderFlow();
      } else if (t.matches("[data-dev]")) {
        var v = Number(t.value); if (!(v > 0)) return;
        p.dev[t.getAttribute("data-dev")] = v; saveA(); refreshA({ keepRights: true, keepAlts: true });
      }
    });
    $("#demoDocs").addEventListener("click", function () { A.demoDocs = true; saveA(); renderDocs(); renderFlow(); });
    $("#plotGo").addEventListener("click", function () { choosePlot($("#plotNum").value); });
    $("#plotNum").addEventListener("keydown", function (e) { if (e.key === "Enter") choosePlot($("#plotNum").value); });
    $("#demoExtract").addEventListener("click", function () {
      if (!DEMO[A.plot]) return;
      var p = P(); p.R = JSON.parse(JSON.stringify(DEMO[A.plot])); p.alts = defaultAlts(p.R); p.dev = defaultDev(p.R);
      p.extracted = true; p.fromDemo = true; saveA(); refreshA(); renderFlow();
    });
    $("#envGo").addEventListener("click", function () { P().env = true; saveA(); renderFlow(); });
    $("#checkGo").addEventListener("click", function () { P().check = true; saveA(); refreshA({ keepRights: true, keepAlts: true }); renderFlow(); });
    $("#decideGo").addEventListener("click", function () { P().decided = true; saveA(); refreshA({ keepRights: true, keepAlts: true }); renderFlow(); });
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
      p.alts = defaultAlts(p.R); p.extracted = true; p.fromDemo = false;
      saveA(); refreshA(); renderFlow();
      msg.textContent = "נקלטו " + n + " ערכים למגרש " + A.plot + ".";
    });
  }

  /* ---------- כפתור הלוגו: פעולות המערכת בתוכו ---------- */
  function setMenu() {
    var m = $("ai-menu"); if (!m) return;
    try {
      m.items = [
        { label: "מצב עריכה", pressed: editing, onSelect: function () { setEditing(!editing); } },
        { label: "העתקת העריכות שלי", onSelect: function () { copy(JSON.stringify(edits, null, 1), null); m.status = "העריכות הועתקו"; } },
        { label: "שחזור הטקסטים המקוריים", onSelect: function () {
          if (!window.confirm("למחוק את כל העריכות ולחזור לטקסטים המקוריים?")) return;
          edits = { lists: {}, texts: {} }; save("edits", edits); location.reload();
        } },
        { label: "איפוס סימוני נלמד", onSelect: function () { done = []; seen = []; save("done", done); save("seen", seen); location.reload(); } },
        { label: "התחלת מפגש א מחדש", onSelect: function () {
          A = { plot: null, alt: "א", mode: "iso", data: {}, demoDocs: false }; save("a2", A);
          visited = visited.filter(function (k) { return k.indexOf("a/") !== 0; }); save("flowv", visited); location.reload();
        } }
      ];
    } catch (e) { /* הרכיב עוד לא נטען */ }
  }
  function wireMenu() {
    if (!window.customElements || !customElements.whenDefined) return;
    customElements.whenDefined("ai-menu").then(setMenu);
  }

  /* ---------- הפעלה ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildB();
    buildIntros();
    buildApps();
    initPrompts();
    initSubtabs();
    buildSkills();
    collectViews();
    buildCovers();
    buildHome();
    renderLists();
    splitSentences();
    stagify();
    applyTexts();
    wireEditing();
    document.addEventListener("click", function (e) {
      var g = e.target.closest("button[data-group]"); if (!g) return;
      var gid = g.getAttribute("data-group"), intro = find(current.page, "_" + gid);
      if (intro && current !== intro) location.hash = key(intro); else toggleGroup(gid);
    });
    wireA();
    wireFlow();
    wireMenu();
    $("#storyReplay").addEventListener("click", story);
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
