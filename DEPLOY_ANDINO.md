# Desplegar MST-Wallet en GitHub Pages

## Pasos para Desplegar la Rama `andino`

### 1. Configurar Ambiente en GitHub (IMPORTANTE)

**Este paso es necesario para resolver el error de protección del ambiente.**

1. Ve a tu repositorio: `https://github.com/cryptohumano/aura-pwa`
2. Ve a **Settings** → **Environments** (en el menú lateral)
3. Haz clic en **github-pages**
4. En **Deployment branches**:
   - Selecciona **Selected branches**
   - Agrega `andino` a la lista
   - O selecciona **All branches** para permitir todas
5. Guarda los cambios

**Ver documentación completa:** `docs/FIX_GITHUB_PAGES_ENVIRONMENT.md`

### 2. Hacer Push de la Rama

```bash
git push origin andino
```

### 3. Verificar el Despliegue

1. Ve a la pestaña **Actions** en GitHub
2. Verás el workflow "Deploy to GitHub Pages" ejecutándose
3. Espera a que complete (toma 2-5 minutos)

### 4. Acceder al Sitio

Una vez desplegado, el sitio estará disponible en:

```
https://cryptohumano.github.io/aura-pwa/
```

**Nota:** Como ambas ramas (`documents` y `andino`) despliegan al mismo sitio, la última que se despliegue será la visible.

## Próximos Pasos

Después de desplegar esta versión estable:

1. ✅ Verificar que el sitio funciona correctamente
2. ✅ Compartir URL para testing
3. 🔄 Crear nuevo repositorio privado para características P2P
4. 🔄 Migrar código al nuevo repo
5. 🔄 Implementar sistema P2P colaborativo

## Nota sobre Base Path

El workflow detecta automáticamente el nombre del repositorio (`aura-pwa`) y configura el base path correctamente. No necesitas hacer nada adicional.

## Troubleshooting

### Error: "Branch not allowed to deploy"

**Solución:** Configura el ambiente `github-pages` en GitHub Settings → Environments

### El sitio no carga correctamente

1. Verifica que el workflow se haya completado exitosamente
2. Espera 2-3 minutos después del despliegue (propagación DNS)
3. Verifica que el base path sea correcto en los logs del workflow

### Build falla

1. Revisa los logs en **Actions**
2. Verifica que todas las dependencias estén en `package.json`
3. Asegúrate de que `yarn build` funcione localmente
