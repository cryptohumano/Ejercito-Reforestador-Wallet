# Ejército Reforestador Wallet

<p align="center">
  <img src="./public/logo-ui.png" alt="Ejército Reforestador" width="160" />
</p>

<p align="center">
  <strong>ES</strong> · Wallet de campo para jornadas de reforestación<br />
  <strong>EN</strong> · Field wallet for reforestation campaigns
</p>

<p align="center">
  <a href="https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/"><strong>Live demo / Demo en vivo</strong></a>
  · <a href="#español">Español</a> · <a href="#english">English</a>
</p>

---

## Español

### Qué es

**Ejército Reforestador Wallet** es una Progressive Web App (PWA) no custodial para unidades de reforestación. Permite gestionar identidad blockchain, registrar jornadas y siembras en campo, firmar evidencias y operar incluso sin conexión.

- Repositorio: [cryptohumano/Ejercito-Reforestador-Wallet](https://github.com/cryptohumano/Ejercito-Reforestador-Wallet)
- GitHub Pages: [cryptohumano.github.io/Ejercito-Reforestador-Wallet](https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/)

### Para quién

Diseñada para brigadas, voluntariado y equipos de campo que necesitan:

- Abrir y cerrar **jornadas** de plantación
- Registrar **siembras** con datos de sitio y evidencia
- Firmar y respaldar el trabajo con una wallet segura en el dispositivo
- Seguir el **impacto** (plantas, registros, jornadas) desde el inicio

### Características principales

#### Forestación
- Jornadas activas con sitio, fecha y conteos
- Registro de siembras en terreno
- Exportación CSV de campaña
- Home demostrativo con métricas de impacto (aunque aún no haya datos)

#### Wallet y seguridad
- **No custodial**: las claves privadas no salen del dispositivo
- Encriptación local con contraseña
- WebAuthn (biometría / hardware key)
- Crear, importar y respaldar cuentas
- Soporte multi-cadena (Polkadot / Substrate y EVM según configuración)

#### Experiencia de campo
- Mobile-first e instalable como PWA
- Orientada a uso offline
- Identidad visual eco-militar (Ejército Reforestador)

### Instalación

```bash
npm install
# o
yarn install
```

### Desarrollo

```bash
npm run dev
# Local: http://localhost:5173/

# Puerto alternativo (si 5173 está ocupado)
npm run dev -- --port 5174 --strictPort

# Túnel Cloudflare (HTTPS público temporal)
npm run tunnel:cf -- 5174
```

### Build

```bash
npm run build
npm run preview

# Build para GitHub Pages (sin bloqueo por tsc)
npm run build:gh-pages
```

### Despliegue (GitHub Pages)

El workflow publica el build en la rama `gh-pages` en cada push a `main`.

1. Espera el workflow verde en **Actions**
2. **Settings → Pages → Source → Deploy from a branch → `gh-pages` / (root)**
3. Sitio: https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/

Detalle: [GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md)

### Seguridad

Esta aplicación es **no custodial**:

- Tú eres responsable de tus claves y fondos
- Guarda la frase de recuperación en un lugar seguro
- Nunca la compartas
- Sin la frase de recuperación no hay forma de recuperar la cuenta

### Stack

Vite · React · TypeScript · Tailwind CSS · shadcn/ui · Dedot / Polkadot.js · IndexedDB · Workbox (PWA)

### Licencia

MIT

### Contribuir

Las contribuciones son bienvenidas: abre un issue o un pull request en el repositorio.

---

## English

### What it is

**Ejército Reforestador Wallet** (*Reforesting Army Wallet*) is a non-custodial Progressive Web App (PWA) for reforestation units. It helps manage blockchain identity, log planting campaigns and seedlings in the field, sign evidence, and keep working offline.

- Repository: [cryptohumano/Ejercito-Reforestador-Wallet](https://github.com/cryptohumano/Ejercito-Reforestador-Wallet)
- GitHub Pages: [cryptohumano.github.io/Ejercito-Reforestador-Wallet](https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/)

### Who it’s for

Built for brigades, volunteers, and field teams that need to:

- Open and close planting **campaigns** (*jornadas*)
- Log **seedlings / plantings** (*siembras*) with site data and evidence
- Sign and back up work with a device-local secure wallet
- Track **impact** (plants, records, campaigns) from day one

### Main features

#### Reforestation
- Active campaigns with site, date, and counters
- Field planting registration
- Campaign CSV export
- Demonstrative home with impact metrics (even when data is still empty)

#### Wallet & security
- **Non-custodial**: private keys never leave the device
- Local password encryption
- WebAuthn (biometrics / hardware key)
- Create, import, and back up accounts
- Multi-chain support (Polkadot / Substrate and EVM as configured)

#### Field experience
- Mobile-first, installable as a PWA
- Offline-oriented workflow
- Eco-military visual identity (Ejército Reforestador)

### Setup

```bash
npm install
# or
yarn install
```

### Development

```bash
npm run dev
# Local: http://localhost:5173/

# Alternate port (if 5173 is taken)
npm run dev -- --port 5174 --strictPort

# Cloudflare tunnel (temporary public HTTPS)
npm run tunnel:cf -- 5174
```

### Build

```bash
npm run build
npm run preview

# GitHub Pages build (skips blocking tsc)
npm run build:gh-pages
```

### Deploy (GitHub Pages)

The workflow publishes the build to the `gh-pages` branch on every push to `main`.

1. Wait for a green run under **Actions**
2. **Settings → Pages → Source → Deploy from a branch → `gh-pages` / (root)**
3. Site: https://cryptohumano.github.io/Ejercito-Reforestador-Wallet/

Details: [GITHUB_PAGES_DEPLOY.md](./GITHUB_PAGES_DEPLOY.md)

### Security

This app is **non-custodial**:

- You alone are responsible for your keys and funds
- Store your recovery phrase safely
- Never share it
- Without the recovery phrase, the account cannot be recovered

### Stack

Vite · React · TypeScript · Tailwind CSS · shadcn/ui · Dedot / Polkadot.js · IndexedDB · Workbox (PWA)

### License

MIT

### Contributing

Contributions are welcome—open an issue or pull request on the repository.

---

**Ejército Reforestador Wallet** · Cada siembra cuenta / Every planting counts
