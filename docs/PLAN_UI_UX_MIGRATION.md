# Plan de Migración UI/UX - MST-Wallet

## 📋 Resumen

Este documento detalla el plan para aplicar los estándares de UI/UX de Emergency Wallet a MST-Wallet, basado en el documento [UI_UX_STANDARDS.md](https://raw.githubusercontent.com/cryptohumano/emergency-wallet-pwa/feature/ui-improvements/docs/UI_UX_STANDARDS.md).

## 🎯 Objetivos

1. **Mobile-First, Desktop-Responsive**: Priorizar diseño móvil
2. **Accesibilidad por Distancia**: Componentes principales a un dedo/mano de distancia
3. **Regla de 3 Clicks**: Acciones principales ≤ 3 clicks
4. **Máximo 5-7 Elementos**: Por pantalla para evitar sobrecarga
5. **Consistencia Visual**: shadcn/ui como base, colores semánticos

## 📊 Análisis de Estado Actual

### ✅ Ya Implementado
- BottomNav con FAB de navegación (derecha)
- Header responsive
- Sistema de colores básico
- Tema oscuro/claro básico
- Uso de shadcn/ui

### ❌ Falta Implementar
- Sistema de colores con tinte azul (backgrounds y cards)
- Header minimalista (solo logo icono)
- FAB de emergencia (izquierda)
- Cards con background con tinte (no blanco puro)
- Sheet sólido en BottomNav (no translúcido)
- BalanceDisplay en header/Sheet
- ThemeToggle en header/Sheet
- Sombras mejoradas
- Responsive mejorado (títulos, espaciado)

## 🔄 Cambios Requeridos

### 1. Sistema de Colores

#### Light Mode
```css
--background: 217 91% 98%;        /* Azul muy claro con tinte */
--card: 217 91% 99%;              /* Card ligeramente más claro */
--muted: 217 91% 97%;             /* Muted con tinte azul */
--border: 217 33% 85%;            /* Border visible pero suave */
--primary: 200 96% 38%;           /* Azul: #0477BF (ya actualizado) */
```

#### Dark Mode
```css
--background: 222.2 47.4% 11.2%;  /* Azul muy oscuro */
--card: 217 33% 19%;              /* Card más claro que background */
--muted: 217 20% 25%;             /* Muted oscuro */
--border: 217 30% 30%;            /* Border visible */
--primary: 195 96% 48%;           /* Azul claro: #05C7F2 (ya actualizado) */
```

### 2. Header

#### Mobile (< 768px)
- Logo: Solo icono (web-app-manifest-192x192.png)
- Acciones: BalanceDisplay (hidden sm:flex), ThemeToggle (hidden sm:flex), LogoutButton
- Altura: Mínima (solo esencial)

#### Desktop (≥ 768px)
- Logo: Icono
- NetworkSwitcher
- BalanceDisplay
- ActiveAccountSwitcher
- ThemeToggle
- LogoutButton
- Altura: 64px

### 3. FABs (Floating Action Buttons)

#### FAB de Emergencia (Izquierda)
- Posición: `bottom-4 left-4`
- Variante: `destructive` (rojo/rosa #F21667)
- Tamaño: 56px (móvil), 64px (desktop)
- Z-index: z-[100]
- Safe area: Respetar `env(safe-area-inset-bottom)`

#### FAB de Navegación (Derecha)
- Posición: `bottom-4 right-4` (ya implementado)
- Variante: `default` (azul #0477BF)
- Tamaño: 56px (móvil), 64px (desktop)
- Estado dim: Opacidad 0.4 cuando tabla expandida

### 4. BottomNav

#### Sheet
- Background: Sólido (no translúcido)
- Altura: 70vh máximo
- Posición: Encima de FABs
- Contenido: BalanceDisplay, navegación, acciones rápidas, ThemeToggle

### 5. Cards

#### Estilos
- Background: Color con tinte azul suave (no blanco puro)
- Border: Visible pero suave
- Sombra: Múltiples capas para profundidad
- Hover: Sombra más pronunciada
- Padding: p-4 (móvil), p-6 (desktop)

### 6. Responsive Design

#### Títulos
```tsx
h1: text-xl sm:text-2xl md:text-3xl font-bold
h2: text-lg sm:text-xl md:text-2xl font-semibold
h3: text-base sm:text-lg font-semibold
```

#### Espaciado
```tsx
Mobile: p-4, gap-2, space-y-4
Desktop: p-6, gap-4, space-y-6
```

## 📝 Checklist de Implementación

### Fase 1: Sistema de Colores
- [ ] Actualizar backgrounds con tinte azul (light mode)
- [ ] Actualizar cards con tinte azul (light mode)
- [ ] Actualizar borders (light mode)
- [ ] Actualizar backgrounds (dark mode)
- [ ] Actualizar cards (dark mode)
- [ ] Actualizar borders (dark mode)
- [ ] Actualizar sombras

### Fase 2: Header
- [ ] Reemplazar texto "MST-Wallet" con logo icono
- [ ] Reorganizar elementos según estándar
- [ ] Agregar BalanceDisplay (desktop)
- [ ] Agregar ThemeToggle (desktop)
- [ ] Simplificar para móvil

### Fase 3: FABs
- [ ] Crear componente FAB reutilizable
- [ ] Agregar FAB de emergencia (izquierda)
- [ ] Actualizar FAB de navegación (derecha)
- [ ] Implementar estado dim
- [ ] Asegurar safe area insets

### Fase 4: BottomNav
- [ ] Cambiar Sheet a background sólido
- [ ] Agregar BalanceDisplay
- [ ] Agregar ThemeToggle
- [ ] Mejorar layout y espaciado
- [ ] Posicionar encima de FABs

### Fase 5: Cards y Componentes
- [ ] Actualizar estilos de Card
- [ ] Asegurar background con tinte
- [ ] Mejorar sombras
- [ ] Actualizar hover states

### Fase 6: Responsive
- [ ] Actualizar títulos (tamaños responsivos)
- [ ] Actualizar espaciado (p-4 → p-6)
- [ ] Actualizar gaps (gap-2 → gap-4)
- [ ] Actualizar grid layouts

### Fase 7: Componentes Faltantes
- [ ] Crear BalanceDisplay
- [ ] Crear ThemeToggle
- [ ] Integrar en Header y BottomNav

## 🚀 Orden de Implementación

1. **Sistema de Colores** (Base para todo)
2. **Componentes Base** (BalanceDisplay, ThemeToggle)
3. **Header** (Depende de componentes base)
4. **FABs** (Depende de sistema de colores)
5. **BottomNav** (Depende de FABs y componentes base)
6. **Cards** (Depende de sistema de colores)
7. **Responsive** (Aplicar en todas las páginas)

## 📚 Referencias

- [UI_UX_STANDARDS.md](https://raw.githubusercontent.com/cryptohumano/emergency-wallet-pwa/feature/ui-improvements/docs/UI_UX_STANDARDS.md)
- [Emergency Wallet - BottomNav](https://github.com/cryptohumano/emergency-wallet-pwa/blob/feature/ui-improvements/src/components/layout/BottomNav.tsx)
- [Emergency Wallet - Header](https://github.com/cryptohumano/emergency-wallet-pwa/blob/feature/ui-improvements/src/components/layout/Header.tsx)
