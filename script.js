(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Loader: choose → delete → type "limelab" → splash → hero ---
  var loader = document.getElementById('loader');
  var loaderText = document.getElementById('loaderText');
  var loaderCaret = document.getElementById('loaderCaret');
  var loaderSplash = document.getElementById('loaderSplash');
  var heroStarted = false;
  var loaderDone = false;

  function startHero(){
    if (heroStarted) return;
    heroStarted = true;
    document.querySelector('.hero-label').classList.add('lit');
    document.getElementById('headline').classList.add('run');
  }
  function removeLoader(){
    if (!loader) return;
    loader.classList.add('hide');
    setTimeout(function(){ if(loader && loader.parentNode){ loader.parentNode.removeChild(loader); } }, 600);
    document.documentElement.classList.remove('loading');
  }

  function runLoaderSequence(){
    if (loaderDone) return;
    loaderDone = true;

    if (reduce){
      if (loaderText) loaderText.textContent = 'limelab';
      if (loaderText) loaderText.classList.add('lime');
      if (loaderCaret) loaderCaret.classList.add('lime');
      setTimeout(function(){
        removeLoader();
        startHero();
      }, 400);
      return;
    }

    var WORD_A = 'choose';
    var WORD_B = 'limelab';
    var APPEAR_HOLD = 650;  // how long "choose" sits before deleting
    var DELETE_MS = 55;     // per-char delete speed
    var GAP_MS = 220;       // pause between delete and type
    var TYPE_MS = 95;       // per-char type speed
    var POST_TYPE_HOLD = 550; // pause before splash fires
    var SPLASH_GROW = 850;  // splash circle grow time
    var SPLASH_FADE = 550;  // splash fade-out time

    if (!loaderText || !loaderCaret || !loaderSplash){
      // markup missing — bail safely
      removeLoader();
      startHero();
      return;
    }

    // phase 1: show "choose"
    loaderText.textContent = WORD_A;

    setTimeout(function deleteChoose(){
      var i = loaderText.textContent.length;
      (function step(){
        if (i > 0){
          loaderText.textContent = loaderText.textContent.slice(0, -1);
          i--;
          setTimeout(step, DELETE_MS);
        } else {
          setTimeout(typeLimelab, GAP_MS);
        }
      })();
    }, APPEAR_HOLD);

    function typeLimelab(){
      // switch to lime palette for the word being typed
      loaderText.classList.add('lime');
      loaderCaret.classList.add('lime');
      var i = 0;
      (function step(){
        if (i < WORD_B.length){
          loaderText.textContent += WORD_B.charAt(i);
          i++;
          setTimeout(step, TYPE_MS);
        } else {
          setTimeout(splash, POST_TYPE_HOLD);
        }
      })();
    }

    function splash(){
      // start hero animations behind the splash so the headline is mid-reveal as the curtain lifts
      loaderSplash.classList.add('fire');
      setTimeout(function(){
        loaderSplash.classList.add('fade');
        // start hero a touch before loader fully gone so it feels seamless
        setTimeout(startHero, 80);
        setTimeout(removeLoader, SPLASH_FADE - 50);
      }, SPLASH_GROW);
    }
  }

  if (document.readyState === 'complete'){
    runLoaderSequence();
  } else {
    window.addEventListener('load', runLoaderSequence);
    // safety net — if load never fires, run anyway
    setTimeout(runLoaderSequence, 4000);
  }

  // --- Headline letter-by-letter + cycling word ---
  var headlineEl = document.getElementById('headline');
  var prefix = "Limelab ships ";
  var words = ["fast", "accurate", "clean", "right"];
  var initialWord = words[0];
  var frag = document.createDocumentFragment();
  var stepMs = 30;
  var idx = 0;
  for (var p = 0; p < prefix.length; p++) {
    var ch = prefix[p];
    if (ch === ' ') {
      frag.appendChild(document.createTextNode(' '));
      continue;
    }
    var span = document.createElement('span');
    span.className = 'ch';
    span.textContent = ch;
    if (!reduce) span.style.animationDelay = (idx * stepMs) + 'ms';
    frag.appendChild(span);
    idx++;
  }
  var wordWrap = document.createElement('span');
  wordWrap.id = 'word';
  wordWrap.className = 'word';
  for (var w = 0; w < initialWord.length; w++) {
    var s = document.createElement('span');
    s.className = 'ch';
    s.textContent = initialWord[w];
    if (!reduce) s.style.animationDelay = (idx * stepMs) + 'ms';
    wordWrap.appendChild(s);
    idx++;
  }
  frag.appendChild(wordWrap);
  // period
  var period = document.createElement('span');
  period.className = 'ch';
  period.textContent = '.';
  if (!reduce) period.style.animationDelay = (idx * stepMs) + 'ms';
  frag.appendChild(period);
  var lastDelay = idx * stepMs;
  // blinking cursor
  var cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  if (!reduce) cursor.style.animationDelay = (lastDelay + 250) + 'ms';
  else cursor.style.opacity = '1';
  frag.appendChild(cursor);
  headlineEl.appendChild(frag);

  // --- Word cycle routine ---
  if (!reduce) {
    var wordIdx = 0;
    var holdMs = 2200;
    var deleteMs = 55;
    var typeMs = 75;
    function cycleWord() {
      var nextIdx = (wordIdx + 1) % words.length;
      var next = words[nextIdx];
      var w = document.getElementById('word');
      function deleteStep() {
        if (w.lastChild) {
          w.removeChild(w.lastChild);
          setTimeout(deleteStep, deleteMs);
        } else {
          typeStep(0);
        }
      }
      function typeStep(i) {
        if (i < next.length) {
          var s = document.createElement('span');
          s.className = 'ch typed';
          s.textContent = next[i];
          w.appendChild(s);
          setTimeout(function(){ typeStep(i + 1); }, typeMs);
        } else {
          wordIdx = nextIdx;
          setTimeout(cycleWord, holdMs);
        }
      }
      deleteStep();
    }
    // start cycling after intro + first hold
    setTimeout(cycleWord, lastDelay + 350 + holdMs);
  }

  // --- Trigger underline + subhead + CTA after headline finishes ---
  var ul = document.getElementById('ul');
  var sub = document.getElementById('subhead');
  var cta = document.getElementById('ctarow');
  var finishMs = reduce ? 0 : (lastDelay + 350);
  setTimeout(function () {
    ul.classList.add('draw');
    sub.classList.add('lit');
    cta.classList.add('lit');
  }, finishMs);

  // --- Intersection Observer reveal + staggered cards (replays on every entry) ---
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var stagger = e.target.dataset.stagger;
        if (e.isIntersecting) {
          if (stagger) e.target.style.transitionDelay = (parseInt(stagger, 10) * 120) + 'ms';
          e.target.classList.add('in');
        } else {
          e.target.classList.remove('in');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, section h2, section .label, .card, .service, .why-item, .process-step, .team-card, .section-num').forEach(function (el) { io.observe(el); });

    // Stagger process steps
    document.querySelectorAll('.process-step').forEach(function (el, i) {
      el.style.transitionDelay = (i * 100) + 'ms';
    });
    // Stagger team cards
    document.querySelectorAll('.team-card').forEach(function (el, i) {
      el.style.transitionDelay = (i * 120) + 'ms';
    });

    // Stagger services
    document.querySelectorAll('.service').forEach(function (el, i) {
      el.style.transitionDelay = (i * 90) + 'ms';
    });

    // Contact list as one group — replays
    var contactList = document.querySelector('.contact-list');
    if (contactList) {
      var clo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add('in');
          else e.target.classList.remove('in');
        });
      }, { threshold: 0.3 });
      clo.observe(contactList);
    }
  } else {
    document.querySelectorAll('.reveal, section h2, section .label, .card, .service, .section-num, .contact-list').forEach(function (el) { el.classList.add('in'); });
  }

  // --- Contact form (FormSubmit AJAX, no page reload) ---
  var form = document.getElementById('contactForm');
  if (form) {
    var statusEl = document.getElementById('cf-status');
    var btn = document.getElementById('cf-submit');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form._honey && form._honey.value) return; // bot
      statusEl.className = 'form-status';
      statusEl.textContent = 'sending…';
      btn.disabled = true;
      var data = new FormData(form);
      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
      .then(function (res) {
        if (res.ok) return res.json();
        throw new Error('bad response');
      })
      .then(function () {
        statusEl.className = 'form-status ok';
        statusEl.textContent = '✓ message sent. I\'ll reply within 24h.';
        form.reset();
        btn.disabled = false;
      })
      .catch(function () {
        statusEl.className = 'form-status err';
        statusEl.textContent = 'something broke. try email or refresh and retry.';
        btn.disabled = false;
      });
    });
  }

  // --- Scroll progress bar + parallax + active section number ---
  if (!reduce) {
    var progress = document.getElementById('progress');
    var hero = document.querySelector('.hero');
    var sectionNums = document.querySelectorAll('.section-num');
    var thumbs = document.querySelectorAll('.thumb');
    var ticking = false;

    function onScroll() {
      var sy = window.scrollY || window.pageYOffset;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? Math.min(100, Math.max(0, (sy / docH) * 100)) : 0;
      if (progress) progress.style.setProperty('--p', pct + '%');

      // Hero parallax
      if (hero && sy < window.innerHeight) {
        hero.style.setProperty('--scroll', sy);
      }

      // Active section badge
      var vh = window.innerHeight;
      sectionNums.forEach(function (n) {
        var sec = n.parentElement;
        var r = sec.getBoundingClientRect();
        if (r.top < vh * 0.4 && r.bottom > vh * 0.4) n.classList.add('active');
        else n.classList.remove('active');
      });

      // Thumb parallax — drift inside each card based on its viewport position
      thumbs.forEach(function (t) {
        var r = t.getBoundingClientRect();
        var center = r.top + r.height / 2;
        var rel = (center - vh / 2) / vh; // -1..1 ish
        var shift = Math.max(-18, Math.min(18, rel * -24));
        t.style.setProperty('--thumb-shift', shift + 'px');
      });

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    onScroll();
  }

  // --- Hero interactive constellation background ---
  (function heroConstellation(){
    if (reduce) return;
    var canvas = document.getElementById('heroBg');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var particles = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var ACCENT = '196,255,61';
    var LINK_DIST = 190;
    var MOUSE_RADIUS = 220;

    function size(){
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      // density: roughly 1 particle per 11k px²
      var target = Math.round((w * h) / 11000);
      target = Math.max(40, Math.min(target, 140));
      if (particles.length === 0){
        for (var i = 0; i < target; i++) particles.push(makeParticle());
      } else if (particles.length < target){
        while (particles.length < target) particles.push(makeParticle());
      } else if (particles.length > target){
        particles.length = target;
      }
    }
    function makeParticle(){
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.6
      };
    }

    function frame(){
      ctx.clearRect(0,0,w,h);

      // update + draw particles
      for (var i = 0; i < particles.length; i++){
        var p = particles[i];

        // mouse magnetism
        if (mouse.active){
          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var d2 = dx*dx + dy*dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS){
            var d = Math.sqrt(d2) || 1;
            var force = (1 - d / MOUSE_RADIUS) * 0.6;
            p.vx += (dx / d) * force * 0.05;
            p.vy += (dy / d) * force * 0.05;
          }
        }

        // friction
        p.vx *= 0.96;
        p.vy *= 0.96;

        // drift floor — keep slow ambient motion
        var sp = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (sp < 0.08){
          p.vx += (Math.random() - 0.5) * 0.04;
          p.vy += (Math.random() - 0.5) * 0.04;
        }

        p.x += p.vx;
        p.y += p.vy;

        // wrap edges
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;

        // draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + ACCENT + ',0.55)';
        ctx.fill();
      }

      // draw links
      for (var a = 0; a < particles.length; a++){
        var pa = particles[a];
        for (var b = a + 1; b < particles.length; b++){
          var pb = particles[b];
          var ldx = pa.x - pb.x;
          var ldy = pa.y - pb.y;
          var ld = Math.sqrt(ldx*ldx + ldy*ldy);
          if (ld < LINK_DIST){
            // ease-out falloff so distant lines stay visible longer
            var t = 1 - ld / LINK_DIST;
            var alpha = (t * t) * 0.55 + t * 0.15;
            var lw = 1;
            // boost links near cursor
            if (mouse.active){
              var mx = (pa.x + pb.x) / 2 - mouse.x;
              var my = (pa.y + pb.y) / 2 - mouse.y;
              var md = Math.sqrt(mx*mx + my*my);
              if (md < MOUSE_RADIUS){
                var mt = 1 - md / MOUSE_RADIUS;
                alpha += mt * 0.85;
                lw += mt * 0.8;
              }
            }
            if (alpha > 1) alpha = 1;
            ctx.strokeStyle = 'rgba(' + ACCENT + ',' + alpha.toFixed(3) + ')';
            ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      // cursor halo
      if (mouse.active){
        var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_RADIUS);
        grad.addColorStop(0, 'rgba(' + ACCENT + ',0.10)');
        grad.addColorStop(1, 'rgba(' + ACCENT + ',0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    function rectXY(e){
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    hero.addEventListener('mousemove', function(e){
      var p = rectXY(e);
      mouse.x = p.x; mouse.y = p.y; mouse.active = true;
    });
    hero.addEventListener('mouseleave', function(){ mouse.active = false; });
    window.addEventListener('resize', size);

    size();
    canvas.classList.add('lit');
    requestAnimationFrame(frame);
  })();

  // --- Cursor trail (skip on touch / reduced motion) ---
  var isTouch = window.matchMedia('(hover: none)').matches;
  if (!isTouch && !reduce) {
    var trail = document.getElementById('trail');
    var mx = -100, my = -100, tx = -100, ty = -100;
    var running = false;
    function loop() {
      tx += (mx - tx) * 0.18;
      ty += (my - ty) * 0.18;
      trail.style.transform = 'translate(' + tx + 'px,' + ty + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    }
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!running) {
        running = true;
        tx = mx; ty = my;
        trail.classList.add('lit');
        requestAnimationFrame(loop);
      }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { trail.classList.remove('lit'); });
    document.addEventListener('mouseenter', function () { trail.classList.add('lit'); });
  }
})();
