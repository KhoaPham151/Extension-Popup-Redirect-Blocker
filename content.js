/**
 * CONTENT SCRIPT - Block Popups and Redirects
 * Version 2.0 - Realistic approach
 */

(function() {
  'use strict';

  let isEnabled = true;
  let blockedCount = 0;
  let lastUserInteraction = 0;
  
  // Track real user interactions
  const USER_INTERACTION_TIMEOUT = 1000; // 1 second window after user click
  
  // Whitelist for trusted domains (never block)
  const TRUSTED_DOMAINS = [
    'google.com',
    'youtube.com',
    'gmail.com',
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'github.com',
    'microsoft.com',
    'apple.com',
    'amazon.com',
    'netflix.com',
    'spotify.com',
    'reddit.com',
    'wikipedia.org',
    'openai.com',
    'anthropic.com',
    'cloudflare.com',
    'stackoverflow.com',
    'medium.com',
    'notion.so'
  ];
  
  // Known ad/popup domains and patterns
  const BLOCKED_DOMAINS = [
    'popads.net',
    'popcash.net',
    'propellerads.com',
    'exoclick.com',
    'adnxs.com',
    'taboola.com',
    'outbrain.com',
    'mgid.com',
    'revcontent.com',
    'content.ad',
    'adsterra.com',
    'hilltopads.net',
    'trafficjunky.com',
    'juicyads.com',
    'clickadu.com',
    'ad-maven.com',
    'admaven.com',
    'pushame.com',
    'pushnami.com',
    'richpush.co',
    'onclickmax.com',
    'poperblocker.com',
    'adf.ly',
    'linkbucks.com',
    'shorte.st'
  ];

  const SUSPICIOUS_URL_PATTERNS = [
    /popunder/i,
    /clickunder/i,
    /\/adserv/i,
    /\/ads\//i,
    /\/popup\//i,
    /exit[-_]?intent/i,
    /interstitial/i,
    /\/click\?.*track/i
  ];

  // ============ UTILITY FUNCTIONS ============

  function getDomain(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function isTrustedDomain(url) {
    if (!url) return false;
    const hostname = getDomain(url);
    if (!hostname) return false;
    
    return TRUSTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  }

  function isBlockedDomain(url) {
    if (!url) return false;
    const hostname = getDomain(url);
    if (!hostname) return false;
    
    return BLOCKED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  }

  function hasSuspiciousPattern(url) {
    if (!url) return false;
    return SUSPICIOUS_URL_PATTERNS.some(pattern => pattern.test(url));
  }

  function shouldBlockUrl(url) {
    if (!url) return false;
    
    // Never block trusted domains
    if (isTrustedDomain(url)) return false;
    
    // Always block known ad domains
    if (isBlockedDomain(url)) return true;
    
    // Block suspicious patterns
    if (hasSuspiciousPattern(url)) return true;
    
    return false;
  }

  function isRecentUserInteraction() {
    return (Date.now() - lastUserInteraction) < USER_INTERACTION_TIMEOUT;
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

  // ============ TRACK USER INTERACTIONS ============
  
  // Record genuine user interactions
  ['click', 'mousedown', 'touchstart', 'keydown'].forEach(eventType => {
    document.addEventListener(eventType, function(e) {
      if (e.isTrusted) {
        lastUserInteraction = Date.now();
      }
    }, true);
  });

  // ============ OVERRIDE WINDOW.OPEN ============

  const originalWindowOpen = window.open;

  window.open = function(url, target, features) {
    if (!isEnabled) {
      return originalWindowOpen.call(window, url, target, features);
    }

    // Allow if user just interacted (clicked a button, link, etc.)
    if (isRecentUserInteraction()) {
      // But still block known ad domains
      if (url && isBlockedDomain(url)) {
        logBlocked('window.open (ad domain)', url);
        return null;
      }
      return originalWindowOpen.call(window, url, target, features);
    }

    // Block popups without user interaction
    if (!url || url === 'about:blank') {
      // Only block about:blank if no recent user interaction
      logBlocked('window.open (no user action)', url || 'about:blank');
      return null;
    }

    if (shouldBlockUrl(url)) {
      logBlocked('window.open (suspicious)', url);
      return null;
    }

    // Block popups that weren't triggered by user
    logBlocked('window.open (auto popup)', url);
    return null;
  };

  // ============ BLOCK SUSPICIOUS LINKS ============

  document.addEventListener('click', function(event) {
    if (!isEnabled || !event.isTrusted) return;

    let target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }

    if (!target || target.tagName !== 'A') return;

    const href = target.href;

    // Block links to known ad domains
    if (isBlockedDomain(href)) {
      event.preventDefault();
      event.stopPropagation();
      logBlocked('link (ad domain)', href);
      return false;
    }

    // Block suspicious redirect links
    if (hasSuspiciousPattern(href) && !isTrustedDomain(href)) {
      event.preventDefault();
      event.stopPropagation();
      logBlocked('link (suspicious pattern)', href);
      return false;
    }
  }, true);

  // ============ BLOCK SUSPICIOUS SCRIPTS/IFRAMES ============

  const observer = new MutationObserver(function(mutations) {
    if (!isEnabled) return;

    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        // Block ad scripts
        if (node.nodeName === 'SCRIPT' && node.src) {
          if (isBlockedDomain(node.src) || hasSuspiciousPattern(node.src)) {
            node.remove();
            logBlocked('script (ad)', node.src);
            return;
          }
        }

        // Block ad iframes
        if (node.nodeName === 'IFRAME') {
          const src = node.src || '';
          
          // Block known ad iframes
          if (isBlockedDomain(src) || hasSuspiciousPattern(src)) {
            node.remove();
            logBlocked('iframe (ad)', src || 'no src');
            return;
          }
          
          // Block hidden iframes (commonly used for tracking/ads)
          const style = node.style;
          const isHidden = (
            node.width == '0' || node.height == '0' ||
            style.width === '0px' || style.height === '0px' ||
            style.display === 'none' || style.visibility === 'hidden' ||
            (node.offsetWidth === 0 && node.offsetHeight === 0)
          );

          if (isHidden && src) {
            node.remove();
            logBlocked('iframe (hidden)', src);
            return;
          }
        }
      });
    });
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // ============ BLOCK HISTORY MANIPULATION ============

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(state, title, url) {
    if (isEnabled && url && shouldBlockUrl(url.toString())) {
      logBlocked('history.pushState', url);
      return;
    }
    return originalPushState.apply(this, arguments);
  };

  history.replaceState = function(state, title, url) {
    if (isEnabled && url && shouldBlockUrl(url.toString())) {
      logBlocked('history.replaceState', url);
      return;
    }
    return originalReplaceState.apply(this, arguments);
  };

  // ============ BLOCK AUTO-REDIRECT ============

  // Block meta refresh redirects to ad pages
  const checkMetaRefresh = () => {
    const metaTags = document.querySelectorAll('meta[http-equiv="refresh"]');
    metaTags.forEach(meta => {
      const content = meta.getAttribute('content') || '';
      const urlMatch = content.match(/url\s*=\s*['"]?([^'";\s]+)/i);
      if (urlMatch && urlMatch[1]) {
        if (shouldBlockUrl(urlMatch[1])) {
          meta.remove();
          logBlocked('meta refresh', urlMatch[1]);
        }
      }
    });
  };

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkMetaRefresh);
  } else {
    checkMetaRefresh();
  }

  // ============ SYNC WITH STORAGE ============

  chrome.storage.local.get(['isEnabled'], function(result) {
    if (result.hasOwnProperty('isEnabled')) {
      isEnabled = result.isEnabled;
    }
  });

  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.isEnabled) {
      isEnabled = changes.isEnabled.newValue;
    }
  });

})();
