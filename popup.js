document.addEventListener('DOMContentLoaded', function() {
  const validUrls = [
    "https://www.youtube.com/",
    "https://youtu.be/",
    "https://m.youtube.com/",
    "https://music.youtube.com/"
  ];

  const browserAPI = window.browser || window.chrome;

  // FirefoxではPromise、Chromeではコールバック
  function queryTabs(queryInfo) {
    if (browserAPI.tabs.query.length === 1) {
      // Promise形式（Firefox）
      return browserAPI.tabs.query(queryInfo);
    } else {
      // コールバック形式（Chrome）
      return new Promise(resolve => {
        browserAPI.tabs.query(queryInfo, resolve);
      });
    }
  }

  queryTabs({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs.length > 0) {
      const currentUrl = tabs[0].url;
      if (isValidUrl(currentUrl, validUrls)) {
        setupButtonListeners(currentUrl, browserAPI);
      } else {
        showSearchInterface(browserAPI);
      }
    }
  });
});

function setupButtonListeners(currentUrl, browserAPI) {
  const buttons = [
    { id: 'video', setting: 'video' },
    { id: 'video_high', setting: 'video-high' },
    { id: 'music', setting: 'music' },
    { id: 'music_wav', setting: 'music-wav' }
  ];

  buttons.forEach(button => {
    const element = document.getElementById(button.id);
    if (element) {
      element.addEventListener('click', function() {
        if (this.disabled) return;
        this.disabled = true;
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
        setTimeout(() => {
          this.style.transform = '';
          this.style.boxShadow = '';
        }, 100);
        // Promise形式でタブ作成
        let createTab;
        if (browserAPI.tabs.create.length === 1) {
          createTab = browserAPI.tabs.create({ 
            url: `${DOWNLOAD_BASE_URL}?vid=${currentUrl}&setting=${button.setting}`, 
            active: false 
          });
        } else {
          createTab = new Promise((resolve, reject) => {
            browserAPI.tabs.create({ 
              url: `${DOWNLOAD_BASE_URL}?vid=${currentUrl}&setting=${button.setting}`, 
              active: false 
            }, (tab) => {
              if (browserAPI.runtime.lastError) {
                reject(browserAPI.runtime.lastError);
              } else {
                resolve(tab);
              }
            });
          });
        }
        createTab.then((tab) => {
          window.close();
        }).catch((err) => {
          console.error('Error creating tab:', err);
        });
      });
    }
  });
}

function setupSearchButtonListeners(searchQuery, browserAPI) {
  const buttons = [
    { id: 'search_video', setting: 'video' },
    { id: 'search_video_high', setting: 'video-high' },
    { id: 'search_music', setting: 'music' },
    { id: 'search_music_wav', setting: 'music-wav' }
  ];

  buttons.forEach(button => {
    const element = document.getElementById(button.id);
    if (element) {
      element.replaceWith(element.cloneNode(true));
      const newElement = document.getElementById(button.id);
      newElement.addEventListener('click', function() {
        if (this.disabled) return;
        this.disabled = true;
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
        setTimeout(() => {
          this.style.transform = '';
          this.style.boxShadow = '';
        }, 100);
        let createTab;
        if (browserAPI.tabs.create.length === 1) {
          createTab = browserAPI.tabs.create({ 
            url: `${DOWNLOAD_BASE_URL}?search=${searchQuery}&setting=${button.setting}`, 
            active: false 
          });
        } else {
          createTab = new Promise((resolve, reject) => {
            browserAPI.tabs.create({ 
              url: `${DOWNLOAD_BASE_URL}?search=${searchQuery}&setting=${button.setting}`, 
              active: false 
            }, (tab) => {
              if (browserAPI.runtime.lastError) {
                reject(browserAPI.runtime.lastError);
              } else {
                resolve(tab);
              }
            });
          });
        }
        createTab.then((tab) => {
          window.close();
        }).catch((err) => {
          console.error('Error creating tab:', err);
        });
      });
    }
  });
}

function showSearchInterface(browserAPI) {
  const popupContent = document.querySelector('.popup-content');
  popupContent.innerHTML = `
    <div class="error-message">
      <h2>⚠️ 対応していないページ</h2>
      <p>YouTubeページでのみ動作します。</p>
      <p><strong>対応サイト</strong></p>
      <ul>
        <li>youtube.com</li>
        <li>youtu.be</li>
        <li>m.youtube.com</li>
        <li>music.youtube.com</li>
      </ul>
    </div>
    <div class="search-section">
      <div class="search-header">
        <h3>YouTube動画を検索</h3>
        <p>動画タイトルやキーワードを入力</p>
      </div>
      <div class="search-container">
        <input type="text" id="search-input" placeholder="動画を検索..." />
      </div>
    </div>
    <div id="download-options" class="download-options" style="display: none;">
      <div class="options-header">
        <h3>ダウンロードオプション</h3>
        <p id="search-query-display"></p>
      </div>
      <button id="search_video" class="download-btn video">
        <span class="btn-icon">🎬</span>
        <span class="btn-text">動画</span>
        <span class="btn-quality">MP4</span>
      </button>
      <button id="search_video_high" class="download-btn video-high">
        <span class="btn-icon">🎥</span>
        <span class="btn-text">高画質動画</span>
        <span class="btn-quality">MP4</span>
      </button>
      <button id="search_music" class="download-btn music">
        <span class="btn-icon">🎵</span>
        <span class="btn-text">音声</span>
        <span class="btn-quality">MP3</span>
      </button>
      <button id="search_music_wav" class="download-btn music-wav">
        <span class="btn-icon">🎶</span>
        <span class="btn-text">音声</span>
        <span class="btn-quality">WAV</span>
      </button>
    </div>
  `;
  setupSearchFunctionality(browserAPI);
}

function setupSearchFunctionality(browserAPI) {
  const searchInput = document.getElementById('search-input');
  const downloadOptions = document.getElementById('download-options');
  const searchQueryDisplay = document.getElementById('search-query-display');
  const errorMessage = document.querySelector('.error-message');
  let currentSearchQuery = '';
  function updateSearchQuery() {
    const searchQuery = searchInput.value.trim();
    if (searchQuery && searchQuery !== currentSearchQuery) {
      currentSearchQuery = searchQuery;
      if (errorMessage) {
        errorMessage.style.display = 'none';
      }
      downloadOptions.style.display = 'block';
      searchQueryDisplay.textContent = `検索: "${searchQuery}"`;
      setupSearchButtonListeners(searchQuery, browserAPI);
      downloadOptions.scrollIntoView({ behavior: 'smooth' });
    } else if (!searchQuery && downloadOptions.style.display !== 'none') {
      downloadOptions.style.display = 'none';
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }
      currentSearchQuery = '';
    }
  }
  searchInput.addEventListener('input', updateSearchQuery);
  searchInput.addEventListener('blur', updateSearchQuery);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      updateSearchQuery();
    }
  });
  searchInput.focus();
}

function isValidUrl(url, validUrls) {
  return validUrls.some(validUrl => url.startsWith(validUrl));
}

// キーボードショートカット対応
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    window.close();
  }
  
  // 数字キーでボタンを選択（ダウンロードオプションが表示されている場合）
  const downloadOptions = document.getElementById('download-options');
  if (downloadOptions && downloadOptions.style.display !== 'none') {
    const keyMap = {
      '1': 'search_video',
      '2': 'search_video_high', 
      '3': 'search_music',
      '4': 'search_music_wav'
    };
    
    if (keyMap[e.key]) {
      const button = document.getElementById(keyMap[e.key]);
      if (button && !button.disabled) {
        button.click();
      }
    }
  } else {
    // 通常のダウンロードボタン用
    const keyMap = {
      '1': 'video',
      '2': 'video_high', 
      '3': 'music',
      '4': 'music_wav'
    };
    
    if (keyMap[e.key]) {
      const button = document.getElementById(keyMap[e.key]);
      if (button && !button.disabled) {
        button.click();
      }
    }
  }
});

// エラーハンドリング
window.addEventListener('error', function(e) {
  console.error('Popup error:', e.error);
});

// ダウンロード用のベースURLを変数化
const DOWNLOAD_BASE_URL = 'https://reach-world.net/apps/YouAPhpITube/download.php';