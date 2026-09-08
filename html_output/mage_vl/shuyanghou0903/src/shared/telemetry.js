(function () {
  'use strict';

  if (window.__DL_TELEMETRY__) return;

  var ENDPOINT = '/__telemetry/events';
  var BOOTSTRAP_ENDPOINT = '/__telemetry/bootstrap';
  var MEMORY_PENDING_ENDPOINT = '/__telemetry/sync/pending?limit=200';
  var MEMORY_ACK_ENDPOINT = '/__telemetry/sync/ack';
  var SKILL_MEMORY_ID = 'intuitive-deep-learning';
  var BEHAVIOR_DATABASE_SOURCE = 'intuitive-deep-learning/history/behavior.sqlite3';
  var NEXT_LESSON_SELECTOR = 'a[data-next-lesson]';
  var NEXT_NAVIGATION_TIMEOUT = 3000;
  var BATCH_SIZE = 20;
  var FLUSH_INTERVAL = 2000;
  var MAX_QUEUE_SIZE = 1000;
  var INTERACTIVE_SELECTOR = 'button,a,input,select,textarea,[role="button"],[role="option"],[role="slider"],[contenteditable="true"]';
  var queue = [];
  var sending = false;
  var consecutiveFailures = 0;
  var retryAfter = 0;
  var fallbackSequence = 0;
  var pageStartedAtUnix = Date.now();
  var pageStartedAt = window.performance.now();
  var visibleStartedAt = document.visibilityState === 'visible' ? pageStartedAt : null;
  var visibleElapsedMs = 0;
  var focusState = new WeakMap();
  var questionAttempts = new WeakMap();
  var observedQuestions = new WeakSet();
  var pageLeaveEmitted = false;
  var memoryReportInFlight = null;
  var telemetryBootstrap = null;

  function ensureTelemetryBootstrap() {
    if (telemetryBootstrap) return telemetryBootstrap;
    telemetryBootstrap = window.fetch(BOOTSTRAP_ENDPOINT, {
      cache: 'no-store',
      credentials: 'same-origin'
    }).catch(function () {
      return false;
    });
    return telemetryBootstrap;
  }

  function createId(prefix) {
    var value = window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    return (prefix || '') + value;
  }

  function getSessionId() {
    var key = 'dl-telemetry-session-id';
    try {
      var current = window.sessionStorage.getItem(key);
      if (current) return current;
      current = createId('sess_');
      window.sessionStorage.setItem(key, current);
      return current;
    }
    catch (_error) {
      return createId('sess_');
    }
  }

  function moduleId() {
    var segments = window.location.pathname.split('/').filter(Boolean);
    if (segments[0] === 'modules' && segments[1]) return decodeURIComponent(segments[1]);
    return decodeURIComponent(segments[0] || 'root');
  }

  var sessionId = getSessionId();
  var currentModuleId = moduleId();

  function nextSequence() {
    var key = 'dl-telemetry-session-sequence:' + sessionId;
    try {
      var current = Number(window.sessionStorage.getItem(key) || 0);
      if (!Number.isFinite(current) || current < 0) current = 0;
      current += 1;
      window.sessionStorage.setItem(key, String(current));
      return current;
    }
    catch (_error) {
      fallbackSequence += 1;
      return fallbackSequence;
    }
  }

  function cleanText(value, limit) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit || 160);
  }

  var currentModuleName = cleanText(
    document.documentElement.getAttribute('data-module-name') || document.title || currentModuleId,
    160
  );

  function elementKind(element) {
    if (!element) return 'document';
    var tag = element.tagName.toLowerCase();
    if (tag === 'input') return (element.type || 'text').toLowerCase();
    if (element.getAttribute('role')) return element.getAttribute('role');
    if (element.isContentEditable) return 'contenteditable';
    return tag;
  }

  function elementPath(element) {
    var parts = [];
    var node = element;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      var tag = node.tagName.toLowerCase();
      var parent = node.parentElement;
      if (parent) {
        var siblings = Array.prototype.filter.call(parent.children, function (candidate) {
          return candidate.tagName === node.tagName;
        });
        if (siblings.length > 1) tag += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
      }
      parts.unshift(tag);
      if (node.id || parts.length >= 6) break;
      node = parent;
    }
    return parts.join('>') || 'document';
  }

  function elementKey(element) {
    if (!element) return 'document';
    if (element.id) return '#' + element.id;
    if (element.getAttribute('name')) {
      return element.tagName.toLowerCase() + '[name="' + cleanText(element.getAttribute('name'), 80) + '"]';
    }
    var parentWithId = element.parentElement && element.parentElement.closest('[id]');
    if (parentWithId) return '#' + parentWithId.id + '>' + elementPath(element).split('>').pop();
    return elementPath(element);
  }

  function elementLabel(element) {
    if (!element) return '';
    var aria = element.getAttribute('aria-label');
    if (aria) return cleanText(aria);
    if (element.labels && element.labels.length) return cleanText(element.labels[0].textContent);
    if (element.getAttribute('title')) return cleanText(element.getAttribute('title'));
    if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.getAttribute('role')) {
      return cleanText(element.textContent);
    }
    if (element.getAttribute('placeholder')) return cleanText(element.getAttribute('placeholder'));
    return '';
  }

  function safeHref(element) {
    if (!element || element.tagName !== 'A' || !element.href) return undefined;
    try {
      var url = new URL(element.href, window.location.href);
      return url.origin === window.location.origin ? url.pathname + url.hash : url.origin + url.pathname;
    }
    catch (_error) {
      return undefined;
    }
  }

  function controlValue(element) {
    var kind = elementKind(element);
    if (kind === 'checkbox' || kind === 'radio') return { checked: element.checked, value: cleanText(element.value, 120) };
    if (kind === 'range' || kind === 'number') return { value: Number(element.value), min: Number(element.min), max: Number(element.max) };
    if (kind === 'file') {
      return {
        file_count: element.files ? element.files.length : 0,
        file_types: element.files ? Array.prototype.map.call(element.files, function (file) { return file.type || 'unknown'; }) : []
      };
    }
    if (element.tagName === 'SELECT') {
      return {
        value: element.multiple
          ? Array.prototype.filter.call(element.options, function (option) { return option.selected; }).map(function (option) { return cleanText(option.value, 120); })
          : cleanText(element.value, 120)
      };
    }
    if (kind === 'password') return { sensitive: true };
    if (element.tagName === 'TEXTAREA' || kind === 'text' || kind === 'search' || kind === 'email' || kind === 'url' || kind === 'tel' || element.isContentEditable) {
      var text = element.isContentEditable ? element.textContent : element.value;
      var value = String(text || '');
      return { value: value, length: Array.from(value).length, empty: !value.trim() };
    }
    return element.value == null ? {} : { value: cleanText(element.value, 120) };
  }

  function inputSnapshot(root) {
    if (!root || !root.querySelectorAll) return [];
    return Array.prototype.map.call(
      root.querySelectorAll('input,select,textarea,[contenteditable="true"]'),
      function (field) {
        return {
          key: elementKey(field),
          kind: elementKind(field),
          value: controlValue(field)
        };
      }
    );
  }

  function eventKind(eventName) {
    if (eventName.indexOf('page_') === 0) return 'page';
    if (eventName.indexOf('module_') === 0 || eventName.indexOf('lesson_') === 0) return 'learning';
    if (eventName === 'page_rating') return 'feedback';
    if (eventName === 'ui_click') return 'click';
    if (eventName.indexOf('answer_') === 0 || eventName === 'question_view') return 'answer';
    if (eventName.indexOf('control_') === 0 || eventName.indexOf('range_') === 0 || eventName === 'form_submit') return 'input';
    return 'system';
  }

  function baseEvent(eventName, element, properties, timing) {
    var now = Date.now();
    var timeStart = timing && Number.isFinite(timing.time_start) ? Math.round(timing.time_start) : now;
    var timeEnd = timing && Number.isFinite(timing.time_end) ? Math.round(timing.time_end) : now;
    if (timeEnd < timeStart) timeEnd = timeStart;
    var eventValue = Object.assign({}, properties || {}, {
      sequence: nextSequence(),
      page_path: window.location.pathname
    });
    var isPageRoot = !element || element === document || element === document.documentElement || element === document.body;
    if (!isPageRoot) {
      eventValue.element = {
        kind: elementKind(element),
        key: elementKey(element),
        label: elementLabel(element)
      };
    }
    return {
      event_id: createId('evt_'),
      session_id: sessionId,
      module_id: currentModuleId,
      module_name: currentModuleName,
      event_name: eventName,
      event_kind: eventKind(eventName),
      event_value: eventValue,
      time_start: timeStart,
      time_end: timeEnd
    };
  }

  function emit(eventName, element, properties, timing) {
    queue.push(baseEvent(eventName, element, properties, timing));
    if (queue.length > MAX_QUEUE_SIZE) queue.splice(0, queue.length - MAX_QUEUE_SIZE);
    if (queue.length >= BATCH_SIZE) flush();
  }

  function flush() {
    if (sending || !queue.length) return Promise.resolve(false);
    if (Date.now() < retryAfter) return Promise.resolve(false);
    sending = true;
    var batch = queue.splice(0, BATCH_SIZE);
    return ensureTelemetryBootstrap().then(function () {
      return window.fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
      credentials: 'same-origin'
      });
    }).then(function (response) {
      if (!response.ok) throw new Error('telemetry-http-' + response.status);
      consecutiveFailures = 0;
      retryAfter = 0;
      return true;
    }).catch(function () {
      queue = batch.concat(queue).slice(0, MAX_QUEUE_SIZE);
      consecutiveFailures += 1;
      retryAfter = Date.now() + Math.min(60000, 2000 * Math.pow(2, Math.min(consecutiveFailures - 1, 5)));
      return false;
    }).finally(function () {
      sending = false;
      if (queue.length >= BATCH_SIZE) {
        window.setTimeout(flush, Math.max(0, retryAfter - Date.now()));
      }
    });
  }

  function flushWithBeacon() {
    if (!queue.length || typeof navigator.sendBeacon !== 'function') return;
    var batch = queue.splice(0, queue.length);
    var body = new Blob([JSON.stringify({ events: batch })], { type: 'application/json' });
    if (!navigator.sendBeacon(ENDPOINT, body)) queue = batch.concat(queue).slice(0, MAX_QUEUE_SIZE);
  }

  function flushAll(attempt) {
    var currentAttempt = attempt || 0;
    if (sending) {
      if (currentAttempt >= 100) return Promise.resolve(false);
      return new Promise(function (resolve) {
        window.setTimeout(resolve, 50);
      }).then(function () {
        return flushAll(currentAttempt + 1);
      });
    }
    if (!queue.length) return Promise.resolve(true);
    return flush().then(function (sent) {
      if (!sent || !queue.length) return sent;
      return flushAll(currentAttempt);
    });
  }

  function emitPageLeave() {
    if (pageLeaveEmitted) return;
    pageLeaveEmitted = true;
    var endedAt = Date.now();
    emit('page_leave', document.documentElement, {
      duration_ms: Math.round(window.performance.now() - pageStartedAt),
      visible_duration_ms: visibleDurationMs(),
      inputs: inputSnapshot(document)
    }, { time_start: pageStartedAtUnix, time_end: endedAt });
  }

  function fetchPendingMemoryBatch() {
    return window.fetch(MEMORY_PENDING_ENDPOINT, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('behavior-sync-pending-http-' + response.status);
        return response.json();
      });
  }

  function acknowledgeMemoryBatch(cursor) {
    return window.fetch(MEMORY_ACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: SKILL_MEMORY_ID, cursor: cursor })
    }).then(function (response) {
      if (!response.ok) throw new Error('behavior-sync-ack-http-' + response.status);
      return response.json();
    }).then(function (result) {
      if (!result || result.ok !== true) throw new Error('behavior-sync-ack-failed');
      return result;
    });
  }

  function uploadPendingMemoryBatches(ipc) {
    return fetchPendingMemoryBatch().then(function (batch) {
      if (!batch || !Array.isArray(batch.events)) throw new Error('behavior-sync-invalid-batch');
      if (!batch.events.length) return true;

      batch.source = BEHAVIOR_DATABASE_SOURCE;
      return ipc.reportSkillMemory({
        skill_id: SKILL_MEMORY_ID,
        content: JSON.stringify(batch)
      }).then(function (saved) {
        if (!saved || saved.ok !== true) {
          throw new Error(saved && saved.error ? saved.error : 'skill-memory-report-failed');
        }
        return acknowledgeMemoryBatch(batch.to_cursor);
      }).then(function () {
        return batch.has_more ? uploadPendingMemoryBatches(ipc) : true;
      });
    });
  }

  function reportSkillMemory() {
    var ipc = window.__growAgentIpc;
    if (!ipc || typeof ipc.reportSkillMemory !== 'function') return Promise.resolve(false);
    if (memoryReportInFlight) return memoryReportInFlight;

    memoryReportInFlight = flushAll()
      .then(function () {
        return uploadPendingMemoryBatches(ipc);
      })
      .catch(function (error) {
        console.warn('[telemetry] skill memory report failed', error);
        return false;
      })
      .finally(function () {
        memoryReportInFlight = null;
      });
    return memoryReportInFlight;
  }

  function getModuleState(requestedModuleId) {
    var requested = cleanText(requestedModuleId || currentModuleId, 160);
    return ensureTelemetryBootstrap().then(function () {
      return window.fetch('/__telemetry/state?module_id=' + encodeURIComponent(requested), {
        cache: 'no-store',
        credentials: 'same-origin'
      });
    }).then(function (response) {
      if (!response.ok) throw new Error('telemetry-state-http-' + response.status);
      return response.json();
    });
  }

  function shouldInterceptNextNavigation(event, link) {
    return event.button === 0
      && !event.metaKey
      && !event.ctrlKey
      && !event.shiftKey
      && !event.altKey
      && (!link.target || link.target === '_self')
      && !link.hasAttribute('download');
  }

  function navigateAfterSkillMemory(link) {
    var navigated = false;
    function navigate() {
      if (navigated) return;
      navigated = true;
      window.location.assign(link.href);
    }

    emitPageLeave();
    var timeout = window.setTimeout(navigate, NEXT_NAVIGATION_TIMEOUT);
    reportSkillMemory().finally(function () {
      window.clearTimeout(timeout);
      navigate();
    });
  }

  function pauseVisibleTimer() {
    if (visibleStartedAt == null) return;
    visibleElapsedMs += window.performance.now() - visibleStartedAt;
    visibleStartedAt = null;
  }

  function resumeVisibleTimer() {
    if (visibleStartedAt == null) visibleStartedAt = window.performance.now();
  }

  function visibleDurationMs() {
    var currentSegment = visibleStartedAt == null ? 0 : window.performance.now() - visibleStartedAt;
    return Math.round(visibleElapsedMs + currentSegment);
  }

  function interactiveTarget(event) {
    var target = event.target && event.target.nodeType === 1 ? event.target : null;
    return target ? target.closest(INTERACTIVE_SELECTOR) : null;
  }

  function questionResult(question) {
    var feedback = question && question.querySelector('.dl-question-feedback');
    if (!feedback || feedback.hidden || !cleanText(feedback.textContent)) return null;
    if (feedback.classList.contains('is-correct')) return true;
    if (feedback.classList.contains('is-wrong')) return false;
    return null;
  }

  function questionProperties(question) {
    var selected = Array.prototype.map.call(question.querySelectorAll('.dl-question-option.is-selected'), function (option) {
      return Number(option.getAttribute('data-index'));
    });
    var fields = Array.prototype.map.call(question.querySelectorAll('[data-role="question-answer"]'), function (field) {
      return controlValue(field);
    });
    var selectedValues = Array.prototype.map.call(question.querySelectorAll('.dl-question-option.is-selected'), function (option) {
      return cleanText(option.getAttribute('data-value'), 120);
    });
    var stateKey = question.getAttribute('data-state-key') || elementKey(question);
    return {
      state_key: stateKey,
      question_key: elementKey(question),
      question_type: question.classList.contains('dl-question--multiple') ? 'multiple' : (question.getAttribute('data-question-type') || 'unknown'),
      submit_mode: question.getAttribute('data-submit-mode') || 'unknown',
      selected_options: selected,
      selected_values: selectedValues,
      answer_fields: fields,
      correct: questionResult(question),
      state: {
        selected_values: selectedValues,
        answer_fields: fields,
        correct: questionResult(question)
      }
    };
  }

  function inspectQuestionAfterClick(element) {
    var question = element.closest('.dl-question');
    if (!question) return;
    var option = element.closest('.dl-question-option');
    var submit = element.closest('.dl-question-submit');
    if (!option && !submit) return;

    window.queueMicrotask(function () {
      var properties = questionProperties(question);
      if (option) {
        properties.option_index = Number(option.getAttribute('data-index'));
        properties.selected = option.classList.contains('is-selected');
        emit('answer_select', option, properties);
      }
      if (submit) {
        var attempts = (questionAttempts.get(question) || 0) + 1;
        questionAttempts.set(question, attempts);
        properties.attempt = attempts;
        emit('answer_submit', submit, properties);
      }
    });
    return true;
  }

  document.addEventListener('click', function (event) {
    if (!event.isTrusted) return;
    var element = interactiveTarget(event);
    if (!element) return;

    var nextLink = element.closest(NEXT_LESSON_SELECTOR);
    if (nextLink && shouldInterceptNextNavigation(event, nextLink)) {
      event.preventDefault();
      navigateAfterSkillMemory(nextLink);
      return;
    }

    var selectOption = element.closest('.edu-selectbox-option');
    if (selectOption) {
      window.queueMicrotask(function () {
        var selectbox = selectOption.closest('[data-dl-selectbox]');
        var hiddenInput = selectbox && selectbox.querySelector('input[type="hidden"]');
        var value = hiddenInput ? cleanText(hiddenInput.value, 120) : cleanText(selectOption.getAttribute('data-value'), 120);
        var stateKey = (selectbox && selectbox.getAttribute('data-state-key')) || elementKey(selectbox || selectOption);
        emit('control_commit', selectbox || selectOption, {
          state_key: stateKey,
          value: value,
          state: { value: value }
        });
      });
      return;
    }

    if (element.closest('[data-telemetry-manual]')) return;
    if (inspectQuestionAfterClick(element)) return;
    if (element.matches('input,select,textarea,[contenteditable="true"]')) return;
    if (element.matches('button[type="submit"],input[type="submit"]')) return;

    var href = safeHref(element);
    if (href && href.charAt(0) === '/') return;
    emit('ui_click', element, href ? { href: href } : {});
  }, true);

  document.addEventListener('change', function (event) {
    if (!event.isTrusted) return;
    var element = interactiveTarget(event);
    if (!element) return;
    if (element.closest('[data-telemetry-manual]')) return;
    var kind = elementKind(element);
    if (kind === 'text' || kind === 'search' || kind === 'email' || kind === 'url' || kind === 'tel' || element.tagName === 'TEXTAREA' || element.isContentEditable) return;
    var state = controlValue(element);
    emit('control_commit', element, {
      state_key: element.getAttribute('data-state-key') || elementKey(element),
      state: state,
      value: state
    });
  }, true);

  document.addEventListener('focusin', function (event) {
    if (!event.isTrusted) return;
    var element = interactiveTarget(event);
    if (!element || (!element.matches('input,select,textarea,[contenteditable="true"]'))) return;
    focusState.set(element, { startedAt: Date.now(), initial: JSON.stringify(controlValue(element)) });
  }, true);

  document.addEventListener('focusout', function (event) {
    if (!event.isTrusted) return;
    var element = interactiveTarget(event);
    if (!element || (!element.matches('input,select,textarea,[contenteditable="true"]'))) return;
    if (element.closest('[data-telemetry-manual]')) return;
    var tracked = focusState.get(element);
    var properties = controlValue(element);
    var endedAt = Date.now();
    focusState.delete(element);
    if (!tracked || tracked.initial === JSON.stringify(properties)) return;
    if (event.relatedTarget && event.relatedTarget.closest && event.relatedTarget.closest('.dl-question-submit')) return;
    emit('control_commit', element, {
      state_key: element.getAttribute('data-state-key') || elementKey(element),
      state: properties,
      value: properties,
      focus_duration_ms: Math.round(endedAt - tracked.startedAt)
    }, { time_start: tracked.startedAt, time_end: endedAt });
  }, true);

  document.addEventListener('submit', function (event) {
    if (!event.isTrusted) return;
    emit('form_submit', event.target, {
      prevented: event.defaultPrevented,
      inputs: inputSnapshot(event.target)
    });
  }, true);

  var questionObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || observedQuestions.has(entry.target)) return;
        observedQuestions.add(entry.target);
        var properties = questionProperties(entry.target);
        delete properties.state_key;
        delete properties.state;
        delete properties.selected_values;
        delete properties.answer_fields;
        delete properties.correct;
        emit('question_view', entry.target, properties);
        questionObserver.unobserve(entry.target);
      });
    }, { threshold: 0.35 })
    : null;

  function observeQuestions(root) {
    if (!questionObserver) return;
    var questions = root.matches && root.matches('.dl-question')
      ? [root]
      : (root.querySelectorAll ? root.querySelectorAll('.dl-question') : []);
    Array.prototype.forEach.call(questions, function (question) {
      if (!observedQuestions.has(question)) questionObserver.observe(question);
    });
  }

  observeQuestions(document);
  if (typeof MutationObserver === 'function') {
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (node.nodeType === 1) observeQuestions(node);
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  function isModulePage() {
    var first = window.location.pathname.split('/').filter(Boolean)[0];
    return Boolean(first && first !== 'shared' && first !== 'dev' && first !== 'CourseMap');
  }

  function emitPageEntry(referrerPath) {
    emit(isModulePage() ? 'module_enter' : 'page_view', document.documentElement, {
      title: cleanText(document.title),
      referrer_path: referrerPath || ''
    });
  }

  var currentPagePath = window.location.pathname;
  emitPageEntry(document.referrer ? (function () {
    try { return new URL(document.referrer).pathname; }
    catch (_error) { return ''; }
  })() : '');

  window.addEventListener('popstate', function () {
    if (window.location.pathname === currentPagePath) return;
    var previousPath = currentPagePath;
    currentPagePath = window.location.pathname;
    currentModuleId = moduleId();
    currentModuleName = cleanText(document.documentElement.getAttribute('data-module-name') || currentModuleId, 160);
    pageStartedAtUnix = Date.now();
    pageStartedAt = window.performance.now();
    visibleStartedAt = document.visibilityState === 'visible' ? pageStartedAt : null;
    visibleElapsedMs = 0;
    pageLeaveEmitted = false;
    if (window.__DL_TELEMETRY__) window.__DL_TELEMETRY__.moduleId = currentModuleId;
    emitPageEntry(previousPath);
  });

  window.setInterval(flush, FLUSH_INTERVAL);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      pauseVisibleTimer();
      flushWithBeacon();
    }
    else {
      resumeVisibleTimer();
    }
  });
  window.addEventListener('pagehide', function () {
    emitPageLeave();
    flushWithBeacon();
  });

  window.__DL_TELEMETRY__ = {
    emit: emit,
    flush: flush,
    getModuleState: getModuleState,
    reportSkillMemory: reportSkillMemory,
    sessionId: sessionId,
    moduleId: currentModuleId
  };
})();
