
import { defineConfig } from 'vite';

export default defineConfig({
  // Caminho absoluto (raiz do domínio) — é assim que Vercel/Netlify
  // servem o site, e simplifica montar o link público de cada foto.
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Sempre gera um arquivo de verdade pra cada imagem (nunca embute
    // como base64), pra garantir que toda imagem tenha um link público
    // — necessário pra mandar a foto do produto na mensagem do WhatsApp.
    assetsInlineLimit: 0
  }
});