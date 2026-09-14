/*!
 * OrientSquare Toast — vanilla JS port of the Geist-style stacked toast component.
 * No build step, no framework, no Tailwind dependency: styles are injected on first use.
 *
 * Usage:
 *   Toast.success("Property saved.");
 *   Toast.warning("The Evil Rabbit jumped over the fence.");
 *   Toast.error("Could not load listings.");
 *   Toast.message({ text: "Removed from favorites.", onUndoAction: () => restore() });
 *   Toast.message({ text: "Reserve this apartment?", preserve: true,
 *                   action: "Reserve", onAction: () => reserve() });
 *
 * Behaviour mirrors the original React component:
 *   - toasts stack bottom-right, last 3 visible, older ones collapse behind with scale/offset
 *   - hovering the stack expands it and pauses every auto-dismiss timer (resumes on leave)
 *   - auto-dismiss after 3s unless `preserve: true`
 */
(function (global) {
  "use strict";

  var DURATION = 3000;
  var VISIBLE = 3;
  var COLLAPSED_PEEK = 20;   // px of each hidden toast visible when collapsed
  var EXPANDED_GAP = 10;     // px between toasts when the stack is hovered
  var FALLBACK_HEIGHT = 63;  // px, used before a toast has been measured

  var STYLES = [
    ':root{',
    '--os-toast-bg:#fff;--os-toast-fg:hsla(0,0%,9%,1);',
    '--os-toast-success:oklch(57.61% 0.2508 258.23);',
    '--os-toast-warning:oklch(77.21% 0.1991 64.28);',
    '--os-toast-error:oklch(58.19% 0.2482 25.15);',
    '--os-toast-contrast:#fff;',
    '--os-toast-hover:hsla(0,0%,0%,0.08);',
    '--os-toast-shadow:0 0 0 1px rgba(0,0,0,.08),0 1px 1px rgba(0,0,0,.02),0 4px 8px -4px rgba(0,0,0,.04),0 16px 24px -8px rgba(0,0,0,.06);',
    '--os-toast-primary:#F57C00;--os-toast-primary-h:#EF6C00;',
    '}',
    '@media (prefers-color-scheme:dark){:root:not(.light){',
    '--os-toast-bg:#0a0a0a;--os-toast-fg:hsla(0,0%,93%,1);',
    '--os-toast-error:oklch(58.01% 0.227 25.12);',
    '--os-toast-hover:hsla(0,0%,100%,0.09);',
    '--os-toast-shadow:0 0 0 1px rgba(255,255,255,.145),0 1px 2px rgba(0,0,0,.16),0 16px 24px -8px rgba(0,0,0,.4);',
    '}}',
    '.dark{',
    '--os-toast-bg:#0a0a0a;--os-toast-fg:hsla(0,0%,93%,1);',
    '--os-toast-hover:hsla(0,0%,100%,0.09);',
    '--os-toast-shadow:0 0 0 1px rgba(255,255,255,.145),0 1px 2px rgba(0,0,0,.16),0 16px 24px -8px rgba(0,0,0,.4);',
    '}',

    '.os-toaster{position:fixed;bottom:16px;right:16px;z-index:9999;pointer-events:none;width:420px;max-width:calc(100vw - 32px);}',
    '.os-toaster-inner{position:relative;pointer-events:auto;width:100%;}',

    '.os-toast{position:absolute;right:0;bottom:0;width:100%;box-sizing:border-box;',
    'padding:16px;border-radius:12px;line-height:21px;font-size:.875rem;height:fit-content;',
    'box-shadow:var(--os-toast-shadow);',
    'transition:all .35s cubic-bezier(.25,.75,.6,.98);',
    'background:var(--os-toast-bg);color:var(--os-toast-fg);}',
    '.os-toast--success{background:var(--os-toast-success);color:var(--os-toast-contrast);}',
    '.os-toast--warning{background:var(--os-toast-warning);color:hsla(0,0%,9%,1);}',
    '.os-toast--error{background:var(--os-toast-error);color:var(--os-toast-contrast);}',
    '.os-toast--hidden{opacity:0;pointer-events:none;}',

    '.os-toast-body{display:flex;flex-direction:column;align-items:center;justify-content:space-between;}',
    '.os-toast-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;}',
    '.os-toast-text{flex:1 1 auto;min-width:0;overflow-wrap:anywhere;}',
    '.os-toast-controls{display:flex;gap:4px;flex:0 0 auto;}',
    '.os-toast-actions{width:100%;display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:8px;}',

    '.os-toast-btn{display:inline-flex;justify-content:center;align-items:center;gap:2px;',
    'font:inherit;font-size:.875rem;line-height:1;cursor:pointer;border:0;border-radius:6px;',
    'padding:0 10px;height:32px;transition:background-color .15s,color .15s;background:none;color:inherit;fill:currentColor;}',
    '.os-toast-btn:focus-visible{outline:0;box-shadow:0 0 0 2px var(--os-toast-bg),0 0 0 4px var(--os-toast-primary);}',
    '.os-toast-btn--icon{width:32px;height:32px;padding:0;}',
    '.os-toast-btn--tertiary:hover{background:var(--os-toast-hover);}',
    '.os-toast-btn--primary{background:var(--os-toast-primary);color:#fff;fill:#fff;}',
    '.os-toast-btn--primary:hover{background:var(--os-toast-primary-h);}',

    '@media (max-width:480px){.os-toaster{left:16px;right:16px;width:auto;}}',
    '@media (prefers-reduced-motion:reduce){.os-toast{transition:opacity .2s linear;}}'
  ].join('');

  var CLOSE_SVG = '<svg height="16" width="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"/></svg>';
  var UNDO_SVG = '<svg height="16" width="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 8C13.5 4.96643 11.0257 2.5 7.96452 2.5C5.42843 2.5 3.29365 4.19393 2.63724 6.5H5.25H6V8H5.25H0.75C0.335787 8 0 7.66421 0 7.25V2.75V2H1.5V2.75V5.23347C2.57851 2.74164 5.06835 1 7.96452 1C11.8461 1 15 4.13001 15 8C15 11.87 11.8461 15 7.96452 15C5.62368 15 3.54872 13.8617 2.27046 12.1122L1.828 11.5066L3.03915 10.6217L3.48161 11.2273C4.48831 12.6051 6.12055 13.5 7.96452 13.5C11.0257 13.5 13.5 11.0336 13.5 8Z"/></svg>';

  var toasts = [];
  var nextId = 0;
  var container = null;
  var inner = null;
  var hovered = false;

  function injectStyles() {
    if (document.getElementById('os-toast-styles')) return;
    var style = document.createElement('style');
    style.id = 'os-toast-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function mount() {
    if (container) return;
    injectStyles();
    container = document.createElement('div');
    container.className = 'os-toaster';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');

    inner = document.createElement('div');
    inner.className = 'os-toaster-inner';
    inner.addEventListener('mouseenter', function () {
      hovered = true;
      toasts.forEach(function (t) { pause(t); });
      render();
    });
    inner.addEventListener('mouseleave', function () {
      hovered = false;
      toasts.forEach(function (t) { resume(t); });
      render();
    });

    container.appendChild(inner);
    document.body.appendChild(container);
  }

  function pause(t) {
    if (!t.timer) return;
    clearTimeout(t.timer);
    t.timer = null;
    t.remaining -= Date.now() - t.start;
  }

  function resume(t) {
    if (t.timer || t.preserve) return;
    t.start = Date.now();
    t.timer = setTimeout(function () { remove(t.id); }, Math.max(t.remaining, 0));
  }

  function button(opts) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'os-toast-btn os-toast-btn--' + (opts.variant || 'tertiary') + (opts.icon ? ' os-toast-btn--icon' : '');
    if (opts.icon) { b.innerHTML = opts.html; b.setAttribute('aria-label', opts.label); }
    else { b.textContent = opts.label; }
    b.addEventListener('click', opts.onClick);
    return b;
  }

  function build(t) {
    var el = document.createElement('div');
    el.className = 'os-toast' + (t.type !== 'message' ? ' os-toast--' + t.type : '');
    el.setAttribute('role', t.type === 'error' ? 'alert' : 'status');
    el.setAttribute('aria-live', t.type === 'error' ? 'assertive' : 'polite');

    var body = document.createElement('div');
    body.className = 'os-toast-body';

    var row = document.createElement('div');
    row.className = 'os-toast-row';

    var text = document.createElement('span');
    text.className = 'os-toast-text';
    if (t.text instanceof Node) text.appendChild(t.text);
    else text.textContent = String(t.text);
    row.appendChild(text);

    if (!t.action) {
      var controls = document.createElement('div');
      controls.className = 'os-toast-controls';
      if (typeof t.onUndoAction === 'function') {
        controls.appendChild(button({
          icon: true, html: UNDO_SVG, label: 'Undo',
          onClick: function () { t.onUndoAction(); remove(t.id); }
        }));
      }
      controls.appendChild(button({
        icon: true, html: CLOSE_SVG, label: 'Close',
        onClick: function () { remove(t.id); }
      }));
      row.appendChild(controls);
    }

    body.appendChild(row);

    if (t.action) {
      var actions = document.createElement('div');
      actions.className = 'os-toast-actions';
      actions.appendChild(button({
        label: t.dismissLabel || 'Dismiss',
        onClick: function () { remove(t.id); }
      }));
      actions.appendChild(button({
        variant: 'primary', label: t.action,
        onClick: function () {
          if (typeof t.onAction === 'function') t.onAction();
          remove(t.id);
        }
      }));
      body.appendChild(actions);
    }

    el.appendChild(body);
    return el;
  }

  function transformFor(index, length) {
    if (index === length - 1) return 'none';
    var offset = length - 1 - index;
    var translateY = toasts[length - 1].height || FALLBACK_HEIGHT;
    for (var i = length - 1; i > index; i--) {
      translateY += hovered
        ? (toasts[i - 1].height || FALLBACK_HEIGHT) + EXPANDED_GAP
        : COLLAPSED_PEEK;
    }
    var scale = hovered ? 1 : 1 - 0.05 * offset;
    return 'translate3d(0, calc(100% - ' + translateY + 'px), ' + (-offset) + 'px) scale(' + scale + ')';
  }

  function render() {
    if (!inner) return;
    var length = toasts.length;
    var firstVisible = Math.max(0, length - VISIBLE);

    toasts.forEach(function (t, index) {
      var visible = index >= firstVisible;
      t.el.classList.toggle('os-toast--hidden', !visible);
      if (t.entered) {
        t.el.style.transform = transformFor(index, length);
      } else {
        t.el.style.transform = 'translate3d(0, 100%, 150px) scale(1)';
      }
    });

    var height = 0;
    for (var i = firstVisible; i < length; i++) height += toasts[i].height || FALLBACK_HEIGHT;
    container.style.height = height + 'px';
    inner.style.height = height + 'px';
    container.style.pointerEvents = length ? '' : 'none';
  }

  function add(text, type, opts) {
    opts = opts || {};
    mount();

    var t = {
      id: nextId++,
      text: text,
      type: type,
      preserve: !!opts.preserve,
      action: opts.action,
      dismissLabel: opts.dismissLabel,
      onAction: opts.onAction,
      onUndoAction: opts.onUndoAction,
      height: 0,
      entered: false,
      timer: null,
      remaining: DURATION,
      start: 0
    };

    t.el = build(t);
    inner.appendChild(t.el);
    t.height = t.el.getBoundingClientRect().height || FALLBACK_HEIGHT;
    toasts.push(t);
    render();

    // next frame: slide it in and lay the stack out
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        t.entered = true;
        render();
      });
    });

    if (!t.preserve && !hovered) {
      t.start = Date.now();
      t.timer = setTimeout(function () { remove(t.id); }, DURATION);
    }

    return t.id;
  }

  function remove(id) {
    var index = -1;
    for (var i = 0; i < toasts.length; i++) { if (toasts[i].id === id) { index = i; break; } }
    if (index === -1) return;

    var t = toasts[index];
    if (t.timer) clearTimeout(t.timer);
    toasts.splice(index, 1);

    t.el.classList.add('os-toast--hidden');
    t.el.style.transform = 'translate3d(0, 100%, 150px) scale(1)';
    setTimeout(function () {
      if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
    }, 350);

    render();
  }

  function normalize(input) {
    // message("text") and message({ text, action, ... }) are both accepted
    if (typeof input === 'string' || input instanceof Node) return { text: input };
    return input || { text: '' };
  }

  var Toast = {
    message: function (input) { var o = normalize(input); return add(o.text, 'message', o); },
    success: function (input) { var o = normalize(input); return add(o.text, 'success', o); },
    warning: function (input) { var o = normalize(input); return add(o.text, 'warning', o); },
    error:   function (input) { var o = normalize(input); return add(o.text, 'error', o); },
    remove: remove,
    clear: function () { toasts.slice().forEach(function (t) { remove(t.id); }); }
  };

  global.Toast = Toast;
  if (typeof module === 'object' && module.exports) module.exports = Toast;
})(typeof window !== 'undefined' ? window : this);
