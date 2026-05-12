(function(){
  var COVE_BASE = '/product-manual';
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.cove-video-btn');
    if (!btn) return;
    var url = btn.getAttribute('data-video');
    if (!url) return;
    var container = btn.parentNode;
    btn.innerHTML = '加载中...';
    btn.style.cursor = 'default';
    btn.className = '';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function() {
      if (xhr.status === 200) {
        var video = document.createElement('video');
        video.controls = true;
        video.style.width = '100%';
        video.style.maxWidth = '720px';
        video.style.borderRadius = '8px';
        video.style.display = 'block';
        video.src = URL.createObjectURL(xhr.response);
        container.innerHTML = '';
        container.appendChild(video);
        video.play().catch(function(){});
      } else {
        btn.innerHTML = '加载失败，请刷新重试';
      }
    };
    xhr.onerror = function() {
      btn.innerHTML = '网络错误，请刷新重试';
    };
    xhr.send();
  });
})();
