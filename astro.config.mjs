import { defineConfig } from 'astro/config'
import unocss from 'unocss/astro'
import solidJs from '@astrojs/solid-js'
import node from '@astrojs/node'
import vercel from '@astrojs/vercel/edge'
const envAdapter = () => {
  if (process.env.OUTPUT == 'vercel') {
    return vercel()
  } else {
    return node({
      mode: 'standalone'
    })
  }
}

// https://astro.build/config
export default defineConfig({
  server: {
    host: true, 
  },
  integrations: [
    unocss(),
    solidJs()
  ],
  output: 'server',
  adapter: envAdapter(),
});