/**
 * POPUP SCRIPT - Extension Control Interface
 */

const toggleSwitch = document.getElementById('toggleSwitch');
const statusText = document.getElementById('statusText');
const header = document.getElementById('header');
const blockedTodayEl = document.getElementById('blockedToday');
const totalBlockedEl = document.getElementById('totalBlocked');
const resetBtn = document.getElementById('resetBtn');
const toast = document.getElementById('toast');
const notificationToggle = document.getElementById('notificationToggle');
const silentModeToggle = document.getElementById('silentModeToggle');

const features = [
  document.getElementById('feature1'),
  document.getElementById('feature2'),
  document.getElementById('feature3'),
  document.getElementById('feature4')
];

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function updateUI(isEnabled) {
  toggleSwitch.checked = isEnabled;
  statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
  statusText.className = 'toggle-status' + (isEnabled ? '' : ' disabled');
  header.className = 'header' + (isEnabled ? '' : ' disabled');
  
  features.forEach(feature => {
    if (isEnabled) {
      feature.className = 'feature-item active';
      feature.querySelector('.feature-icon').textContent = '✓';
    } else {
      feature.className = 'feature-item inactive';
      feature.querySelector('.feature-icon').textContent = '○';
    }
  });
}

function updateSettingsUI(settings) {
  notificationToggle.checked = settings.promptNotifications || false;
  silentModeToggle.checked = settings.silentMode !== false;
}

function updateStats(today, total) {
  if (blockedTodayEl.textContent !== today.toString()) {
    blockedTodayEl.classList.add('pulse');
    setTimeout(() => blockedTodayEl.classList.remove('pulse'), 300);
  }
  blockedTodayEl.textContent = today;
  totalBlockedEl.textContent = total;
}

function loadData() {
  chrome.runtime.sendMessage({ action: 'getStats' }, function(response) {
    if (response) {
      updateUI(response.isEnabled);
      updateStats(response.blockedToday, response.totalBlocked);
      updateSettingsUI(response.settings || {});
    }
  });
}

toggleSwitch.addEventListener('change', function() {
  chrome.runtime.sendMessage({ action: 'toggleEnabled' }, function(response) {
    if (response) {
      updateUI(response.isEnabled);
      showToast(
        response.isEnabled ? '🛡️ Protection enabled!' : '⚠️ Protection disabled!',
        response.isEnabled ? 'success' : 'error'
      );
    }
  });
});

notificationToggle.addEventListener('change', function() {
  const enabled = notificationToggle.checked;
  chrome.runtime.sendMessage({ 
    action: 'updateSetting', 
    setting: 'promptNotifications',
    value: enabled 
  }, function(response) {
    if (response && response.success) {
      showToast(enabled ? '🔔 Prompt notifications enabled!' : '🔕 Prompt notifications disabled!');
      if (enabled && silentModeToggle.checked) {
        silentModeToggle.checked = false;
        chrome.runtime.sendMessage({ action: 'updateSetting', setting: 'silentMode', value: false });
      }
    }
  });
});

silentModeToggle.addEventListener('change', function() {
  const enabled = silentModeToggle.checked;
  chrome.runtime.sendMessage({ 
    action: 'updateSetting', 
    setting: 'silentMode',
    value: enabled 
  }, function(response) {
    if (response && response.success) {
      showToast(enabled ? '🔕 Silent mode enabled!' : '🔔 Silent mode disabled!');
      if (enabled && notificationToggle.checked) {
        notificationToggle.checked = false;
        chrome.runtime.sendMessage({ action: 'updateSetting', setting: 'promptNotifications', value: false });
      }
    }
  });
});

resetBtn.addEventListener('click', function() {
  resetBtn.style.transform = 'scale(0.95)';
  setTimeout(() => resetBtn.style.transform = 'scale(1)', 100);
  
  if (confirm('Are you sure you want to reset all statistics?')) {
    chrome.runtime.sendMessage({ action: 'resetStats' }, function(response) {
      if (response && response.success) {
        updateStats(0, 0);
        showToast('🔄 Statistics reset!', 'success');
      }
    });
  }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.isEnabled) updateUI(changes.isEnabled.newValue);
  if (changes.blockedToday) {
    blockedTodayEl.textContent = changes.blockedToday.newValue;
    blockedTodayEl.classList.add('pulse');
    setTimeout(() => blockedTodayEl.classList.remove('pulse'), 300);
  }
  if (changes.totalBlocked) totalBlockedEl.textContent = changes.totalBlocked.newValue;
  if (changes.promptNotifications) notificationToggle.checked = changes.promptNotifications.newValue;
  if (changes.silentMode) silentModeToggle.checked = changes.silentMode.newValue;
});

document.addEventListener('DOMContentLoaded', loadData);

setInterval(function() {
  chrome.runtime.sendMessage({ action: 'getStats' }, function(response) {
    if (response) updateStats(response.blockedToday, response.totalBlocked);
  });
}, 2000);

document.addEventListener('keydown', function(event) {
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    toggleSwitch.click();
  }
  if (event.code === 'KeyR' && !event.ctrlKey && !event.metaKey) resetBtn.click();
});
