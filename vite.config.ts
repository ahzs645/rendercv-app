import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

function rendercvVirtualModules() {
	const virtualModules: Record<string, string> = {
		'virtual:rendercv-variants': path.resolve('src/lib/virtual/rendercv-variants.ts'),
		'virtual:rendercv-examples': path.resolve('src/lib/virtual/rendercv-examples.ts'),
		'virtual:rendercv-schema': path.resolve('src/lib/virtual/rendercv-schema.ts')
	};

	return {
		name: 'rendercv-virtual-modules',
		resolveId(id: string) {
			if (id in virtualModules) {
				return virtualModules[id];
			}
		}
	};
}

function markdownPlugin() {
	return {
		name: 'vite-plugin-markdown',
		transform(code: string, id: string) {
			if (!id.endsWith('.md')) return null;
			// Simple markdown to HTML: just export the raw content as a string.
			// The original build likely used a proper markdown-to-HTML plugin,
			// but for a stub this is sufficient.
			const html = code
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/^### (.*$)/gm, '<h3>$1</h3>')
				.replace(/^## (.*$)/gm, '<h2>$1</h2>')
				.replace(/^# (.*$)/gm, '<h1>$1</h1>')
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\n\n/g, '</p><p>')
				.replace(/^(?!<[h|p])(.+)$/gm, '$1');
			const escaped = JSON.stringify(`<div>${html}</div>`);
			return {
				code: `export default ${escaped};`,
				map: null
			};
		}
	};
}

export default defineConfig({
	plugins: [rendercvVirtualModules(), markdownPlugin(), tailwindcss(), sveltekit()],
	worker: {
		format: 'es'
	}
});
