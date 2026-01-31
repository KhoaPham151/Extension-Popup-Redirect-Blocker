/**
 * CONTENT SCRIPT - Block Popups and Redirects
 * Version 2.2 - Comprehensive global whitelist
 */

(function() {
  'use strict';

  let isEnabled = true;
  let blockedCount = 0;
  let lastUserInteraction = 0;
  
  const USER_INTERACTION_TIMEOUT = 5000; // 5 seconds for OAuth flows
  
  // ===========================================
  // COMPREHENSIVE WHITELIST - GLOBAL COVERAGE
  // ===========================================
  const TRUSTED_DOMAINS = [
    // ========== GOOGLE SERVICES ==========
    'google.com',
    'google.com.vn',
    'google.co.uk',
    'google.de',
    'google.fr',
    'google.es',
    'google.it',
    'google.co.jp',
    'google.co.kr',
    'google.com.br',
    'google.ca',
    'google.com.au',
    'google.co.in',
    'google.ru',
    'google.pl',
    'google.nl',
    'google.com.tw',
    'google.com.hk',
    'google.com.sg',
    'google.com.mx',
    'googleapis.com',
    'gstatic.com',
    'googleusercontent.com',
    'googlevideo.com',
    'googleadservices.com',
    'google-analytics.com',
    'googletagmanager.com',
    'accounts.google.com',
    'accounts.youtube.com',
    'youtube.com',
    'youtu.be',
    'gmail.com',
    'mail.google.com',
    'drive.google.com',
    'docs.google.com',
    'sheets.google.com',
    'slides.google.com',
    'calendar.google.com',
    'meet.google.com',
    'chat.google.com',
    'photos.google.com',
    'play.google.com',
    'gemini.google.com',
    
    // ========== MICROSOFT SERVICES ==========
    'microsoft.com',
    'microsoftonline.com',
    'live.com',
    'outlook.com',
    'outlook.live.com',
    'office.com',
    'office365.com',
    'sharepoint.com',
    'onedrive.com',
    'onedrive.live.com',
    'azure.com',
    'azure.microsoft.com',
    'login.microsoftonline.com',
    'login.live.com',
    'account.microsoft.com',
    'bing.com',
    'msn.com',
    'skype.com',
    'linkedin.com',
    'github.com',
    'githubusercontent.com',
    'githubassets.com',
    'visualstudio.com',
    'xbox.com',
    'windowsupdate.com',
    
    // ========== META/FACEBOOK ==========
    'facebook.com',
    'fb.com',
    'fb.me',
    'fbcdn.net',
    'facebook.net',
    'messenger.com',
    'instagram.com',
    'cdninstagram.com',
    'whatsapp.com',
    'whatsapp.net',
    'threads.net',
    'meta.com',
    'oculus.com',
    
    // ========== APPLE SERVICES ==========
    'apple.com',
    'icloud.com',
    'icloud.com.cn',
    'appleid.apple.com',
    'itunes.apple.com',
    'mzstatic.com',
    'apple-cloudkit.com',
    
    // ========== AMAZON SERVICES ==========
    'amazon.com',
    'amazon.co.uk',
    'amazon.de',
    'amazon.fr',
    'amazon.co.jp',
    'amazon.in',
    'amazon.ca',
    'amazon.com.au',
    'amazon.com.br',
    'amazon.es',
    'amazon.it',
    'amazon.nl',
    'amazon.sg',
    'amazon.ae',
    'amazon.sa',
    'amazon.com.mx',
    'amazon.com.tr',
    'amazonaws.com',
    'cloudfront.net',
    'aws.amazon.com',
    'twitch.tv',
    'twitchcdn.net',
    'jtvnw.net',
    'primevideo.com',
    'imdb.com',
    'audible.com',
    'alexa.com',
    'whole foods.com',
    
    // ========== TWITTER/X ==========
    'twitter.com',
    'x.com',
    't.co',
    'twimg.com',
    'tweetdeck.com',
    
    // ========== SOCIAL MEDIA ==========
    'reddit.com',
    'redd.it',
    'redditstatic.com',
    'redditmedia.com',
    'pinterest.com',
    'pinimg.com',
    'tiktok.com',
    'tiktokcdn.com',
    'musical.ly',
    'snapchat.com',
    'snap.com',
    'discord.com',
    'discordapp.com',
    'discord.gg',
    'telegram.org',
    't.me',
    'telegram.me',
    'tumblr.com',
    'quora.com',
    'vk.com',
    'vkontakte.ru',
    'weibo.com',
    'weibo.cn',
    'qq.com',
    'wechat.com',
    'line.me',
    'line.naver.jp',
    
    // ========== VIDEO/STREAMING ==========
    'netflix.com',
    'nflxvideo.net',
    'nflximg.net',
    'nflxext.com',
    'hulu.com',
    'huluim.com',
    'disneyplus.com',
    'disney.com',
    'espn.com',
    'hbomax.com',
    'max.com',
    'hbo.com',
    'peacocktv.com',
    'paramountplus.com',
    'cbs.com',
    'abc.com',
    'nbc.com',
    'fox.com',
    'crunchyroll.com',
    'funimation.com',
    'vimeo.com',
    'dailymotion.com',
    'twitch.tv',
    'bilibili.com',
    'bilibili.tv',
    'niconico.jp',
    'nicovideo.jp',
    
    // ========== MUSIC/AUDIO ==========
    'spotify.com',
    'scdn.co',
    'spotifycdn.com',
    'soundcloud.com',
    'sndcdn.com',
    'apple.music',
    'music.apple.com',
    'deezer.com',
    'pandora.com',
    'tidal.com',
    'bandcamp.com',
    
    // ========== E-COMMERCE ==========
    'ebay.com',
    'ebayimg.com',
    'ebaystatic.com',
    'etsy.com',
    'etsystatic.com',
    'aliexpress.com',
    'alibaba.com',
    'alibabacloud.com',
    'aliyun.com',
    'taobao.com',
    'tmall.com',
    'jd.com',
    'walmart.com',
    'walmartimages.com',
    'target.com',
    'bestbuy.com',
    'homedepot.com',
    'lowes.com',
    'costco.com',
    'ikea.com',
    'wayfair.com',
    'shopify.com',
    'myshopify.com',
    'shopifycdn.com',
    'temu.com',
    'shein.com',
    'wish.com',
    'rakuten.com',
    'rakuten.co.jp',
    'mercari.com',
    'mercadolibre.com',
    'mercadolivre.com.br',
    
    // ========== PAYMENT/FINANCE ==========
    'paypal.com',
    'paypalobjects.com',
    'braintreegateway.com',
    'stripe.com',
    'stripecdn.com',
    'js.stripe.com',
    'squareup.com',
    'square.com',
    'venmo.com',
    'wise.com',
    'transferwise.com',
    'revolut.com',
    'n26.com',
    'chime.com',
    'robinhood.com',
    'coinbase.com',
    'binance.com',
    'kraken.com',
    'blockchain.com',
    'visa.com',
    'mastercard.com',
    'americanexpress.com',
    'discover.com',
    'chase.com',
    'bankofamerica.com',
    'wellsfargo.com',
    'citibank.com',
    'usbank.com',
    'capitalone.com',
    'hsbc.com',
    'barclays.com',
    'lloydsbank.com',
    'santander.com',
    'ing.com',
    'bnpparibas.com',
    'deutschebank.com',
    
    // ========== NEWS/MEDIA ==========
    'cnn.com',
    'bbc.com',
    'bbc.co.uk',
    'nytimes.com',
    'washingtonpost.com',
    'theguardian.com',
    'reuters.com',
    'apnews.com',
    'bloomberg.com',
    'forbes.com',
    'wsj.com',
    'ft.com',
    'economist.com',
    'time.com',
    'newsweek.com',
    'usatoday.com',
    'huffpost.com',
    'buzzfeed.com',
    'vice.com',
    'vox.com',
    'techcrunch.com',
    'theverge.com',
    'wired.com',
    'arstechnica.com',
    'engadget.com',
    'mashable.com',
    'cnet.com',
    'zdnet.com',
    'tomsguide.com',
    'tomshardware.com',
    'pcmag.com',
    'ign.com',
    'gamespot.com',
    'kotaku.com',
    'polygon.com',
    'yahoo.com',
    'yahoo.co.jp',
    'news.yahoo.co.jp',
    'yimg.com',
    'msn.com',
    'weather.com',
    'accuweather.com',
    
    // ========== SEARCH ENGINES ==========
    'duckduckgo.com',
    'bing.com',
    'baidu.com',
    'yandex.ru',
    'yandex.com',
    'naver.com',
    'daum.net',
    'sogou.com',
    '360.cn',
    'ask.com',
    'ecosia.org',
    'startpage.com',
    'qwant.com',
    'brave.com',
    
    // ========== PRODUCTIVITY/WORK ==========
    'notion.so',
    'notion.com',
    'trello.com',
    'asana.com',
    'monday.com',
    'clickup.com',
    'basecamp.com',
    'airtable.com',
    'slack.com',
    'slack-edge.com',
    'zoom.us',
    'zoom.com',
    'zoomcdn.com',
    'webex.com',
    'gotomeeting.com',
    'teams.microsoft.com',
    'evernote.com',
    'onenote.com',
    'dropbox.com',
    'dropboxstatic.com',
    'box.com',
    'box.net',
    'wetransfer.com',
    'mega.nz',
    'mega.io',
    'mediafire.com',
    'canva.com',
    'figma.com',
    'sketch.com',
    'adobe.com',
    'adobelogin.com',
    'typeform.com',
    'surveymonkey.com',
    'calendly.com',
    'doodle.com',
    'miro.com',
    'lucid.app',
    'lucidchart.com',
    'grammarly.com',
    'deepl.com',
    
    // ========== DEVELOPER TOOLS ==========
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'atlassian.com',
    'atlassian.net',
    'jira.com',
    'confluence.com',
    'stackoverflow.com',
    'stackexchange.com',
    'stackoverflowcdn.com',
    'codepen.io',
    'codesandbox.io',
    'replit.com',
    'glitch.com',
    'heroku.com',
    'vercel.com',
    'vercel.app',
    'netlify.com',
    'netlify.app',
    'firebase.google.com',
    'firebaseio.com',
    'firebaseapp.com',
    'supabase.com',
    'supabase.io',
    'mongodb.com',
    'npmjs.com',
    'npmjs.org',
    'unpkg.com',
    'jsdelivr.net',
    'cdnjs.com',
    'cdnjs.cloudflare.com',
    'bootstrapcdn.com',
    'fontawesome.com',
    'fonts.google.com',
    'fonts.googleapis.com',
    'fontsgstatic.com',
    'jquery.com',
    'reactjs.org',
    'vuejs.org',
    'angular.io',
    'svelte.dev',
    'nodejs.org',
    'python.org',
    'php.net',
    'ruby-lang.org',
    'rust-lang.org',
    'golang.org',
    'go.dev',
    'docker.com',
    'docker.io',
    'kubernetes.io',
    
    // ========== AI/ML SERVICES ==========
    'openai.com',
    'chat.openai.com',
    'chatgpt.com',
    'anthropic.com',
    'claude.ai',
    'bard.google.com',
    'gemini.google.com',
    'copilot.microsoft.com',
    'midjourney.com',
    'stability.ai',
    'replicate.com',
    'huggingface.co',
    'perplexity.ai',
    'character.ai',
    'jasper.ai',
    'writesonic.com',
    'copy.ai',
    
    // ========== EDUCATION ==========
    'wikipedia.org',
    'wikimedia.org',
    'wiktionary.org',
    'wikihow.com',
    'medium.com',
    'substack.com',
    'blogger.com',
    'wordpress.com',
    'wordpress.org',
    'wix.com',
    'squarespace.com',
    'weebly.com',
    'coursera.org',
    'udemy.com',
    'edx.org',
    'khanacademy.org',
    'skillshare.com',
    'lynda.com',
    'linkedin.com/learning',
    'pluralsight.com',
    'codecademy.com',
    'freecodecamp.org',
    'w3schools.com',
    'geeksforgeeks.org',
    'tutorialspoint.com',
    'hackerrank.com',
    'leetcode.com',
    'codewars.com',
    'duolingo.com',
    'quizlet.com',
    'chegg.com',
    'scribd.com',
    'academia.edu',
    'researchgate.net',
    'scholar.google.com',
    'arxiv.org',
    
    // ========== GAMING ==========
    'steam.com',
    'steampowered.com',
    'steamcommunity.com',
    'steamstatic.com',
    'epicgames.com',
    'unrealengine.com',
    'ea.com',
    'origin.com',
    'ubisoft.com',
    'blizzard.com',
    'battle.net',
    'playstation.com',
    'xbox.com',
    'nintendo.com',
    'nintendo.co.jp',
    'roblox.com',
    'rbxcdn.com',
    'minecraft.net',
    'mojang.com',
    'leagueoflegends.com',
    'riotgames.com',
    'valorant.com',
    'gog.com',
    'humblebundle.com',
    'itch.io',
    'fandom.com',
    'wikia.com',
    'gamepedia.com',
    
    // ========== CLOUD/CDN ==========
    'cloudflare.com',
    'cloudflare.net',
    'cloudflareinsights.com',
    'akamai.net',
    'akamaized.net',
    'akamaihd.net',
    'fastly.net',
    'fastly.com',
    'edgecast.net',
    'limelight.com',
    'maxcdn.com',
    'stackpathdns.com',
    'stackpathcdn.com',
    'azureedge.net',
    'azurefd.net',
    'b-cdn.net',
    'bunnycdn.com',
    
    // ========== AUTHENTICATION/SSO ==========
    'auth0.com',
    'okta.com',
    'onelogin.com',
    'duo.com',
    'authy.com',
    'lastpass.com',
    '1password.com',
    'bitwarden.com',
    'dashlane.com',
    'keeper.com',
    'recaptcha.net',
    'gstatic.com',
    'hcaptcha.com',
    'cloudflare.com',
    
    // ========== EMAIL SERVICES ==========
    'mail.ru',
    'yandex.mail',
    'protonmail.com',
    'proton.me',
    'tutanota.com',
    'zoho.com',
    'mailchimp.com',
    'sendgrid.com',
    'mailgun.com',
    'constantcontact.com',
    'getresponse.com',
    
    // ========== REGIONAL SERVICES ==========
    // Russia
    'yandex.ru',
    'mail.ru',
    'vk.com',
    'ok.ru',
    'dzen.ru',
    'rutube.ru',
    
    // China
    'baidu.com',
    'qq.com',
    'weibo.com',
    'taobao.com',
    'tmall.com',
    'jd.com',
    'alipay.com',
    'bilibili.com',
    'zhihu.com',
    'douyin.com',
    'kuaishou.com',
    'xiaohongshu.com',
    '163.com',
    'sohu.com',
    'sina.com.cn',
    
    // Japan
    'yahoo.co.jp',
    'rakuten.co.jp',
    'nicovideo.jp',
    'pixiv.net',
    'dmm.com',
    'livedoor.jp',
    'fc2.com',
    'ameba.jp',
    'goo.ne.jp',
    
    // Korea
    'naver.com',
    'daum.net',
    'kakao.com',
    'coupang.com',
    'tistory.com',
    
    // Brazil
    'globo.com',
    'uol.com.br',
    'mercadolivre.com.br',
    'magazineluiza.com.br',
    
    // India
    'flipkart.com',
    'myntra.com',
    'paytm.com',
    'phonepe.com',
    'hotstar.com',
    'jiocinema.com',
    
    // Europe
    'bbc.co.uk',
    'zalando.com',
    'booking.com',
    'trivago.com',
    
    // ========== TRAVEL ==========
    'booking.com',
    'expedia.com',
    'hotels.com',
    'airbnb.com',
    'tripadvisor.com',
    'kayak.com',
    'skyscanner.com',
    'priceline.com',
    'agoda.com',
    'vrbo.com',
    'delta.com',
    'united.com',
    'aa.com',
    'southwest.com',
    'jetblue.com',
    'uber.com',
    'lyft.com',
    'grab.com',
    'ola.com',
    'didi.com',
    
    // ========== FOOD/DELIVERY ==========
    'doordash.com',
    'ubereats.com',
    'grubhub.com',
    'postmates.com',
    'instacart.com',
    'seamless.com',
    'deliveroo.com',
    'just-eat.com',
    'foodpanda.com',
    'swiggy.com',
    'zomato.com',
    'yelp.com',
    'opentable.com',
    'resy.com',
    
    // ========== HEALTH ==========
    'webmd.com',
    'healthline.com',
    'mayoclinic.org',
    'nih.gov',
    'cdc.gov',
    'who.int',
    'cvs.com',
    'walgreens.com',
    'goodrx.com',
    'zocdoc.com',
    
    // ========== GOVERNMENT ==========
    'gov',
    'gov.uk',
    'gov.au',
    'gc.ca',
    'europa.eu',
    'un.org',
    
    // ========== MISC TRUSTED ==========
    'bit.ly',
    'tinyurl.com',
    'ow.ly',
    'goo.gl',
    'shorturl.at',
    'linktr.ee',
    'lnk.to',
    'smarturl.it',
    'qr.codes'
  ];
  
  // ===========================================
  // BLOCKED DOMAINS - KNOWN AD/POPUP NETWORKS
  // ===========================================
  const BLOCKED_DOMAINS = [
    'popads.net',
    'popcash.net',
    'popunder.net',
    'propellerads.com',
    'propellerpops.com',
    'exoclick.com',
    'exosrv.com',
    'adnxs.com',
    'mgid.com',
    'revcontent.com',
    'content.ad',
    'adsterra.com',
    'adsterratools.com',
    'hilltopads.net',
    'trafficjunky.com',
    'trafficjunky.net',
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
    'bc.vc',
    'linkbucks.com',
    'shorte.st',
    'sh.st',
    'adfoc.us',
    'adfly.co',
    'bidvertiser.com',
    'zeroredirect.com',
    'clksite.com',
    'adcash.com',
    'clicksor.com',
    'infolinks.com',
    'revenuehits.com',
    'popmyads.com',
    'popads.com',
    'clickaine.com',
    'adxpansion.com',
    'plugrush.com',
    'trafficforce.com',
    'ero-advertising.com',
    'adxxx.com'
  ];

  const SUSPICIOUS_PATTERNS = [
    /popunder/i,
    /clickunder/i,
    /exit[-_]?intent/i
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
    if (!url) return true;
    
    const hostname = getDomain(url);
    if (!hostname) return true;
    
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
    return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url));
  }

  function shouldBlockUrl(url) {
    if (isTrustedDomain(url)) return false;
    if (isBlockedDomain(url)) return true;
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

    // ALWAYS allow trusted domains
    if (isTrustedDomain(url)) {
      return originalWindowOpen.call(window, url, target, features);
    }

    // Allow if user recently interacted
    if (isRecentUserInteraction()) {
      if (isBlockedDomain(url)) {
        logBlocked('window.open (ad)', url);
        return null;
      }
      return originalWindowOpen.call(window, url, target, features);
    }

    // Block only known bad domains
    if (shouldBlockUrl(url)) {
      logBlocked('window.open (blocked)', url);
      return null;
    }

    // Allow unknown domains (don't break legitimate sites)
    return originalWindowOpen.call(window, url, target, features);
  };

  // ============ BLOCK AD LINKS ============

  document.addEventListener('click', function(event) {
    if (!isEnabled || !event.isTrusted) return;

    let target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }

    if (!target || target.tagName !== 'A') return;

    const href = target.href;
    if (isTrustedDomain(href)) return;

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
        if (node.nodeName === 'SCRIPT' && node.src && isBlockedDomain(node.src)) {
          node.remove();
          logBlocked('script (ad)', node.src);
        }

        if (node.nodeName === 'IFRAME' && node.src && isBlockedDomain(node.src)) {
          node.remove();
          logBlocked('iframe (ad)', node.src);
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
