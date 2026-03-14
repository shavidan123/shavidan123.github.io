---
permalink: /
title: "About me"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

I do research on AI safety and security. Reach out to me via email if you'd like to get in contact for discussion or collaboration.

I'm currently taking a gap semester from my MS in Computer Science at New York University to participate in the MATS 9.0 Research Fellowship, where I'm advised by [Shi Feng](https://shi-feng.super.site/) and [Jacob Pfau](https://jacobpfau.com/). I recently graduated from UC Berkeley where I double majored in Computer Science and Applied Mathematics. 

I'm broadly interested in security/robustness for deep learning models as well as improving out of distribution generalization. Right now, I'm particularly focused on LLM's ability to encode and interpret subliminal information.

At NYU, I'm advised by [Rico Angell](https://rangell.github.io/) and [He He](https://hhexiy.github.io/), working on jailbreak defenses and model interpretability. I'm also extremely fortunate for the opportunity during my undergraduate studies to be mentored by [Chawin Sitawarin](https://chawins.github.io/) at Berkeley as a part of [David Wagner's group](https://people.eecs.berkeley.edu/~daw/).

In my free time, I enjoy reading, writing, and photography.

# Publications

{% include base_path %}

<div class="publications-list">
{% for post in site.publications reversed %}
  <div class="pub-entry" style="margin-bottom: 1em;">
    <strong><a href="{{ post.paperurl }}" target="_blank">{{ post.title }}</a></strong><br/>
    <span style="font-size: 0.85em; color: #9AA0A6;">{{ post.venue }}, {{ post.date | date: "%Y" }}</span>
    {% if post.excerpt %}<br/><span style="font-size: 0.85em;">{{ post.excerpt }}</span>{% endif %}
  </div>
{% endfor %}
</div>
