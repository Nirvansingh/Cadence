import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Custom Vite plugin to eliminate render-blocking CSS requests
function asyncCssPlugin(): Plugin {
  return {
    name: 'vite-plugin-async-css',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
        '<link rel="preload" href="$1" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="$1"></noscript>'
      );
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), asyncCssPlugin()],
  build: {
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000
  }
})
