import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkWikiLink from './src/plugins/remark-wiki-link.js';
import remarkObsidianImage from './src/plugins/remark-obsidian-image.js';

export default defineConfig({
  site: 'https://akulinich.github.io',
  base: '/Simple_Geometry',
  integrations: [react()],
  markdown: {
    remarkPlugins: [
      remarkMath,
      [remarkWikiLink, { base: '/Simple_Geometry' }],
      [remarkObsidianImage, { base: '/Simple_Geometry' }],
    ],
    rehypePlugins: [
      rehypeKatex,
    ],
  },
});
