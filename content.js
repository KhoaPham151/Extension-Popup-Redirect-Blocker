/**
 * CONTENT SCRIPT - Block Popups and Redirects
 * Version 2.1 - Fixed Google Login & OAuth issues
 */

(function() {
  'use strict';

  let isEnabled = true;
  let blockedCount = 0;
  let lastUserInteraction = 0;
  
  const USER_INTERACTION_TIMEOUT = 3000; // Increased to 3 seconds for OAuth flows
  
  // Whitelist for trusted domains (NEVER block these)
  const TRUSTED_DOMAINS = [
    // Google services
    'google.com',
    'google.com.vn',
    'googleapis.com',
    'gstatic.com',
    'accounts.google.com',
    'accounts.youtube.com',
    'youtube.com',
    'gmail.com',
    'googleusercontent.com',
    
    // OAuth & Login providers
    'facebook.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'github.com',
    'microsoft.com',
    'live.com',
    'microsoftonline.com',
    'apple.com',
    'appleid.apple.com',
    'auth0.com',
    'okta.com',
    'onelogin.com',
    
    // Popular services
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
    'notion.so',
    'discord.com',
    'slack.com',
    'zoom.us',
    'dropbox.com',
    'paypal.com',
    'stripe.com'
  ];
  
  // Known ad/popup domains ONLY
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
    /exit[-_]?intent/i,
    /interstitial/i
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
    if (!url) return true; // Don't block empty URLs
    
    const hostname = getDomain(url);
    if (!hostname) return true; // Don't block if can't parse
    
    // Check against whitelist
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
    // NEVER block trusted domains
    if (isTrustedDomain(url)) return false;
    
    // Block known ad domains
    if (isBlockedDomain(url)) return true;
    
    // Block suspicious patterns only if NOT trusted
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
  
  ['click', 'mousedown', 'touchstart', 'keydown', 'submit'].forEach(eventType => {
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

    // ALWAYS allow trusted domains (Google, Facebook login, etc.)
    if (isTrustedDomain(url)) {
      return originalWindowOpen.call(window, url, target, features);
    }

    // Allow if user recently interacted
    if (isRecentUserInteraction()) {
      // Still block known ad domains
      if (isBlockedDomain(url)) {
        logBlocked('window.open (ad)', url);
        return null;
      }
      return originalWindowOpen.call(window, url, target, features);
    }

    // Block only if it's a known bad domain or suspicious
    if (shouldBlockUrl(url)) {
      logBlocked('window.open (blocked)', url);
      return null;
    }

    // For unknown domains without user interaction, allow but log
    // This prevents blocking legitimate OAuth redirects
    return originalWindowOpen.call(window, url, target, features);
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

    // NEVER block trusted domains
    if (isTrustedDomain(href)) return;

    // Block only known ad domains
    if (isBlockedDomain(href)) {
      event.preventDefault();
      event.stopPropagation();
      logBlocked('link (ad)', href);
      return false;
    }
  }, true);

  // ============ BLOCK AD SCRIPTS/IFRAMES ============

  const observer = new MutationObserver(function(mutations) {
    if (!isEnabled) return;

    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        // Block ad scripts ONLY from blocked domains
        if (node.nodeName === 'SCRIPT' && node.src) {
          if (isBlockedDomain(node.src)) {
            node.remove();
            logBlocked('script (ad)', node.src);
            return;
          }
        }

        // Block ad iframes ONLY from blocked domains
        if (node.nodeName === 'IFRAME') {
          const src = node.src || '';
          
          if (isBlockedDomain(src)) {
            node.remove();
            logBlocked('iframe (ad)', src);
            return;
          }
        }
      });
    });
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
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
