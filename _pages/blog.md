---
layout: archive
title: "Blog"
permalink: /blog/
author_profile: true
# entries_layout: list   # alt: grid
paginate: 10             # requires jekyll-paginate (allowed by GH Pages)
---

Here's my collection of notes on research papers, random thoughts, and things I find interesting. Will be updated whenever I feel like it.

{% include base_path %}

{% for post in site.posts reversed %}
  {% include archive-single.html %}
{% endfor %}
