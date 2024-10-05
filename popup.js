document.addEventListener('DOMContentLoaded', function() {
  const validUrls = [
    "https://www.youtube.com/",
    // 他の許可するURLパターンを必要に応じて追加
  ];

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0) {
      const currentUrl = tabs[0].url;
      if (isValidUrl(currentUrl, validUrls)) {
        const video = document.getElementById('video');
        video.addEventListener('click', function() {
          openDownloadTab(currentUrl, "video");
        });

        const video_high = document.getElementById('video_high');
        video_high.addEventListener('click', function() {
          openDownloadTab(currentUrl, "video-high");
        });

        const music = document.getElementById('music');
        music.addEventListener('click', function() {
          openDownloadTab(currentUrl, "music");
        });
      } else {
        // 特定のURLでない場合の処理
        const popupContent = document.querySelector('.popup-content');
        popupContent.innerHTML = ""; // コンテンツを空にする
        const messageElement = document.createElement('p');
        messageElement.textContent = "これはYouTubeのURLではありません。";
        popupContent.appendChild(messageElement);
      }
    }
  });
});

function isValidUrl(url, validUrls) {
  for (const validUrl of validUrls) {
    if (url.startsWith(validUrl)) {
      return true;
    }
  }
  return false;
}

function openDownloadTab(currentUrl, setting) {
  const newTabUrl = `https://YourServer.com/download.php?vid=${currentUrl}&setting=${encodeURIComponent(setting)}`;
  chrome.tabs.create({ url: newTabUrl, active: false });
}