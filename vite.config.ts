/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/leadmagnetdl/',
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // Brez tega Node ime "localhost" razreši samo v IPv6 (::1) in strežnik na
    // 127.0.0.1 sploh ne posluša. Brskalnik, ki poskusi IPv4, dobi zavrnjeno
    // povezavo in izpiše "This site can't be reached" — čeprav strežnik teče.
    // `true` veže vse vmesnike, torej oba loopbacka (in naslov v lokalnem omrežju,
    // ki ga Vite izpiše ob zagonu).
    host: true,
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
