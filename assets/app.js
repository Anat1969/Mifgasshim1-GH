(function () {
  "use strict";

  var C = window.COURSE;
  var DONE_KEY = "mifgasshim1-done";

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function getDone() {
    try {
      return JSON.parse(localStorage.getItem(DONE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function setDone(list) {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(list));
    } catch (e) { /* אין שמירה מקומית: הדף עובד בלעדיה */ }
  }

  function copyText(text, btn) {
    var original = btn.textContent;
    var done = function () {
      btn.textContent = "הועתק";
      setTimeout(function () { btn.textContent = original; }, 1500);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else {
      fallback();
    }
    function fallback() {
      var t = document.createElement("textarea");
      t.value = text;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
      done();
    }
  }

  function promptBlock(label, text, lang) {
    var wrap = h("div", "prompt");
    var head = h("div", "prompt-head");
    head.appendChild(h("span", "muted small", label));
    var btn = h("button", "linkbtn", lang === "en" ? "Copy" : "העתק");
    btn.type = "button";
    btn.addEventListener("click", function () { copyText(text, btn); });
    head.appendChild(btn);
    var p = h("p", "prompt-text", text);
    p.setAttribute("dir", lang === "en" ? "ltr" : "rtl");
    wrap.appendChild(head);
    wrap.appendChild(p);
    return wrap;
  }

  function progressText() {
    var total = 0;
    Object.keys(C.sessions).forEach(function (k) {
      C.sessions[k].stages.forEach(function (s) { total += s.nodes.length; });
    });
    return getDone().length + " מתוך " + total + " צמתים סומנו כנלמדו";
  }

  function updateProgress() {
    var p = document.getElementById("progress");
    if (p) p.textContent = progressText();
  }

  function nodeCard(sessionKey, node, done) {
    var key = sessionKey + "." + node.n;
    var article = h("article", "node");
    article.id = "n" + sessionKey + "-" + node.n;

    var top = h("div", "node-top");
    top.appendChild(h("span", "muted small", "צומת " + node.n));
    if (node.draft) top.appendChild(h("span", "tag", "טיוטה לעריכה"));
    article.appendChild(top);

    article.appendChild(h("h3", "node-title", node.title));
    article.appendChild(h("p", "node-goal", node.goal));

    if (node.works) {
      var w = h("p", "row");
      w.appendChild(h("span", "label", "דבר אחד שעובד"));
      w.appendChild(document.createTextNode(node.works));
      article.appendChild(w);
    }
    if (node.ask) {
      var a = h("p", "row");
      a.appendChild(h("span", "label", "שאלה אחת לבינה"));
      a.appendChild(document.createTextNode(node.ask));
      article.appendChild(a);
    }

    article.appendChild(promptBlock("פרומפט · עברית", node.prompt, "he"));
    if (node.promptEn) article.appendChild(promptBlock("Prompt · English", node.promptEn, "en"));

    var mark = h("button", "linkbtn mark", done.indexOf(key) === -1 ? "סמן כנלמד" : "סומן. בטל");
    mark.type = "button";
    mark.addEventListener("click", function () {
      var list = getDone();
      var i = list.indexOf(key);
      if (i === -1) list.push(key); else list.splice(i, 1);
      setDone(list);
      mark.textContent = i === -1 ? "סומן. בטל" : "סמן כנלמד";
      updateProgress();
    });
    article.appendChild(mark);
    return article;
  }

  function renderSession(key) {
    var s = C.sessions[key];
    var root = document.getElementById("stages");
    if (!s || !root) return;
    document.getElementById("kicker").textContent = s.kicker;
    document.getElementById("title").textContent = s.title;
    document.getElementById("intro").textContent = s.intro;
    var done = getDone();

    s.stages.forEach(function (stage) {
      var sec = h("section", "stage");
      var head = h("div", "stage-head");
      head.appendChild(h("h2", "stage-name", stage.name));
      head.appendChild(h("span", "muted small", stage.note));
      sec.appendChild(head);
      stage.nodes.forEach(function (node) {
        sec.appendChild(nodeCard(key, node, done));
      });
      root.appendChild(sec);
    });

    if (s.example) {
      var ex = h("section", "stage");
      ex.appendChild(h("h2", "stage-name", s.example.title));
      ex.appendChild(h("p", "muted", s.example.note));
      var table = h("table", "grid");
      var thead = h("tr");
      s.example.head.forEach(function (c) { thead.appendChild(h("th", "", c)); });
      table.appendChild(thead);
      s.example.rows.forEach(function (r) {
        var tr = h("tr");
        r.forEach(function (c) { tr.appendChild(h("td", "", c)); });
        table.appendChild(tr);
      });
      ex.appendChild(table);
      root.appendChild(ex);
    }
    updateProgress();
  }

  function renderIndex() {
    var list = document.getElementById("sessions");
    if (list) {
      Object.keys(C.sessions).forEach(function (k) {
        var s = C.sessions[k];
        var a = h("a", "card");
        a.href = "session-" + k + ".html";
        a.appendChild(h("span", "muted small", s.kicker));
        a.appendChild(h("span", "card-title", s.title));
        a.appendChild(h("span", "muted", s.intro));
        list.appendChild(a);
      });
    }
    var apps = document.getElementById("apps");
    if (apps) {
      Object.keys(C.apps).forEach(function (group) {
        var col = h("div", "app-col");
        col.appendChild(h("p", "muted small", group + " · לאישור"));
        C.apps[group].forEach(function (app) {
          var row = h("div", "app");
          row.appendChild(document.createTextNode(app.name + " "));
          row.appendChild(h("span", "muted small", "· " + app.level));
          col.appendChild(row);
        });
        apps.appendChild(col);
      });
    }
    updateProgress();
  }

  function renderReference() {
    var r = C.reference;
    var gl = document.getElementById("glossary");
    if (gl) {
      r.glossary.forEach(function (g) {
        var row = h("div", "gloss");
        row.appendChild(h("dt", "gloss-term", g.term));
        row.appendChild(h("dd", "gloss-def", g.def));
        gl.appendChild(row);
      });
    }
    var pr = document.getElementById("processes");
    if (pr) {
      r.processes.forEach(function (p) {
        var sec = h("section", "stage");
        sec.appendChild(h("h2", "stage-name", p.title));
        var ol = h("ol", "steps");
        p.steps.forEach(function (s) { ol.appendChild(h("li", "", s)); });
        sec.appendChild(ol);
        pr.appendChild(sec);
      });
    }
  }

  function wireMenu() {
    var btn = document.getElementById("menuBtn");
    var menu = document.getElementById("menu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function () {
      var open = menu.hasAttribute("hidden");
      if (open) menu.removeAttribute("hidden"); else menu.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    if (page === "index") renderIndex();
    if (page === "session") renderSession(document.body.getAttribute("data-session"));
    if (page === "reference") renderReference();
    wireMenu();
  });
})();
