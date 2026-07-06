# 🏢 INACAP Navigator 3D

Sistema de navegación interior interactiva en 3D para el edificio INACAP.

## Stack

- **React 18** + **Vite 5**
- **Three.js** + **@react-three/fiber** + **@react-three/drei**
- **GSAP** para animaciones de cámara
- **three-pathfinding** para cálculo de rutas
- **Zustand** para estado global

## Inicio rápido

```bash
npm install
npm run dev
```

El servidor abre en http://localhost:3000

## Configurar tu modelo .glb

1. Copia `inacapestructura2.glb` → `public/models/inacapestructura2.glb`
2. (Opcional) Copia `mascota.glb` → `public/models/mascota.glb`
3. Lee `public/models/COLOCA_TUS_GLB_AQUI.md` para convenciones de nodos

## Ajustar coordenadas de destinos

Edita `src/data/destinations.js` con las posiciones reales de tu modelo.

Para descubrir coordenadas, abre la consola del navegador y ejecuta:
```javascript
window.__scene.traverse(c => {
  if (c.isMesh) console.log(c.name, c.position)
})
```

## Flujo de experiencia

```
Carga ──► Vista Aérea Exterior ──► [Botón: Ingresar]
  ──► Transición GSAP ──► Vista Interior
    ──► Buscar destino ──► [Botón: Guiarme]
      ──► Línea verde 3D + Mascota animada ──► ¡Llegaste!
```
