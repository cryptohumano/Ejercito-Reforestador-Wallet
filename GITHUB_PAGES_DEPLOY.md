# Despliegue en GitHub Pages — Ejército Reforestador Wallet

## URL

https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/

## Cómo funciona

El workflow publica el build en la rama **`gh-pages`** (vía `peaceiris/actions-gh-pages`).  
Así se evita el error `Create Pages site failed: Resource not accessible by integration`, porque el `GITHUB_TOKEN` **no puede** crear el sitio Pages por API.

## Activación (una sola vez)

1. Espera a que el workflow en **Actions** termine en verde (crea/actualiza la rama `gh-pages`).
2. Abre: https://github.com/cryptohumano/Ejercito-Reforestador-Wallet/settings/pages
3. **Build and deployment → Source** → **Deploy from a branch**
4. **Branch:** `gh-pages` / `/ (root)`
5. **Save**

En 1–2 minutos el sitio debería responder en la URL de arriba.

> No uses “GitHub Actions” como Source con este workflow: la fuente es la rama `gh-pages`.

## Verificar

- Rama: https://github.com/cryptohumano/Ejercito-Reforestador-Wallet/tree/gh-pages  
- Actions: https://github.com/cryptohumano/Ejercito-Reforestador-Wallet/actions  
- Sitio: https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/

## Troubleshooting

| Síntoma | Qué hacer |
| --- | --- |
| Workflow verde pero 404 en el sitio | Falta el paso Settings → branch `gh-pages` |
| Workflow falla en Deploy | Settings → Actions → General → Workflow permissions → **Read and write** |
| Assets 404 | Revisa que el HTML use `/Ejercito-Reforestador-Wallet/` |

## Build local equivalente

```bash
NODE_ENV=production \
GITHUB_REPOSITORY=cryptohumano/Ejercito-Reforestador-Wallet \
npm run build:gh-pages
```
