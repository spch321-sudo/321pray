/* CPAR321（2026-11-09）：課程內容中英逐句並讀
   繁／简頁並讀英文、英文頁並讀繁體中文。作用在課文、宣教／牧養經文、工作坊、談話步驟、聚會流程、服事守則。
   作法：預先載入另一語言的課程資料（c-xx.json）與字串表，暫時切到那個語言用同一套版型再畫一次（不寫入畫面），
   兩邊依段落結構（LCS 對齊）配對；每一句主要句子後面插入對應的譯句（.cps，灰色小字自成一行）。
   經文區塊依節號逐節配對。朗讀、畫線、領受只收 .sent，並讀句不會被讀到或畫到。設定存 localStorage cpar321。 */
(function () {
  if (window.CPAR321 || typeof setApp !== 'function' || typeof render !== 'function' || typeof L !== 'function') return;
  function EN() { return L() === 'en'; }
  function altL() { return EN() ? 'zh' : 'en'; }
  function altLang() { return EN() ? 'zh-Hant' : 'en'; }
  function ui() { return EN() ? 'en' : (L() === 'zs' ? 'sc' : 'tc'); }
  var STR = {
    tc: { btn: '中英並讀', on: '開', off: '關', loading: '英文內容載入中…', fail: '英文內容載入失敗，請檢查網路' },
    sc: { btn: '中英并读', on: '开', off: '关', loading: '英文内容载入中…', fail: '英文内容载入失败，请检查网络' },
    en: { btn: 'Chinese parallel', on: 'On', off: 'Off', loading: 'Loading the Chinese text…', fail: 'Couldn’t load the Chinese text — check your connection' }
  };
  function T2(k) { return STR[ui()][k]; }
  function isOn() { try { return localStorage.getItem('cpar321') === '1'; } catch (e) { return false; } }
  function setOn(v) { try { localStorage.setItem('cpar321', v ? '1' : ''); } catch (e) { } }
  function isContent() {
    var p = R.page;
    if (p) return ['lesson', 'verse', 'ws', 'min', 'meet'].indexOf(p.t) >= 0;
    return R.tab === 'serve' && R.sub && R.sub.serve === 'rules';
  }

  /* ── 另一語言資料 ── */
  var loading = {}, failed = {};
  function ready(a) { return !!C[a] && (a === 'zh' || !!I18N[a]); }
  function load(a, cb) {
    if (ready(a)) return cb(true);
    if (loading[a]) return; loading[a] = 1;
    var left = 2, ok = true;
    var fin = function () { if (--left) return; loading[a] = 0; failed[a] = !ok || !C[a]; cb(!failed[a]); };
    if (C[a]) fin(); else getJSON(['c-' + a + '.json', 'content/c-' + a + '.json'], function (j) { C[a] = j; fin(); }, function () { ok = false; fin(); });
    loadPack(a, fin);
  }
  var inAlt = false;
  function altRun() {
    var a = altL(); if (!ready(a)) return null;
    var cap = null, oL = S.lang, oSet = window.setApp, oAC = window.applyChrome, oDT = window.drawTabs, oUI = window.updIdle, oLd = window.loading, oLE = window.loadErr;
    var oCS = window.CARDSRC, oLC = window.LCUR, oBusy = window.BUSY;
    inAlt = true;
    try {
      window.setApp = function (h) { cap = h; };
      window.applyChrome = window.drawTabs = window.updIdle = window.loading = window.loadErr = function () { };
      S.lang = a; render();
    } catch (e) { cap = null; }
    finally {
      S.lang = oL; window.setApp = oSet; window.applyChrome = oAC; window.drawTabs = oDT; window.updIdle = oUI; window.loading = oLd; window.loadErr = oLE;
      window.CARDSRC = oCS; window.LCUR = oLC; try { window.BUSY = oBusy; } catch (e) { }
      inAlt = false;
    }
    return cap;
  }

  /* ── 段落配對 ── */
  var SEL = 'h1,h2,h3,h4,h5,p,li,blockquote,td,th,dt,dd,label,.blk,.h2,.say,.qq';
  var SKIP = '.cps,.cparbar,.cpar-st,.top,button,.seg,.chips,.dots,.hl-note,textarea,select';
  function blocks(root) {
    var all = root.querySelectorAll(SEL), out = [];
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest(SKIP)) continue;
      var p = e.parentElement, nested = false;
      while (p && p !== root) { if (p.matches && p.matches(SEL)) { nested = true; break; } p = p.parentElement; }
      if (!nested) out.push(e);
    }
    return out;
  }
  function sig(e) { return e.tagName + '.' + (e.className || '').toString().split(/\s+/).filter(function (c) { return c && !/^(on|done|td|tts-reading)$/.test(c); }).sort().join('.'); }
  function lcs(a, b) {
    var n = a.length, m = b.length, i, j, Lm = [];
    for (i = 0; i <= n; i++) Lm.push(new Uint16Array(m + 1));
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) Lm[i][j] = a[i] === b[j] ? Lm[i + 1][j + 1] + 1 : Math.max(Lm[i + 1][j], Lm[i][j + 1]);
    var pairs = []; i = 0; j = 0;
    while (i < n && j < m) { if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; } else if (Lm[i + 1][j] >= Lm[i][j + 1]) i++; else j++; }
    return pairs;
  }
  function txtOf(e) {
    var c = e.cloneNode(true), k = c.querySelectorAll('button,input,textarea,select,script,style,svg,sup.vn,.hl-note');
    for (var i = 0; i < k.length; i++) k[i].parentNode.removeChild(k[i]);
    return (c.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function pairInto(root, altHtml) {
    if (!root || !altHtml) return 0;
    var old = root.querySelectorAll('.cps'); for (var o = 0; o < old.length; o++) old[o].parentNode.removeChild(old[o]);
    var box = document.createElement('div'); box.innerHTML = altHtml;
    var A = blocks(root), B = blocks(box);
    if (!A.length || !B.length) return 0;
    var n = 0;
    lcs(A.map(sig), B.map(sig)).forEach(function (p) {
      var me = A[p[0]], al = B[p[1]];
      if (me.querySelector('sup.vn') && al.querySelector('sup.vn')) { n += versePair(me, al); return; }
      var t1 = txtOf(me), t2 = txtOf(al);
      if (!t2 || t1 === t2 || !/[A-Za-z一-鿿]/.test(t2)) return;
      n += sentPair(me, t2);
    });
    return n;
  }
  /* 經文：依節號逐節配對，譯文插在該節最後一句後面 */
  function verseMap(el) {
    var m = {}, order = [], cur = null;
    [].forEach.call(el.childNodes, function (c) {
      if (c.nodeType === 1 && c.matches('sup.vn')) { cur = c.textContent.trim(); m[cur] = { last: null, text: '' }; order.push(cur); return; }
      if (cur == null || c.nodeType !== 1 || c.classList.contains('cps')) return;
      m[cur].last = c; m[cur].text += (m[cur].text ? ' ' : '') + c.textContent.trim();
    });
    return { m: m, order: order };
  }
  function versePair(me, al) {
    var A1 = verseMap(me), B1 = verseMap(al), n = 0;
    A1.order.slice().reverse().forEach(function (v) {
      var a = A1.m[v], b = B1.m[v]; if (!a || !a.last || !b || !b.text) return;
      a.last.parentNode.insertBefore(mkSpan(b.text.replace(/\s+/g, ' ')), a.last.nextSibling); n++;
    });
    return n;
  }
  /* ── 逐句 ── */
  var ZH_END = /[。！？；!?]+(?:[」』”’）)】〕]*)/g, EN_END = /[.!?;](?:["”’)\]]*)(?=\s|$)/g;
  function splitSents(t, zh) {
    t = t.replace(/\s+/g, ' ').trim(); if (!t) return [];
    var re = zh ? /[^。！？；!?]+(?:[。！？；!?]+[」』”’）)】〕]*)?/g : /[^.!?;]+(?:[.!?;]+["”’)\]]*)?(?=\s|$)|[^.!?;]+$/g;
    var out = (t.match(re) || [t]).map(function (x) { return x.trim(); }).filter(Boolean), merged = [];
    out.forEach(function (x) {
      if (merged.length && (x.replace(/[\s\p{P}]/gu, '').length < (zh ? 3 : 6))) merged[merged.length - 1] += (zh ? '' : ' ') + x;
      else merged.push(x);
    });
    return merged;
  }
  function plen(t, zh) { return Math.max(1, zh ? t.replace(/[\s\p{P}]/gu, '').length : t.replace(/\s+/g, ' ').length); }
  function mainBounds(block, zh) {
    var re = zh ? ZH_END : EN_END, w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null), node, out = [], acc = '';
    while ((node = w.nextNode())) {
      var pe = node.parentElement;
      if (pe && pe.closest('.cps,button,svg,textarea,select,.hl-note')) continue;
      var tx = node.nodeValue, m, pos = 0, unit = pe && pe.closest('.sent');
      if (unit && !block.contains(unit)) unit = null;
      re.lastIndex = 0;
      while ((m = re.exec(tx))) {
        var end = m.index + m[0].length;
        acc += tx.slice(pos, end); pos = end;
        out.push({ node: node, off: end, unit: unit, text: acc }); acc = '';
      }
      acc += tx.slice(pos);
      if (unit && acc.replace(/\s/g, '') && node === lastText(unit)) { out.push({ node: null, off: 0, unit: unit, text: acc }); acc = ''; }   // 句子單位沒有標點收尾時，也算一句
    }
    if (acc.replace(/\s/g, '')) out.push({ node: null, off: 0, unit: null, text: acc, tail: true });
    var res = [];
    out.forEach(function (b) {
      var last = res[res.length - 1];
      if (last && b.unit && last.unit === b.unit) { last.text += b.text; return; }
      if (b.tail && last && !last.unit && !last.node) { last.text += b.text; return; }
      res.push(b);
    });
    return res;
  }
  function lastText(el) { var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, l = null; while ((n = w.nextNode())) l = n; return l; }
  function align(ma, al, zh) {
    var M = ma.map(function (t) { return plen(t, zh); }), A2 = al.map(function (t) { return plen(t, !zh); });
    var sm = M.reduce(function (a, b) { return a + b; }, 0), sa = A2.reduce(function (a, b) { return a + b; }, 0), r = sa / sm;
    var m = M.length, n = A2.length, INF = 1e9, Cc = [], Bk = [], i, j;
    for (i = 0; i <= m; i++) { Cc.push(new Float64Array(n + 1).fill(INF)); Bk.push(new Array(n + 1)); }
    Cc[0][0] = 0;
    var moves = [[1, 1, 0], [1, 2, .6], [2, 1, .6], [1, 3, 1.4], [3, 1, 1.4], [2, 2, 1], [1, 0, 3], [0, 1, 3]];
    for (i = 0; i <= m; i++) for (j = 0; j <= n; j++) {
      if (Cc[i][j] >= INF) continue;
      moves.forEach(function (mv) {
        var a = i + mv[0], b = j + mv[1]; if (a > m || b > n) return;
        var x = 0, y = 0, k; for (k = i; k < a; k++) x += M[k]; for (k = j; k < b; k++) y += A2[k];
        var c = Cc[i][j] + mv[2] + Math.abs(y - r * x) / Math.sqrt(r * x + y + 1);
        if (c < Cc[a][b]) { Cc[a][b] = c; Bk[a][b] = [i, j]; }
      });
    }
    var groups = []; i = m; j = n;
    while (i > 0 || j > 0) { var p = Bk[i][j]; if (!p) break; groups.unshift([p[0], i, p[1], j]); i = p[0]; j = p[1]; }
    return groups;
  }
  function mkSpan(t) { var d = document.createElement('span'); d.className = 'cps'; d.setAttribute('lang', altLang()); d.textContent = t; return d; }
  function sentPair(me, altText) {
    var zh = !EN(), bounds = mainBounds(me, zh), alts = splitSents(altText, !zh);
    if (!bounds.length || !alts.length) return 0;
    var groups = bounds.length === 1 ? [[0, 1, 0, alts.length]] : align(bounds.map(function (b) { return b.text; }), alts, zh);
    var ins = [], J = zh ? ' ' : '';
    groups.forEach(function (g) {
      var t = alts.slice(g[2], g[3]).join(J); if (!t) return;
      var at = g[1] > g[0] ? g[1] - 1 : Math.max(0, g[0] - 1);
      if (ins.length && ins[ins.length - 1][0] === at) ins[ins.length - 1][1] += J + t; else ins.push([at, t]);
    });
    for (var k = ins.length - 1; k >= 0; k--) {
      var b = bounds[ins[k][0]], sp = mkSpan(ins[k][1]);
      if (b.unit) b.unit.parentNode.insertBefore(sp, b.unit.nextSibling);
      else if (b.node) { var rest = b.node.splitText(b.off); rest.parentNode.insertBefore(sp, rest); }
      else me.appendChild(sp);
    }
    return ins.length;
  }

  /* ── 介面 ── */
  function css() {
    if (document.getElementById('cparCss')) return;
    var st = document.createElement('style'); st.id = 'cparCss';
    st.textContent = '.cps{display:block;margin:2px 0 8px;padding:1px 0 1px 9px;border-left:3px solid color-mix(in srgb,var(--brand) 40%,transparent);font-size:.88em;line-height:1.65;color:color-mix(in srgb,currentColor 62%,transparent);font-weight:400;font-style:normal;letter-spacing:0;text-transform:none;text-align:left;font-family:var(--sans)}'
      + '.h2 .cps,b .cps,label .cps{font-weight:400}.cps[lang="en"]{word-break:normal;overflow-wrap:anywhere}'
      + '.cparbar{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px;margin:2px 0 6px}'
      + '.cparbtn{border:1px solid var(--line);background:var(--card);color:inherit;border-radius:999px;padding:6px 14px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}'
      + '.cparbtn.on{border-color:var(--brand);color:var(--brand)}.cpar-st{font-size:12.5px;opacity:.75;margin:0 0 8px;text-align:right}';
    document.head.appendChild(st);
  }
  function addBar(root) {
    if (root.querySelector('.cparbar')) return;
    var on = isOn(), bar = document.createElement('div'); bar.className = 'cparbar';
    bar.innerHTML = '<button class="cparbtn' + (on ? ' on' : '') + '" onclick="CPAR321.toggle()">🌐 ' + T2('btn') + (EN() ? ': ' : '：') + (on ? T2('on') : T2('off')) + '</button>';
    var top = root.querySelector('.top');
    if (top && top.parentNode === root) root.insertBefore(bar, top.nextSibling); else root.insertBefore(bar, root.firstChild);
  }
  function status(root, msg) {
    var s = root.querySelector('.cpar-st');
    if (!msg) { if (s) s.parentNode.removeChild(s); return; }
    if (!s) { s = document.createElement('div'); s.className = 'cpar-st'; var bar = root.querySelector('.cparbar'); root.insertBefore(s, bar ? bar.nextSibling : root.firstChild); }
    s.textContent = msg;
  }
  var seq = 0;
  function after() {
    if (inAlt || !isContent()) return;
    var root = document.getElementById('app'); if (!root) return;
    css(); addBar(root);
    if (!isOn()) return;
    var a = altL(), my = ++seq;
    if (!ready(a)) {
      status(root, failed[a] ? T2('fail') : T2('loading'));
      load(a, function (ok) { if (my !== seq) return; if (ok) { var y = window.scrollY; render(); window.scrollTo(0, y); } else status(root, T2('fail')); });
      return;
    }
    pairInto(root, altRun());
    if (window.paintHl) paintHl(root);
  }
  var orig = window.setApp;
  window.setApp = function (h) { orig.apply(this, arguments); try { after(); } catch (e) { } };
  window.CPAR321 = {
    toggle: function () { var y = window.scrollY; setOn(!isOn()); render(); window.scrollTo(0, y); },
    _pair: pairInto, _run: altRun, _load: load
  };
})();
