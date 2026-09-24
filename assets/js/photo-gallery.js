/* Builds the grid at /photography/ from window.__photos, the same list the
   home page uses for its random photo (the inline array in _pages/about.md).
   Each entry is [filename, caption]. Tiles use images/photography/thumbs/
   (run generate_photo_thumbnails.py); the lightbox opens the original. */
(function () {
  var photos = window.__photos;
  var grid = document.getElementById('photo-grid');
  if (!grid || !photos || !photos.length) return;

  var base = '/images/photography/';
  var frag = document.createDocumentFragment();

  // New photos get appended to the end of the list; show them first.
  for (var i = photos.length - 1; i >= 0; i--) {
    var file = photos[i][0];
    var caption = photos[i][1] || '';

    var fig = document.createElement('figure');
    fig.className = 'photo-tile';

    var a = document.createElement('a');
    a.className = 'image-popup';   // picked up by the theme's lightbox (magnific popup)
    a.href = base + file;
    if (caption) a.title = caption;

    var img = document.createElement('img');
    img.src = base + 'thumbs/' + file;
    img.alt = caption || 'Photography by Avidan Shah';
    img.loading = 'lazy';
    img.onerror = function () {
      // No thumbnail generated yet: fall back to the original.
      this.onerror = null;
      this.src = this.src.replace('/thumbs/', '/');
    };

    a.appendChild(img);
    fig.appendChild(a);

    if (caption) {
      var cap = document.createElement('figcaption');
      cap.className = 'photo-caption';
      cap.textContent = caption;
      fig.appendChild(cap);
    }
    frag.appendChild(fig);
  }
  grid.appendChild(frag);
})();
