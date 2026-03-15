(function() {
  var photos = window.__photos;
  if (!photos || photos.length === 0) return;
  var pick = photos[Math.floor(Math.random() * photos.length)];
  var img = document.getElementById('random-photo');
  var caption = document.getElementById('random-photo-caption');
  if (!img) return;
  img.src = '/images/photography/' + pick[0];
  img.style.display = 'block';
  if (pick[1] && caption) {
    caption.textContent = pick[1];
    caption.style.display = 'block';
  }
})();
