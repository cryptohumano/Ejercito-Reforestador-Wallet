# Propuesta: Home Centrado en Montañistas

## 🎯 Objetivo

Reorientar la página de inicio para priorizar las funciones esenciales para montañistas, exploradores y andinistas, relegando las funciones financieras a un rol secundario.

## 📊 Análisis Actual

### Problemas Identificados
1. **Balance Total** es lo primero que se ve (prioridad financiera)
2. **Acciones Rápidas** enfocadas en transferencias (Enviar, Recibir, Cuentas)
3. **Cuentas Activas** ocupa mucho espacio
4. **Transacciones Recientes** es prominente
5. **No hay información sobre bitácoras activas**
6. **No hay información sobre emergencias**
7. **No hay acceso rápido a crear bitácora**

### Lo que Debería Ser Prioridad
1. **Bitácoras Activas** - Ver expediciones en curso
2. **Emergencias Activas** - Alertas críticas
3. **Crear Nueva Bitácora** - Acción principal
4. **Avisos de Salida** - Próximas expediciones
5. **Tracking GPS** - Estado si hay bitácora activa
6. **Funciones Financieras** - Como información secundaria

## 🏔️ Nueva Estructura Propuesta

### 1. Header Hero (Bienvenida)
```
┌─────────────────────────────────────┐
│  🏔️ MST-Wallet                   │
│  Tu compañero en la montaña         │
└─────────────────────────────────────┘
```

### 2. Bitácora Activa (Si existe)
```
┌─────────────────────────────────────┐
│  📍 Bitácora Activa                 │
│  ─────────────────────────────────  │
│  [Nombre de la expedición]          │
│  🏔️ [Montaña] • 📍 [Ubicación]     │
│  ⏱️ [Tiempo activo] • 📊 [Stats]    │
│  [Ver Detalles] [Crear Emergencia]  │
└─────────────────────────────────────┘
```

### 3. Emergencias Activas (Si existen)
```
┌─────────────────────────────────────┐
│  🚨 Emergencias Activas             │
│  ─────────────────────────────────  │
│  [Card de emergencia activa]        │
│  Estado, ubicación, tiempo          │
└─────────────────────────────────────┘
```

### 4. Acciones Principales
```
┌─────────────────────────────────────┐
│  [Crear Bitácora] [Ver Bitácoras]   │
│  [Ver Emergencias] [Documentos]     │
└─────────────────────────────────────┘
```

### 5. Bitácoras Recientes
```
┌─────────────────────────────────────┐
│  📚 Bitácoras Recientes              │
│  ─────────────────────────────────  │
│  [Lista de últimas 3-5 bitácoras]   │
└─────────────────────────────────────┘
```

### 6. Información Financiera (Secundaria)
```
┌─────────────────────────────────────┐
│  💰 Balance                          │
│  [Balance compacto]                  │
│  [Ver todas las transacciones →]    │
└─────────────────────────────────────┘
```

## 📱 Orden de Prioridad Visual

### Mobile (< 768px)
1. **Bitácora Activa** (si existe) - Card grande
2. **Emergencias Activas** (si existen) - Card destacada
3. **Botón: Crear Bitácora** - FAB o botón grande
4. **Bitácoras Recientes** - Lista compacta
5. **Balance** - Card pequeña al final

### Desktop (≥ 768px)
1. **Grid 2 columnas:**
   - Columna izquierda: Bitácora Activa + Emergencias
   - Columna derecha: Acciones + Balance
2. **Bitácoras Recientes** - Grid de cards

## 🎨 Componentes Necesarios

### Nuevos Componentes
- `ActiveMountainLogCard` - Muestra bitácora activa con stats
- `ActiveEmergenciesCard` - Muestra emergencias activas
- `QuickActionsGrid` - Grid de acciones principales
- `RecentMountainLogsList` - Lista de bitácoras recientes
- `CompactBalanceCard` - Balance en formato compacto

### Hooks Necesarios
- `useActiveMountainLog()` - Obtener bitácora activa
- `useActiveEmergencies()` - Obtener emergencias activas
- `useRecentMountainLogs()` - Obtener bitácoras recientes

## 📋 Checklist de Implementación

- [ ] Crear componente `ActiveMountainLogCard`
- [ ] Crear componente `ActiveEmergenciesCard`
- [ ] Crear componente `QuickActionsGrid`
- [ ] Crear componente `RecentMountainLogsList`
- [ ] Crear componente `CompactBalanceCard`
- [ ] Crear hooks necesarios
- [ ] Reorganizar Home.tsx con nueva estructura
- [ ] Aplicar responsive design
- [ ] Actualizar navegación si es necesario

## 🚀 Beneficios

1. **Enfoque en el usuario**: Montañistas ven primero lo que necesitan
2. **Acceso rápido**: Crear bitácora y emergencias a un click
3. **Contexto claro**: Estado actual de expediciones visibles
4. **Funciones financieras**: Disponibles pero no intrusivas
5. **Mejor UX**: Flujo natural para el usuario objetivo
