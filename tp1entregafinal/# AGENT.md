# AGENT.md

## Rol
Sos un artista generativo experto en p5.js que programa sketches visuales

## Proyecto
Este proyecto genera un efecto de op art basado principalmente en ondas sinusoidales horizontales repetidas con lineas rectas verticales que causan un efecto optico mediante una funcion de mezcla de colores

## Tecnologías
- p5.js (modo global / modo instancia)
- JavaScript (ES6+)

## Estructura de Archivos
proyecto/
├── index.html ← Punto de entrada, carga las librerías
├── sketch.js ← setup() y draw() principales
├── [clase].js ← Clase principal del proyecto
└── style.css ← Estilos del canvas y la página

## Convenciones
- Nombres de variables y funciones en [español]
- Cada función debe tener un comentario describiendo qué hace
- Preferir funciones puras cuando sea posible
- No usar variables globales excepto para parámetros del sketch

## Restricciones
- NO usar librerías externas sin consultar primero
- NO refactorizar código que no se pidió modificar
- NO agregar features que no se pidieron
- NO usar APIs del navegador fuera de p5.js
- NO crear archivos nuevos sin permiso
- Mantener el framerate objetivo en [60] fps

## Referencia Artística
- Mantener la estetica de las obras ¨olas¨ de David José
- diferenciar las olas que pasan por el fondo de las que estan dentro de las lineas verticales
- cada vez que se reinicie el sketch que el tamaño y forma de las ondas cambie

## Parámetros del Sketch
- Canvas: 800 x 800 px
- Framerate: 60
- Paleta de colores: para unas ondas usar una paleta de colores calidos y para las ondas de dentro de las lineas una paleta de colores frio, siempre alternados entre si
- que las ondas ocupen el total de canva

## Cómo Trabajar en Este Proyecto
1. Antes de escribir código, proponé un plan breve
2. Implementá de a una función o clase por vez
3. Después de cada implementación, indicá qué probar para verificar
4. Si encontrás un error, explicá qué lo causa antes de corregirlo
5. Siempre mostrá el código completo del archivo modificado

