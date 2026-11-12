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
    p1h: 'אתה מנתח תב"ע ישראלית. קלט: כל מסמכי התכנית שהועלו (הוראות, תשריט, טבלת זכויות, נספחים) ומספר המגרש או תא השטח.\n1. אתר ופענח את המגרש בטבלת הזכויות ובתשריט. אם הם לא מסכימים, עצור והצג את הסתירה.\n2. חלץ לכל מגרש: שטח מגרש; תכסית מרבית; אחוזי בנייה מרביים (ציין אם מוגדרים כשטח כולל או מפוצלים לעיקרי ושירות, לפי תקנות חישוב השטחים, התשנ"ב-1992); מספר קומות מרבי מעל ומתחת לקרקע; גובה מרבי והגדרתו; קווי בניין קדמי, צדדי ואחורי; מספר יח"ד מרבי וצפיפות; שימושים מותרים; דרישות חניה.\n3. לכל ערך החזר: ערך, יחידה, מקור (מסמך, עמוד, סעיף או תא), ורמת ודאות: מלאה, חלקית או חסרה.\n4. בצע בדיקות עקביות: רכיבי השטח מסתכמים לסה"כ; אחוזי הבנייה תואמים לשטחים; שטח השייפ תואם לשטח הטבלה בסטייה עד 0.5%.\n5. אל תנחש ערך חסר. סמן "לא נמצא" ורשום איזה מסמך לבדוק.\n6. הפלט: טבלה אחת, וממצאי עקביות בסוף.\n7. בסיום הוסף רשימה קצרה לקליטה בכלי, שורה לכל ערך, בדיוק במבנה הזה:\nשטח מגרש: [מספר] | מקור: [מסמך, עמוד, סעיף]\nתכסית מרבית: [מספר] | מקור: [...]\nאחוזי בנייה: [מספר] | מקור: [...]\nקומות מרבי: [מספר] | מקור: [...]\nגובה מרבי: [מספר] | מקור: [...]\nקו בניין קדמי: [מספר] | מקור: [...]\nקו בניין צדדי: [מספר] | מקור: [...]\nקו בניין אחורי: [מספר] | מקור: [...]\nיח"ד מרבי: [מספר] | מקור: [...]\nחניה: [הדרישה במילים] | מקור: [...]\nערך שלא נמצא: כתוב "לא נמצא".',
    p1e: 'You are an analyst of Israeli detailed plans (TABA). Input: all uploaded plan documents (ordinances, zoning map, rights table, appendices) and the plot or sub-plot number.\n1. Locate the plot in the rights table and on the map. If they disagree, stop and show the conflict.\n2. Extract and decode, for this plot: plot area; maximum coverage; maximum building rights (state whether expressed as total area or split into main and service areas under the 1992 area-calculation regulations); maximum floors above and below ground; maximum height and its definition; front, side and rear setbacks; maximum dwelling units and density; permitted uses; parking requirements.\n3. For each value return: value, unit, source (document, page, section or table cell), and confidence (full, partial or missing).\n4. Run consistency checks: components sum to the total; percentages match the areas; plot shape area matches the table area within 0.5%.\n5. Never guess a missing value. Mark it "not found" and name the document to check.\n6. Output one table, followed by the consistency findings.\n7. Finally, add a short list for import into the tool, one line per value, using exactly these Hebrew labels and this structure:\nשטח מגרש: [number] | מקור: [document, page, section]\nתכסית מרבית: [number] | מקור: [...]\nאחוזי בנייה: [number] | מקור: [...]\nקומות מרבי: [number] | מקור: [...]\nגובה מרבי: [number] | מקור: [...]\nקו בניין קדמי: [number] | מקור: [...]\nקו בניין צדדי: [number] | מקור: [...]\nקו בניין אחורי: [number] | מקור: [...]\nיח"ד מרבי: [number] | מקור: [...]\nחניה: [the requirement in words] | מקור: [...]\nFor a value that was not found write: לא נמצא.',
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
  var MVP = [
    { t: "נלמד: מודל הנתונים והמסכים", x: "אני מנהלת משרד אדריכלות. בנה לי אפליקציה סטטית בעברית, מימין לשמאל, בקובץ אחד, בלי שרת. הנתונים נשמרים בדפדפן.\nחמש ישויות: פרויקט (שם, מזמין, סטטוס, שכר טרחה מאושר), שלב (שם, תקציב, סטטוס: לא התחיל, בתהליך, נסגר), איש מקצוע (שם, תפקיד, תעריף לשעה), עלות (תאריך, סכום, סוג: שעות צוות, יועץ, הוצאה ישירה), ותקציב (סכום התקציבים של השלבים).\nשלושה מסכים: רשימת פרויקטים, דף פרויקט עם השלבים שלו, וטופס הוספת עלות.\nבשלב הזה בנה רק את המסכים ואת השמירה. טען פרויקט לדוגמה: בית פרטי, שכר טרחה 180,000 ש\"ח, ארבעה שלבים: תכנון 90,000, היתר 30,000, ליווי ביצוע 50,000, סגירה ומסירה 10,000." },
    { t: "נבין: הקשרים, החישובים והכללים", x: "הוסף את הקשרים ואת החישובים.\nכל שלב שייך לפרויקט אחד. כל עלות משויכת לשלב אחד ולאיש מקצוע אחד. עלות בלי שלב לא נשמרת, ומוצגת הודעה שמסבירה למה.\nלכל שלב חשב: עלות בפועל (סכום העלויות), ניצול באחוזים (בפועל חלקי תקציב), ויתרה.\nרמזור לשלב: ירוק עד 80%. צהוב מעל 80% כשהשלב עוד פתוח. אדום מעל 100%. שלב שנסגר בדיוק בתקציב הוא ירוק.\nלפרויקט חשב: סך התקציב, סך הביצוע, ניצול כולל, והשלב שחורג הכי הרבה.\nבדוק על הדוגמה: תכנון 98,000 בפועל, היתר 30,000, ליווי ביצוע 36,000, סגירה 0. התוצאה הצפויה: תכנון אדום ב-109%, היתר ירוק ב-100%, ליווי ביצוע ירוק ב-72%, והפרויקט כולו ב-91%." },
    { t: "נעשה: ה-MVP המלא", x: "השלם את הגרסה הראשונה.\nבדף הפרויקט: גרף פסים לכל שלב, עם קו ב-80% וקו ב-100%, ושורת מסקנה אחת מעל הגרף, למשל: התכנון חרג ב-8,000 ש\"ח.\nעמוד סקירה שבועית לכל הפרויקטים. לכל פרויקט שלושה שדות בלבד: סטטוס, סטייה מהתקציב, והפעולה הבאה. הפעולה הבאה היא שדה שאני ממלאת.\nמיון הסקירה: קודם אדום, אחר כך צהוב, אחר כך ירוק.\nכפתור ייצוא של הסקירה לקובץ CSV.\nעיצוב: לבן, אפור ושחור. צבע רק לרמזור. בלי אייקונים.\nבסוף עבור על כל כפתור ומסך, ותקן מה שלא עובד." }
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
  var PAGES = { home: "בית", guide: "כללי", a: 'מפגש א: מבחן התב"ע', b: "מפגש ב: ניהול הסטודיו", c: "מפגש ג: מהחלופה למודל עבודה" };
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
    },
    c: {
      learn: { t: "מה קיים.", x: "הוולום הנבחר **נכנס למרחב**, ואוספים את העובדות על המגרש וסביבתו. ==עובדות לפני שרטוט.==" },
      understand: { t: "מה מותר ומה דוחף.", x: "כללים, שמש ורוח. ==בודקים היתכנות לפני שמציירים שורה אחת.==" },
      do: { t: "מה רוצים.", x: "כוונת העיצוב **הופכת לשפה עיצובית**, וכל השכבות מתאגדות ל==מודל אחד מוכן לייצוא.==" }
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
      '<p class="what">אחד לכל שלב. <mark>כל פרומפט נבדק על פרויקט הדוגמה לפני שממשיכים.</mark></p>' +
      MVP.map(function (m, i) { return '<div class="prompt" data-label="' + (i + 1) + ". " + esc(m.t) + '"><pre>' + esc(m.x) + "</pre></div>"; }).join("") +
      '<div class="warn">במסמך המקור הופיעו רק הכותרות של שלושת הפרומפטים. הנוסח כאן הוא הצעה, ולא נבדק עדיין בבנייה אמיתית.</div>' +
      "</section>";
    $("#viewsB").innerHTML = html;
  }
  function buildIntros() {
    ["a", "b", "c"].forEach(function (p) {
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
      var pre = $("pre", box), bid = box.getAttribute("data-build");
      if (bid) {
        var bb = BUILD.filter(function (x) { return x.id === bid; })[0];
        pre = document.createElement("pre"); pre.textContent = bb.x;
        if (!box.getAttribute("data-label")) box.setAttribute("data-label", "הפרומפט שבונה את הצעד");
      }
      if (!pre) { pre = document.createElement("pre"); pre.textContent = PROMPTS[he] || ""; }
      var open = box.hasAttribute("data-open");
      pre.hidden = !open;
      pre.setAttribute("dir", "rtl");
      var bar = document.createElement("div");
      bar.className = "prompt-bar";
      bar.innerHTML = '<span class="lbl">' + esc(box.getAttribute("data-label") || "פרומפט") + "</span>" +
        '<span class="toast" aria-live="polite"></span>' +
        '<button class="lnk" type="button" data-act="toggle">' + (open ? "הסתר" : "הצג") + "</button>" +
        '<button class="lnk" type="button" data-act="he">העתק</button>' +
        (en ? '<button class="lnk" type="button" data-act="en">העתק באנגלית</button>' : "");
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
    if (EXT[v.page] && EXT[v.page].show) EXT[v.page].show(v);
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
    var p = { id: "633", R: JSON.parse(JSON.stringify(EX_DEMO["633"])), src: {}, alts: null };
    p.alts = genAlts(p);
    var dm = dims(p), top = topOf(p), sum = summary(p), R = p.R;
    function draw(st) {
      svg.innerHTML = isoDraw({ W: dm.W, D: dm.D, R: R, top: top, tone: st.tone, ground: st.ground, setb: st.setb, env: st.ring, grow: st.m,
        boxes: st.alt ? geom(p.alts[st.alt], p).boxes : [] });
    }
    function altCap(k, tested) {
      var x = sum.all[k], base = "<b>חלופה " + k + ", " + ALT_NAME[x.a.kind] + ".</b> " + ALT_UNIQUE[x.a.kind];
      return tested ? "<b>חלופה " + k + ".</b> מיצוי של " + fmt(x.c.util, 0) + "%. " + (x.tone === "r" ? '<span class="bad">חורגת.</span>' : '<span class="good">' + TONE_WORD[x.tone] + ".</span>") : base;
    }
    var best = sum.best || "א";
    var scenes = [
      { t: 900, cap: "<b>המגרש.</b> " + fmt(R.plot, 0) + ' מ"ר.', to: { ground: 1 } },
      { t: 900, cap: "<b>קווי הבניין.</b> " + R.sf + " / " + R.ss + " / " + R.sr + " מ'.", to: { setb: 1 } },
      { t: 1000, cap: "<b>המעטפת המותרת.</b> עד " + R.h + " מ'.", to: { ring: 1 } },
      { t: 1100, cap: altCap("א"), alt: "א", tone: "n", from: { m: 0 }, to: { m: 1 } },
      { t: 1100, cap: altCap("ב"), alt: "ב", tone: "n", from: { m: 0 }, to: { m: 1 } },
      { t: 1100, cap: altCap("ג"), alt: "ג", tone: "n", from: { m: 0 }, to: { m: 1 } },
      { t: 500, cap: altCap("ג", true), alt: "ג", tone: sum.all["ג"].tone, to: {} },
      { t: 500, cap: altCap("ב", true), alt: "ב", tone: sum.all["ב"].tone, to: {} },
      { t: 500, cap: altCap("א", true), alt: "א", tone: sum.all["א"].tone, to: {} },
      { t: 900, cap: "<mark><b>ההכרעה: חלופה " + best + ".</b> " + fmt(sum.all[best].c.util, 0) + "% מיצוי.</mark>", alt: best, tone: sum.all[best].tone, to: {} }
    ];
    var st = { ground: 0, setb: 0, ring: 0, m: 1, alt: null, tone: "n" };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw({ ground: 1, setb: 1, ring: 1, m: 1, alt: best, tone: sum.all[best].tone }); cap.innerHTML = scenes[scenes.length - 1].cap; return;
    }
    var idx = 0;
    function play() {
      if (run !== storyRun || idx >= scenes.length) return;
      var sn = scenes[idx++], from = {}, keys = Object.keys(sn.to), t0 = null;
      if (sn.alt) st.alt = sn.alt;
      if (sn.tone) st.tone = sn.tone;
      if (sn.from) Object.keys(sn.from).forEach(function (k) { st[k] = sn.from[k]; });
      keys.forEach(function (k) { from[k] = st[k]; });
      cap.innerHTML = sn.cap;
      function frame(ts) {
        if (run !== storyRun) return;
        if (t0 === null) t0 = ts;
        var u = Math.min(1, (ts - t0) / sn.t), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        keys.forEach(function (k) { st[k] = from[k] + (sn.to[k] - from[k]) * e; });
        draw(st);
        if (u < 1) requestAnimationFrame(frame); else setTimeout(play, idx >= scenes.length ? 0 : 800);
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
  /* ששת הפרומפטים שבונים אפליקציה כזו ב-Claude Code */
  var BUILD = [
   {
    "id": "b0",
    "t": "אפיון ושלד",
    "x": "אני אדריכלית. בנה לי אפליקציה סטטית בעברית, מימין לשמאל, בקובץ index.html אחד (מותר three.js מ-CDN), בלי שרת ובלי חשבון.\nשם האפליקציה: \"מהתב\"ע לחלופה\".\nהמטרה: לבחור מגרש בתב\"ע, לחלץ את זכויות הבנייה שלו, ולבחור אחת משלוש חלופות בינוי.\nהמסך בנוי כמהלך של שלושה שלבים, ובכל שלב קלט בצד ימין ופלט בצד שמאל:\n1. מסמכים ומגרש.\n2. דרישות וחלופות.\n3. הכרעה.\nשלב נפתח רק אחרי שהקודם הושלם, והפלט ריק עד שהקלט ניתן.\nעיצוב: לבן, אפור ושחור. צבע רק לרמזור (ירוק, צהוב, אדום) ולקו הכחול של התכנית. בלי אייקונים ובלי אמוג'י.\nבשלב הזה בנה רק את השלד: כותרת, שלושת השלבים, והמעבר ביניהם."
   },
   {
    "id": "b1",
    "t": "מסמכים ומודל התכנית",
    "x": "הוסף את שלב 1, חלק א.\nקלט: העלאת מסמכי התב\"ע (הוראות, תשריט, טבלת זכויות), בכפתורים עם כיתוב בעברית ולא בכפתור הקובץ של הדפדפן, וכפתור \"טעינת תכנית לדוגמה\". הקבצים נשמרים בדפדפן, אבל האפליקציה לא קוראת אותם: בכל מקרה מוצגים נתוני התכנית לדוגמה, עם התווית \"דוגמה\".\nפלט: מודל תלת-ממדי של התכנית ב-three.js, עם סיבוב וזום בעכבר. במודל: הקו הכחול (גבול התכנית) בכחול, חמישה מגרשים כמשטחים עם מספר המגרש על כל אחד, ודרך ביניהם.\nנתוני התכנית לדוגמה, במטרים:\nמגרש 631: x 0, y 0, רוחב 37.5, עומק 50.\nמגרש 632: x 37.5, y 0, רוחב 40, עומק 50.\nמגרש 633: x 77.5, y 0, רוחב 40, עומק 50.\nדרך ברוחב 12, בין y 50 ל-y 62.\nמגרש 634: x 0, y 62, רוחב 37.5, עומק 40.\nמגרש 635: x 37.5, y 62, רוחב 80, עומק 40.\nהקו הכחול מקיף הכול במרווח של 6 מטרים.\nהמודל מופיע רק אחרי שנטענו מסמכים."
   },
   {
    "id": "b2",
    "t": "מגרש, טבלה 5 והבניין",
    "x": "הוסף את שלב 1, חלק ב.\nקלט: שדה \"מספר מגרש\". אפשר גם ללחוץ על מגרש במודל.\nפלט: המצלמה נעה בתנועה רכה אל המגרש שנבחר, והוא מודגש.\nמתחת למודל מוצגת שורת המגרש מטבלה 5 (טבלת הזכויות): שטח מגרש, תכסית מרבית, אחוזי בנייה, קומות מרבי, גובה מרבי, קווי בניין (קדמי, צדדי, אחורי) ויח\"ד מרבי.\nעל המגרש נבנה בניין לפי הזכויות: בתוך קווי הבניין, שטח קומה עד התכסית המרבית, מספר קומות עד המרבי, וסך השטח לא עולה על אחוזי הבנייה. הקו הקדמי פונה אל הדרך.\nנתוני טבלה 5 לדוגמה (שטח במ\"ר, תכסית, אחוזי בנייה, קומות, גובה במ', קווי בניין קדמי/צדדי/אחורי, יח\"ד):\n631: 1875, 35%, 220%, 7, 25, 5/4/4, 34.\n632: 2000, 35%, 250%, 8, 28, 5/4/4, 40.\n633: 2000, 35%, 250%, 8, 28, 5/4/4, 40.\n634: 1500, 40%, 200%, 6, 22, 5/3/4, 28.\n635: 3200, 30%, 300%, 12, 42, 6/5/5, 80.\nגובה קומה: 3.2 מ'.\nמגרש שלא קיים בתכנית: הודעה ברורה."
   },
   {
    "id": "b3",
    "t": "דרישות המערכת והיזם",
    "x": "הוסף את שלב 2, חלק א: דרישות.\nקלט, בשני חלקים.\nדרישות המערכת: שלושה מקורות, ולכל אחד כפתור \"חיבור\" וכפתור \"העלאת קובץ\": הנחיות מרחביות, אוגדן הדרישות של גורמי העירייה, ותקנות התכנון והבנייה. חיבור של מקור מוסיף את הדרישות שלו לרשימה. קובץ שהועלה רק נשמר, ולא מוסיף דרישות.\nדרישות לדוגמה:\nהנחיות מרחביות: שטח פתוח של 60% לפחות מהמגרש. רוחב הבניין לפחות 60% מרוחב החזית, כלומר מהרוחב שבין קווי הבניין הצדדיים.\nאוגדן הדרישות: 1.5 מקומות חניה לכל יח\"ד.\nתקנות התכנון והבנייה: גובה קומה 3.2 מ'.\nדרישות היזם: תיאור חופשי בטקסט, כפתור הקלטה שמתמלל לעברית (Web Speech API. אם הדפדפן לא תומך, הכפתור מוסתר), ושלושה שדות: יעד יח\"ד, שטח יח\"ד ממוצע במ\"ר, ועדיפות (מיצוי זכויות, דירות גדולות, שטח פתוח). ברירות המחדל: יעד של 80% מהיח\"ד המרבי בטבלה 5, שטח ממוצע של 90 מ\"ר, ועדיפות למיצוי זכויות.\nכפתור \"איסוף הדרישות\" מפיק את הפלט, גם אם לא חובר אף מקור.\nפלט: רשימה ממוספרת של כל הדרישות שנאספו, מחולקת לדרישות המערכת ולדרישות היזם, עם המקור של כל דרישה."
   },
   {
    "id": "b4",
    "t": "שלוש חלופות",
    "x": "הוסף את שלב 2, חלק ב: חלופות.\nקלט: כפתור \"יצירת שלוש חלופות\".\nפלט: שלוש חלופות שונות זו מזו. כל אחת ממצה את הזכויות ועומדת בכל דרישות המערכת והיזם.\nחלופה א, רחבה ונמוכה: שטח קומה מרבי, ומספר הקומות הגדול ביותר שלא עובר את אחוזי הבנייה. מעגלים למטה, גם אם המיצוי יוצא מעט מתחת ל-100%.\nחלופה ב, צרה וגבוהה: מספר הקומות המרבי, ושטח קומה קטן בהתאם.\nחלופה ג, מדורגת: מספר הקומות המרבי. החצי התחתון בשטח קומה מרבי, והחצי העליון ב-75% ממנו, או פחות אם אחוזי הבנייה לא מספיקים. הקומות העליונות בנסיגה מהרחוב.\nבכל החלופות שטח הקומה מעוגל כלפי מטה לעשרות מ\"ר, במספר קומות אי-זוגי הקומה הנוספת שייכת לחצי התחתון, ורוחב הבניין נגזר מהפרופורציות של האזור שבין קווי הבניין.\nשלושתן מוצגות זו לצד זו כמודלים באותו קנה מידה, באפור.\nמתחת לכל מודל: מה מייחד אותה במשפט אחד, והפרמטרים: שטח קומה, קומות, שטח כולל, גובה, יח\"ד, שטח יח\"ד ממוצע, שטח פתוח באחוזים ומקומות חניה.\nחישוב יח\"ד: שטח כולל כפול 80% נטו, חלקי שטח היח\"ד הממוצע של היזם, ולא יותר מהמרבי בטבלה 5."
   },
   {
    "id": "b5",
    "t": "הכרעה",
    "x": "הוסף את שלב 3: הכרעה.\nקלט: כפתור \"בחירת החלופה האידיאלית\".\nפלט: לכל חלופה אחוז מיצוי הפוטנציאל (שטח כולל חלקי השטח המרבי המותר), יתרון אחד וחיסרון אחד שנגזרים מהמספרים שלה, וצבע רמזור על המודל: ירוק כשהיא עומדת בכל הדרישות, צהוב כשהיא עומדת במרווח קטן מ-5% מול הגובה המרבי, השטח הפתוח, רוחב הבניין או יעדי היזם, אדום כשהיא חורגת. הגעה מדויקת לתכסית, לאחוזי הבנייה, למספר הקומות או למספר היח\"ד המרבי היא ירוק.\nאחר כך ההכרעה: החלופה שנבחרה, ומשפט שמסביר למה, עם המספרים שהכריעו.\nהציון: 50% מיצוי הפוטנציאל, 30% העדיפות שהיזם בחר, 20% שיעור הבדיקות שעברו. ציון העדיפות: במיצוי זכויות הוא אחוז המיצוי. בדירות גדולות ובשטח פתוח הוא הערך של החלופה חלקי הערך הגבוה מבין השלוש. המרווח של 5% נמדד ביחס לגבול עצמו. אי-עמידה ביעד היח\"ד של היזם נחשבת חריגה. חלופה שחורגת לא יכולה להיבחר, ואם כולן חורגות אין הכרעה.\nהוסף כפתור \"התחלה מחדש\".\nבסוף בדוק את כל המהלך מקצה לקצה, ותקן מה שלא עובד."
   }
  ];
  var VERIFY = {
   "verdict": "==הפרומפטים הורצו פעמיים, כלשונם, על ידי סוכן Claude נפרד שלא ראה את האפליקציה הזו.== בשתי ההרצות התקבלה אפליקציה עובדת. בהרצה השנייה עברו **84 מתוך 84** בדיקות בדפדפן, במחשב ובנייד.",
   "checks": [
    [
     "שלבים נפתחים לפי הסדר, והפלט ריק עד שיש קלט",
     true
    ],
    [
     "מודל תלת-ממדי של הקו הכחול ושל חמשת המגרשים, עם סיבוב וזום",
     true
    ],
    [
     "מגרש שלא קיים בתכנית מקבל הודעה ברורה",
     true
    ],
    [
     "המצלמה נעה אל מגרש 633, ומוצגים טבלה 5 והבניין",
     true
    ],
    [
     "שלושת מקורות הדרישות ודרישות היזם נאספים לרשימה אחת",
     true
    ],
    [
     "שלוש חלופות: 700 × 7, 620 × 8, ומדורגת של 4 + 4 קומות",
     true
    ],
    [
     "הכרעה: נבחרה חלופה ב, עם המספרים שהכריעו",
     true
    ],
    [
     "יעד יח\"ד שאי אפשר לעמוד בו: כל החלופות אדומות, ואין הכרעה",
     true
    ],
    [
     "בלי שגיאות בדפדפן ובלי גלילה אופקית",
     true
    ],
    [
     "הקלטה ותמלול לעברית",
     null
    ],
    [
     "קריאה אוטומטית של קובצי תב\"ע אמיתיים",
     false
    ]
   ],
   "gaps": [
    "הרצה ראשונה: חלופה א הוגדרה בסתירה למספרים של מגרש 633. תוקן: מספר הקומות מעוגל למטה.",
    "הרצה ראשונה: לא נאמר מול אילו מגבלות נמדד המרווח של 5%. תוקן.",
    "הרצה שנייה: \"רוחב החזית\" לא הוגדר, ובפירוש מילולי אף חלופה לא עמדה בדרישה. חודד: הרוחב שבין קווי הבניין הצדדיים.",
    "הרצה שנייה: חסרו ברירות מחדל לדרישות היזם, כיוון העיגול, ונוסחה לציון העדיפות. חודדו.",
    "הרצה שנייה: כפתורי העלאת הקבצים יצאו עם כיתוב באנגלית של הדפדפן. נוספה דרישה לכיתוב בעברית.",
    "החידודים שאחרי ההרצה השנייה לא נבדקו בהרצה שלישית."
   ],
   "url": "built/index.html",
   "how": "נבדק ב-11.11.2026. האפליקציה שבקישור היא התוצאה של ההרצה השנייה, כמו שהיא יצאה, בלי תיקון ידני. ההקלטה לא נבדקה, כי דפדפן הבדיקה לא תומך בזיהוי דיבור. קריאה של תב\"ע אמיתית לא נבנתה, כי הפרומפטים מבקשים נתוני דוגמה."
  };

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
  /* תכנית הדוגמה: חמישה מגרשים, דרך ביניהם, והקו הכחול מסביב. הכול דמו. */
  var EX_PLAN = {
    name: 'תב"ע 603',
    margin: 6,
    road: { y1: 50, y2: 62 },
    plots: {
      "631": { x: 0, y: 0, w: 37.5, d: 50, front: "s" },
      "632": { x: 37.5, y: 0, w: 40, d: 50, front: "s" },
      "633": { x: 77.5, y: 0, w: 40, d: 50, front: "s" },
      "634": { x: 0, y: 62, w: 37.5, d: 40, front: "n" },
      "635": { x: 37.5, y: 62, w: 80, d: 40, front: "n" }
    }
  };
  var EX_DEMO = {
    "631": { plot: 1875, cov: 35, bp: 220, floors: 7, h: 25, sf: 5, ss: 4, sr: 4, units: 34, parking: "" },
    "632": { plot: 2000, cov: 35, bp: 250, floors: 8, h: 28, sf: 5, ss: 4, sr: 4, units: 40, parking: "" },
    "633": { plot: 2000, cov: 35, bp: 250, floors: 8, h: 28, sf: 5, ss: 4, sr: 4, units: 40, parking: "" },
    "634": { plot: 1500, cov: 40, bp: 200, floors: 6, h: 22, sf: 5, ss: 3, sr: 4, units: 28, parking: "" },
    "635": { plot: 3200, cov: 30, bp: 300, floors: 12, h: 42, sf: 6, ss: 5, sr: 5, units: 80, parking: "" }
  };
  var EX_SYS = { open: 60, front: 60, park: 1.5, flh: 3.2 };
  var MODE = load("mode", "example") === "live" ? "live" : "example";
  var PLAN = EX_PLAN, DEMO = EX_DEMO;
  var FLH = 3.2, SELL = 0.8;
  var ALT_KEYS = ["א", "ב", "ג"];
  var ALT_KIND = { "א": "wide", "ב": "tower", "ג": "step" };
  var ALT_NAME = { wide: "רחבה ונמוכה", tower: "צרה וגבוהה", step: "מדורגת" };
  var ALT_UNIQUE = {
    wide: "כל התכסית, במינימום קומות.",
    tower: "כל הקומות, בתכסית קטנה.",
    step: "בסיס רחב, וקומות עליונות בנסיגה מהרחוב."
  };
  var DOCS = [
    { id: "rules", n: "הוראות התכנית", req: true },
    { id: "map", n: "תשריט", req: true },
    { id: "table", n: "טבלת זכויות", hint: "טבלה 5", req: true },
    { id: "annex", n: "נספחים", hint: "מים, ביוב, תנועה", req: false }
  ];
  var SOURCES = [
    { id: "guide", n: "הנחיות מרחביות", url: "https://hanchayit-gh.vercel.app/", reqs: function () { return ["שטח פתוח של " + fmt(SYS().open) + "% לפחות מהמגרש", "רוחב הבניין לפחות " + fmt(SYS().front) + "% מרוחב החזית"]; } },
    { id: "ogdan", n: "אוגדן הדרישות", hint: "גורמי העירייה ומחוצה לה", url: "https://ogdan-gh.vercel.app", reqs: function () { return [fmt(SYS().park) + ' מקומות חניה לכל יח"ד']; } },
    { id: "takanot", n: "תקנות התכנון והבנייה", url: "https://takanot-merhav-gh.vercel.app/", reqs: function () { return ["גובה קומה: " + fmt(FLH) + " מ'"]; } }
  ];
  var PRIOS = { util: "מיצוי זכויות", big: "דירות גדולות", open: "שטח פתוח" };

  function freshLive() { return { plots: [], rights: {}, sys: { open: 60, front: 60, park: 1.5, flh: 3.2 }, file: "" }; }
  function freshA() { return { plot: null, planBuilt: false, demoDocs: false, data: {}, live: freshLive(), req: { src: {}, files: {}, text: "", target: null, avg: 90, prio: "util", done: false, found: "" } }; }
  function aKey() { return MODE === "live" ? "a3live" : "a3"; }
  function fixA(x) { if (!x.req) x.req = freshA().req; if (!x.live) x.live = freshLive(); if (!x.live.sys) x.live.sys = freshLive().sys; return x; }
  var A = fixA(load(aKey(), freshA()));
  function SYS() { return MODE === "live" ? A.live.sys : EX_SYS; }
  function syncFlh() { var f = SYS().flh; FLH = MODE === "live" && A.req.src.takanot && f >= 2.5 && f <= 6 ? f : 3.2; }
  /* פריסת התכנית מהמגרשים שהמשתמש הגדיר: שורה מעל הדרך ושורה מתחתיה */
  function buildLivePlan() {
    var up = A.live.plots.filter(function (q) { return q.side !== "b"; }), dn = A.live.plots.filter(function (q) { return q.side === "b"; });
    var maxUp = up.reduce(function (m, q) { return Math.max(m, q.d); }, 0) || 30, plots = {}, x;
    x = 0; up.forEach(function (q) { plots[q.id] = { x: x, y: maxUp - q.d, w: q.w, d: q.d, front: "s" }; x += q.w; });
    var y2 = maxUp + 12; x = 0; dn.forEach(function (q) { plots[q.id] = { x: x, y: y2, w: q.w, d: q.d, front: "n" }; x += q.w; });
    return { name: "התכנית שלך", margin: 6, road: { y1: maxUp, y2: y2 }, plots: plots };
  }
  function applyLivePlan() {
    PLAN = buildLivePlan(); DEMO = A.live.rights;
    if (A.plot && !PLAN.plots[A.plot]) A.plot = null;
    if (!A.live.plots.length) A.planBuilt = false;
  }
  function applyMode() {
    if (MODE === "live") applyLivePlan(); else { PLAN = EX_PLAN; DEMO = EX_DEMO; }
    syncFlh();
    document.body.setAttribute("data-mode", MODE);
  }
  applyMode();
  var notes = load("notes", {});
  function r10(n) { return Math.max(10, Math.round(n / 10) * 10); }
  function f10(n) { return Math.max(10, Math.floor(n / 10) * 10); }
  function plotData(id) {
    if (!A.data[id]) {
      var R = {}, src = {};
      PARAMS.forEach(function (x) { R[x.k] = x.text ? "" : null; });
      if (DEMO[id]) {
        R = JSON.parse(JSON.stringify(DEMO[id]));
        PARAMS.forEach(function (x) { if (has(R[x.k])) src[x.k] = MODE === "live" ? (A.live.file || "הטבלה שהוזנה") + ", מגרש " + id : "טבלה 5, שורת מגרש " + id; });
      }
      if (MODE === "live" && !has(R.plot) && PLAN.plots[id]) R.plot = Math.round(PLAN.plots[id].w * PLAN.plots[id].d);
      A.data[id] = { id: id, R: R, src: src, alts: null, fromDemo: MODE !== "live" && !!DEMO[id] };
    }
    return A.data[id];
  }
  function P() { return plotData(A.plot || "_"); }
  var savedTimer = null;
  function saveA() {
    save(aKey(), A);
    var s = $("#savedA"); if (s) { s.textContent = "נשמר"; clearTimeout(savedTimer); savedTimer = setTimeout(function () { s.textContent = ""; }, 1500); }
    var m = $("ai-menu"); if (m) { try { m.status = "נשמר"; } catch (e) { /* הרכיב עוד לא נטען */ } }
  }

  /* ---------- גאומטריה וחישוב: הכול נגזר מטבלה 5 ומהדרישות ---------- */
  function dims(p) {
    var g = PLAN.plots[p.id];
    if (g) return { W: g.w, D: g.d };
    var s = Math.sqrt(has(p.R.plot) ? p.R.plot : 1000);
    return { W: s, D: s };
  }
  function zoneOf(R, W, D) {
    var ok = has(R.ss) && has(R.sr) && has(R.sf);
    return ok ? { x1: R.ss, y1: R.sr, x2: W - R.ss, y2: D - R.sf, ok: true } : { x1: 0, y1: 0, x2: W, y2: D, ok: false };
  }
  function limits(p) {
    var R = p.R, dm = dims(p), z = zoneOf(R, dm.W, dm.D), area = has(R.plot) ? R.plot : dm.W * dm.D;
    var zw = Math.max(1, z.x2 - z.x1), zd = Math.max(1, z.y2 - z.y1);
    var maxFp = Math.min(has(R.cov) ? area * R.cov / 100 : zw * zd, zw * zd);
    var maxGross = has(R.bp) ? area * R.bp / 100 : maxFp * (R.floors || 4);
    var maxFl = Math.max(1, Math.min(has(R.floors) ? R.floors : 99, has(R.h) ? Math.floor(R.h / FLH + 1e-9) : 99));
    if (maxFl === 99) maxFl = 4;
    return { area: area, W: dm.W, D: dm.D, z: z, zw: zw, zd: zd, maxFp: maxFp, maxGross: maxGross, maxFl: maxFl };
  }
  /* שלוש דרכים שונות למצות את אותן זכויות */
  function genAlts(p) {
    var L = limits(p), fpMax = f10(L.maxFp), out = {};
    var nWide = Math.max(1, Math.min(L.maxFl, Math.floor(L.maxGross / fpMax)));
    out["א"] = { kind: "wide", fp: fpMax, n: nWide };
    out["ב"] = { kind: "tower", fp: f10(Math.min(fpMax, L.maxGross / L.maxFl)), n: L.maxFl };
    var nb = Math.ceil(L.maxFl / 2), nu = L.maxFl - nb;
    var up = nu > 0 ? f10(Math.min(fpMax * 0.75, (L.maxGross - nb * fpMax) / nu)) : 0;
    out["ג"] = { kind: "step", fp: fpMax, n: L.maxFl, ratio: up / fpMax };
    return out;
  }
  function tiers(a) {
    if (a.kind !== "step" || a.n < 2) return [{ fp: a.fp, fl: a.n }];
    var nb = Math.ceil(a.n / 2);
    return [{ fp: a.fp, fl: nb }, { fp: f10(a.fp * (a.ratio || 0.75)), fl: a.n - nb }];
  }
  function geom(a, p) {
    var L = limits(p), z = L.z, t = tiers(a), boxes = [], z0 = 0;
    var w = Math.min(L.zw, Math.sqrt(t[0].fp * L.zw / L.zd)), d = t[0].fp / w;
    var ox = z.x1 + (L.zw - w) / 2, oy = z.y1 + (L.zd - d) / 2;
    t.forEach(function (tr, i) {
      var dd = i === 0 ? d : tr.fp / w;
      boxes.push({ ox: ox, oy: oy, w: w, d: dd, z0: z0, H: tr.fl * FLH });
      z0 += tr.fl * FLH;
    });
    return { W: L.W, D: L.D, w: w, d: d, ox: ox, oy: oy, boxes: boxes, H: z0, inside: d <= L.zd + 1e-6 && w <= L.zw + 1e-6 };
  }
  function calc(a, p) {
    var L = limits(p), R = p.R, t = tiers(a), g = geom(a, p), q = A.req;
    var gross = t.reduce(function (s, x) { return s + x.fp * x.fl; }, 0);
    var net = gross * SELL, avgWant = q.avg > 0 ? q.avg : 90;
    var units = Math.floor(net / avgWant); if (has(R.units)) units = Math.min(units, R.units);
    return {
      gross: gross, floors: a.n, h: a.n * FLH, cov: a.fp / L.area * 100, bp: gross / L.area * 100,
      util: gross / L.maxGross * 100, units: units, avg: units ? net / units : 0, open: 100 - a.fp / L.area * 100,
      parking: Math.ceil(units * SYS().park), front: g.w / L.zw * 100, terrace: t.length > 1 ? t[0].fp - t[1].fp : 0
    };
  }
  function stHard(v, m) { if (!has(m) || !has(v)) return "n"; return v > m + 1e-9 ? "r" : "g"; }
  function stMax(v, m) { if (!has(m) || !has(v)) return "n"; return v > m + 1e-9 ? "r" : (v >= m * 0.95 ? "y" : "g"); }
  function stMin(v, m) { if (!has(m) || !has(v)) return "n"; return v < m - 1e-9 ? "r" : (v < m * 1.05 ? "y" : "g"); }
  function checks(a, p) {
    var R = p.R, c = calc(a, p), g = geom(a, p), q = A.req, out = [], T = "טבלה 5";
    function lim(v, pre, u) { return has(v) ? pre + fmt(v) + u : "חסר"; }
    out.push({ n: "תכסית", lim: lim(R.cov, "עד ", "%"), val: fmt(c.cov) + "%", st: stHard(c.cov, R.cov), src: T });
    out.push({ n: "אחוזי בנייה", lim: lim(R.bp, "עד ", "%"), val: fmt(c.bp, 0) + "%", st: stHard(c.bp, R.bp), src: T });
    out.push({ n: "קומות", lim: lim(R.floors, "עד ", ""), val: String(c.floors), st: stHard(c.floors, R.floors), src: T });
    out.push({ n: "גובה", lim: lim(R.h, "עד ", " מ'"), val: fmt(c.h) + " מ'", st: stMax(c.h, R.h), src: T });
    var sb = has(R.ss) && has(R.sr) && has(R.sf);
    out.push({ n: "קווי בניין", lim: sb ? R.sf + " / " + R.ss + " / " + R.sr + " מ'" : "חסר", val: !sb ? "חסר" : (g.inside ? "בפנים" : "חורג"), st: !sb ? "n" : (g.inside ? "g" : "r"), src: T });
    out.push({ n: 'יח"ד מרבי', lim: lim(R.units, "עד ", ""), val: String(c.units), st: stHard(c.units, R.units), src: T });
    if (q.src.guide) {
      out.push({ n: "שטח פתוח", lim: "לפחות " + fmt(SYS().open) + "%", val: fmt(c.open) + "%", st: stMin(c.open, SYS().open), src: "הנחיות מרחביות" });
      out.push({ n: "רוחב מול החזית", lim: "לפחות " + fmt(SYS().front) + "%", val: fmt(c.front, 0) + "%", st: stMin(c.front, SYS().front), src: "הנחיות מרחביות" });
    }
    if (q.src.ogdan) out.push({ n: "מקומות חניה", lim: fmt(SYS().park) + ' ליח"ד', val: String(c.parking), st: "n", src: "אוגדן הדרישות" });
    if (q.src.takanot) out.push({ n: "גובה קומה", lim: fmt(FLH) + " מ'", val: fmt(FLH) + " מ'", st: "g", src: "תקנות" });
    if (has(q.target)) out.push({ n: 'יח"ד מול היעד', lim: "לפחות " + q.target, val: String(c.units), st: stMin(c.units, q.target), src: "היזם" });
    if (has(q.avg)) out.push({ n: 'שטח יח"ד ממוצע', lim: "לפחות " + q.avg + ' מ"ר', val: fmt(c.avg, 0) + ' מ"ר', st: c.avg + 0.5 < q.avg ? "r" : "g", src: "היזם" });
    return out;
  }
  function score(ch) {
    var s = ch.filter(function (x) { return x.st !== "n"; });
    if (!s.length) return 0;
    return Math.round(s.reduce(function (t, x) { return t + (x.st === "g" ? 1 : x.st === "y" ? 0.5 : 0); }, 0) / s.length * 100);
  }
  function toneOf(x) { return x.reds.length ? "r" : (x.ch.some(function (q) { return q.st === "y"; }) ? "y" : "g"); }
  function summary(p) {
    p = p || P();
    var alts = p.alts || genAlts(p), all = {}, prio = A.req.prio || "util";
    ALT_KEYS.forEach(function (k) {
      var a = alts[k], ch = checks(a, p);
      all[k] = { k: k, a: a, c: calc(a, p), ch: ch, s: score(ch), reds: ch.filter(function (x) { return x.st === "r"; }) };
      all[k].tone = toneOf(all[k]);
    });
    var maxAvg = Math.max.apply(null, ALT_KEYS.map(function (k) { return all[k].c.avg; })) || 1;
    var maxOpen = Math.max.apply(null, ALT_KEYS.map(function (k) { return all[k].c.open; })) || 1;
    var maxUtil = Math.max.apply(null, ALT_KEYS.map(function (k) { return all[k].c.util; }));
    var minH = Math.min.apply(null, ALT_KEYS.map(function (k) { return all[k].c.h; }));
    var best = null;
    ALT_KEYS.forEach(function (k) {
      var x = all[k], c = x.c;
      var pr = prio === "big" ? c.avg / maxAvg * 100 : (prio === "open" ? c.open / maxOpen * 100 : Math.min(100, c.util));
      x.total = 0.5 * Math.min(100, c.util) + 0.3 * pr + 0.2 * x.s;
      /* יתרון וחיסרון, מהמספרים של החלופה */
      var kind = x.a.kind, R = p.R;
      x.pro = kind === "wide" ? "הנמוכה ביותר: " + fmt(c.h) + " מ'" + (has(R.h) ? " מתוך " + fmt(R.h) + " המותרים" : "") + "."
        : kind === "tower" ? "שטח פתוח של " + fmt(c.open, 0) + "%" + (c.open >= maxOpen - 1e-9 ? ", הגדול מבין השלוש." : ".")
        : "מרפסות גג של " + fmt(c.terrace, 0) + ' מ"ר, לכיוון הרחוב.';
      if (c.h <= minH + 1e-9 && kind !== "wide") x.pro = x.pro;
      x.con = x.reds.length ? "חורגת: " + x.reds.map(function (r) { return r.n; }).join(", ") + "."
        : kind === "wide" ? "תכסית מלאה: נשאר שטח פתוח של " + fmt(c.open, 0) + "% בלבד."
        : kind === "tower" ? "מגיעה ל-" + fmt(c.h) + " מ'" + (has(R.h) ? " מתוך " + fmt(R.h) + " המותרים" : "") + ", עם שטח קומה של " + fmt(x.a.fp, 0) + ' מ"ר בלבד.'
        : "שתי תבניות קומה: תכנון וביצוע מורכבים יותר.";
      if (!x.reds.length && (!best || x.total > all[best].total + 1e-9)) best = k;
    });
    var why = "";
    if (best) {
      var b = all[best], cb = b.c;
      why = "היא ממצה " + fmt(cb.util, 0) + "% מהזכויות" + (cb.util >= maxUtil - 1e-9 ? ", הגבוה מבין השלוש" : "") +
        (prio === "big" ? ', עם דירות של ' + fmt(cb.avg, 0) + ' מ"ר בממוצע' : (prio === "open" ? ", ומשאירה " + fmt(cb.open, 0) + "% שטח פתוח" : "")) +
        ', עם ' + cb.units + ' יח"ד' + (has(A.req.target) ? " מול יעד של " + A.req.target : "") + ". היא עומדת בכל הדרישות.";
    }
    return { all: all, best: best, why: why };
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
  function PK(id) { return (MODE === "live" ? "live:" : "plan:") + id; }
  var REQ_DOCS = DOCS.filter(function (d) { return d.req; });
  function docOf(id) { return docsCache[PK(id)] || (MODE !== "live" && A.demoDocs ? { name: "מסמך דמו", demo: true } : null); }
  function docsLoaded() { return REQ_DOCS.filter(function (d) { return !!docOf(d.id); }).length; }
  function renderDocs() {
    $("#docs").innerHTML = DOCS.map(function (d) {
      var f = docsCache[PK(d.id)], any = docOf(d.id);
      return '<li><div class="dn">' + esc(d.n) + "<small>" + (f ? esc(f.name) + " · " + size(f.size) : (any ? "מסמך דמו" : (d.hint ? d.hint + (d.req && MODE !== "live" ? " · חובה" : " · אופציונלי") : (d.req && MODE !== "live" ? "חובה" : "אופציונלי")))) + "</small></div>" +
        '<div class="da">' + (f
          ? '<button class="btn small" type="button" data-open="' + d.id + '">פתיחה</button><button class="btn small" type="button" data-del="' + d.id + '">הסרה</button>'
          : '<label class="btn small">העלאה<input type="file" data-up="' + d.id + '" aria-label="העלאת ' + esc(d.n) + '"></label>') +
        "</div></li>";
    }).join("");
    $("#planGo").disabled = MODE === "live" ? !A.live.plots.length : docsLoaded() < REQ_DOCS.length;
    $("#planOut").hidden = !A.planBuilt;
    $("#planCount").textContent = PLAN.name + ": " + Object.keys(PLAN.plots).length + " מגרשים.";
    var real = Object.keys(docsCache).some(function (k) { return k.indexOf(PK("")) === 0; });
    if (MODE === "live") { $("#planNote").textContent = "המודל נבנה מהמגרשים שבטבלה שלך. שינוי של רוחב או עומק מתעדכן מיד."; return; }
    $("#planNote").textContent = real ? "המודל מציג את תכנית הדוגמה. קריאה של תכנית אמיתית נעשית בעזרת הבינה, עם פרומפט החילוץ שבצעד הבא." : "";
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
    var c = srcCoverage(), p = P(), g = PLAN.plots[p.id];
    $("#srcCount").textContent = "· " + c + "% מקושרים למקור";
    $("#trustSrc").textContent = A.plot ? c + "%" : "טרם נבחר מגרש";
    $("#trustArea").textContent = A.plot && g && has(p.R.plot) ? fmt(Math.abs(g.w * g.d - p.R.plot) / p.R.plot * 100, 2) + "%" : "טרם נבחר מגרש";
  }
  function renderPlot() {
    var p = P();
    $("#plotOut").hidden = !A.plot;
    $("#plotTitle").innerHTML = "<b>מגרש " + esc(A.plot || "") + ".</b> הבניין נבנה לפי טבלה 5.";
    $("#demoTag").hidden = !p.fromDemo;
    $("#plotNum").placeholder = MODE === "live" ? "מספר מגרש מהטבלה שלך" : "למשל 633";
    $("#rights").innerHTML = PARAMS.map(function (x, i) {
      var v = p.R[x.k];
      return '<tr style="animation-delay:' + (i * 60) + 'ms"><td>' + x.n + "</td>" +
        '<td><input class="val" ' + (x.text ? 'type="text" style="width:78px;direction:rtl;text-align:right"' : 'type="number" step="any" inputmode="decimal"') + ' data-k="' + x.k + '" value="' + (has(v) ? esc(v) : "") + '" placeholder="חסר" aria-label="' + esc(x.n) + '"></td>' +
        '<td class="unit">' + x.u + "</td>" +
        '<td><input type="text" data-src="' + x.k + '" value="' + esc(p.src[x.k] || "") + '" placeholder="מסמך, עמוד, סעיף" aria-label="מקור: ' + esc(x.n) + '"></td>' +
        '<td class="st"><i class="dot" data-st="' + x.k + '"></i></td></tr>';
    }).join("");
    paintRightsStatus();
  }
  function kv(rows) { return rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd class=\"num\">" + r[1] + "</dd></div>"; }).join(""); }

  /* דרישות המערכת והיזם */
  function parseDev(text) {
    var out = {}, m;
    if ((m = text.match(/(\d+)\s*(?:יח"ד|יח״ד|יחידות|דירות)/))) out.target = Number(m[1]);
    if ((m = text.match(/(\d+)\s*(?:מ"ר|מ״ר|מטר)/))) out.avg = Number(m[1]);
    if (/חצר|גינה|שטח פתוח|ירוק/.test(text)) out.prio = "open";
    else if (/דירות גדולות|מרווח/.test(text)) out.prio = "big";
    return out;
  }
  function renderReqs() {
    var q = A.req, p = P();
    $("#sources").innerHTML = SOURCES.map(function (s) {
      var on = !!q.src[s.id], f = q.files[s.id];
      return '<li><div class="dn">' + esc(s.n) + "<small>" + (on ? (MODE === "live" ? "מחובר · לפי הערכים שהזנת" : "מחובר · דרישות דמו") : (f ? esc(f) : (s.hint || "לא מחובר"))) + (f ? " · " + esc((q.read && q.read[s.id]) || "נשמר, לא נקרא אוטומטית") : "") + "</small></div>" +
        '<div class="da"><button class="btn small' + (on ? " on" : "") + '" type="button" data-conn="' + s.id + '">' + (on ? "ניתוק" : "חיבור") + "</button>" +
        '<label class="btn small">העלאה<input type="file" data-srcup="' + s.id + '" aria-label="העלאת קובץ: ' + esc(s.n) + '"></label>' +
        '<a class="btn small" href="' + s.url + '" target="_blank" rel="noopener">פתיחה</a></div></li>';
    }).join("");
    if (!$("#dev").children.length) {
      $("#dev").innerHTML = '<div><label>יעד יח"ד<input type="number" step="1" min="0" data-req="target"></label></div>' +
        '<div><label>שטח יח"ד ממוצע, מ"ר<input type="number" step="1" min="20" data-req="avg"></label></div>' +
        '<div class="wide"><label>עדיפות<select data-req="prio">' + Object.keys(PRIOS).map(function (k) { return '<option value="' + k + '">' + PRIOS[k] + "</option>"; }).join("") + "</select></label></div>";
    }
    var def = has(q.target) ? q.target : (has(p.R.units) ? Math.round(p.R.units * 0.8) : "");
    $('[data-req="target"]').value = def; $('[data-req="avg"]').value = q.avg; $('[data-req="prio"]').value = q.prio;
    if ($("#devText").value !== q.text && document.activeElement !== $("#devText")) $("#devText").value = q.text;
    if (!q.done) { $("#reqOut").innerHTML = ""; return; }
    var sys = [], T5 = p.R;
    sys.push(["טבלה 5", "תכסית עד " + fmt(T5.cov) + "%, אחוזי בנייה עד " + fmt(T5.bp) + "%, עד " + T5.floors + " קומות ו-" + fmt(T5.h) + " מ', עד " + T5.units + ' יח"ד.']);
    SOURCES.forEach(function (s) { if (q.src[s.id]) s.reqs().forEach(function (r) { sys.push([s.n, r + "."]); }); });
    var dev = [["יעד", "לפחות " + q.target + ' יח"ד.'], ["יעד", 'שטח יח"ד ממוצע של ' + q.avg + ' מ"ר לפחות.'], ["עדיפות", PRIOS[q.prio] + "."]];
    if (q.text) dev.push(["תיאור", q.text]);
    function list(rows) { return '<ol class="outlist req">' + rows.map(function (r) { return "<li><b>" + esc(r[1]) + "</b><span>" + esc(r[0]) + "</span></li>"; }).join("") + "</ol>"; }
    var none = !SOURCES.some(function (s) { return q.src[s.id]; });
    $("#reqOut").innerHTML = '<p class="io-q">דרישות המערכת ' + (MODE === "live" ? "" : '<span class="demo-tag">דוגמה · דרישות דמו</span>') + '</p>' + list(sys) +
      (none ? '<p class="small muted">לא חובר מקור. החלופות ייבדקו מול טבלה 5 בלבד.</p>' : "") +
      '<p class="io-q" style="margin-top:14px">דרישות היזם</p>' + list(dev) +
      (q.found ? '<p class="small muted">זוהה מהתיאור: ' + esc(q.found) + "</p>" : "");
  }

  /* ---------- המודל: שרטוט איזומטרי שנבנה מהנתונים ---------- */
  var TONES = {
    n: { front: "#e9e9e6", side: "#cfcfcc", top: "#ffffff", line: "#6b6b6b" },
    g: { front: "#d3e9da", side: "#b5d9c1", top: "#f0f8f3", line: "#3c8c5a" },
    y: { front: "#f5e8c8", side: "#ead59b", top: "#fcf6e4", line: "#a8841a" },
    r: { front: "#ecc9c5", side: "#e2aca5", top: "#f8ebe9", line: "#b83a2e" }
  };
  var TONE_WORD = { g: "עומדת בכל הדרישות", y: "עומדת, במרווח קטן", r: "חורגת" };
  /* c: W, D, R, top, boxes [{ox, oy, w, d, z0, H}], tone, ground, setb, env (0 עד 1), grow (0 עד 1), labels */
  function isoDraw(c) {
    var sc = Math.min(290 / (0.866 * (c.W + c.D)), 250 / ((c.W + c.D) / 2 + c.top)), CX = 160 - (c.W - c.D) * 0.866 * sc / 2, CY = 24 + c.top * sc;
    var R = c.R, z = zoneOf(R, c.W, c.D), t = TONES[c.tone || "n"], h = "", EN = "#6f859c";
    function pt(x, y, zz) { return ((x - y) * 0.866 * sc + CX).toFixed(1) + "," + ((x + y) * 0.5 * sc - zz * sc + CY).toFixed(1); }
    function poly(a) { return a.map(function (q) { return pt(q[0], q[1], q[2]); }).join(" "); }
    function rect(x1, y1, x2, y2, zz) { return poly([[x1, y1, zz], [x2, y1, zz], [x2, y2, zz], [x1, y2, zz]]); }
    var ga = c.ground === undefined ? 1 : c.ground, sa = c.setb === undefined ? 1 : c.setb, e = c.env === undefined ? 1 : c.env, gr = c.grow === undefined ? 1 : c.grow;
    h += '<polygon points="' + rect(0, 0, c.W, c.D, 0) + '" fill="#f1f1ef" stroke="#151515" stroke-width="1.4" opacity="' + ga + '"/>';
    if (z.ok) h += '<polygon points="' + rect(z.x1, z.y1, z.x2, z.y2, 0) + '" fill="none" stroke="' + EN + '" stroke-dasharray="4 4" opacity="' + sa + '"/>';
    var eh = has(R.h) ? R.h * e : 0;
    if (eh > 0) h += '<g stroke="' + EN + '" stroke-width=".9" stroke-dasharray="4 4" fill="none"><polyline points="' + poly([[z.x1, z.y1, 0], [z.x1, z.y1, eh]]) + '"/><polyline points="' + poly([[z.x2, z.y1, 0], [z.x2, z.y1, eh]]) + '"/><polyline points="' + poly([[z.x1, z.y2, 0], [z.x1, z.y2, eh]]) + '"/></g>';
    (c.boxes || []).forEach(function (b) {
      var z0 = b.z0 * gr, H = b.H * gr; if (H <= 0) return;
      var x2 = b.ox + b.w, y2 = b.oy + b.d, zt = z0 + H;
      h += '<polygon points="' + poly([[b.ox, y2, z0], [x2, y2, z0], [x2, y2, zt], [b.ox, y2, zt]]) + '" fill="' + t.front + '" stroke="#151515" stroke-width="1.3" stroke-linejoin="round"/>';
      h += '<polygon points="' + poly([[x2, b.oy, z0], [x2, y2, z0], [x2, y2, zt], [x2, b.oy, zt]]) + '" fill="' + t.side + '" stroke="#151515" stroke-width="1.3" stroke-linejoin="round"/>';
      h += '<polygon points="' + rect(b.ox, b.oy, x2, y2, zt) + '" fill="' + t.top + '" stroke="#151515" stroke-width="1.3" stroke-linejoin="round"/>';
      for (var f = 1; f * FLH < H - 0.2; f++) h += '<polyline points="' + poly([[b.ox, y2, z0 + f * FLH], [x2, y2, z0 + f * FLH], [x2, b.oy, z0 + f * FLH]]) + '" fill="none" stroke="' + t.line + '" stroke-width=".7"/>';
    });
    if (eh > 0) {
      h += '<g stroke="' + EN + '" stroke-width=".9" stroke-dasharray="4 4" fill="none"><polygon points="' + rect(z.x1, z.y1, z.x2, z.y2, eh) + '"/><polyline points="' + poly([[z.x2, z.y2, 0], [z.x2, z.y2, eh]]) + '"/></g>';
      if (c.labels && e === 1) {
        var lp = pt(z.x1, z.y1, eh).split(",");
        h += '<text x="' + lp[0] + '" y="' + (Number(lp[1]) - 7) + '" font-size="11" fill="#4a6079" text-anchor="middle" direction="rtl" font-family="Heebo, Arial">גובה מרבי ' + fmt(R.h) + " מ'</text>";
      }
    }
    return h;
  }
  function topOf(p) {
    var alts = p.alts || genAlts(p);
    return Math.max(has(p.R.h) ? p.R.h : 0, Math.max.apply(null, ALT_KEYS.map(function (k) { return alts[k].n * FLH; })), 6);
  }
  function isoSVG(p, a, o) {
    o = o || {};
    var dm = dims(p), g = a ? geom(a, p) : null;
    return '<svg viewBox="0 0 320 300" role="img" aria-label="' + (o.label || "מודל") + '">' + isoDraw({ W: dm.W, D: dm.D, R: p.R, top: topOf(p), boxes: g ? g.boxes : [], tone: o.tone, labels: o.labels }) + "</svg>";
  }

  function renderAlts() {
    var p = P(), L = limits(p), has3 = !!p.alts;
    $("#trio").hidden = !has3; $("#trioLegend").hidden = !has3; $("#massAct").hidden = has3;
    if (!has3) { $("#trio").innerHTML = ""; return; }
    var maxFp = f10(L.zw * L.zd), maxFl = L.maxFl + 4;
    $("#trio").innerHTML = ALT_KEYS.map(function (k) {
      var a = p.alts[k];
      return '<div class="tcol" data-col="' + k + '"><div class="tmodel"></div>' +
        '<div class="thead"><b>חלופה ' + k + " · " + ALT_NAME[a.kind] + '</b><span class="tfit" data-tfit="' + k + '"></span></div>' +
        '<p class="tunique">' + ALT_UNIQUE[a.kind] + "</p>" +
        '<dl class="kv tight" data-sum="' + k + '"></dl>' +
        '<div class="slide"><span>שטח קומה</span><input type="range" min="100" max="' + maxFp + '" step="10" value="' + a.fp + '" data-fp="' + k + '" aria-label="שטח קומה, חלופה ' + k + '"><output class="num" data-ofp="' + k + '"></output></div>' +
        '<div class="slide"><span>קומות</span><input type="range" min="1" max="' + maxFl + '" step="1" value="' + a.n + '" data-fl="' + k + '" aria-label="קומות, חלופה ' + k + '"><output class="num" data-ofl="' + k + '"></output></div></div>';
    }).join("");
  }
  function paintAlts(sum) {
    var p = P(); if (!p.alts) return;
    ALT_KEYS.forEach(function (k) {
      var a = p.alts[k], c = sum.all[k].c, col = $('#trio [data-col="' + k + '"]'); if (!col) return;
      $(".tmodel", col).innerHTML = isoSVG(p, a, { tone: "n", label: "חלופה " + k });
      $('[data-ofp="' + k + '"]').textContent = fmt(a.fp, 0) + ' מ"ר';
      $('[data-ofl="' + k + '"]').textContent = a.n;
      $('[data-sum="' + k + '"]').innerHTML = kv([
        ["שטח קומה", tiers(a).map(function (t) { return fmt(t.fp, 0); }).join(" / ") + ' מ"ר'],
        ["קומות", tiers(a).map(function (t) { return t.fl; }).join(" + ")],
        ["שטח כולל", fmt(c.gross, 0) + ' מ"ר'],
        ["גובה", fmt(c.h) + " מ'"],
        ['יח"ד', c.units + " · " + fmt(c.avg, 0) + ' מ"ר בממוצע'],
        ["שטח פתוח", fmt(c.open, 0) + "%"],
        ["מקומות חניה", String(c.parking)]
      ]);
      $('[data-tfit="' + k + '"]').innerHTML = p.decided ? '<i class="dot ' + sum.all[k].tone + '"></i>' + fmt(c.util, 0) + "% מיצוי" : "טרם נבחנה";
    });
  }
  function renderDecide(sum) {
    var p = P(), hasAlts = !!p.alts;
    $("#decideIn").innerHTML = hasAlts ? kv(ALT_KEYS.map(function (k) { var x = sum.all[k]; return ["חלופה " + k + " · " + ALT_NAME[x.a.kind], fmt(x.c.gross, 0) + ' מ"ר · ' + x.c.floors + " קומות"]; })) : "";
    $("#decideWrap").hidden = !(hasAlts && p.decided);
    if (!hasAlts) return;
    $("#fitTrio").innerHTML = ALT_KEYS.map(function (k) {
      var x = sum.all[k];
      return '<div class="tcol' + (k === sum.best ? " on" : "") + '"><div class="tmodel">' + isoSVG(p, x.a, { tone: x.tone, label: "חלופה " + k }) + '</div>' +
        '<div class="tscore"><b>' + fmt(x.c.util, 0) + '%</b><span>מיצוי · חלופה ' + k + "</span></div>" +
        '<p class="tword"><i class="dot ' + x.tone + '"></i>' + TONE_WORD[x.tone] + "</p>" +
        '<p class="pc"><b class="good">יתרון</b>' + esc(x.pro) + '</p><p class="pc"><b class="bad">חיסרון</b>' + esc(x.con) + "</p></div>";
    }).join("");
    $("#fitTitle").innerHTML = sum.best ? "<mark><b>נבחרה חלופה " + sum.best + ", " + ALT_NAME[sum.all[sum.best].a.kind] + ".</b></mark>" : '<b class="bad">אין חלופה שעומדת בכל הדרישות.</b>';
    $("#reco").textContent = sum.best ? sum.why : "מתקנים את החלופות בצעד הקודם, או מעדכנים את הדרישות.";
    var names = sum.all[ALT_KEYS[0]].ch;
    $("#fit").innerHTML = "<thead><tr><th>בדיקה</th><th>מקור</th>" + ALT_KEYS.map(function (k) { return '<th class="alt-col">חלופה ' + k + "</th>"; }).join("") + "</tr></thead><tbody>" +
      names.map(function (row, i) {
        return "<tr><td>" + row.n + "<small>" + esc(row.lim) + '</small></td><td class="muted small">' + esc(row.src) + "</td>" + ALT_KEYS.map(function (k) {
          var x = sum.all[k].ch[i];
          return '<td class="c"><i class="dot ' + (x.st === "n" ? "" : x.st) + '"></i>' + esc(x.val) + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody>";
  }

  function refreshA(opts) {
    opts = opts || {};
    var sum = summary();
    if (!opts.keepRights) { renderDocs(); renderPlot(); renderReqs(); }
    else paintRightsStatus();
    if (!opts.keepAlts) renderAlts();
    paintAlts(sum);
    renderDecide(sum);
    if (window.update3D) window.update3D();
  }

  /* ---------- מהלך בצעדים: הסבר, ואז קלט ופלט ---------- */
  var visited = load("flowv", []);
  var flowPos = {};
  var EXT = {};
  var STEP_DONE = {
    docs: function () { return !!A.planBuilt; },
    plot: function () { return !!A.plot; },
    reqs: function () { return !!A.req.done; },
    mass: function () { return !!A.plot && !!P().alts; },
    decide: function () { return !!A.plot && !!P().decided; }
  };
  var VIEW_NEEDS = {
    "a/alts": { ok: function () { return STEP_DONE.docs() && STEP_DONE.plot(); }, text: "קודם בוחרים מגרש ובונים את הבניין לפי טבלה 5.", to: "#a/plan" },
    "a/decide": { ok: function () { return STEP_DONE.mass(); }, text: "קודם יוצרים את שלוש החלופות.", to: "#a/alts" }
  };
  function flowSteps(v) { return $$(":scope > .step", v.el); }
  function stepId(st) { return st.getAttribute("data-step"); }
  function stepKey(v, st) { return key(v) + ":" + stepId(st); }
  function isDone(v, st) {
    var f = v.page === "a" ? STEP_DONE[stepId(st)] : (EXT[v.page] && EXT[v.page].done && EXT[v.page].done[stepId(st)]);
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
    if (v.page === "a" && window.update3D) window.update3D();
    if (EXT[v.page] && EXT[v.page].render) EXT[v.page].render(v, cur, pos);
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

  function mountVP() {
    var st = curStep(), vp = $("#vp"), slot = st && $('[data-slot="vp"]', st), id = st ? stepId(st) : "";
    var ok = slot && ((id === "docs" && A.planBuilt) || (id === "plot" && A.planBuilt && A.plot));
    if (ok) { if (vp.parentNode !== slot) slot.appendChild(vp); }
    else if (vp.parentNode !== $("#vpStore")) $("#vpStore").appendChild(vp);
  }

  /* המודל התלת-ממדי קורא מכאן את התכנית, את המגרש שנבחר ואת הבניין */
  function worldBox(pl, b) {
    return { x: pl.x + b.ox, y: pl.front === "n" ? pl.y + pl.d - (b.oy + b.d) : pl.y + b.oy, w: b.w, d: b.d, z0: b.z0, H: b.H };
  }
  window.TOOL = {
    plan: function () {
      var st = curStep(), focus = st && stepId(st) === "plot" && A.plot && PLAN.plots[A.plot] ? A.plot : null, out;
      out = { margin: PLAN.margin, road: PLAN.road, flh: FLH, focus: focus, plots: Object.keys(PLAN.plots).map(function (id) {
        var g = PLAN.plots[id]; return { id: id, x: g.x, y: g.y, w: g.w, d: g.d };
      }), boxes: [], zone: null };
      if (focus) {
        var p = P(), pl = PLAN.plots[focus], L = limits(p), a = genAlts(p)["א"];
        out.boxes = geom(a, p).boxes.map(function (b) { return worldBox(pl, b); });
        var zb = worldBox(pl, { ox: L.z.x1, oy: L.z.y1, w: L.zw, d: L.zd, z0: 0, H: 0 });
        out.zone = { x: zb.x, y: zb.y, w: zb.w, d: zb.d, h: has(p.R.h) ? p.R.h : 0 };
      }
      return out;
    },
    volume: function () {
      var ids = Object.keys(A.data).filter(function (id) { var d = A.data[id]; return d.decided && d.alts && PLAN.plots[id]; });
      if (!ids.length) return null;
      var id = A.plot && ids.indexOf(A.plot) !== -1 ? A.plot : ids[0], p = A.data[id], sum = summary(p);
      if (!sum.best) return { none: true, plotId: id };
      var x = sum.all[sum.best], g = geom(x.a, p), L = limits(p);
      return { mode: MODE, plotId: id, key: sum.best, kind: x.a.kind, name: ALT_NAME[x.a.kind], W: g.W, D: g.D, boxes: JSON.parse(JSON.stringify(g.boxes)),
        flh: FLH, R: JSON.parse(JSON.stringify(p.R)), c: JSON.parse(JSON.stringify(x.c)), tone: x.tone, why: sum.why, area: L.area, parkRate: SYS().park };
    },
    pick: function (id) { var st = curStep(); if (st && stepId(st) === "plot") choosePlot(id); },
    visible: function () { var h = $("#iso3d"); return document.body.getAttribute("data-page") === "a" && !!h && h.offsetParent !== null; }
  };

  function choosePlot(id) {
    id = String(id).trim(); if (!id) return;
    if (!PLAN.plots[id]) { $("#plotMsg").innerHTML = '<span class="bad">מגרש ' + esc(id) + " לא נמצא בתכנית.</span> המגרשים בתכנית: " + Object.keys(PLAN.plots).join(", ") + "."; return; }
    $("#plotMsg").textContent = "אפשר גם ללחוץ על מגרש במודל.";
    if (A.plot !== id) { A.plot = id; }
    $("#plotNum").value = id;
    saveA(); refreshA(); renderFlow();
  }
  function collectReqs() {
    var q = A.req, p = P(), found = parseDev(q.text || ""), bits = [];
    if (has(found.target)) { q.target = found.target; bits.push("יעד של " + found.target + ' יח"ד'); }
    if (has(found.avg)) { q.avg = found.avg; bits.push('שטח ממוצע של ' + found.avg + ' מ"ר'); }
    if (found.prio) { q.prio = found.prio; bits.push("עדיפות: " + PRIOS[found.prio]); }
    if (!has(q.target)) q.target = has(p.R.units) ? Math.round(p.R.units * 0.8) : 0;
    q.found = bits.join(", "); q.done = true;
  }
  function wireA() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-open],[data-del],[data-conn]");
      if (!t) return;
      if (t.hasAttribute("data-open")) {
        var f = docsCache[PK(t.getAttribute("data-open"))];
        if (f && f.file) { var u = URL.createObjectURL(f.file); window.open(u, "_blank", "noopener"); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }
      } else if (t.hasAttribute("data-del")) {
        var k = PK(t.getAttribute("data-del"));
        delete docsCache[k]; renderDocs(); renderFlow(); docDel(k);
      } else if (t.hasAttribute("data-conn")) {
        var id = t.getAttribute("data-conn"); A.req.src[id] = !A.req.src[id]; syncFlh(); regenAll(); saveA(); refreshA({ keepAlts: true }); renderFlow();
      }
    });
    document.addEventListener("change", function (e) {
      var up = e.target.closest("input[data-up]"), su = e.target.closest("input[data-srcup]");
      if (up && up.files && up.files[0]) {
        var file = up.files[0], k = PK(up.getAttribute("data-up"));
        var rec = { name: file.name, size: file.size, type: file.type, file: file, ts: Date.now() };
        docsCache[k] = rec; renderDocs(); renderFlow(); docPut(k, rec);
        if (MODE === "live") {
          if (isTextFile(file)) readText(file).then(function (t) { $("#liveMsg").textContent = file.name + ": " + importTable(t, file.name); });
          else $("#liveMsg").textContent = file.name + " נשמר ואפשר לפתוח אותו. הוא לא נקרא אוטומטית: מדביקים את הטבלה מ-Excel, או מעלים אותה כ-CSV.";
        }
      }
      if (su && su.files && su.files[0]) {
        var sid = su.getAttribute("data-srcup"), sf = su.files[0];
        A.req.files[sid] = sf.name; A.req.read = A.req.read || {}; A.req.read[sid] = "";
        if (MODE === "live" && isTextFile(sf)) {
          readText(sf).then(function (t) {
            var got = parseSys(t); A.req.read[sid] = got.length ? "נקראו: " + got.join(", ") : "לא נמצאו ערכים מוכרים";
            if (got.length) A.req.src[sid] = true;
            syncFlh(); regenAll(); renderLive(); saveA(); refreshA({ keepRights: true }); renderReqs();
          });
        } else { saveA(); renderReqs(); }
      }
      var rq = e.target.closest("[data-req]");
      if (rq) {
        var key = rq.getAttribute("data-req");
        A.req[key] = key === "prio" ? rq.value : (rq.value === "" ? null : Number(rq.value));
        saveA(); refreshA({ keepRights: true, keepAlts: true }); if (A.req.done) renderReqs();
      }
    });
    document.addEventListener("input", function (e) {
      var t = e.target, p = P(), k;
      if (!t.matches) return;
      if (t.id === "devText") { A.req.text = t.value; saveA(); return; }
      if (t.matches("[data-k]")) {
        k = t.getAttribute("data-k");
        var x = PARAMS.filter(function (q) { return q.k === k; })[0];
        p.R[k] = x.text ? t.value.trim() : (t.value === "" ? null : Number(t.value));
        p.fromDemo = false; $("#demoTag").hidden = true;
        if (p.alts) p.alts = genAlts(p);
        saveA(); refreshA({ keepRights: true });
      } else if (t.matches("[data-src]")) {
        p.src[t.getAttribute("data-src")] = t.value.trim(); saveA(); paintRightsStatus();
      } else if (t.matches("[data-fp]")) {
        p.alts[t.getAttribute("data-fp")].fp = Number(t.value); saveA(); refreshA({ keepRights: true, keepAlts: true });
      } else if (t.matches("[data-fl]")) {
        p.alts[t.getAttribute("data-fl")].n = Number(t.value); saveA(); refreshA({ keepRights: true, keepAlts: true });
      }
    });
    $("#demoDocs").addEventListener("click", function () { A.demoDocs = true; saveA(); renderDocs(); renderFlow(); });
    $("#planGo").addEventListener("click", function () { A.planBuilt = true; saveA(); renderDocs(); renderFlow(); });
    $("#plotGo").addEventListener("click", function () { choosePlot($("#plotNum").value); });
    $("#plotNum").addEventListener("keydown", function (e) { if (e.key === "Enter") choosePlot($("#plotNum").value); });
    $("#reqGo").addEventListener("click", function () { collectReqs(); saveA(); refreshA({ keepAlts: true }); renderFlow(); });
    $("#massGo").addEventListener("click", function () { var p = P(); p.alts = genAlts(p); p.decided = false; saveA(); refreshA({ keepRights: true }); renderFlow(); });
    $("#decideGo").addEventListener("click", function () { P().decided = true; saveA(); refreshA({ keepRights: true, keepAlts: true }); renderFlow(); });
    function toggleFit() { var w = $("#fitWrap"), h = $("#fitToggle"); w.hidden = !w.hidden; h.classList.toggle("open", !w.hidden); h.setAttribute("aria-expanded", String(!w.hidden)); }
    $("#fitToggle").addEventListener("click", toggleFit);
    $("#fitToggle").addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFit(); } });
    /* הקלטה שמתמללת לעברית, כשהדפדפן תומך */
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, btn = $("#recBtn");
    if (SR) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        if (rec) { rec.stop(); return; }
        rec = new SR(); rec.lang = "he-IL"; rec.interimResults = false; rec.continuous = true;
        btn.textContent = "עצירה"; btn.classList.add("on");
        rec.onresult = function (ev) {
          var txt = ""; for (var i = ev.resultIndex; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
          var box = $("#devText"); box.value = (box.value ? box.value + " " : "") + txt.trim(); A.req.text = box.value; saveA();
        };
        rec.onend = rec.onerror = function () { rec = null; btn.textContent = "הקלטה"; btn.classList.remove("on"); };
        try { rec.start(); } catch (err) { rec = null; btn.textContent = "הקלטה"; btn.classList.remove("on"); }
      });
    }
    $("#importBtn").addEventListener("click", function () {
      var msg = $("#importMsg"), raw = $("#importBox").value, p = P(), n = 0;
      if (!A.plot) { msg.textContent = "קודם בוחרים מגרש."; return; }
      raw.split(/\n/).forEach(function (line) {
        PARAMS.forEach(function (x) {
          var i = line.indexOf(x.n); if (i === -1) return;
          var rest = line.slice(i + x.n.length).replace(/^[\s:*|]+/, ""), parts = rest.split(/\|/);
          var val = parts[0].trim(), src = (parts[1] || "").replace(/^\s*מקור\s*:?\s*/, "").trim();
          if (/לא נמצא/.test(val) || val === "") { p.R[x.k] = x.text ? "" : null; n++; }
          else if (x.text) { p.R[x.k] = val; n++; }
          else { var num = val.replace(/,/g, "").match(/-?\d+(\.\d+)?/); if (num) { p.R[x.k] = Number(num[0]); n++; } }
          p.src[x.k] = /לא נמצא/.test(src) ? "" : src;
        });
      });
      if (!n) { msg.textContent = "לא נמצאו ערכים בתשובה. צריך שורה לכל ערך, למשל: שטח מגרש: 2000"; return; }
      p.fromDemo = false; if (p.alts) p.alts = genAlts(p);
      saveA(); refreshA(); renderFlow();
      msg.textContent = "נקלטו " + n + " ערכים למגרש " + A.plot + ".";
    });
    $("#copyAll").addEventListener("click", function () {
      copy(BUILD.map(function (b, i) { return "פרומפט " + (i + 1) + ": " + b.t + "\n\n" + b.x; }).join("\n\n----------\n\n"), $("#copyAllMsg"));
    });
  }

  /* ---------- הדגמה חיה: הנתונים של המשתמש, מקצה לקצה ---------- */
  var HCOL = [["sf", /קדמי/], ["ss", /צדדי/], ["sr", /אחורי/], ["cov", /תכסית/], ["bp", /אחוז|בנייה|בניה/], ["floors", /קומות/], ["h", /גובה/],
    ["units", /יח.?ד|יחידות/], ["parking", /חניה/], ["plot", /שטח/], ["w", /רוחב/], ["d", /עומק|אורך/], ["side", /מיקום|צד|דרך/], ["id", /מגרש|מספר|מס/]];
  var TPL_HEAD = ["מספר מגרש", "רוחב", "עומק", "מיקום", "שטח מגרש", "תכסית", "אחוזי בנייה", "קומות", "גובה", "קו בניין קדמי", "קו בניין צדדי", "קו בניין אחורי", 'יח"ד'];
  var TPL_ROW = ["101", "30", "45", "מעל הדרך", "1350", "40", "200", "6", "22", "5", "3", "4", "26"];
  function numOf(v) { var m = String(v == null ? "" : v).replace(/,/g, "").match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : null; }
  /* קורא טבלה בטקסט: טאב, פסיק, נקודה-פסיק או קו אנכי. שורת הכותרות קובעת את העמודות. */
  function parseTable(text) {
    var rows = String(text || "").replace(/\r/g, "").split("\n").filter(function (l) { return l.trim(); });
    if (rows.length < 2) return { err: "צריך שורת כותרות ולפחות שורה אחת של מגרש." };
    var best = "\t", cnt = -1;
    ["\t", ";", "|", ","].forEach(function (d) { var n = rows[0].split(d).length; if (n > cnt) { cnt = n; best = d; } });
    var head = rows[0].split(best).map(function (h) { return h.replace(/["'״׳]/g, "").trim(); }), col = {};
    head.forEach(function (h, i) { for (var j = 0; j < HCOL.length; j++) if (HCOL[j][1].test(h) && col[HCOL[j][0]] === undefined) { col[HCOL[j][0]] = i; break; } });
    if (col.id === undefined) return { err: 'לא נמצאה עמודה "מספר מגרש" בשורת הכותרות.' };
    var out = [], skipped = 0, derived = 0;
    rows.slice(1).forEach(function (l) {
      var c = l.split(best).map(function (x) { return x.trim(); }), id = (c[col.id] || "").replace(/["']/g, "").trim();
      if (!id) return;
      var R = {}, any = false;
      PARAMS.forEach(function (x) { var i = col[x.k]; if (i === undefined) return; var v = c[i]; if (v === undefined || v === "") return; if (x.text) { R[x.k] = v; any = true; } else { var n = numOf(v); if (n !== null) { R[x.k] = n; any = true; } } });
      var w = col.w !== undefined ? numOf(c[col.w]) : null, d = col.d !== undefined ? numOf(c[col.d]) : null;
      if (!(w > 0 && d > 0)) {
        if (R.plot > 0) { w = Math.round(Math.sqrt(R.plot * 0.8) * 10) / 10; d = Math.round(R.plot / w * 10) / 10; derived++; } else { skipped++; return; }
      }
      var side = col.side !== undefined && /מתחת|דרום|^b$|^2$/i.test(c[col.side] || "") ? "b" : "a";
      out.push({ id: id, w: w, d: d, side: side, R: R, any: any });
    });
    if (!out.length) return { err: "לא נמצא מגרש עם רוחב ועומק, או עם שטח." };
    return { plots: out, skipped: skipped, derived: derived };
  }
  function importTable(text, name) {
    var r = parseTable(text);
    if (r.err) return r.err;
    r.plots.forEach(function (q) {
      var cur = A.live.plots.filter(function (x) { return x.id === q.id; })[0];
      if (cur) { cur.w = q.w; cur.d = q.d; cur.side = q.side; } else A.live.plots.push({ id: q.id, w: q.w, d: q.d, side: q.side });
      if (q.any) A.live.rights[q.id] = q.R;
      delete A.data[q.id];
    });
    A.live.file = name || "הטבלה שהודבקה";
    applyLivePlan(); saveA(); renderLive(); renderDocs(); refreshA(); renderFlow();
    return "נקלטו " + r.plots.length + " מגרשים" + (r.derived ? ", " + r.derived + " עם מידות שנגזרו מהשטח" : "") + (r.skipped ? ", " + r.skipped + " שורות דולגו (בלי מידות ובלי שטח)" : "") + ".";
  }
  /* קובץ שהועלה: טקסט נקרא, והשאר נשמר בלבד */
  function readText(file) {
    return new Promise(function (res) {
      var fr = new FileReader();
      fr.onload = function () {
        var buf = fr.result, t;
        try { t = new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch (e) { try { t = new TextDecoder("windows-1255").decode(buf); } catch (e2) { t = ""; } }
        res(t);
      };
      fr.onerror = function () { res(""); };
      fr.readAsArrayBuffer(file);
    });
  }
  function isTextFile(f) { return /\.(csv|tsv|txt|md)$/i.test(f.name) || /^text\//.test(f.type); }
  function parseSys(text) {
    var found = [], S = A.live.sys, m;
    function take(re, key, label, unit) { if ((m = text.match(re))) { var v = Number(m[1]); if (v > 0) { S[key] = v; found.push(label + " " + fmt(v) + unit); } } }
    take(/שטח פתוח[^\d\n]{0,25}(\d+(?:\.\d+)?)/, "open", "שטח פתוח", "%");
    take(/חזית[^\d\n]{0,25}(\d+(?:\.\d+)?)/, "front", "רוחב מול חזית", "%");
    take(/חניה[^\d\n]{0,25}(\d+(?:\.\d+)?)/, "park", "חניה ליח\"ד", "");
    take(/גובה קומה[^\d\n]{0,25}(\d+(?:\.\d+)?)/, "flh", "גובה קומה", " מ'");
    return found;
  }
  function regenAll() { Object.keys(A.data).forEach(function (id) { var q = A.data[id]; if (q.alts && PLAN.plots[id]) q.alts = genAlts(q); }); }
  var SYS_FIELDS = [["open", "הנחיות מרחביות: שטח פתוח מזערי, %"], ["front", "הנחיות מרחביות: רוחב הבניין מול החזית, % לפחות"], ["park", 'אוגדן הדרישות: מקומות חניה ליח"ד'], ["flh", "תקנות: גובה קומה, מ'"]];
  function renderLive() {
    var on = MODE === "live";
    $("#liveDocs").hidden = !on; $("#demoDocs").hidden = on; $("#sysEdit").hidden = !on;
    if (!on) return;
    $("#livePlots").innerHTML = A.live.plots.length ? A.live.plots.map(function (q, i) {
      return '<tr><td><input type="text" data-lp="id" data-i="' + i + '" value="' + esc(q.id) + '" aria-label="מספר מגרש"></td>' +
        '<td><input type="number" step="any" min="1" data-lp="w" data-i="' + i + '" value="' + q.w + '" aria-label="רוחב"></td>' +
        '<td><input type="number" step="any" min="1" data-lp="d" data-i="' + i + '" value="' + q.d + '" aria-label="עומק"></td>' +
        '<td><select data-lp="side" data-i="' + i + '" aria-label="מיקום"><option value="a"' + (q.side !== "b" ? " selected" : "") + '>מעל הדרך</option><option value="b"' + (q.side === "b" ? " selected" : "") + '>מתחת לדרך</option></select></td>' +
        '<td><button class="btn small" type="button" data-lpdel="' + i + '">הסרה</button></td></tr>';
    }).join("") : '<tr><td colspan="5" class="muted small">עוד אין מגרשים. מעלים או מדביקים טבלה, או מוסיפים מגרש.</td></tr>';
    $("#sysFields").innerHTML = SYS_FIELDS.map(function (f) {
      return '<div><label>' + f[1] + '<input type="number" step="any" min="0" data-sys="' + f[0] + '" value="' + A.live.sys[f[0]] + '"></label></div>';
    }).join("");
  }
  function renderModeBar() {
    $$("button[data-mode]").forEach(function (b) { var on = b.getAttribute("data-mode") === MODE; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  }
  function setMode(m) {
    if (m === MODE) return;
    saveA(); MODE = m; save("mode", m);
    A = fixA(load(aKey(), freshA())); applyMode();
    $("#plotNum").value = A.plot || ""; $("#devText").value = A.req.text || ""; $("#dev").innerHTML = ""; $("#importMsg").textContent = ""; $("#liveMsg").textContent = "";
    $("#plotMsg").textContent = "אפשר גם ללחוץ על מגרש במודל.";
    flowSteps_reset();
    renderModeBar(); renderLive(); refreshA(); renderFlow();
    if (current && current.page === "a" && current.id !== "start") location.hash = "a/start";
  }
  function flowSteps_reset() { Object.keys(flowPos).forEach(function (k) { if (k.indexOf("a/") === 0) flowPos[k] = 0; }); }
  function decisionText() {
    var sum = summary(), p = P();
    if (!A.plot || !p.alts || !sum.best) return "";
    var out = ["מגרש " + A.plot + ": " + (sum.best ? "נבחרה חלופה " + sum.best + ", " + ALT_NAME[sum.all[sum.best].a.kind] + "." : "אין חלופה שעומדת בכל הדרישות."), sum.why, ""];
    ALT_KEYS.forEach(function (k) {
      var x = sum.all[k];
      out.push("חלופה " + k + " (" + ALT_NAME[x.a.kind] + "): מיצוי " + fmt(x.c.util, 0) + "%, " + x.c.floors + " קומות, " + fmt(x.c.gross, 0) + ' מ"ר, ' + x.c.units + ' יח"ד. ' + TONE_WORD[x.tone] + ".");
      out.push("יתרון: " + x.pro); out.push("חיסרון: " + x.con); out.push("");
    });
    return out.join("\n");
  }
  function wireLive() {
    document.addEventListener("click", function (e) {
      var m = e.target.closest("button[data-mode]");
      if (m) { setMode(m.getAttribute("data-mode")); return; }
      var del = e.target.closest("[data-lpdel]");
      if (del) {
        var i = Number(del.getAttribute("data-lpdel")), q = A.live.plots[i]; if (!q) return;
        A.live.plots.splice(i, 1); delete A.live.rights[q.id]; delete A.data[q.id];
        applyLivePlan(); saveA(); renderLive(); renderDocs(); refreshA(); renderFlow(); return;
      }
    });
    $("#liveAdd").addEventListener("click", function () {
      var n = A.live.plots.reduce(function (m, q) { var v = parseInt(q.id, 10); return isNaN(v) ? m : Math.max(m, v); }, 100) + 1;
      A.live.plots.push({ id: String(n), w: 30, d: 40, side: "a" });
      applyLivePlan(); saveA(); renderLive(); renderDocs(); refreshA(); renderFlow();
    });
    $("#liveClear").addEventListener("click", function () {
      if (A.live.plots.length && !window.confirm("למחוק את כל המגרשים והזכויות שהוזנו?")) return;
      A.live.plots = []; A.live.rights = {}; A.data = {}; A.plot = null; A.planBuilt = false; A.live.file = "";
      applyLivePlan(); saveA(); renderLive(); renderDocs(); refreshA(); renderFlow(); $("#liveMsg").textContent = "";
    });
    $("#livePasteBtn").addEventListener("click", function () {
      var t = $("#livePaste").value;
      if (!t.trim()) { $("#liveMsg").textContent = "מדביקים כאן טבלה עם שורת כותרות."; return; }
      $("#liveMsg").textContent = importTable(t, "הטבלה שהודבקה");
    });
    $("#liveTpl").addEventListener("click", function () { copy(TPL_HEAD.join("\t") + "\n" + TPL_ROW.join("\t"), $("#liveMsg")); });
    document.addEventListener("input", function (e) {
      var t = e.target; if (!t.matches) return;
      if (t.matches("[data-lp='w'],[data-lp='d']")) {
        var q = A.live.plots[Number(t.getAttribute("data-i"))], v = Number(t.value); if (!q || !(v > 0)) return;
        var old = Math.round(q.w * q.d), pd = A.data[q.id];
        q[t.getAttribute("data-lp")] = v;
        if (pd && pd.R.plot === old && !pd.src.plot) pd.R.plot = Math.round(q.w * q.d);
        if (pd && pd.alts) pd.alts = genAlts(pd);
        applyLivePlan(); saveA(); refreshA({ keepRights: true });
      } else if (t.matches("[data-sys]")) {
        var k = t.getAttribute("data-sys"), n = Number(t.value); if (!(n > 0)) return;
        A.live.sys[k] = n; syncFlh(); regenAll(); saveA(); refreshA({ keepRights: true }); if (A.req.done) renderReqs();
      }
    });
    document.addEventListener("change", function (e) {
      var t = e.target; if (!t.matches) return;
      if (t.matches("[data-lp='side']")) {
        var q = A.live.plots[Number(t.getAttribute("data-i"))]; if (!q) return;
        q.side = t.value; applyLivePlan(); saveA(); refreshA({ keepRights: true });
      } else if (t.matches("[data-lp='id']")) {
        var i = Number(t.getAttribute("data-i")), q2 = A.live.plots[i], nid = t.value.trim();
        if (!q2) return;
        if (!nid || A.live.plots.some(function (x, j) { return j !== i && x.id === nid; })) { t.value = q2.id; $("#liveMsg").textContent = "מספר המגרש חייב להיות ייחודי ולא ריק."; return; }
        var oid = q2.id;
        if (A.live.rights[oid]) { A.live.rights[nid] = A.live.rights[oid]; delete A.live.rights[oid]; }
        if (A.data[oid]) { A.data[nid] = A.data[oid]; A.data[nid].id = nid; delete A.data[oid]; }
        if (A.plot === oid) A.plot = nid;
        q2.id = nid; applyLivePlan(); saveA(); refreshA(); renderFlow(); $("#liveMsg").textContent = "";
      }
    });
    $("#decideCopy").addEventListener("click", function () { var t = decisionText(); if (t) copy(t, $("#decideCopyMsg")); });
  }

  function renderVerify() {
    var v = VERIFY, box = $("#verifyOut");
    if (!v) { box.innerHTML = '<p class="muted">הבדיקה עוד לא הורצה.</p>'; return; }
    box.innerHTML = '<p class="what">' + rich(v.verdict) + "</p>" +
      '<ol class="outlist req">' + v.checks.map(function (c) { return "<li><b>" + esc(c[0]) + '</b><span><i class="dot ' + (c[1] === true ? "g" : (c[1] === false ? "r" : "")) + '"></i>' + (c[1] === true ? "עובד" : (c[1] === false ? "לא נבנה" : "לא נבדק")) + "</span></li>"; }).join("") + "</ol>" +
      (v.gaps.length ? '<h3>מה היה חסר בפרומפטים</h3><ol class="plain">' + v.gaps.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ol>" : "") +
      '<div class="io-act"><a class="btn dark" href="' + v.url + '" target="_blank" rel="noopener">פתיחת האפליקציה שנבנתה מהפרומפטים</a></div>' +
      '<p class="small muted">' + esc(v.how) + "</p>";
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
          A = freshA(); save(aKey(), A);
          visited = visited.filter(function (k) { return k.indexOf("a/") !== 0; }); save("flowv", visited); location.reload();
        } }
      ];
    } catch (e) { /* הרכיב עוד לא נטען */ }
  }
  function wireMenu() {
    if (!window.customElements || !customElements.whenDefined) return;
    customElements.whenDefined("ai-menu").then(setMenu);
  }

  /* גשר לדפים נוספים (מפגש ג) */
  window.APP = { load: load, save: save, esc: esc, fmt: fmt, has: has, copy: copy, $: $, $$: $$, rich: rich, lines: lines, ext: EXT, needs: VIEW_NEEDS,
    refresh: function () { renderFlow(); }, docPut: docPut, docDel: docDel, docs: function () { return docsCache; },
    sys: function () { return SYS(); }, volume: function () { return window.TOOL.volume(); }, current: function () { return current; }, FLH: function () { return FLH; } };

  /* ---------- הפעלה ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildB();
    $("#buildList").innerHTML = BUILD.map(function (b, i) { return '<div class="prompt" data-build="' + b.id + '" data-label="' + (i + 1) + ". " + esc(b.t) + '"></div>'; }).join("");
    renderVerify();
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
    wireLive();
    applyMode(); renderModeBar(); renderLive();
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
