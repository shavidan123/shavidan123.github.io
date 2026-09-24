---
permalink: /photography/
title: "Photography"
author_profile: true
---

{% comment %}
The photo list lives in ONE place: the inline `window.__photos` array in
_pages/about.md (the home page). Pull that exact line out of the home page's
source so the gallery and the random photo can never drift apart.
{% endcomment %}
{% assign home = site.pages | where: "url", "/" | first %}
{% assign photos_json = home.content | split: "window.__photos=" | last | split: ";</script>" | first %}

Photos from my travels, most of them taken on my Canon EOS R50. Click any photo to view it at full size.

<div class="photo-grid" id="photo-grid"></div>

<script>window.__photos={% if photos_json contains "[" %}{{ photos_json }}{% else %}[]{% endif %};</script>
<script src="/assets/js/photo-gallery.js"></script>
