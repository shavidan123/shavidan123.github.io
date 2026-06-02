(function () {
  var STORAGE_KEY = 'd20-stats';
  var ROLL_MS = 750;

  function loadStats() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          rolls:   parsed.rolls   || 0,
          nat20s:  parsed.nat20s  || 0,
          nat1s:   parsed.nat1s   || 0,
          last:    parsed.last    || 20
        };
      }
    } catch (e) {}
    return { rolls: 0, nat20s: 0, nat1s: 0, last: 20 };
  }
  function saveStats(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  var styles = ''
    + '.d20-widget{position:fixed;bottom:16px;right:16px;z-index:9999;'
    + 'font-family:"Courier New",monospace;user-select:none;display:flex;'
    + 'flex-direction:column;align-items:center;gap:4px}'
    + '.d20-stage{position:relative;line-height:0}'
    + '.d20-die{width:64px;height:64px;cursor:pointer;'
    + 'transition:transform .12s ease;'
    + 'filter:drop-shadow(2px 2px 0 rgba(0,0,0,.45))}'
    + '.d20-die:hover{transform:scale(1.08)}'
    + '.d20-die.rolling{animation:d20-tumble .75s cubic-bezier(.3,1.1,.4,1)}'
    + '.d20-die.crit{animation:d20-crit 1.1s ease}'
    + '.d20-die.fumble{animation:d20-shake .55s ease}'
    + '@keyframes d20-tumble{'
    + '0%{transform:rotate(0) scale(1)}'
    + '35%{transform:rotate(220deg) scale(1.35)}'
    + '70%{transform:rotate(500deg) scale(1.1)}'
    + '100%{transform:rotate(720deg) scale(1)}}'
    + '@keyframes d20-crit{'
    + '0%,100%{filter:drop-shadow(2px 2px 0 rgba(0,0,0,.45))}'
    + '50%{filter:drop-shadow(0 0 10px gold) drop-shadow(0 0 22px #ff9c1c)}}'
    + '@keyframes d20-shake{'
    + '0%,100%{transform:translateX(0)}'
    + '20%,60%{transform:translateX(-4px)}'
    + '40%,80%{transform:translateX(4px)}}'
    + '.d20-stats{font-size:10px;line-height:1.45;text-align:center;'
    + 'letter-spacing:.5px;padding:4px 8px;border-radius:3px;min-width:74px;'
    + 'background:rgba(0,0,0,.55);color:#e8d6b4;'
    + 'border:1px solid rgba(226,168,75,.45);'
    + 'text-transform:lowercase}'
    + '[data-theme="light"] .d20-stats{'
    + 'background:rgba(245,241,236,.92);color:#2C2520;'
    + 'border-color:rgba(226,168,75,.6)}'
    + '.d20-stats .row{display:flex;justify-content:space-between;gap:10px}'
    + '.d20-flash{position:absolute;top:-22px;left:50%;'
    + 'transform:translateX(-50%);font-family:"Courier New",monospace;'
    + 'font-size:13px;font-weight:800;letter-spacing:.5px;'
    + 'white-space:nowrap;opacity:0;pointer-events:none;'
    + 'text-shadow:1px 1px 0 #000, 0 0 6px rgba(0,0,0,.7)}'
    + '.d20-flash.show{animation:d20-flash 1.6s ease forwards}'
    + '@keyframes d20-flash{'
    + '0%{opacity:0;transform:translate(-50%,8px)}'
    + '20%{opacity:1;transform:translate(-50%,-10px)}'
    + '80%{opacity:1;transform:translate(-50%,-14px)}'
    + '100%{opacity:0;transform:translate(-50%,-28px)}}'
    + '@media (max-width:600px){'
    + '.d20-widget{bottom:10px;right:10px}'
    + '.d20-die{width:52px;height:52px}'
    + '.d20-stats{font-size:9px;min-width:60px}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  var widget = document.createElement('div');
  widget.className = 'd20-widget';
  widget.innerHTML = ''
    + '<div class="d20-stage">'
    + '  <span class="d20-flash" id="d20-flash"></span>'
    + '  <svg class="d20-die" id="d20-die" viewBox="0 0 80 80" '
    + '       shape-rendering="crispEdges" aria-label="d20" role="button" tabindex="0">'
    + '    <polygon points="40,5 75,30 65,72 15,72 5,30" '
    + '             fill="#E2A84B" stroke="#231F1C" stroke-width="4" stroke-linejoin="miter"/>'
    + '    <polygon points="40,5 75,30 40,40" fill="#B8852F" stroke="#231F1C" stroke-width="2.5"/>'
    + '    <polygon points="75,30 65,72 40,40" fill="#D89638" stroke="#231F1C" stroke-width="2.5"/>'
    + '    <polygon points="40,5 5,30 40,40"   fill="#E2A84B" stroke="#231F1C" stroke-width="2.5"/>'
    + '    <polygon points="5,30 15,72 40,40"  fill="#B8852F" stroke="#231F1C" stroke-width="2.5"/>'
    + '    <polygon points="15,72 65,72 40,40" fill="#F5C26B" stroke="#231F1C" stroke-width="2.5"/>'
    + '    <text id="d20-num" x="40" y="50" text-anchor="middle" '
    + '          font-family="\'Courier New\',monospace" font-size="22" font-weight="900" '
    + '          fill="#231F1C">20</text>'
    + '  </svg>'
    + '</div>'
    + '<div class="d20-stats">'
    + '  <div>rolls: <span id="d20-rolls">0</span></div>'
    + '  <div class="row">'
    + '    <span title="nat 20s">&#9733; <span id="d20-nat20s">0</span></span>'
    + '    <span title="nat 1s">&#9760; <span id="d20-nat1s">0</span></span>'
    + '  </div>'
    + '</div>';
  document.body.appendChild(widget);

  var stats   = loadStats();
  var dieEl   = document.getElementById('d20-die');
  var numEl   = document.getElementById('d20-num');
  var flashEl = document.getElementById('d20-flash');
  var rollsEl = document.getElementById('d20-rolls');
  var n20El   = document.getElementById('d20-nat20s');
  var n1El    = document.getElementById('d20-nat1s');

  function render() {
    numEl.textContent = stats.last;
    rollsEl.textContent = stats.rolls;
    n20El.textContent   = stats.nat20s;
    n1El.textContent    = stats.nat1s;
  }
  render();

  var rolling = false;
  function roll() {
    if (rolling) return;
    rolling = true;
    dieEl.classList.remove('crit', 'fumble');
    dieEl.classList.add('rolling');

    var flicker = setInterval(function () {
      numEl.textContent = 1 + Math.floor(Math.random() * 20);
    }, 55);

    setTimeout(function () {
      clearInterval(flicker);
      dieEl.classList.remove('rolling');
      var result = 1 + Math.floor(Math.random() * 20);
      stats.last = result;
      stats.rolls += 1;
      if (result === 20) stats.nat20s += 1;
      if (result === 1)  stats.nat1s  += 1;
      saveStats(stats);
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
