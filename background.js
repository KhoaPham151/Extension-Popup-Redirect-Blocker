/**
 * BACKGROUND SERVICE WORKER
 * Handles background tasks: state management, badge updates, notifications
 */

const pendingRedirects = new Map();

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.storage.local.set({
    isEnabled: true,
    totalBlocked: 0,
    blockedToday: 0,
    lastResetDate: new Date().toDateString(),
    promptNotifications: false,
    silentMode: true
  });

  updateBadge(0);
  
});

function updateBadge(count) {
  let badgeText = '';
  if (count > 0) badgeText = count > 99 ? '99+' : count.toString();
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
}

function updateBadgeState(isEnabled) {
  if (!isEnabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#95a5a6' });
  } else {
    chrome.storage.local.get(['blockedToday'], function(result) {
      updateBadge(result.blockedToday || 0);
    });
  }
}

function showNotification(title, message, type = 'info', data = null) {
  const notificationId = `popup-blocker-${Date.now()}`;
  
  // For prompt type (Allow/Deny), use system notification with buttons
  if (type === 'prompt' && data) {
    const options = {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      priority: 2,
      buttons: [
        { title: '✓ Allow' },
        { title: '✗ Block' }
      ],
      requireInteraction: true
    };
    pendingRedirects.set(notificationId, data);
    chrome.notifications.create(notificationId, options);
  } else {
    // For info notifications, just flash the badge briefly (small & non-intrusive)
    flashBadge(message);
  }
}

// Flash badge with a brief message (small notification)
function flashBadge(message) {
  chrome.storage.local.get(['blockedToday'], function(result) {
    const count = result.blockedToday || 0;
    
    // Show "!" briefly then return to count
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#27ae60' });
    
    setTimeout(() => {
      chrome.action.setBadgeText({ text: count > 0 ? (count > 99 ? '99+' : count.toString()) : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
    }, 800);
  });
}

function showPromptNotification(url, source, tabId) {
  const shortUrl = url.length > 50 ? url.substring(0, 50) + '...' : url;
  showNotification(
    '🚫 Popup/Redirect Detected',
    `${source}: ${shortUrl}\n\nClick to allow or block this action.`,
    'prompt',
    { url, source, tabId }
  );
}

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
  const data = pendingRedirects.get(notificationId);
  
  if (data) {
    if (buttonIndex === 0) {
      chrome.tabs.create({ url: data.url });
    } else {
      incrementBlockedCount();
    }
    
    pendingRedirects.delete(notificationId);
    chrome.notifications.clear(notificationId);
  }
});

chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
  if (pendingRedirects.has(notificationId)) {
    incrementBlockedCount();
    pendingRedirects.delete(notificationId);
  }
});

function incrementBlockedCount() {
  chrome.storage.local.get(['blockedToday', 'totalBlocked', 'lastResetDate'], function(result) {
    const today = new Date().toDateString();
    let blockedToday = result.blockedToday || 0;
    let totalBlocked = result.totalBlocked || 0;

    if (result.lastResetDate !== today) blockedToday = 0;

    blockedToday++;
    totalBlocked++;

    chrome.storage.local.set({
      blockedToday: blockedToday,
      totalBlocked: totalBlocked,
      lastResetDate: today
    });

    updateBadge(blockedToday);
  });
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  
  if (message.action === 'updateBadge') {
    chrome.storage.local.get(['promptNotifications', 'silentMode'], function(settings) {
      if (settings.promptNotifications && message.url) {
        showPromptNotification(
          message.url || 'Unknown URL',
          message.source || 'Popup/Redirect',
          sender.tab ? sender.tab.id : null
        );
      } else {
        incrementBlockedCount();
        
        // Just flash badge briefly (non-intrusive)
        if (!settings.silentMode) {
          flashBadge('Blocked');
        }
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'getStats') {
    chrome.storage.local.get([
      'blockedToday', 'totalBlocked', 'isEnabled', 'promptNotifications', 'silentMode'
    ], function(result) {
      sendResponse({
        blockedToday: result.blockedToday || 0,
        totalBlocked: result.totalBlocked || 0,
        isEnabled: result.isEnabled !== false,
        settings: {
          promptNotifications: result.promptNotifications || false,
          silentMode: result.silentMode !== false
        }
      });
    });
    return true;
  }

  if (message.action === 'toggleEnabled') {
    chrome.storage.local.get(['isEnabled'], function(result) {
      const newState = !result.isEnabled;
      chrome.storage.local.set({ isEnabled: newState }, function() {
        updateBadgeState(newState);
        toggleRules(newState);
        sendResponse({ isEnabled: newState });
      });
    });
    return true;
  }

  if (message.action === 'updateSetting') {
    const update = {};
    update[message.setting] = message.value;
    chrome.storage.local.set(update, function() {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'resetStats') {
    chrome.storage.local.set({
      blockedToday: 0,
      totalBlocked: 0,
      lastResetDate: new Date().toDateString()
    }, function() {
      updateBadge(0);
      sendResponse({ success: true });
    });
    return true;
  }
});

async function toggleRules(enabled) {
  try {
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['ruleset_1'] });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ['ruleset_1'] });
    }
  } catch (error) {
    // Silently handle error
  }
}

chrome.storage.local.get(['isEnabled', 'blockedToday'], function(result) {
  const isEnabled = result.isEnabled !== false;
  updateBadgeState(isEnabled);
});
