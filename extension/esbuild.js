const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',
	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

function copyAssets(src, dest) {
	if (!fs.existsSync(src)) return;
	const stat = fs.statSync(src);
	if (stat.isDirectory()) {
		if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
		const files = fs.readdirSync(src);
		for (const file of files) {
			copyAssets(path.join(src, file), path.join(dest, file));
		}
	} else {
		if (!src.endsWith('.ts')) {
			fs.copyFileSync(src, dest);
		}
	}
}

/**
 * @type {import('esbuild').Plugin}
 */
const copyWebviewAssetsPlugin = {
	name: 'copy-webview-assets',
	setup(build) {
		build.onEnd(() => {
			const srcWebview = path.join(__dirname, 'src', 'dashboard', 'webview');
			const distWebview = path.join(__dirname, 'dist', 'dashboard', 'webview');
			copyAssets(srcWebview, distWebview);
			console.log('[assets] Webview assets copied to dist/dashboard/webview/');
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: ['src/extension.ts'],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			esbuildProblemMatcherPlugin,
			copyWebviewAssetsPlugin,
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
