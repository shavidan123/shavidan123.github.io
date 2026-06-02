(function () {
  var ROLL_MS = 950;
  var HISTORY_MAX = 50;
  var HIST_HEIGHT_PX = 28;
  var PIXEL_SIZE = 4;
  var FACES = 20;
  var KERNEL = [0.08, 0.24, 0.36, 0.24, 0.08];

  var stats = { rolls: 0, nat20s: 0, nat1s: 0, last: 20, history: [] };

  var styles = ''
    + '.d20-widget{position:fixed;bottom:14px;right:14px;z-index:9999;'
    + 'font-family:"Courier New",monospace;user-select:none;display:flex;'
    + 'flex-direction:column;align-items:center;gap:6px}'
    + '.d20-stage{position:relative;width:64px;height:64px;'
    + 'display:flex;align-items:flex-end;justify-content:center;'
    + 'perspective:600px}'
    + '.d20-shadow{position:absolute;bottom:1px;left:50%;width:42px;height:7px;'
    + 'border-radius:50%;pointer-events:none;'
    + 'background:radial-gradient(ellipse,rgba(0,0,0,.55),rgba(0,0,0,0) 70%);'
    + 'transform:translateX(-50%) scale(1);opacity:.9}'
    + '.d20-stage.rolling .d20-shadow{animation:d20-shadow .95s linear}'
    + '@keyframes d20-shadow{'
    + '0%{transform:translateX(-50%) scale(1);opacity:.9}'
    + '30%{transform:translateX(-50%) scale(.55);opacity:.35}'
    + '50%{transform:translateX(-50%) scale(.42);opacity:.28}'
    + '70%{transform:translateX(-50%) scale(.7);opacity:.5}'
    + '88%{transform:translateX(-50%) scaleX(1.45) scaleY(.8);opacity:.9}'
    + '100%{transform:translateX(-50%) scale(1);opacity:.9}}'
    + '.d20-die{width:58px;height:58px;cursor:pointer;outline:none;'
    + '-webkit-tap-highlight-color:transparent;transform-origin:50% 50%;'
    + 'filter:drop-shadow(2px 2px 0 rgba(0,0,0,.4));'
    + 'transition:filter .15s ease}'
    + '.d20-die:hover{filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45)) brightness(1.08)}'
    + '.d20-die:focus-visible{filter:drop-shadow(0 0 6px #E2A84B)}'
    + '.d20-die.rolling{animation:d20-tumble .95s cubic-bezier(.35,.05,.5,.95)}'
    + '.d20-die.crit{animation:d20-crit 1.2s ease}'
    + '.d20-die.fumble{animation:d20-shake .55s ease}'
    + '@keyframes d20-tumble{'
    + '0%{transform:translateY(0) rotateY(0) rotate(0) scale(1)}'
    + '15%{transform:translateY(-20px) rotateY(220deg) rotate(20deg) scale(1.2)}'
    + '32%{transform:translateY(-32px) rotateY(540deg) rotate(50deg) scale(1.3)}'
    + '50%{transform:translateY(-36px) rotateY(900deg) rotate(70deg) scale(1.35)}'
    + '68%{transform:translateY(-26px) rotateY(1260deg) rotate(50deg) scale(1.22)}'
    + '83%{transform:translateY(-8px) rotateY(1620deg) rotate(20deg) scale(1.08)}'
    + '92%{transform:translateY(0) rotateY(1800deg) rotate(0) scaleX(1.35) scaleY(.62)}'
    + '100%{transform:translateY(0) rotateY(1800deg) rotate(0) scale(1)}}'
    + '@keyframes d20-crit{'
    + '0%,100%{filter:drop-shadow(2px 2px 0 rgba(0,0,0,.4))}'
    + '50%{filter:drop-shadow(0 0 14px #FFD24A) drop-shadow(0 0 26px #ff9c1c)}}'
    + '@keyframes d20-shake{'
    + '0%,100%{transform:translateX(0)}'
    + '20%,60%{transform:translateX(-5px)}'
    + '40%,80%{transform:translateX(5px)}}'
    + '.d20-stats{font-size:9px;line-height:1.4;letter-spacing:.5px;'
    + 'padding:5px 7px 6px;border-radius:3px;'
    + 'background:rgba(0,0,0,.55);color:#e8d6b4;'
    + 'border:1px solid rgba(226,168,75,.4);'
    + 'text-transform:lowercase;display:flex;flex-direction:column;gap:4px;'
    + 'align-items:center;box-sizing:border-box}'
    + '[data-theme="light"] .d20-stats{'
    + 'background:rgba(245,241,236,.94);color:#2C2520;'
    + 'border-color:rgba(184,133,47,.5)}'
    + '.d20-meta{display:flex;gap:8px;font-size:9px}'
    + '.d20-meta b{font-weight:700}'
    + '.d20-hist{display:flex;gap:1px;align-items:flex-end;'
    + 'height:' + HIST_HEIGHT_PX + 'px}'
    + '.d20-col{width:' + PIXEL_SIZE + 'px;display:flex;'
    + 'flex-direction:column;justify-content:flex-end;gap:1px;height:100%;'
    + 'align-items:center}'
    + '.d20-pixel{width:' + PIXEL_SIZE + 'px;height:' + PIXEL_SIZE + 'px;'
    + 'background:rgba(226,168,75,.55)}'
    + '.d20-pixel.crit{background:#FFD24A;'
    + 'box-shadow:0 0 3px rgba(255,210,74,.75)}'
    + '.d20-pixel.fumble{background:#E74C3C;'
    + 'box-shadow:0 0 3px rgba(231,76,60,.65)}'
    + '.d20-axis{display:flex;justify-content:space-between;'
    + 'width:' + (FACES * PIXEL_SIZE + (FACES - 1)) + 'px;'
    + 'font-size:7px;opacity:.55;letter-spacing:0;margin-top:1px}'
    + '.d20-flash{position:absolute;top:-6px;right:50%;'
    + 'transform:translate(50%,-100%);font-family:"Courier New",monospace;'
    + 'font-size:12px;font-weight:800;letter-spacing:.5px;'
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
    + '.d20-widget{bottom:10px;right:10px;gap:4px}'
    + '.d20-stage{width:56px;height:56px}'
    + '.d20-die{width:50px;height:50px}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  var widget = document.createElement('div');
  widget.className = 'd20-widget';
  widget.innerHTML = ''
    + '<div class="d20-stage" id="d20-stage">'
    + '  <div class="d20-shadow"></div>'
    + '  <span class="d20-flash" id="d20-flash"></span>'
    + '  <svg class="d20-die" id="d20-die" viewBox="0 0 80 80" '
    + '       shape-rendering="crispEdges" aria-label="roll d20" role="button" tabindex="0">'
    + '    <polygon points="40,8 72,28 60,60 40,76 20,60 8,28" '
    + '             fill="#B8852F" stroke="#1a1612" stroke-width="3" stroke-linejoin="miter"/>'
    + '    <polygon points="40,8 72,28 60,60" fill="#D89638" stroke="#1a1612" stroke-width="2"/>'
    + '    <polygon points="40,8 20,60 8,28" fill="#A67324" stroke="#1a1612" stroke-width="2"/>'
    + '    <polygon points="60,60 40,76 20,60" fill="#8a5d1c" stroke="#1a1612" stroke-width="2"/>'
    + '    <polygon points="40,8 60,60 20,60" fill="#F5C26B" stroke="#1a1612" stroke-width="2.5"/>'
    + '    <text id="d20-num" x="40" y="52" text-anchor="middle" '
    + '          font-family="\'Courier New\',monospace" font-size="26" font-weight="900" '
    + '          fill="#FFF6DC" stroke="#1a1612" stroke-width="1.2" '
    + '          paint-order="stroke" stroke-linejoin="round">20</text>'
    + '  </svg>'
    + '</div>'
    + '<div class="d20-stats">'
    + '  <div class="d20-meta">'
    + '    <span>rolls: <b id="d20-rolls">0</b></span>'
    + '    <span>last: <b id="d20-last">-</b></span>'
    + '  </div>'
    + '  <div class="d20-hist" id="d20-hist"></div>'
    + '  <div class="d20-axis"><span>1</span><span>20</span></div>'
    + '</div>';
  document.body.appendChild(widget);

  var stageEl = document.getElementById('d20-stage');
  var dieEl   = document.getElementById('d20-die');
  var numEl   = document.getElementById('d20-num');
  var flashEl = document.getElementById('d20-flash');
  var rollsEl = document.getElementById('d20-rolls');
  var lastEl  = document.getElementById('d20-last');
  var histEl  = document.getElementById('d20-hist');

  var cols = [];
  for (var i = 0; i < FACES; i++) {
    var c = document.createElement('div');
    c.className = 'd20-col';
    c.title = String(i + 1);
    histEl.appendChild(c);
    cols.push(c);
  }

  function pixelClass(value) {
    if (value === 20) return 'crit';
    if (value === 1)  return 'fumble';
    return '';
  }

  function smoothCounts(counts) {
    var half = Math.floor(KERNEL.length / 2);
    var smoothed = new Array(counts.length).fill(0);
    for (var i = 0; i < counts.length; i++) {
      var sum = 0;
      for (var k = -half; k <= half; k++) {
        var j = i + k;
        if (j >= 0 && j < counts.length) {
          sum += counts[j] * KERNEL[k + half];
        }
      }
      smoothed[i] = sum;
    }
    return smoothed;
  }

  function renderHistogram() {
    var counts = new Array(FACES).fill(0);
    for (var i = 0; i < stats.history.length; i++) {
      counts[stats.history[i] - 1] += 1;
    }
    var smoothed = smoothCounts(counts);
    var maxSmoothed = 0;
    for (var j = 0; j < FACES; j++) {
      if (smoothed[j] > maxSmoothed) maxSmoothed = smoothed[j];
    }
    var maxBars = Math.floor((HIST_HEIGHT_PX + 1) / (PIXEL_SIZE + 1));
    var scale = maxSmoothed > 0 ? maxBars / maxSmoothed : 0;

    for (var k = 0; k < FACES; k++) {
      var col = cols[k];
      while (col.firstChild) col.removeChild(col.firstChild);
      var bars = Math.round(smoothed[k] * scale);
      if (smoothed[k] > 0 && bars === 0) bars = 1;
      var cls = pixelClass(k + 1);
      for (var b = 0; b < bars; b++) {
        var px = document.createElement('div');
        px.className = 'd20-pixel' + (cls ? ' ' + cls : '');
        col.appendChild(px);
      }
    }
  }

  function render() {
    numEl.textContent = stats.last;
    rollsEl.textContent = stats.rolls;
    lastEl.textContent = stats.rolls ? stats.last : '-';
    renderHistogram();
  }
  render();

  var rolling = false;
  function roll() {
    if (rolling) return;
    rolling = true;
    dieEl.classList.remove('crit', 'fumble');
    void dieEl.offsetWidth;
    dieEl.classList.add('rolling');
    stageEl.classList.add('rolling');

    var flicker = setInterval(function () {
      numEl.textContent = 1 + Math.floor(Math.random() * 20);
    }, 45);

    setTimeout(function () {
      clearInterval(flicker);
      dieEl.classList.remove('rolling');
      stageEl.classList.remove('rolling');
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
