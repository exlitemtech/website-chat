import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'WebsiteChat',
      fileName: 'website-chat-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'website-chat-widget.[ext]',
        exports: 'named',
        extend: true
      }
    },
    cssCodeSplit: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
})