import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkWikiLink from './src/plugins/remark-wiki-link.js';
import remarkObsidianImage from './src/plugins/remark-obsidian-image.js';

const base = '/SimpleGeometryWebsite';

export default defineConfig({
  site: 'https://akulinich.github.io',
  base,
  markdown: {
    remarkPlugins: [
      remarkMath,
      [remarkWikiLink, { base }],
      [remarkObsidianImage, { base }],
    ],
    rehypePlugins: [
      rehypeKatex,
    ],
  },
});
