import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Plugin proprio (sem dependencia externa): apos o build, pre-comprime os
// assets estaticos em .gz e .br para que o servidor possa entregar os arquivos
// ja comprimidos (RNF de performance: compressao de arquivos estaticos).
function comprimeAssets() {
  return {
    name: 'comprime-assets',
    apply: 'build',
    closeBundle() {
      const dir = 'dist/assets'
      let files = []
      try {
        files = readdirSync(dir)
      } catch {
        return
      }
      for (const file of files) {
        if (!/\.(js|css|svg|json)$/.test(file)) continue
        const full = join(dir, file)
        const buf = readFileSync(full)
        writeFileSync(`${full}.gz`, gzipSync(buf))
        writeFileSync(`${full}.br`, brotliCompressSync(buf))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), comprimeAssets()],
  build: { reportCompressedSize: true },
})
