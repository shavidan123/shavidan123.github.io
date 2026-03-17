---
permalink: /
title: "Avidan Shah"
hide_title: true
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

<div style="float:right;width:45%;margin:0 0 1em 1.5em;padding:0.8em 1em;border:1px solid #3D3733;border-radius:4px;background:#231F1C;font-size:0.85em;line-height:1.5;" id="news-box">
<span style="display:block;font-weight:600;color:#E2A84B;margin-bottom:0.4em;">Recent Updates</span>
<ul style="margin:0;padding-left:1.2em;">
<li>On leave from NYU to participate in the <a href="https://www.matsprogram.org/">MATS Research Fellowship</a>, advised by <a href="https://shi-feng.super.site/">Shi Feng</a> and <a href="https://jacobpfau.com/">Jacob Pfau</a>.</li>
<li>Paper on poisoning jailbreak detection models accepted to ICLR 2026 AIWILD Workshop.</li>
</ul>
</div>

**I do research on AI safety and security. Reach out to me via email if you'd like to get in contact for discussion or collaboration. I'm always open to talk about research ideas.**

I'm broadly interested in the security and robustness for deep learning models as well as understanding their capabilities for generalization in out of distribution settings. Right now, I'm particularly focused on the ability of LLMs to encode and interpret information that is subliminal to humans.

At NYU, I'm advised by [Rico Angell](https://rangell.github.io/) and [He He](https://hhexiy.github.io/), working on jailbreak defenses and model interpretability. I'm also extremely fortunate for the mentorship of [Chawin Sitawarin](https://chawins.github.io/) during my undergraduate studies at UC Berkeley as a part of [David Wagner's group](https://people.eecs.berkeley.edu/~daw/).

I'm a fan of landscape photography. Here's a randomly sampled photo from my portfolio, most of which were taken on my Canon EOS R50:

<div style="margin:1.5em 0;text-align:center;">
  <img id="random-photo" src="" alt="Photography by Avidan Shah" style="display:none;max-width:90%;max-height:400px;width:auto;height:auto;margin:0 auto;border:none;padding:0;background:none;border-radius:3px;box-shadow:0 2px 12px rgba(0,0,0,0.35);">
  <span id="random-photo-caption" class="photo-caption" style="display:none;"></span>
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
