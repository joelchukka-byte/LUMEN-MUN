/**
 * Lumen MUN — application logic.
 *
 * Implements the behaviour specified by the design canvas:
 *   · hash routing with the 620ms HUD sweep (content swaps at 260ms behind it)
 *   · readout counters that tick once on first paint over 1.1s
 *   · grouped dropdown navigation, collapsing to a full-screen HUD panel
 *   · registration track switch, FAQ accordion, and form handling
 *
 * Everything degrades sensibly: with JS disabled the home page still renders
 * its prose and the nav links resolve to in-page anchors.
 */
(function () {
  'use strict';

  var DATA = window.LUMEN;

  /* ---------------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------------- */

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rupees(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------------
     Rendering — the collections the design drives from data
     --------------------------------------------------------------------- */

  function renderCommitteePreviews() {
    var host = $('#committee-preview-grid');
    if (!host) return;

    host.innerHTML = DATA.committees.slice(0, 3).map(function (c) {
      return '' +
        '<a class="committee-preview" href="#/committees">' +
          '<span class="reticle reticle--tl"></span>' +
          '<span class="reticle reticle--br"></span>' +
          '<span class="readout">' + esc(c.code) + '</span>' +
          '<h3>' + esc(c.name) + '</h3>' +
          '<p>' + esc(c.blurb) + '</p>' +
          '<span class="committee-preview__foot">' +
            '<span class="is-flare">AGENDA: CLASSIFIED</span>' +
            '<span class="is-muted">STUDY GUIDE PENDING</span>' +
          '</span>' +
        '</a>';
    }).join('');
  }

  function renderCommittees() {
    var host = $('#committee-list');
    if (!host) return;

    host.innerHTML = DATA.committees.map(function (c) {
      return '' +
        '<article class="committee">' +
          '<span class="reticle reticle--tr"></span>' +
          '<div class="committee__photo hatch--tight">' +
            '<p class="slot-label">[ COMMITTEE<br>PHOTO ]</p>' +
          '</div>' +
          '<div class="committee__body">' +
            '<p class="committee__meta">' +
              esc(c.code) +
              '<span class="sep" aria-hidden="true">|</span>' +
              '<span class="committee__level">' + esc(c.level) + '</span>' +
            '</p>' +
            '<h3>' + esc(c.name) + '</h3>' +
            '<p>' + esc(c.blurb) + '</p>' +
            '<div class="embargo">' +
              '<p class="readout">Agenda</p>' +
              '<p class="embargo__value">Classified — releasing shortly</p>' +
            '</div>' +
            '<dl class="dais">' +
              '<div><dt>CHAIRPERSON</dt><dd>' + esc(DATA.tba) + '</dd></div>' +
              '<div><dt>VICE-CHAIR</dt><dd>' + esc(DATA.tba) + '</dd></div>' +
            '</dl>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderTeam() {
    var host = $('#team-grid');
    if (!host) return;

    host.innerHTML = DATA.team.map(function (p) {
      return '' +
        '<article class="person">' +
          '<span class="reticle reticle--tl"></span>' +
          '<span class="reticle reticle--tr"></span>' +
          '<div class="person__portrait hatch--red">' +
            '<p class="slot-label">[ PORTRAIT ]</p>' +
          '</div>' +
          '<div class="person__body">' +
            '<p class="person__name">' + esc(p.name) + '</p>' +
            '<p class="person__role">' + esc(p.role) + '</p>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderDays() {
    var host = $('#day-grid');
    if (!host) return;

    host.innerHTML = DATA.days.map(function (d) {
      return '' +
        '<article class="day">' +
          '<div class="day__head">' +
            '<p class="day__label">' + esc(d.label) + '</p>' +
            '<h2>' + esc(d.title) + '</h2>' +
            '<p class="day__date">DATE TO BE ANNOUNCED</p>' +
          '</div>' +
          '<div class="day__body">' +
            '<div>' +
              '<div class="day__ring"><span class="dot"></span></div>' +
              '<p class="readout stack-18">SESSION PLAN PENDING</p>' +
              '<p class="day__note">' + esc(d.note) + '</p>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderSponsorTiers() {
    var host = $('#tier-grid');
    if (!host) return;

    host.innerHTML = DATA.sponsorTiers.map(function (t) {
      return '' +
        '<article class="tier">' +
          '<p class="readout readout--gold">' + esc(t.tag) + '</p>' +
          '<h3>' + esc(t.name) + '</h3>' +
          '<p class="tier__price">' + esc(t.price) + '</p>' +
          '<ul class="tier__perks">' +
            t.perks.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') +
          '</ul>' +
          '<div class="tier__action">' +
            '<a class="btn btn--ghost btn--sm" href="#/contact">Enquire</a>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderLogoWall() {
    var host = $('#logo-wall');
    if (!host) return;

    host.innerHTML = DATA.logoSlots.map(function (l) {
      return '<div class="logo-slot">' + esc(l) + '</div>';
    }).join('');
  }

  function renderGallery() {
    var host = $('#gallery-grid');
    if (!host) return;

    host.innerHTML = DATA.gallery.map(function (g) {
      return '' +
        '<div class="gallery__cell hatch" style="grid-column: span ' + g.span + ';">' +
          '<span class="reticle reticle--tl"></span>' +
          '<span class="reticle reticle--br"></span>' +
          '<p class="slot-label">' + esc(g.label) + '</p>' +
        '</div>';
    }).join('');
  }

  function renderFaqs() {
    var host = $('#faq-list');
    if (!host) return;

    host.innerHTML = DATA.faqs.map(function (f, i) {
      var open = i === 0;
      return '' +
        '<div class="faq">' +
          '<h3>' +
            '<button type="button" class="faq__q" aria-expanded="' + open + '" aria-controls="faq-a-' + i + '" id="faq-q-' + i + '">' +
              '<span class="faq__num">' + esc(f.num) + '</span>' +
              '<span class="faq__text">' + esc(f.q) + '</span>' +
              '<span class="faq__sign" aria-hidden="true"></span>' +
            '</button>' +
          '</h3>' +
          '<div class="faq__a" id="faq-a-' + i + '" role="region" aria-labelledby="faq-q-' + i + '"' + (open ? '' : ' hidden') + '>' +
            '<p>' + esc(f.a) + '</p>' +
          '</div>' +
        '</div>';
    }).join('');

    host.addEventListener('click', function (event) {
      var trigger = event.target.closest('.faq__q');
      if (!trigger) return;

      var isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // One panel at a time, matching the prototype's single-index state.
      $$('.faq__q', host).forEach(function (other) {
        other.setAttribute('aria-expanded', 'false');
        document.getElementById(other.getAttribute('aria-controls')).hidden = true;
      });

      if (!isOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        document.getElementById(trigger.getAttribute('aria-controls')).hidden = false;
      }
    });
  }

  function renderTokens() {
    var host = $('#token-grid');
    if (!host) return;

    host.innerHTML = DATA.tokens.map(function (t) {
      return '' +
        '<div class="token">' +
          '<div class="token__swatch" style="background: ' + esc(t.hex) + ';"></div>' +
          '<div class="token__body">' +
            '<p class="token__name">' + esc(t.name) + '</p>' +
            '<p class="token__hex">' + esc(t.hex) + '</p>' +
            '<p class="token__use">' + esc(t.use) + '</p>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function renderSpacing() {
    var host = $('#spacing-list');
    if (!host) return;

    host.innerHTML = DATA.spacing.map(function (s) {
      return '' +
        '<div class="spacing-row">' +
          '<span class="spacing-row__label">' + esc(s.label) + '</span>' +
          '<span class="spacing-row__bar" style="width: ' + esc(s.w) + ';"></span>' +
        '</div>';
    }).join('');
  }

  /* ---------------------------------------------------------------------
     Routing
     --------------------------------------------------------------------- */

  var PAGES = {
    home:       { title: null,                     group: null },
    about:      { title: 'About',                  group: 'conference' },
    committees: { title: 'Committees',             group: 'conference' },
    schedule:   { title: 'Schedule',               group: 'conference' },
    register:   { title: 'Registration',           group: 'delegates' },
    faq:        { title: 'FAQ',                    group: 'delegates' },
    team:       { title: 'Secretariat',            group: 'people' },
    sponsors:   { title: 'Sponsors & Partners',    group: 'people' },
    press:      { title: 'Press & Gallery',        group: 'people' },
    system:     { title: 'Design system',          group: 'people' },
    contact:    { title: 'Contact',                group: null }
  };

  var BASE_TITLE = 'Lumen MUN — Edition I · Guntur';
  var SWAP_AT = 260;   // content changes behind the band
  var SWEEP_END = 660; // band clears

  var sweepEl;
  var currentPage = null;
  var swapTimer = null;
  var endTimer = null;

  function pageFromHash() {
    var raw = (window.location.hash || '').replace(/^#\/?/, '').trim();
    return Object.prototype.hasOwnProperty.call(PAGES, raw) ? raw : 'home';
  }

  function markNav(page) {
    var group = PAGES[page].group;

    $$('[data-nav-group]').forEach(function (el) {
      el.setAttribute('data-active', String(el.getAttribute('data-nav-group') === group));
    });
    $$('[data-nav-page]').forEach(function (el) {
      var isCurrent = el.getAttribute('data-nav-page') === page;
      el.setAttribute('data-active', String(isCurrent));
      if (isCurrent) {
        el.setAttribute('aria-current', 'page');
      } else {
        el.removeAttribute('aria-current');
      }
    });
  }

  function showPage(page, options) {
    var target = document.getElementById('page-' + page);
    if (!target) return;

    $$('.page').forEach(function (el) {
      el.classList.toggle('is-current', el === target);
    });

    document.title = PAGES[page].title
      ? PAGES[page].title + ' · Lumen MUN'
      : BASE_TITLE;

    markNav(page);
    currentPage = page;

    if (options && options.scroll) {
      window.scrollTo(0, 0);
    }

    // Announce the new page to assistive tech without stealing the caret.
    if (options && options.focus) {
      var heading = target.querySelector('[data-page-heading]');
      if (heading) heading.focus({ preventScroll: true });
    }

    if (page === 'home') startCounters();
  }

  function navigate(page, options) {
    if (page === currentPage) return;

    clearTimeout(swapTimer);
    clearTimeout(endTimer);

    if (prefersReducedMotion.matches) {
      showPage(page, { scroll: true, focus: !!(options && options.focus) });
      return;
    }

    sweepEl.classList.remove('is-active');
    void sweepEl.offsetWidth; // restart the animation
    sweepEl.classList.add('is-active');

    swapTimer = setTimeout(function () {
      showPage(page, { scroll: true, focus: !!(options && options.focus) });
    }, SWAP_AT);

    endTimer = setTimeout(function () {
      sweepEl.classList.remove('is-active');
    }, SWEEP_END);
  }

  function onHashChange() {
    closeAllMenus();
    closeMobileNav();
    navigate(pageFromHash(), { focus: true });
  }

  /* ---------------------------------------------------------------------
     Readout counters — tick once on first paint over 1.1s
     --------------------------------------------------------------------- */

  var countersDone = false;

  function startCounters() {
    if (countersDone) return;
    countersDone = true;

    var delegatesEl = $('#stat-delegates');
    var committeesEl = $('#stat-committees');
    if (!delegatesEl || !committeesEl) return;

    if (prefersReducedMotion.matches) {
      delegatesEl.textContent = DATA.stats.delegates;
      committeesEl.textContent = DATA.stats.committees;
      return;
    }

    var start = performance.now();
    var duration = 1100;

    function tick(now) {
      var k = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - k, 3);
      delegatesEl.textContent = Math.round(DATA.stats.delegates * eased);
      committeesEl.textContent = Math.round(DATA.stats.committees * eased);
      if (k < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------------
     Grouped dropdown navigation
     --------------------------------------------------------------------- */

  function closeAllMenus(except) {
    $$('.nav__group').forEach(function (group) {
      if (group === except) return;
      group.setAttribute('data-open', 'false');
      var trigger = $('.nav__trigger', group);
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function openMenu(group) {
    closeAllMenus(group);
    group.setAttribute('data-open', 'true');
    var trigger = $('.nav__trigger', group);
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu(group) {
    group.setAttribute('data-open', 'false');
    var trigger = $('.nav__trigger', group);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function initNav() {
    $$('.nav__group').forEach(function (group) {
      var trigger = $('.nav__trigger', group);

      // Pointer: open on hover, exactly as the design specifies.
      group.addEventListener('pointerenter', function (event) {
        if (event.pointerType === 'touch') return;
        openMenu(group);
      });
      group.addEventListener('pointerleave', function (event) {
        if (event.pointerType === 'touch') return;
        closeMenu(group);
      });

      // Keyboard and touch: the trigger is a real button that toggles.
      trigger.addEventListener('click', function () {
        if (group.getAttribute('data-open') === 'true') {
          closeMenu(group);
        } else {
          openMenu(group);
        }
      });

      group.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && group.getAttribute('data-open') === 'true') {
          closeMenu(group);
          trigger.focus();
        }
      });

      group.addEventListener('focusout', function (event) {
        if (!group.contains(event.relatedTarget)) closeMenu(group);
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.nav__group')) closeAllMenus();
    });
  }

  /* ---------------------------------------------------------------------
     Mobile HUD panel
     --------------------------------------------------------------------- */

  var mobileNav, navToggle;

  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.setAttribute('data-open', 'false');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.removeProperty('overflow');
  }

  function initMobileNav() {
    mobileNav = $('#mobile-nav');
    navToggle = $('#nav-toggle');
    if (!mobileNav || !navToggle) return;

    navToggle.addEventListener('click', function () {
      var open = mobileNav.getAttribute('data-open') === 'true';
      mobileNav.setAttribute('data-open', String(!open));
      navToggle.setAttribute('aria-expanded', String(!open));
      document.body.style.overflow = open ? '' : 'hidden';
      if (!open) {
        var first = mobileNav.querySelector('a, button');
        if (first) first.focus();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && mobileNav.getAttribute('data-open') === 'true') {
        closeMobileNav();
        navToggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Registration — track switch and running fee total
     --------------------------------------------------------------------- */

  function delegateCount(form) {
    if (!form) return 1;
    var sizeField = form.elements.delegationSize;
    if (!sizeField) return 1;
    var match = /\d+/.exec(sizeField.value);
    return match ? parseInt(match[0], 10) : 1;
  }

  function updateFeeTotal() {
    var hosts = $$('.fee-total');
    if (!hosts.length) return;

    var activeForm = $('.form-panel[data-track]:not([hidden]) form');
    if (!activeForm) return;

    var isSchool = activeForm.id === 'form-school';
    var heads = isSchool ? delegateCount(activeForm) : 1;

    // Anchored: "Not required" must not match.
    var stay = activeForm.elements.accommodation;
    var wantsStay = stay && /^required/i.test(stay.value);
    var stayHeads = wantsStay ? (stay.value === 'Required — for part of delegation' ? 1 : heads) : 0;

    var total = DATA.fee.regular * heads + DATA.fee.accommodation * stayHeads;
    var label = (isSchool ? 'FROM ' : 'TOTAL ') + rupees(total);

    hosts.forEach(function (host) { host.textContent = label; });
  }

  function selectTrack(track) {
    $$('.track').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-track') === track));
    });
    $$('.form-panel[data-track]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-track') !== track;
    });
    updateFeeTotal();
  }

  function initRegister() {
    var tracks = $$('.track');
    if (!tracks.length) return;

    tracks.forEach(function (button) {
      button.addEventListener('click', function () {
        selectTrack(button.getAttribute('data-track'));
      });
    });

    $$('.form-panel[data-track] form').forEach(function (form) {
      form.addEventListener('change', updateFeeTotal);
    });

    selectTrack('individual');
  }

  /* ---------------------------------------------------------------------
     Forms
     --------------------------------------------------------------------- */

  /**
   * Submission target. Set window.LUMEN_FORM_ENDPOINT to a URL that accepts a
   * JSON POST and the forms will use it. Until one is configured, submissions
   * fall back to a pre-composed email to the department that owns the form —
   * which keeps the site fully functional as a static deploy.
   */
  function submitForm(form, statusEl) {
    var payload = {};
    new FormData(form).forEach(function (value, key) { payload[key] = value; });
    payload.form = form.getAttribute('data-form-name') || form.id;

    var endpoint = window.LUMEN_FORM_ENDPOINT;

    if (endpoint) {
      statusEl.hidden = false;
      statusEl.textContent = 'Sending…';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) throw new Error('Request failed: ' + response.status);
        statusEl.textContent = 'Received. You will hear back by email — check your spam folder if nothing arrives within 48 hours.';
        form.reset();
        updateFeeTotal();
      }).catch(function () {
        statusEl.textContent = 'That did not go through. Please email ' + form.getAttribute('data-mailto') + ' directly.';
      });
      return;
    }

    var address = form.getAttribute('data-mailto');
    var subject = form.getAttribute('data-subject') || 'Lumen MUN enquiry';
    var body = Object.keys(payload).map(function (key) {
      return key + ': ' + payload[key];
    }).join('\n');

    window.location.href = 'mailto:' + address +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    statusEl.hidden = false;
    statusEl.textContent = 'Your email client should now be open with this application filled in. Send it to ' + address + ' to complete your submission.';
  }

  function initForms() {
    $$('form[data-mailto]').forEach(function (form) {
      var statusEl = $('.form-status', form);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        submitForm(form, statusEl);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */

  function init() {
    sweepEl = $('#sweep');

    renderCommitteePreviews();
    renderCommittees();
    renderTeam();
    renderDays();
    renderSponsorTiers();
    renderLogoWall();
    renderGallery();
    renderFaqs();
    renderTokens();
    renderSpacing();

    initNav();
    initMobileNav();
    initRegister();
    initForms();

    window.addEventListener('hashchange', onHashChange);

    // Tapping a link to the page you are already on fires no hashchange, so
    // dismiss the menus here rather than leaving them open over the content.
    document.addEventListener('click', function (event) {
      if (event.target.closest('a[href^="#/"]')) {
        closeAllMenus();
        closeMobileNav();
      }
    });

    // First paint: no sweep, just land on the requested page.
    showPage(pageFromHash(), { scroll: false, focus: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
