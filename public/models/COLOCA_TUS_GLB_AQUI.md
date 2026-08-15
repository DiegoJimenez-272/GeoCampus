# Coloca aquí tus archivos .glb

## Archivos requeridos:

- **inacapestructura2.glb** (REQUERIDO)  
  Tu modelo del edificio exportado desde Blender.
  
- **mascota.glb** (OPCIONAL)  
  Modelo de mascota con animaciones 'Idle' y 'Walk'.
  Si no existe, se usará una mascota geométrica animada automáticamente.

## Convenciones de nombres de nodos en el .glb:

Para que el sistema funcione correctamente, tus nodos en Blender deben seguir estas convenciones:

| Nombre del nodo contiene | Comportamiento |
|--------------------------|----------------|
| `NavMesh`                | Se usa como malla de navegación (invisible) |
| `interior` o `inside`    | Solo visible en vista interior |
| `exterior_only`          | Solo visible en vista exterior |
| `wall` o `exterior`      | Se hace semi-transparente en vista interior |

## Cómo encontrar las coordenadas de tus destinos:

Una vez que cargues el modelo, abre la consola del navegador y ejecuta:

```javascript
// Ver todos los nodos y sus posiciones
window.__scene.traverse(c => {
  if (c.isMesh) console.log(c.name, c.position)
})
```

Luego actualiza el archivo `src/data/destinations.js` con las posiciones reales.
