import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main:        resolve(__dirname, 'index.html'),
        map:         resolve(__dirname, 'map.html'),
        briefing:    resolve(__dirname, 'briefing.html'),
        game:        resolve(__dirname, 'game.html'),
        quiz:        resolve(__dirname, 'quiz.html'),
        trophies:    resolve(__dirname, 'trophies.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
        graduate:    resolve(__dirname, 'graduate.html'),
      },
    },
  },
  server: {
    open: '/index.html',
    port: 5173,
  },
})
