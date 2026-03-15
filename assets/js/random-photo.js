(function() {
  var photos = window.__photos;
  if (!photos || photos.length === 0) return;
  var pick = photos[Math.floor(Math.random() * photos.length)];
  var img = document.getElementById('random-photo');
  var caption = document.getElementById('random-photo-caption');
  if (!img) return;
  img.src = '/images/photography/' + pick[0];
  img.style.cssText = 'display:block;max-width:90%;max-height:400px;width:auto;height:auto;margin:0 auto;border:none;padding:0;background:none;border-radius:3px;box-shadow:0 2px 12px rgba(0,0,0,0.35);';
  if (pick[1] && caption) {
    caption.textContent = pick[1];
    caption.style.display = 'block';
  }
})();
