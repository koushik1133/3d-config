import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    open: true
  },
  resolve: {
    alias: {
      // Map 'three/addons' shortcut correctly
      'three/addons': 'three/examples/jsm'
    }
  }
});
