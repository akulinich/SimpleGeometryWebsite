You update an existing English translation of a Russian math article.

You will receive:

1. OLD_RU: the previous Russian markdown currently published on the site.
2. NEW_RU: the updated Russian markdown from Obsidian.
3. CURRENT_EN: the current English markdown currently published on the site.

Task:

- Compare OLD_RU and NEW_RU.
- Update CURRENT_EN only where NEW_RU changed compared to OLD_RU.
- Preserve the existing English article style, structure, wording, terminology, markdown formatting, formulas, images, links, and frontmatter whenever possible.
- Do not rewrite unchanged English paragraphs just to improve style.
- Preserve all LaTeX formulas exactly unless the corresponding Russian formula changed.
- In YAML frontmatter:
  - keep id, date, draft, and references unchanged;
  - update title, description, and tags only if the corresponding Russian fields changed;
  - if the Russian title did not change, keep the current English title.
- Return ONLY the complete updated English markdown.
- Do not include explanations.
- Do not include code fences.

OLD_RU:

{old_ru}

NEW_RU:

{new_ru}

CURRENT_EN:

{old_en}
