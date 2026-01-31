/**
 * CONTENT SCRIPT - Block Popups and Redirects
 */

(function() {
  'use strict';

  let isEnabled = true;
  
  const SUSPICIOUS_KEYWORDS = [
    'ads', 'pop', 'click', 'track', 'banner', 'promo',
    'adserver', 'doubleclick', 'googlesyndication', 'adnxs',
    'taboola', 'outbrain', 'popunder', 'clickunder'
  ];

  let blockedCount = 0;

  function isSuspiciousUrl(url) {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return SUSPICIOUS_KEYWORDS.some(keyword => lowerUrl.includes(keyword));
  }

  function logBlocked(type, detail) {
    blockedCount++;
    
    try {
      chrome.runtime.sendMessage({
        action: 'updateBadge',
        count: blockedCount,
        url: detail,
        source: type
      });
    } catch (e) {}
  }

  function isTrustedUserAction(event) {
    if (!event || !event.isTrusted) return false;
    const now = Date.now();
    if (window._lastClickTime && (now - window._lastClickTime) < 100) return false;
    window._lastClickTime = now;
    return true;
  }

  // Override window.open
  const originalWindowOpen = window.open;

  window.open = function(url, target, features) {
    if (!isEnabled) return originalWindowOpen.call(window, url, target, features);

    if (isSuspiciousUrl(url)) {
      logBlocked('window.open', url || 'about:blank');
      return null;
    }

    if (!url || url === 'about:blank') {
      logBlocked('window.open (blank)', 'about:blank or empty URL');
      return null;
    }

    return originalWindowOpen.call(window, url, target, features);
  };

  // Block unauthorized target="_blank"
  function handleClickEvent(event) {
    if (!isEnabled) return;

    let target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }

    if (!target || target.tagName !== 'A') return;

    const href = target.href;
    const linkTarget = target.target;

    if (linkTarget === '_blank' && isSuspiciousUrl(href)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      logBlocked('link target="_blank"', href);
      return false;
    }

    if (target.hasAttribute('onclick') && isSuspiciousUrl(href)) {
      event.preventDefault();
      event.stopPropagation();
      logBlocked('suspicious onclick', href);
      return false;
    }
  }

  document.addEventListener('click', handleClickEvent, true);

  // Disable hidden ad scripts
  const scriptObserver = new MutationObserver(function(mutations) {
    if (!isEnabled) return;

    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeName === 'SCRIPT') {
          const src = node.src || '';
          const content = node.textContent || '';

          if (isSuspiciousUrl(src)) {
            node.remove();
            logBlocked('ad script', src);
            return;
          }

          const suspiciousPatterns = [
            /window\.open\s*\(/i,
            /\.popup\s*\(/i,
            /popunder/i,
            /clickunder/i,
            /document\.write.*<script/i
          ];

          if (suspiciousPatterns.some(pattern => pattern.test(content))) {
            node.remove();
            logBlocked('suspicious inline script', 'Contains popup code');
            return;
          }
        }

        if (node.nodeName === 'IFRAME') {
          const src = node.src || '';
          const style = window.getComputedStyle ? window.getComputedStyle(node) : node.style;
          
          const isHidden = (
            node.width === '0' || node.height === '0' ||
            style.width === '0px' || style.height === '0px' ||
            style.display === 'none' || style.visibility === 'hidden'
          );

          if (isHidden || isSuspiciousUrl(src)) {
            node.remove();
            logBlocked('hidden/ad iframe', src || 'Hidden iframe');
            return;
          }
        }
      });
    });
  });

  if (document.documentElement) {
    scriptObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Block redirect techniques
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(state, title, url) {
    if (isEnabled && isSuspiciousUrl(url)) {
      logBlocked('history.pushState', url);
      return;
    }
    return originalPushState.apply(this, arguments);
  };

  history.replaceState = function(state, title, url) {
    if (isEnabled && isSuspiciousUrl(url)) {
      logBlocked('history.replaceState', url);
      return;
    }
    return originalReplaceState.apply(this, arguments);
  };

  // Block timer-based popups
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;

  window.setTimeout = function(callback, delay, ...args) {
    if (isEnabled && typeof callback === 'string') {
      if (/window\.open|\.popup|location\s*=/i.test(callback)) {
        logBlocked('setTimeout with popup code', callback.substring(0, 100));
        return 0;
      }
    }
    return originalSetTimeout.call(window, callback, delay, ...args);
  };

  window.setInterval = function(callback, delay, ...args) {
    if (isEnabled && typeof callback === 'string') {
      if (/window\.open|\.popup|location\s*=/i.test(callback)) {
        logBlocked('setInterval with popup code', callback.substring(0, 100));
        return 0;
      }
    }
    return originalSetInterval.call(window, callback, delay, ...args);
  };

  // Block beforeunload popups
  window.addEventListener('beforeunload', function(event) {
    if (!isEnabled) return;
    
    const handlers = window.onbeforeunload;
    if (handlers && typeof handlers === 'function') {
      const handlerStr = handlers.toString();
      if (/window\.open|popup/i.test(handlerStr)) {
        window.onbeforeunload = null;
        logBlocked('beforeunload handler', 'Contains popup code');
      }
    }
  }, true);

  // Listen for state from storage
  chrome.storage.local.get(['isEnabled'], function(result) {
    if (result.hasOwnProperty('isEnabled')) isEnabled = result.isEnabled;
  });

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.isEnabled) {
      isEnabled = changes.isEnabled.newValue;
    }
  });

})();
