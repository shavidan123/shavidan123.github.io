(function () {
  var ROLL_MS = 900;
  var HISTORY_MAX = 8;

  var stats = { rolls: 0, nat20s: 0, nat1s: 0, last: 20, history: [] };

  var styles = ''
    + '.d20-widget{position:fixed;bottom:16px;right:16px;z-index:9999;'
    + 'font-family:"Courier New",monospace;user-select:none;display:flex;'
    + 'flex-direction:column;align-items:center;gap:6px;width:170px}'
    + '.d20-stage{position:relative;line-height:0;width:80px;height:80px;'
    + 'display:flex;align-items:center;justify-content:center}'
    + '.d20-die{width:72px;height:72px;cursor:pointer;outline:none;'
    + '-webkit-tap-highlight-color:transparent;transform-origin:50% 60%;'
    + 'transition:filter .15s ease}'
    + '.d20-die:hover{filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45)) brightness(1.08)}'
    + '.d20-die:focus-visible{filter:drop-shadow(0 0 6px #E2A84B)}'
    + '.d20-die{filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45))}'
    + '.d20-die.rolling{animation:d20-tumble .9s linear}'
    + '.d20-die.crit{animation:d20-crit 1.2s ease}'
    + '.d20-die.fumble{animation:d20-shake .55s ease}'
    + '@keyframes d20-tumble{'
    + '0%{transform:translateY(0) rotate(0) scale(1)}'
    + '25%{transform:translateY(-24px) rotate(360deg) scale(1.35)}'
    + '50%{transform:translateY(-30px) rotate(560deg) scale(1.45)}'
    + '72%{transform:translateY(-10px) rotate(680deg) scale(1.2)}'
    + '88%{transform:translateY(0) rotate(720deg) scaleX(1.15) scaleY(.78)}'
    + '100%{transform:translateY(0) rotate(720deg) scale(1)}}'
    + '@keyframes d20-crit{'
    + '0%,100%{filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45))}'
    + '50%{filter:drop-shadow(0 0 14px #FFD24A) drop-shadow(0 0 28px #ff9c1c)}}'
    + '@keyframes d20-shake{'
    + '0%,100%{transform:translateX(0)}'
    + '20%,60%{transform:translateX(-5px)}'
    + '40%,80%{transform:translateX(5px)}}'
    + '.d20-stats{font-size:10px;line-height:1.5;text-align:center;'
    + 'letter-spacing:.5px;padding:5px 10px;border-radius:3px;'
    + 'background:rgba(0,0,0,.55);color:#e8d6b4;'
    + 'border:1px solid rgba(226,168,75,.45);'
    + 'text-transform:lowercase;display:flex;flex-direction:column;gap:5px;'
    + 'align-items:center;width:130px;box-sizing:border-box}'
    + '[data-theme="light"] .d20-stats{'
    + 'background:rgba(245,241,236,.94);color:#2C2520;'
    + 'border-color:rgba(184,133,47,.55)}'
    + '.d20-history{display:flex;gap:3px}'
    + '.d20-cell{width:10px;height:10px;border-radius:1px;'
    + 'background:transparent;border:1px solid rgba(226,168,75,.3)}'
    + '[data-theme="light"] .d20-cell{border-color:rgba(184,133,47,.45)}'
    + '.d20-cell.low{background:rgba(226,168,75,.35);border-color:#a17328}'
    + '.d20-cell.mid{background:#E2A84B;border-color:#7a541c}'
    + '.d20-cell.crit{background:#FFD24A;border-color:#8a5d00;'
    + 'box-shadow:0 0 4px rgba(255,210,74,.7)}'
    + '.d20-cell.fumble{background:#E74C3C;border-color:#5d1814;'
    + 'box-shadow:0 0 4px rgba(231,76,60,.6)}'
    + '.d20-flash{position:absolute;top:-4px;right:50%;'
    + 'transform:translate(50%,-100%);font-family:"Courier New",monospace;'
    + 'font-size:13px;font-weight:800;letter-spacing:.5px;'
    + 'white-space:nowrap;opacity:0;pointer-events:none;'
    + 'text-shadow:1px 1px 0 #000, 0 0 8px rgba(0,0,0,.85)}'
    + '[data-theme="light"] .d20-flash{'
    + 'text-shadow:1px 1px 0 rgba(255,255,255,.7), 0 0 6px rgba(0,0,0,.4)}'
    + '.d20-flash.show{animation:d20-flash 1.7s ease forwards}'
    + '@keyframes d20-flash{'
    + '0%{opacity:0;transform:translate(50%,-90%) scale(.7)}'
    + '15%{opacity:1;transform:translate(50%,-130%) scale(1.1)}'
    + '25%{transform:translate(50%,-130%) scale(1)}'
    + '80%{opacity:1;transform:translate(50%,-140%) scale(1)}'
    + '100%{opacity:0;transform:translate(50%,-170%) scale(1)}}'
    + '@media (max-width:600px){'
    + '.d20-widget{bottom:10px;right:10px;width:140px;gap:4px}'
    + '.d20-stage{width:64px;height:64px}'
    + '.d20-die{width:58px;height:58px}'
    + '.d20-stats{font-size:9px;width:110px;padding:4px 8px}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  var widget = document.createElement('div');
  widget.className = 'd20-widget';
  widget.innerHTML = ''
    + '<div class="d20-stage">'
    + '  <span class="d20-flash" id="d20-flash"></span>'
    + '  <svg class="d20-die" id="d20-die" viewBox="0 0 80 80" '
    + '       shape-rendering="crispEdges" aria-label="roll d20" role="button" tabindex="0">'
    + '    <polygon points="40,4 76,30 64,74 16,74 4,30" '
    + '             fill="#E2A84B" stroke="#1a1612" stroke-width="4" stroke-linejoin="miter"/>'
    + '    <polygon points="40,4 76,30 40,40" fill="#B8852F" stroke="#1a1612" stroke-width="2.5"/>'
    + '    <polygon points="76,30 64,74 40,40" fill="#D89638" stroke="#1a1612" stroke-width="2.5"/>'
    + '    <polygon points="40,4 4,30 40,40"   fill="#E2A84B" stroke="#1a1612" stroke-width="2.5"/>'
    + '    <polygon points="4,30 16,74 40,40"  fill="#B8852F" stroke="#1a1612" stroke-width="2.5"/>'
    + '    <polygon points="16,74 64,74 40,40" fill="#F5C26B" stroke="#1a1612" stroke-width="2.5"/>'
    + '    <text id="d20-num" x="40" y="52" text-anchor="middle" '
    + '          font-family="\'Courier New\',monospace" font-size="30" font-weight="900" '
    + '          fill="#FFF6DC" stroke="#1a1612" stroke-width="1.3" '
    + '          paint-order="stroke" stroke-linejoin="round">20</text>'
    + '  </svg>'
    + '</div>'
    + '<div class="d20-stats">'
    + '  <div>rolls: <span id="d20-rolls">0</span></div>'
    + '  <div class="d20-history" id="d20-history"></div>'
    + '</div>';
  document.body.appendChild(widget);

  var dieEl   = document.getElementById('d20-die');
  var numEl   = document.getElementById('d20-num');
  var flashEl = document.getElementById('d20-flash');
  var rollsEl = document.getElementById('d20-rolls');
  var histEl  = document.getElementById('d20-history');

  function tierClass(n) {
    if (n === 20) return 'crit';
    if (n === 1)  return 'fumble';
    if (n >= 11)  return 'mid';
    return 'low';
  }

  function renderHistory() {
    histEl.innerHTML = '';
    var pad = HISTORY_MAX - stats.history.length;
    for (var i = 0; i < pad; i++) {
      var empty = document.createElement('span');
      empty.className = 'd20-cell';
      histEl.appendChild(empty);
    }
    for (var j = 0; j < stats.history.length; j++) {
      var n = stats.history[j];
      var c = document.createElement('span');
      c.className = 'd20-cell ' + tierClass(n);
      c.title = 'rolled ' + n;
      histEl.appendChild(c);
    }
  }

  function render() {
    numEl.textContent = stats.last;
    rollsEl.textContent = stats.rolls;
    renderHistory();
  }
  render();

  var rolling = false;
  function roll() {
    if (rolling) return;
    rolling = true;
    dieEl.classList.remove('crit', 'fumble');
    void dieEl.offsetWidth;
    dieEl.classList.add('rolling');

    var flicker = setInterval(function () {
      numEl.textContent = 1 + Math.floor(Math.random() * 20);
    }, 50);

    setTimeout(function () {
      clearInterval(flicker);
      dieEl.classList.remove('rolling');
      var result = 1 + Math.floor(Math.random() * 20);
      stats.last = result;
      stats.rolls += 1;
      if (result === 20) stats.nat20s += 1;
      if (result === 1)  stats.nat1s  += 1;
      stats.history.push(result);
      if (stats.history.length > HISTORY_MAX) stats.history.shift();
      render();

      if (result === 20) {
        dieEl.classList.add('crit');
        flashEl.textContent = 'critical success!';
        flashEl.style.color = '#FFD24A';
      } else if (result === 1) {
        dieEl.classList.add('fumble');
        flashEl.textContent = 'critical failure';
        flashEl.style.color = '#E74C3C';
      } else {
        flashEl.textContent = '';
      }
      if (flashEl.textContent) {
        flashEl.classList.remove('show');
        void flashEl.offsetWidth;
        flashEl.classList.add('show');
      }
      rolling = false;
    }, ROLL_MS);
  }

  dieEl.addEventListener('click', roll);
  dieEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); roll(); }
  });
})();
