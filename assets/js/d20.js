(function () {
  var HISTORY_MAX = 50;
  var HIST_HEIGHT_PX = 28;
  var PIXEL_SIZE = 4;
  var FACES = 20;
  var EFFECT_MS = 1100;          // result glow at corner
  var RECOVER_MS = 1200;         // graceful timeout drag + wobble + upright
  var MAX_TOTAL_MS = 7500;       // safety timeout
  var GRAVITY_Y = 1100;          // standard downward gravity (px/s²)
  var HORIZ_PULL_K = 1.1;        // linear horizontal pull toward corner_x...
  var HORIZ_PULL_CAP = 550;      // ...capped so it doesn't dominate motion
  var CATCH_RADIUS = 200;        // catch zone where spring + damping ramp in
  var CATCH_SPRING_K = 28;       // peak spring stiffness (overdamped with...)
  var CATCH_DAMP = 13;           // ...this damping → no oscillation in zone
  var BASE_ANG_DRAG = 0.15;      // light angular drag, always on
  var COMMIT_DIST = 95;          // commit number when this close to corner...
  var COMMIT_SPEED = 480;        // ...AND moving slower than this
  var ARRIVAL_DIST = 22;         // px from corner to count as "home"
  var ARRIVAL_SPEED = 70;        // px/s to count as "stopped"
  var SMACK_DIST = 55;           // tendril hitbox radius around sigil
  var SMACK_SPEED = 750;         // px/s required to "smack" the sigil
  var SMACK_MS = 380;            // how long the recoil lasts

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
    + '.d20-sigil{position:absolute;width:40px;height:40px;top:50%;left:50%;'
    + 'transform:translate(-50%,-50%);pointer-events:none;opacity:0;'
    + 'transition:opacity .35s ease}'
    + '.d20-sigil.active{opacity:.85}'
    + '.d20-sigil.smacked{animation:d20-sigil-shake .35s ease}'
    + '@keyframes d20-sigil-shake{'
    + '0%,100%{transform:translate(-50%,-50%) rotate(0)}'
    + '25%{transform:translate(calc(-50% - 4px),-50%) rotate(-8deg)}'
    + '75%{transform:translate(calc(-50% + 4px),-50%) rotate(8deg)}}'
    + '.d20-tendrils{position:fixed;top:0;left:0;width:100%;height:100%;'
    + 'pointer-events:none;z-index:9998;opacity:0;'
    + 'transition:opacity .25s ease}'
    + '.d20-tendrils.active{opacity:1}'
    + '.d20-tendrils svg{width:100%;height:100%;position:absolute;top:0;left:0;'
    + 'overflow:visible}'
    + '.d20-tendrils path{fill:none;stroke:#9B59B6;stroke-width:1.8;'
    + 'opacity:.55;filter:drop-shadow(0 0 5px #9B59B6);'
    + 'transition:stroke .15s ease,opacity .15s ease}'
    + '.d20-tendrils.smacked path{stroke:#E74C3C;opacity:.35;'
    + 'filter:drop-shadow(0 0 6px #E74C3C)}'
    + '@media (max-width:600px){'
    + '.d20-widget{bottom:10px;right:10px;gap:4px}'
    + '.d20-stage{width:56px;height:56px}'
    + '.d20-die{width:50px;height:50px}'
    + '.d20-sigil{width:32px;height:32px}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  var widget = document.createElement('div');
  widget.className = 'd20-widget';
  widget.innerHTML = ''
    + '<div class="d20-stage" id="d20-stage">'
    + '  <div class="d20-shadow"></div>'
    + '  <div class="d20-sigil" id="d20-sigil">'
    + '    <svg viewBox="0 0 50 50" shape-rendering="geometricPrecision">'
    + '      <circle cx="25" cy="25" r="22" fill="none" stroke="#9B59B6" '
    + '              stroke-width="1" stroke-dasharray="3,2" opacity=".8"/>'
    + '      <polygon points="25,8 29,21 42,21 32,29 36,42 25,34 14,42 18,29 8,21 21,21" '
    + '               fill="#9B59B6" fill-opacity=".25" '
    + '               stroke="#C28FE0" stroke-width="1.4" stroke-linejoin="round"/>'
    + '      <circle cx="25" cy="25" r="2.5" fill="#FFE6B6"/>'
    + '    </svg>'
    + '  </div>'
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

  // Full-viewport overlay for the tendril paths (separate so they can span the page)
  var tendrilsEl = document.createElement('div');
  tendrilsEl.className = 'd20-tendrils';
  tendrilsEl.id = 'd20-tendrils';
  tendrilsEl.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">' +
    '  <path id="d20-t0"/><path id="d20-t1"/>' +
    '  <path id="d20-t2"/><path id="d20-t3"/>' +
    '</svg>';
  document.body.appendChild(tendrilsEl);

  var stageEl = document.getElementById('d20-stage');
  var sigilEl = document.getElementById('d20-sigil');
  var dieEl   = document.getElementById('d20-die');
  var numEl   = document.getElementById('d20-num');
  var flashEl = document.getElementById('d20-flash');
  var rollsEl = document.getElementById('d20-rolls');
  var lastEl  = document.getElementById('d20-last');
  var histEl  = document.getElementById('d20-hist');
  var tendrilPaths = [
    document.getElementById('d20-t0'),
    document.getElementById('d20-t1'),
    document.getElementById('d20-t2'),
    document.getElementById('d20-t3')
  ];

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

  function updateTendrils(restCx, restCy, dieXp, dieYp, smacked, timeMs) {
    var t = timeMs / 1000;
    for (var i = 0; i < 4; i++) {
      var path = tendrilPaths[i];
      // Tendrils emerge from 4 anchor points around the sigil, slowly drifting
      var ang = (i / 4) * Math.PI * 2 + t * 0.18;
      var startR = 14;
      var sx = restCx + startR * Math.cos(ang);
      var sy = restCy + startR * Math.sin(ang);

      var ex, ey;
      if (smacked) {
        // Recoil — tendrils retract to ~30% of the way to the die
        ex = sx + 0.3 * (dieXp - sx);
        ey = sy + 0.3 * (dieYp - sy);
      } else {
        ex = dieXp;
        ey = dieYp;
      }

      // Perpendicular curve offset gives each tendril a wavy character;
      // sine over time animates the "writhing"
      var ddx = ex - sx, ddy = ey - sy;
      var dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist < 1) dist = 1;
      var nx = -ddy / dist, ny = ddx / dist;
      var bias = (i - 1.5) * 12 + Math.sin(t * 4 + i * 1.7) * 14;
      var mx = (sx + ex) / 2 + nx * bias;
      var my = (sy + ey) / 2 + ny * bias;

      path.setAttribute('d',
        'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) +
        ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) +
        ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1)
      );
    }
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
    sigilEl.classList.add('active');
    tendrilsEl.classList.add('active');

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
    var lastFlickerTime = 0;
    var numCommitted = false;
    var currentSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    var distToCorner = 0;
    var escaped = false;     // true once die has left the catch zone at least once
    var smackedUntil = 0;    // tendrils/sigil recoil window

    var startTime = null;
    var lastTime = null;
    var phase = 'bounce';
    var effectStartTime = 0;
    var effectStartAngle = 0;
    var effectTargetAngle = 0;
    var recoverStartTime = 0;
    var recoverStart = null;
    var recoverTargetAngle = 0;

    function step(now) {
      if (startTime === null) { startTime = now; lastTime = now; }
      var dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;
      var elapsed = now - startTime;

      // Number flicker — interval tracks current speed; commits early once the
      // die enters the catch zone slow enough, so the final approach is silent.
      if (!numCommitted) {
        if (phase === 'effect' ||
            (distToCorner < COMMIT_DIST && currentSpeed < COMMIT_SPEED)) {
          numEl.textContent = result;
          numCommitted = true;
        } else {
          var sf = currentSpeed / 1300;
          if (sf > 1) sf = 1; if (sf < 0) sf = 0;
          var slow = (1 - sf) * (1 - sf);
          var fInterval = 55 + slow * 480;
          if (elapsed - lastFlickerTime >= fInterval) {
            numEl.textContent = 1 + Math.floor(Math.random() * 20);
            lastFlickerTime = elapsed;
          }
        }
      }

      if (phase === 'bounce') {
        // Smoothstep "nearness" to corner — 0 outside catch zone, 1 at corner.
        // The catch zone is dormant until the die has *escaped* once, so the
        // spring doesn't fight the initial launch (die starts at restPos).
        var dxs = restCx - pos.x;
        var dys = restCy - pos.y;
        var dc  = Math.sqrt(dxs * dxs + dys * dys);
        if (!escaped && dc > CATCH_RADIUS) escaped = true;
        var nearness = 0;
        if (escaped && dc < CATCH_RADIUS) {
          var nt = 1 - dc / CATCH_RADIUS;
          nearness = nt * nt * (3 - 2 * nt);  // smoothstep
        }

        // Straight-down gravity (fades inside catch zone so the spring's
        // equilibrium is exactly restPos). No central force → no orbits.
        vel.y += GRAVITY_Y * (1 - nearness) * dt;

        // Mild horizontal pull toward corner_x (linear, capped). This breaks
        // the symmetry of pure gravity and biases the die toward the corner
        // *side* of the floor without dominating the trajectory.
        var hx = HORIZ_PULL_K * dxs;
        if (hx >  HORIZ_PULL_CAP) hx =  HORIZ_PULL_CAP;
        if (hx < -HORIZ_PULL_CAP) hx = -HORIZ_PULL_CAP;
        vel.x += hx * (1 - nearness) * dt;

        // Catch zone: overdamped spring exactly to restPos. ω² = K = 28,
        // c_crit = 2√28 ≈ 10.6; damping 13 > c_crit → no oscillation.
        if (nearness > 0) {
          vel.x += dxs * CATCH_SPRING_K * nearness * dt;
          vel.y += dys * CATCH_SPRING_K * nearness * dt;
          vel.x *= (1 - CATCH_DAMP * nearness * dt);
          vel.y *= (1 - CATCH_DAMP * nearness * dt);
          angVel *= (1 - CATCH_DAMP * nearness * 0.4 * dt);
        }

        // Constant light angular drag — keeps spin from growing unboundedly
        angVel *= (1 - BASE_ANG_DRAG * dt);

        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
        angle += angVel * dt;

        // Wall collisions — moderate restitution so energy bleeds via bounces
        if (pos.x < leftWall) {
          pos.x = leftWall;
          vel.x = Math.abs(vel.x) * 0.80;
          angVel = -angVel * 0.92;
        } else if (pos.x > rightWall) {
          pos.x = rightWall;
          vel.x = -Math.abs(vel.x) * 0.80;
          angVel = -angVel * 0.92;
        }
        if (pos.y < ceiling) {
          pos.y = ceiling;
          vel.y = Math.abs(vel.y) * 0.80;
        } else if (pos.y > floor) {
          pos.y = floor;
          vel.y = -Math.abs(vel.y) * 0.74;
          vel.x *= 0.94;
          angVel *= 0.94;
        }

        distToCorner = Math.sqrt(
          (pos.x - restCx) * (pos.x - restCx) +
          (pos.y - restCy) * (pos.y - restCy)
        );
        currentSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        applyTransform(pos.x - restCx, pos.y - restCy, angle, 1, 1);

        // Smack detection — die slammed near the sigil at high speed
        if (escaped && distToCorner < SMACK_DIST && currentSpeed > SMACK_SPEED &&
            elapsed > smackedUntil) {
          smackedUntil = elapsed + SMACK_MS;
          sigilEl.classList.remove('smacked');
          void sigilEl.offsetWidth;
          sigilEl.classList.add('smacked');
        }

        if (distToCorner < ARRIVAL_DIST && currentSpeed < ARRIVAL_SPEED) {
          phase = 'effect';
          effectStartTime = elapsed;
          effectStartAngle = angle;
          effectTargetAngle = Math.round(angle / 360) * 360;
          stageEl.classList.remove('rolling');
          stageEl.classList.add('landing');
        } else if (elapsed > MAX_TOTAL_MS - EFFECT_MS - RECOVER_MS) {
          // Safety timeout — play a graceful recovery (no teleport).
          phase = 'recover';
          recoverStartTime = elapsed;
          recoverStart = { x: pos.x, y: pos.y, angle: angle };
          recoverTargetAngle = Math.round(angle / 360) * 360;
          stageEl.classList.remove('rolling');
          stageEl.classList.add('landing');
        }
      }

      if (phase === 'recover') {
        var rt = (elapsed - recoverStartTime) / RECOVER_MS;
        if (rt > 1) rt = 1;

        // Position: ease-out cubic drag back to restPos
        var rEase = 1 - Math.pow(1 - rt, 3);
        var fxr = recoverStart.x + (restCx - recoverStart.x) * rEase;
        var fyr = recoverStart.y + (restCy - recoverStart.y) * rEase;

        // Angle: ease to upright + decaying wobble (~3Hz, dies out by the end)
        var wobble = Math.sin(rt * 18) * (1 - rt) * 12;
        var far = recoverStart.angle +
                  (recoverTargetAngle - recoverStart.angle) * rEase + wobble;

        // Scale: small squash-stretch wobble that also decays
        var sw = Math.sin(rt * 14) * (1 - rt) * 0.06;
        var sxr = 1 + sw;
        var syr = 1 - sw;

        applyTransform(fxr - restCx, fyr - restCy, far, sxr, syr);
        pos.x = fxr;
        pos.y = fyr;

        if (rt >= 1) {
          phase = 'effect';
          effectStartTime = elapsed;
          effectStartAngle = recoverTargetAngle;
          effectTargetAngle = recoverTargetAngle;
        }
      }

      if (phase === 'effect') {
        var efT = (elapsed - effectStartTime) / EFFECT_MS;
        if (efT > 1) efT = 1;
        var bell = Math.sin(efT * Math.PI);

        // Color from red (1) to gold (20), with extra saturation/size at the extremes
        var hueT = (result - 1) / 19;
        var hue = hueT * 50;                       // 0=red, 50=gold-yellow
        var extremity = Math.abs(result - 10.5) / 9.5;  // 0 mid → 1 extreme
        var sat = 70 + 28 * extremity;
        var color = 'hsl(' + hue.toFixed(0) + ',' + sat.toFixed(0) + '%,55%)';

        var maxGlow  = 6 + extremity * 24;         // 6 → 30 px
        var maxGlow2 = maxGlow * 1.7;
        var s = 1 + (0.06 + 0.20 * extremity) * bell;

        // Snap angle to upright in the first 25% of the effect
        var ap = efT * 4; if (ap > 1) ap = 1;
        var ape = 1 - Math.pow(1 - ap, 2);
        var fa = effectStartAngle + (effectTargetAngle - effectStartAngle) * ape;

        dieEl.style.filter =
          'drop-shadow(2px 2px 0 rgba(0,0,0,.4)) ' +
          'drop-shadow(0 0 ' + (maxGlow * bell).toFixed(1) + 'px ' + color + ') ' +
          'drop-shadow(0 0 ' + (maxGlow2 * bell).toFixed(1) + 'px ' + color + ')';

        applyTransform(0, 0, fa, s, s);
        pos.x = restCx;
        pos.y = restCy;

        if (efT >= 1) {
          dieEl.style.filter = '';
          finalize();
          return;
        }
      }

      // Update sigil + tendril visualization (after all phase logic)
      var isSmacked = elapsed < smackedUntil;
      if (isSmacked) tendrilsEl.classList.add('smacked');
      else tendrilsEl.classList.remove('smacked');
      updateTendrils(restCx, restCy, pos.x, pos.y, isSmacked, elapsed);

      requestAnimationFrame(step);
    }

    function finalize() {
      dieEl.style.transform = '';
      dieEl.classList.remove('rolling');
      stageEl.classList.remove('landing');
      sigilEl.classList.remove('active', 'smacked');
      tendrilsEl.classList.remove('active', 'smacked');

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
