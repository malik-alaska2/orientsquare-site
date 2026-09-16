/* ==========================================================================
   OrientSquare — переключение языков сайта (TR / EN)
   Создано 16.09.2026.

   Как это работает:
   1. Язык определяется так: сохранённый выбор пользователя → язык браузера
      (tr → турецкий, en → английский) → по умолчанию турецкий.
   2. Словарь OS_DICT (файл js/i18n-dict.js) хранит строки в том виде,
      в каком они написаны в HTML, и перевод на оба языка:
         'Find Your Dream Home': {tr:'Hayalinizdeki Evi Bulun', en:'Find Your Dream Home'}
      Поэтому исходные страницы править не нужно — движок подменяет текст
      сам, при загрузке страницы.
   3. Узлы с атрибутом data-i18n пропускаются: на страницах блоков,
      калькулятора, подбора, акций, стройки и кабинета есть собственные
      словари, и они переводят себя сами.
   4. Переключатель языка в шапке и в мобильном меню собирается здесь же —
      в HTML ничего добавлять не нужно.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var KEY = 'os_lang';
  var LANGS = { tr: 'TR', en: 'EN' };

  function detect() {
    var saved = '';
    try { saved = localStorage.getItem(KEY) || ''; } catch (e) {}
    if (saved === 'tr' || saved === 'en') return saved;
    var list = navigator.languages && navigator.languages.length
      ? navigator.languages : [navigator.language || navigator.userLanguage || ''];
    for (var i = 0; i < list.length; i++) {
      var l = (list[i] || '').toLowerCase();
      if (l.indexOf('tr') === 0) return 'tr';
      if (l.indexOf('en') === 0) return 'en';
    }
    return 'tr';
  }

  var lang = detect();
  try {
    /* старое значение 'ru' больше не используется — переводим на турецкий;
       определённый язык сразу сохраняем, чтобы скрипты страниц (блоки,
       калькулятор, кабинет) прочитали его из localStorage и совпали с шапкой */
    localStorage.setItem(KEY, lang);
  } catch (e) {}

  function dict() { return w.OS_DICT || {}; }

  function tr(text) {
    var k = (text || '').replace(/\s+/g, ' ').trim();
    if (!k) return null;
    var row = dict()[k];
    if (!row) return null;
    var v = row[lang];
    return (v === undefined || v === null || v === '') ? null : v;
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };

  function skipNode(el) {
    while (el && el !== d.body) {
      if (SKIP[el.nodeName]) return true;
      if (el.nodeType === 1 && (el.hasAttribute('data-i18n') || el.hasAttribute('data-t') || el.hasAttribute('data-no-i18n'))) return true;
      el = el.parentNode;
    }
    return false;
  }

  function translateText(root) {
    var walker = d.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var raw = node.nodeValue;
      if (!raw || !raw.trim()) continue;
      if (skipNode(node.parentNode)) continue;
      var v = tr(raw);
      if (v === null) continue;
      var lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0];
      node.nodeValue = lead + v + tail;
    }
  }

  var ATTRS = ['placeholder', 'alt', 'title', 'aria-label', 'value'];

  function translateAttrs(root) {
    for (var a = 0; a < ATTRS.length; a++) {
      var name = ATTRS[a];
      var els = root.querySelectorAll('[' + name + ']');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (name === 'value' && el.tagName !== 'INPUT') continue;
        if (name === 'value' && el.type !== 'button' && el.type !== 'submit') continue;
        if (el.hasAttribute('data-no-i18n')) continue;
        var v = tr(el.getAttribute(name));
        if (v !== null) el.setAttribute(name, v);
      }
    }
  }

  function translateTitle() {
    var v = tr(d.title);
    if (v !== null) d.title = v;
    var md = d.querySelector('meta[name="description"]');
    if (md) { var m = tr(md.getAttribute('content')); if (m !== null) md.setAttribute('content', m); }
  }

  function setLang(l) {
    if (l !== 'tr' && l !== 'en') return;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    w.location.reload();
  }

  /* ---------- переключатель языка в шапке ---------- */
  function buildSwitcher() {
    var header = d.querySelector('header');
    if (!header) return;

    /* десктоп: выпадающее меню с флагами заменяем на TR / EN */
    var groups = header.querySelectorAll('.relative.group');
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var panel = g.querySelector('.absolute');
      var btn = g.querySelector('button');
      if (!panel || !btn) continue;
      if (!/English|Türkçe|Русский|🇺🇸|🇹🇷|🇷🇺/.test(panel.textContent + btn.textContent)) continue;

      var label = btn.querySelector('span');
      if (label) label.textContent = LANGS[lang];
      btn.setAttribute('aria-label', 'Language');

      panel.innerHTML = '';
      panel.classList.add('os-lang-panel');
      ['tr', 'en'].forEach(function (code) {
        var b = d.createElement('button');
        b.type = 'button';
        b.className = 'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg '
          + (code === lang ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-700');
        b.textContent = code === 'tr' ? 'Türkçe' : 'English';
        b.addEventListener('click', function () { setLang(code); });
        panel.appendChild(b);
      });
    }

    /* телефон: строка TR | EN в выезжающем меню */
    var menu = d.getElementById('mobileMenu');
    if (menu && !menu.querySelector('.os-lang-mob')) {
      var row = d.createElement('div');
      row.className = 'os-lang-mob flex gap-2 px-2 pt-3 mt-2 border-t border-gray-200';
      ['tr', 'en'].forEach(function (code) {
        var b = d.createElement('button');
        b.type = 'button';
        b.className = 'flex-1 py-2 rounded-lg text-sm font-semibold border '
          + (code === lang ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200 text-gray-700');
        b.textContent = code === 'tr' ? 'Türkçe' : 'English';
        b.addEventListener('click', function () { setLang(code); });
        row.appendChild(b);
      });
      menu.appendChild(row);
    }
  }

  function apply() {
    d.documentElement.setAttribute('lang', lang);
    translateTitle();
    if (d.body) { translateText(d.body); translateAttrs(d.body); }
    buildSwitcher();
  }

  w.OSLang = { get: function () { return lang; }, set: setLang, apply: apply, t: tr };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', apply);
  else apply();

})(window, document);
