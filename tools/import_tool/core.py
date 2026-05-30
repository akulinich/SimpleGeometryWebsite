import json
import re
from pathlib import Path

SETTINGS_FILE = Path(__file__).parent / 'settings.json'
PROMPTS_DIR   = Path(__file__).parent / 'prompts'
PROJECT_ROOT  = Path(__file__).parent.parent.parent
ARTICLES_DIR  = PROJECT_ROOT / 'src' / 'content' / 'articles'
RU_DIR        = ARTICLES_DIR / 'ru'
EN_DIR        = ARTICLES_DIR / 'en'
IMAGES_DIR    = PROJECT_ROOT / 'public' / 'images'


# ─── Prompt loader ───────────────────────────────────────────────────────────

def load_prompt(name, **kwargs):
    text = (PROMPTS_DIR / f'{name}.md').read_text(encoding='utf-8').strip()
    for key, val in kwargs.items():
        text = text.replace(f'{{{key}}}', val)
    return text


# ─── Settings ────────────────────────────────────────────────────────────────

def load_settings():
    try:
        with open(SETTINGS_FILE, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {'notes_folder': '', 'images_folder': ''}


def save_settings(settings):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)


# ─── Markdown helpers ─────────────────────────────────────────────────────────

def find_images_in_md(content):
    images = set()
    for m in re.finditer(r'!\[\[([^\]|]+)', content):
        images.add(m.group(1).strip())
    for m in re.finditer(r'!\[.*?\]\(([^)]+)\)', content):
        p = m.group(1)
        if not p.startswith('http'):
            images.add(Path(p).name)
    return images


# ─── Frontmatter helpers ──────────────────────────────────────────────────────

def read_frontmatter(path):
    """Return dict of simple key: value frontmatter fields."""
    try:
        content = path.read_text(encoding='utf-8')
        m = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if not m:
            return {}
        result = {}
        for line in m.group(1).splitlines():
            if ':' in line and not line.startswith(' '):
                k, _, v = line.partition(':')
                result[k.strip()] = v.strip().strip('"\'')
        return result
    except Exception:
        return {}


def set_frontmatter_field(path, field, value):
    """Add or update a scalar field in YAML frontmatter."""
    content = path.read_text(encoding='utf-8')
    m = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)

    def quoted(v):
        if any(c in str(v) for c in ':#{}[]|>&*!,?@`"\''):
            return f'"{v}"'
        return str(v)

    if not m:
        path.write_text(f'---\n{field}: {quoted(value)}\n---\n\n{content}',
                        encoding='utf-8', newline='\n')
        return

    yaml_block = m.group(1)
    rest = content[m.end():]
    pat = re.compile(rf'^{re.escape(field)}:.*$', re.MULTILINE)
    if pat.search(yaml_block):
        yaml_block = pat.sub(f'{field}: {quoted(value)}', yaml_block)
    else:
        yaml_block = f'{field}: {quoted(value)}\n{yaml_block}'
    path.write_text(f'---\n{yaml_block}\n---{rest}', encoding='utf-8', newline='\n')


# ─── Article list ─────────────────────────────────────────────────────────────

def get_all_articles(notes_folder, id_map, path_to_id):
    """
    id_map     : {id → obsidian_rel_path}
    path_to_id : {obsidian_rel_path → id}
    Returns list of (display_path, status, id_or_None).
    status: 'new' | 'imported' | 'site_only'
    """
    ru_ids = {f.stem for f in RU_DIR.glob('*.md')} if RU_DIR.exists() else set()
    result = []

    if notes_folder and Path(notes_folder).exists():
        root = Path(notes_folder)
        for f in root.rglob('*.md'):
            rel = str(f.relative_to(root))
            aid = path_to_id.get(rel)
            status = 'imported' if aid and aid in ru_ids else 'new'
            result.append((rel, status, aid))

    if RU_DIR.exists():
        for f in RU_DIR.glob('*.md'):
            if f.stem not in id_map:
                result.append((f.name, 'site_only', f.stem))

    return sorted(result, key=lambda x: x[0])


# ─── Image processing ─────────────────────────────────────────────────────────

def remove_white_background(path, threshold=240):
    """Make near-white pixels transparent in a PNG. Saves in place."""
    from PIL import Image

    img = Image.open(path).convert('RGBA')
    pixels = [
        (r, g, b, 0) if r >= threshold and g >= threshold and b >= threshold
        else (r, g, b, a)
        for r, g, b, a in img.getdata()
    ]
    img.putdata(pixels)
    img.save(path)
