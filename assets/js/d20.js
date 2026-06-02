(function () {
  var HISTORY_MAX = 50;
  var HIST_HEIGHT_PX = 28;
  var PIXEL_SIZE = 4;
  var FACES = 20;
  var PHYSICS_MS = 4500;
  var LAND_MS = 280;
  var PULL_START_MS = 2800;   // when the corner-magnetism begins ramping in
  var PULL_K = 15;             // spring stiffness at full strength
  var PULL_DAMP = 9;           // velocity damping at full strength

  var stats = { rolls: 0, nat20s: 0, nat1s: 0, last: 20, history: [] };

  var styles = ''
    + '.d20-widget{position:fixed;bottom:14px;right:14px;z-index:9999;'
    + 'font-family:"Courier New",monospace;user-select:none;display:flex;'
    + 'flex-direction:column;align-items:center;gap:6px}'
    + '.d20-stage{position:relative;width:64px;height:64px;'
    + 'display:flex;align-items:flex-end;justify-content:center}'
    + '.d20-shadow{position:absolute;bottom:1px;left:50%;width:42px;height:7px;'
    + 'border-radius:50%;pointer-events:none;'
    + 'background:radial-gradient(ellipse,rgba(0,0,0,.55),rgba(0,0,0,0) 70%);'
    + 'transform:translateX(-50%) scale(1);opacity:.9;transition:opacity .15s ease}'
    + '.d20-stage.rolling .d20-shadow{opacity:0}'
    + '.d20-stage.landing .d20-shadow{opacity:.9;animation:d20-shadow-land .2s ease}'
    + '@keyframes d20-shadow-land{'
    + '0%{transform:translateX(-50%) scale(.3)}'
    + '60%{transform:translateX(-50%) scaleX(1.55) scaleY(.7)}'
    + '100%{transform:translateX(-50%) scale(1)}}'
    + '.d20-die{width:58px;height:58px;cursor:pointer;outline:none;'
    + '-webkit-tap-highlight-color:transparent;transform-origin:50% 50%;'
    + 'filter:drop-shadow(2px 2px 0 rgba(0,0,0,.4));'
    + 'transition:filter .15s ease;will-change:transform}'
    + '.d20-die:hover{filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45)) brightness(1.08)}'
    + '.d20-die:focus-visible{filter:drop-shadow(0 0 6px #E2A84B)}'
    + '.d20-die.rolling{filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))}'
    + '.d20-die.crit{animation:d20-crit 1.2s ease}'
    + '.d20-die.fumble{animation:d20-shake .55s ease}'
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

  function renderHistogram() {
    var counts = new Array(FACES).fill(0);
    for (var i = 0; i < stats.history.length; i++) {
      counts[stats.history[i] - 1] += 1;
    }
    var maxCount = 0;
    for (var j = 0; j < FACES; j++) if (counts[j] > maxCount) maxCount = counts[j];
    var maxBars = Math.floor((HIST_HEIGHT_PX + 1) / (PIXEL_SIZE + 1));
    var scale = maxCount > maxBars ? maxBars / maxCount : 1;

    for (var k = 0; k < FACES; k++) {
      var col = cols[k];
      while (col.firstChild) col.removeChild(col.firstChild);
      var bars = Math.round(counts[k] * scale);
      if (counts[k] > 0 && bars === 0) bars = 1;
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

  function rand(min, max) { return min + Math.random() * (max - min); }
  function sign() { return Math.random() < 0.5 ? -1 : 1; }
  function applyTransform(dx, dy, ang, sx, sy) {
    dieEl.style.transform =
      'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) ' +
      'rotate(' + ang.toFixed(1) + 'deg) ' +
      'scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
  }

  // Several "launch profiles" — picked at random so each click feels different
  // [vxMin, vxMax, vyMin, vyMax, spinMin, spinMax, gravity]
  var LAUNCH_PROFILES = [
    { vx:[-1700,-1200], vy:[-2100,-1600], spin:[900,1600], g:1700 },   // hard left arc
    { vx:[ 1200, 1700], vy:[-2100,-1600], spin:[900,1600], g:1700 },   // hard right arc
    { vx:[-2000,-1500], vy:[-1400,-1000], spin:[1400,2000], g:1850 },  // low flat shot left
    { vx:[-1000, -500], vy:[-2400,-1900], spin:[700,1300], g:1800 },   // high lob
    { vx:[-2200,-1700], vy:[-1900,-1400], spin:[1600,2200], g:1900 },  // fast skipping shot
  ];

  var rolling = false;
  function roll() {
    if (rolling) return;
    rolling = true;

    dieEl.classList.remove('crit', 'fumble');
    dieEl.classList.add('rolling');
    stageEl.classList.add('rolling');

    // Measure rest position (center of die) in viewport coordinates
    dieEl.style.transform = '';
    void dieEl.offsetWidth;
    var rect = dieEl.getBoundingClientRect();
    var restCx = rect.left + rect.width / 2;
    var restCy = rect.top + rect.height / 2;
    var radius = rect.width / 2;

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var margin = 18;
    var leftWall   = radius + margin;
    var rightWall  = vw - radius - margin;
    var ceiling    = radius + margin;
    var floor      = vh - radius - margin;

    var profile = LAUNCH_PROFILES[Math.floor(Math.random() * LAUNCH_PROFILES.length)];
    var pos = { x: restCx, y: restCy };
    var vel = {
      x: rand(profile.vx[0], profile.vx[1]),
      y: rand(profile.vy[0], profile.vy[1])
    };
    var angle = 0;
    var angVel = sign() * rand(profile.spin[0], profile.spin[1]);
    var gravity = profile.g;

    // Pre-pick the final result so the flicker can settle on it before landing
    var result = 1 + Math.floor(Math.random() * 20);
    var commitTimeMs = PULL_START_MS + 0.85 * (PHYSICS_MS - PULL_START_MS);
    var lastFlickerTime = 0;
    var numCommitted = false;

    var startTime = null;
    var lastTime = null;
    var phase = 'physics';
    var rStart = null;     // captured at start of return phase
    var rTargetAngle = 0;

    function step(now) {
      if (startTime === null) { startTime = now; lastTime = now; }
      var dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;
      var elapsed = now - startTime;

      // Number flicker — fast during free bounce, slows during the pull,
      // commits to the final result once the die is mostly settled.
      if (!numCommitted) {
        if (elapsed >= commitTimeMs) {
          numEl.textContent = result;
          numCommitted = true;
        } else {
          var fInterval;
          if (elapsed < PULL_START_MS) {
            fInterval = 55;
          } else {
            var st = (elapsed - PULL_START_MS) / (commitTimeMs - PULL_START_MS);
            fInterval = 55 + (480 - 55) * st * st;
          }
          if (elapsed - lastFlickerTime >= fInterval) {
            numEl.textContent = 1 + Math.floor(Math.random() * 20);
            lastFlickerTime = elapsed;
          }
        }
      }

      if (phase === 'physics') {
        if (elapsed < PHYSICS_MS) {
          // Magnetic pull toward the corner — ramps up after PULL_START_MS via smoothstep.
          // Gravity fades in inverse, so the spring's equilibrium is exactly the corner
          // (otherwise gravity would offset the rest point below it).
          var pullT = (elapsed - PULL_START_MS) / (PHYSICS_MS - PULL_START_MS);
          if (pullT < 0) pullT = 0;
          if (pullT > 1) pullT = 1;
          var pullEase = pullT * pullT * (3 - 2 * pullT);

          vel.y += gravity * (1 - pullEase) * dt;
          vel.x *= (1 - 0.22 * dt);
          vel.y *= (1 - 0.10 * dt);
          angVel *= (1 - 0.15 * dt);

          if (pullEase > 0) {
            var k = PULL_K * pullEase;
            var damp = PULL_DAMP * pullEase;
            vel.x += -k * (pos.x - restCx) * dt;
            vel.y += -k * (pos.y - restCy) * dt;
            vel.x *= (1 - damp * dt);
            vel.y *= (1 - damp * dt);
            angVel *= (1 - damp * 0.6 * dt);
          }

          pos.x += vel.x * dt;
          pos.y += vel.y * dt;
          angle += angVel * dt;

          // Wall collisions (bouncier restitution)
          if (pos.x < leftWall) {
            pos.x = leftWall;
            vel.x = Math.abs(vel.x) * 0.82;
            angVel = -angVel * 0.92;
          } else if (pos.x > rightWall) {
            pos.x = rightWall;
            vel.x = -Math.abs(vel.x) * 0.82;
            angVel = -angVel * 0.92;
          }
          if (pos.y < ceiling) {
            pos.y = ceiling;
            vel.y = Math.abs(vel.y) * 0.78;
          } else if (pos.y > floor) {
            pos.y = floor;
            vel.y = -Math.abs(vel.y) * 0.75;
            vel.x *= 0.93;
            angVel *= 0.93;
          }

          applyTransform(pos.x - restCx, pos.y - restCy, angle, 1, 1);
        } else {
          phase = 'land';
          rStart = { x: pos.x, y: pos.y, a: angle };
          rTargetAngle = Math.round(angle / 360) * 360;
          stageEl.classList.remove('rolling');
          stageEl.classList.add('landing');
        }
      }

      if (phase === 'land') {
        var lt = Math.min((elapsed - PHYSICS_MS) / LAND_MS, 1);
        // Snap any residual offset/rotation smoothly while the squish plays
        var snap = 1 - Math.pow(1 - lt, 2);
        var fx = (rStart.x - restCx) * (1 - snap);
        var fy = (rStart.y - restCy) * (1 - snap);
        var fa = rStart.a + (rTargetAngle - rStart.a) * snap;
        var bell = Math.sin(lt * Math.PI);
        var sx = 1 + 0.32 * bell;
        var sy = 1 - 0.32 * bell;
        applyTransform(fx, fy, fa, sx, sy);

        if (lt >= 1) {
          finalize();
          return;
        }
      }

      requestAnimationFrame(step);
    }

    function finalize() {
      dieEl.style.transform = '';
      dieEl.classList.remove('rolling');
      stageEl.classList.remove('landing');

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
    }

    requestAnimationFrame(step);
  }

  dieEl.addEventListener('click', roll);
  dieEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); roll(); }
  });
})();
