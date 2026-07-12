# Despliegue en GitHub Pages — Ejército Reforestador Wallet

## URL

https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/

## Activación (una sola vez)

1. Abre [Settings → Pages](https://github.com/cryptohumano/Ejercito-Reforestador-Wallet/settings/pages)
2. En **Build and deployment → Source**, elige **GitHub Actions**
3. Guarda

Si el ambiente `github-pages` tiene reglas de protección, permite la rama `main` en **Settings → Environments → github-pages**.

## Cómo se despliega

El workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):

- Se dispara en cada push a `main` (también manualmente desde **Actions**)
- Instala con `npm ci`
- Construye con `npm run build:gh-pages` (`vite build`)
- Usa `GITHUB_REPOSITORY` para el base path `/Ejercito-Reforestador-Wallet/`
- Sube `dist/` con `actions/deploy-pages`

## Verificar

1. **Actions** → workflow **Deploy to GitHub Pages** en verde
2. Abrir https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/

## Troubleshooting

| Síntoma | Qué revisar |
| --- | --- |
| Workflow no corre | Pages Source = GitHub Actions; push a `main` |
| 404 en assets | Base path en logs del build; debe ser `/Ejercito-Reforestador-Wallet/` |
| Deploy rechazado | Environment `github-pages` debe permitir `main` |
| Build falla en `npm ci` | Asegura que `package-lock.json` esté en el repo |

## Build local equivalente

```bash
NODE_ENV=production \
GITHUB_REPOSITORY=cryptohumano/Ejercito-Reforestador-Wallet \
npm run build:gh-pages
```
