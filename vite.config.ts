import fs from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	// Dùng VITE_SITE_URL nếu có, không thì lấy mặc định
	const siteUrl = env.VITE_SITE_URL || "https://x.enmixx.com";

	return {
		plugins: [
			react(),
			tailwindcss(),
			{
				name: "generate-seo-files",
				writeBundle() {
					const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
					const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;

					fs.writeFileSync(
						resolve(import.meta.dirname, "dist/robots.txt"),
						robotsTxt,
					);
					fs.writeFileSync(
						resolve(import.meta.dirname, "dist/sitemap.xml"),
						sitemapXml,
					);
				},
			},
		],
		resolve: {
			alias: {
				"@": resolve(import.meta.dirname, "./src"),
			},
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes('node_modules')) {
							if (id.includes('react') || id.includes('react-dom')) return 'vendor';
							if (id.includes('lucide') || id.includes('@base-ui') || id.includes('@tanstack') || id.includes('zod')) return 'ui';
							return 'vendor';
						}
					}
				}
			}
		}
	};
});
