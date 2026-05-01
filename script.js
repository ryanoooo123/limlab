(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Loader ---
  var loader = document.getElementById('loader');
  var loaderHoldMs = reduce ? 200 : 1100;
  var heroStarted = false;
  function startHero(){
    if (heroStarted) return;
    heroStarted = true;
    document.querySelector('.hero-label').classList.add('lit');
    document.getElementById('headline').classList.add('run');
  }
  function hideLoader(){
    if (loader){
      loader.classList.add('hide');
      setTimeout(function(){ if(loader && loader.parentNode){ loader.parentNode.removeChild(loader); } }, 600);
    }
    document.documentElement.classList.remove('loading');
    startHero();
  }
  var loaderStart = Date.now();
  function startWhenReady(cb){
    var elapsed = Date.now() - loaderStart;
    var wait = Math.max(0, loaderHoldMs - elapsed);
    setTimeout(cb, wait);
  }
  if (document.readyState === 'complete') {
    startWhenReady(hideLoader);
  } else {
    window.addEventListener('load', function(){ startWhenReady(hideLoader); });
    setTimeout(hideLoader, 3500); // safety net
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
