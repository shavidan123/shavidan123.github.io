---
permalink: /
title: "About me"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

Hey, I'm Avi! I'm currently taking a gap semester from my MSCS in Computer Science at New York University to participate in the MATS 9.0 Research Fellowship, where I'm advised by Shi Feng and Jacob Pfau. I recently graduated from UC Berkeley where I double majored in Computer Science and Applied Mathematics. I'm broadly interested in security/robustness for deep learning models as well as improving OOD generalization. Right now, I'm particularly focused on red teaming, building defenses for deployed AI systems, and AI oversight/control.

At NYU, I'm advised by Rico Angell and He He, working on jailbreak defenses and model interpretability. I'm also extremely fortunate for the opportunity during my undergraduate studies to be mentored by [Chawin Sitawarin](https://chawins.github.io/) and [Julien Piet](https://people.eecs.berkeley.edu/~julien.piet/) at Berkeley as a part of [David Wagner's group](https://people.eecs.berkeley.edu/~daw/).

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
