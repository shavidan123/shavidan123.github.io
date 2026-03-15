---
permalink: /
title: "Avidan Shah"
hide_title: true
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

**I do research on AI safety and security. Reach out to me via email if you'd like to get in contact for discussion or collaboration. I'm always open to talk about research ideas.**

I'm currently on leave from my MS in Computer Science at New York University to participate in the MATS Research Fellowship, where I'm advised by [Shi Feng](https://shi-feng.super.site/) and [Jacob Pfau](https://jacobpfau.com/). I recently graduated from UC Berkeley where I double majored in Computer Science and Applied Mathematics. 

I'm broadly interested in the security and robustness for deep learning models as well as understanding their capabilities for generalization in out of distribution settings. Right now, I'm particularly focused on the ability of LLMs to encode and interpret subliminal information.

At NYU, I'm advised by [Rico Angell](https://rangell.github.io/) and [He He](https://hhexiy.github.io/), working on jailbreak defenses and model interpretability. I'm also extremely fortunate to be mentored by [Chawin Sitawarin](https://chawins.github.io/) during my undergraduate studies at Berkeley as a part of [David Wagner's group](https://people.eecs.berkeley.edu/~daw/).

In my free time, I enjoy reading and writing fantasy, as well as weightlifting.

I'm also a fan of landscape photography. Here's a randomly sampled photo from my collection:

<div class="random-photo-container">
  <img id="random-photo" src="" alt="Photography by Avidan Shah" style="display:none;">
  <p id="random-photo-caption" class="photo-caption" style="display:none;"></p>
</div>

<script>window.__photos=[["IMG_0103.JPG","San Francisco, CA"],["IMG_0332.jpg","Huka Falls, Taupo, New Zealand"],["IMG_0390.JPG","Andes Mountains, Peru"],["IMG_0440.jpg","Lake Tekapo, New Zealand"],["IMG_0490.jpg","Tasman Glacier, New Zealand"],["IMG_0809.JPG","Milford Sound, New Zealand"],["IMG_0837.JPG","Fiordland National Park, New Zealand"],["IMG_0945.jpg","Sydney, Australia"],["IMG_1160.JPG","Tokyo Tower, Tokyo, Japan"],["IMG_1369.JPG","Senso-ji Temple, Tokyo, Japan"],["IMG_1375.JPG","Senso-ji Temple, Tokyo, Japan"],["IMG_1539.JPG","Kyoto, Japan"],["IMG_4325.JPG","Venice, Italy"],["IMG_4952.JPG","Paris, France"],["IMG_5802.JPG","Baku, Azerbaijan"],["IMG_5943.JPG","Baku, Azerbaijan"],["IMG_6077.JPG","Khinaliq, Azerbaijan"],["IMG_6081.JPG","Khinaliq, Azerbaijan"],["IMG_6117.JPG","New York City, NY"],["IMG_6142.JPG","New York City, NY"],["IMG_6144.JPG","New York City, NY"],["IMG_6450.JPG","Cairo, Egypt"],["IMG_6555.JPG","Giza, Egypt"],["IMG_6611.jpg","San Francisco, CA"],["IMG_6632.jpg","San Francisco, CA"],["IMG_6645.jpg","San Francisco, CA"],["IMG_6660.jpg","San Francisco, CA"]];</script>
<script src="/assets/js/random-photo.js"></script>

# Publications

{% include base_path %}

<div class="publications-list">
{% for post in site.publications reversed %}
  <div class="pub-entry">
    {% if post.thumbnail %}
    <div class="pub-thumbnail">
      <a href="{{ post.paperurl }}" target="_blank">
        <img src="{{ base_path }}/images/{{ post.thumbnail }}" alt="{{ post.title }}">
      </a>
    </div>
    {% endif %}
    <div class="pub-details">
      <strong><a href="{{ post.paperurl }}" target="_blank">{{ post.title }}</a></strong><br/>
      {% if post.authors %}<span class="pub-authors">{{ post.authors }}</span><br/>{% endif %}
      <span class="pub-venue">{{ post.venue }}, {{ post.date | date: "%Y" }}</span>
      {% if post.excerpt %}<br/><span class="pub-excerpt">{{ post.excerpt }}</span>{% endif %}
    </div>
  </div>
{% endfor %}
</div>
