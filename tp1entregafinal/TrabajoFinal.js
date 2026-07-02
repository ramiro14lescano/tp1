let obra = [];
let destelloImagen;
let destelloObra;

let cantidadCapas = 6;
let cantidadLineas = 60;
let impactoAplauso = 0;
let panelUso;
let estadoMicrofonoTexto;
let estadoModeloTexto;
let estadoRecargaTexto;
let confianzaAplausoTexto;
let confianzaRecargaTexto;
let sensibilidadTexto;
let controlSensibilidad;
let botonMicrofono;
let interaccionesTexto;
let interaccionActualTexto;
let aplausosTexto;
let frecuenciaTexto;
let tipoSonidoTexto;
let barraFrecuenciaRelleno;
let barraFrecuenciaIndicador;
let marcaUmbralGrave;
let marcaUmbralAgudo;
let amplitudTexto;
let barraAmplitudRelleno;
let controlUmbralGrave;
let controlUmbralAgudo;
let umbralGraveTexto;
let umbralAgudoTexto;
let contadorAplausos = 0;
let contadorRecargas = 0;
let recargasTexto;

// Carga la imagen del destello antes de iniciar el sketch.
function preload() {
  destelloImagen = loadImage("destello.png");
}

// Configura el lienzo, prepara el modelo ML y genera la obra inicial.
function setup() {
  createCanvas(800, 800);
  frameRate(60);
  pixelDensity(1);

  prepararModeloAplausosML();
  prepararClasificadorRecargaTM();
  configurarSensibilidadMicrofono(60);
  crearPanelUso();
  crearObra();
}

// Actualiza la interaccion sonora y dibuja la obra.
function draw() {
  background(30);

  actualizarVoz();

  if (recargaObraDetectada) {
    reaccionarRecargaObra();
  } else if (aplausoDetectado) {
    reaccionarAplauso();
  }

  actualizarPanelUso();

  impactoAplauso = lerp(impactoAplauso, 0, 0.16);

  for (let pieza of obra) {
    pieza.fondo.actualizar(nivelVoz);
    pieza.fondo.mostrar();

    pieza.lineas.actualizar(max(vibracionAgudos, impactoAplauso), amplitudMicrofono);
    pieza.lineas.mostrar();
  }

  mostrarDestelloObra();
}

// Genera la composicion visual completa.
function crearObra() {
  obra = [];

  let capas = cantidadCapas + floor(random(-1, 2));
  let lineasPanel = cantidadLineas + floor(random(-8, 9));
  let paletaPanel = new Paleta(capas, floor(random(4)));

  let fondo = new FondoOndulado(0, 0, width, height, capas, paletaPanel.coloresFondo);
  let lineas = new LineasFrente(0, 0, width, height, lineasPanel, capas, paletaPanel.coloresLineas);

  let pieza = {
    x: 0,
    y: 0,
    w: width,
    h: height,
    paleta: paletaPanel,
    fondo: fondo,
    lineas: lineas
  };

  obra.push(pieza);
  generarDestelloObra();
}

// Genera posicion, desplazamiento y rotacion aleatoria para el destello.
function generarDestelloObra() {
  destelloObra = {
    x: random(width * 0.15, width * 0.85),
    y: random(height * 0.15, height * 0.85),
    desplazamientoX: random(-width * 0.18, width * 0.18),
    desplazamientoY: random(-height * 0.18, height * 0.18),
    rotacion: random(TWO_PI),
    escala: random(0.80, 1.15)
  };
}

// Dibuja el destello con 60% de opacidad, translate y rotate.
function mostrarDestelloObra() {
  if (!destelloImagen || !destelloObra) {
    return;
  }

  push();
  imageMode(CENTER);
  translate(
    destelloObra.x + destelloObra.desplazamientoX,
    destelloObra.y + destelloObra.desplazamientoY
  );
  rotate(destelloObra.rotacion);
  tint(255, 153);
  image(destelloImagen, 0, 0, width * destelloObra.escala, height * destelloObra.escala);
  noTint();
  pop();
}

// Crea el panel lateral con controles y lecturas del microfono.
function crearPanelUso() {
  panelUso = createDiv();
  panelUso.style("width", "320px");
  panelUso.style("max-width", "calc(100vw - 36px)");
  panelUso.style("max-height", "calc(100vh - 36px)");
  panelUso.style("flex", "0 0 320px");
  panelUso.style("padding", "16px");
  panelUso.style("overflow-y", "auto");
  panelUso.style("border-radius", "8px");
  panelUso.style("background", "rgba(20, 20, 22, 0.94)");
  panelUso.style("border", "1px solid rgba(255, 255, 255, 0.22)");
  panelUso.style("box-shadow", "0 14px 32px rgba(0, 0, 0, 0.32)");
  panelUso.style("color", "#f4f4f5");
  panelUso.style("font-family", "Arial, sans-serif");
  panelUso.style("line-height", "1.35");
  panelUso.style("box-sizing", "border-box");

  let titulo = createDiv("Panel de control");
  titulo.parent(panelUso);
  titulo.style("font-size", "18px");
  titulo.style("font-weight", "700");
  titulo.style("margin-bottom", "12px");

  botonMicrofono = createButton("Activar microfono");
  botonMicrofono.parent(panelUso);
  botonMicrofono.mousePressed(iniciarMicrofono);
  botonMicrofono.style("width", "100%");
  botonMicrofono.style("min-height", "40px");
  botonMicrofono.style("border", "0");
  botonMicrofono.style("border-radius", "8px");
  botonMicrofono.style("background", "#f2c94c");
  botonMicrofono.style("color", "#171717");
  botonMicrofono.style("font-weight", "700");
  botonMicrofono.style("cursor", "pointer");

  let seccionUmbrales = crearSeccionPanel("Umbrales de frecuencia");

  umbralGraveTexto = createDiv("Grave hasta: " + umbralGraveHz + " Hz");
  umbralGraveTexto.parent(seccionUmbrales);
  aplicarEstiloEtiquetaControl(umbralGraveTexto);

  controlUmbralGrave = createSlider(80, 900, umbralGraveHz, 10);
  controlUmbralGrave.parent(seccionUmbrales);
  controlUmbralGrave.input(cambiarUmbralesFrecuenciaDesdePanel);
  aplicarEstiloSlider(controlUmbralGrave);

  umbralAgudoTexto = createDiv("Agudo desde: " + umbralAgudoHz + " Hz");
  umbralAgudoTexto.parent(seccionUmbrales);
  aplicarEstiloEtiquetaControl(umbralAgudoTexto);

  controlUmbralAgudo = createSlider(500, 5000, umbralAgudoHz, 10);
  controlUmbralAgudo.parent(seccionUmbrales);
  controlUmbralAgudo.input(cambiarUmbralesFrecuenciaDesdePanel);
  aplicarEstiloSlider(controlUmbralAgudo);

  sensibilidadTexto = createDiv("Sensibilidad: 60%");
  sensibilidadTexto.parent(seccionUmbrales);
  aplicarEstiloEtiquetaControl(sensibilidadTexto);

  controlSensibilidad = createSlider(0, 100, 60, 1);
  controlSensibilidad.parent(seccionUmbrales);
  controlSensibilidad.input(cambiarSensibilidadDesdePanel);
  aplicarEstiloSlider(controlSensibilidad);

  let seccionFrecuencia = crearSeccionPanel("Frecuencia en vivo");

  frecuenciaTexto = createDiv("Frecuencia: 0 Hz");
  frecuenciaTexto.parent(seccionFrecuencia);
  aplicarEstiloLectura(frecuenciaTexto);

  let medidorFrecuencia = crearMedidorPanel(seccionFrecuencia);
  barraFrecuenciaRelleno = medidorFrecuencia.relleno;
  barraFrecuenciaIndicador = medidorFrecuencia.indicador;

  marcaUmbralGrave = crearMarcaUmbral(medidorFrecuencia.pista, "#62b6ff");
  marcaUmbralAgudo = crearMarcaUmbral(medidorFrecuencia.pista, "#f2c94c");

  tipoSonidoTexto = createDiv("Sonido: silencio");
  tipoSonidoTexto.parent(seccionFrecuencia);
  tipoSonidoTexto.style("font-size", "13px");
  tipoSonidoTexto.style("font-weight", "700");
  tipoSonidoTexto.style("margin-top", "8px");

  let seccionAmplitud = crearSeccionPanel("Amplitud");

  amplitudTexto = createDiv("Amplitud: 0%");
  amplitudTexto.parent(seccionAmplitud);
  aplicarEstiloLectura(amplitudTexto);

  let medidorAmplitud = crearMedidorPanel(seccionAmplitud);
  barraAmplitudRelleno = medidorAmplitud.relleno;
  medidorAmplitud.indicador.style("display", "none");

  let seccionInteracciones = crearSeccionPanel("Interacciones");

  interaccionesTexto = createDiv("Voz: mueve las ondas<br>Agudo: vibra las lineas<br>Aplauso " + porcentajeMinimoAplauso + "%: invierte los colores<br>Pop/Pup " + porcentajeMinimoRecargaObra + "%: recarga la obra");
  interaccionesTexto.parent(seccionInteracciones);
  interaccionesTexto.style("font-size", "12px");
  interaccionesTexto.style("color", "#d7d7de");
  interaccionesTexto.style("margin-bottom", "8px");

  interaccionActualTexto = createDiv("Actual: microfono apagado");
  interaccionActualTexto.parent(seccionInteracciones);
  interaccionActualTexto.style("font-size", "13px");
  interaccionActualTexto.style("font-weight", "700");

  aplausosTexto = createDiv("Aplausos detectados: 0");
  aplausosTexto.parent(seccionInteracciones);
  aplausosTexto.style("font-size", "12px");
  aplausosTexto.style("color", "#b9bac3");
  aplausosTexto.style("margin-top", "4px");

  recargasTexto = createDiv("Recargas detectadas: 0");
  recargasTexto.parent(seccionInteracciones);
  recargasTexto.style("font-size", "12px");
  recargasTexto.style("color", "#b9bac3");
  recargasTexto.style("margin-top", "4px");

  let seccionEstado = crearSeccionPanel("Estado");

  estadoMicrofonoTexto = createDiv("Microfono: apagado");
  estadoMicrofonoTexto.parent(seccionEstado);
  estadoMicrofonoTexto.style("font-size", "12px");
  estadoMicrofonoTexto.style("color", "#b9bac3");

  estadoModeloTexto = createDiv("Aplauso: cargando");
  estadoModeloTexto.parent(seccionEstado);
  estadoModeloTexto.style("font-size", "12px");
  estadoModeloTexto.style("color", "#b9bac3");

  estadoRecargaTexto = createDiv("Pop/Pup: cargando");
  estadoRecargaTexto.parent(seccionEstado);
  estadoRecargaTexto.style("font-size", "12px");
  estadoRecargaTexto.style("color", "#b9bac3");

  confianzaAplausoTexto = createDiv("Aplauso ML: 0%");
  confianzaAplausoTexto.parent(seccionEstado);
  confianzaAplausoTexto.style("font-size", "12px");
  confianzaAplausoTexto.style("color", "#b9bac3");

  confianzaRecargaTexto = createDiv("Pop/Pup ML: 0%");
  confianzaRecargaTexto.parent(seccionEstado);
  confianzaRecargaTexto.style("font-size", "12px");
  confianzaRecargaTexto.style("color", "#b9bac3");
}

// Crea un bloque interno del panel para agrupar controles relacionados.
function crearSeccionPanel(tituloTexto) {
  let seccion = createDiv();
  seccion.parent(panelUso);
  seccion.style("padding-top", "12px");
  seccion.style("margin-top", "12px");
  seccion.style("border-top", "1px solid rgba(255, 255, 255, 0.14)");

  let titulo = createDiv(tituloTexto);
  titulo.parent(seccion);
  titulo.style("font-size", "12px");
  titulo.style("font-weight", "700");
  titulo.style("letter-spacing", "0");
  titulo.style("text-transform", "uppercase");
  titulo.style("color", "#f4f4f5");
  titulo.style("margin-bottom", "8px");

  return seccion;
}

// Aplica el estilo base de las etiquetas que acompanan sliders.
function aplicarEstiloEtiquetaControl(elemento) {
  elemento.style("font-size", "13px");
  elemento.style("font-weight", "700");
  elemento.style("margin-top", "8px");
}

// Aplica el estilo comun de los sliders del panel.
function aplicarEstiloSlider(elemento) {
  elemento.style("width", "100%");
  elemento.style("accent-color", "#f2c94c");
  elemento.style("margin-top", "2px");
}

// Aplica el estilo base de los valores de lectura del panel.
function aplicarEstiloLectura(elemento) {
  elemento.style("font-size", "13px");
  elemento.style("font-weight", "700");
  elemento.style("margin-bottom", "8px");
}

// Crea una barra horizontal con relleno e indicador movil.
function crearMedidorPanel(padre) {
  let pista = createDiv();
  pista.parent(padre);
  pista.style("position", "relative");
  pista.style("width", "100%");
  pista.style("height", "14px");
  pista.style("overflow", "hidden");
  pista.style("border-radius", "7px");
  pista.style("background", "rgba(255, 255, 255, 0.12)");
  pista.style("border", "1px solid rgba(255, 255, 255, 0.16)");

  let relleno = createDiv();
  relleno.parent(pista);
  relleno.style("position", "absolute");
  relleno.style("left", "0");
  relleno.style("top", "0");
  relleno.style("height", "100%");
  relleno.style("width", "0%");
  relleno.style("background", "#f2c94c");

  let indicador = createDiv();
  indicador.parent(pista);
  indicador.style("position", "absolute");
  indicador.style("top", "-3px");
  indicador.style("left", "0%");
  indicador.style("width", "3px");
  indicador.style("height", "20px");
  indicador.style("background", "#ffffff");
  indicador.style("box-shadow", "0 0 8px rgba(255, 255, 255, 0.65)");

  return {
    pista: pista,
    relleno: relleno,
    indicador: indicador
  };
}

// Crea una marca vertical para senalar los umbrales dentro de la barra.
function crearMarcaUmbral(padre, color) {
  let marca = createDiv();
  marca.parent(padre);
  marca.style("position", "absolute");
  marca.style("top", "0");
  marca.style("left", "0%");
  marca.style("width", "2px");
  marca.style("height", "100%");
  marca.style("background", color);
  marca.style("opacity", "0.9");
  marca.style("z-index", "2");

  return marca;
}

// Aplica el valor elegido en el control de sensibilidad.
function cambiarSensibilidadDesdePanel() {
  let valor = controlSensibilidad.value();
  configurarSensibilidadMicrofono(valor);
  sensibilidadTexto.html("Sensibilidad: " + valor + "%");
}

// Aplica los valores elegidos para separar graves y agudos.
function cambiarUmbralesFrecuenciaDesdePanel() {
  configurarUmbralesFrecuencia(controlUmbralGrave.value(), controlUmbralAgudo.value());
  controlUmbralGrave.value(umbralGraveHz);
  controlUmbralAgudo.value(umbralAgudoHz);
  actualizarTextosUmbrales();
}

// Actualiza textos, barras y estado del panel lateral.
function actualizarPanelUso() {
  if (
    !estadoMicrofonoTexto ||
    !estadoModeloTexto ||
    !estadoRecargaTexto ||
    !confianzaAplausoTexto ||
    !confianzaRecargaTexto ||
    !botonMicrofono ||
    !barraFrecuenciaRelleno ||
    !barraAmplitudRelleno
  ) {
    return;
  }

  if (microfonoListo) {
    estadoMicrofonoTexto.html("Microfono: activo");
    botonMicrofono.html("Microfono activo");
    botonMicrofono.attribute("disabled", "");
    botonMicrofono.style("opacity", "0.72");
    botonMicrofono.style("cursor", "default");
  } else if (microfonoSolicitado) {
    estadoMicrofonoTexto.html("Microfono: esperando permiso");
    botonMicrofono.html("Esperando permiso");
    botonMicrofono.attribute("disabled", "");
    botonMicrofono.style("opacity", "0.72");
    botonMicrofono.style("cursor", "default");
  } else {
    estadoMicrofonoTexto.html("Microfono: apagado");
    botonMicrofono.html("Activar microfono");
    botonMicrofono.elt.removeAttribute("disabled");
    botonMicrofono.style("opacity", "1");
    botonMicrofono.style("cursor", "pointer");
  }

  estadoModeloTexto.html("Aplauso: " + estadoModeloAplausos);
  estadoRecargaTexto.html("Pop/Pup: " + estadoModeloRecarga);
  confianzaAplausoTexto.html("Aplauso ML: " + round(confianzaAplauso * 100) + "% " + etiquetaActualModeloAplausos);
  confianzaRecargaTexto.html("Pop/Pup ML: " + round(confianzaRecargaObra * 100) + "% " + etiquetaActualModeloRecarga);
  actualizarTextosUmbrales();
  actualizarMedidoresPanel();
  actualizarInteraccionesPanel();
}

// Mantiene visibles los valores actuales de los umbrales.
function actualizarTextosUmbrales() {
  if (!umbralGraveTexto || !umbralAgudoTexto) {
    return;
  }

  umbralGraveTexto.html("Grave hasta: " + umbralGraveHz + " Hz");
  umbralAgudoTexto.html("Agudo desde: " + umbralAgudoHz + " Hz");
}

// Actualiza las barras de frecuencia y amplitud en tiempo real.
function actualizarMedidoresPanel() {
  let colorSonido = obtenerColorTipoSonido(tipoSonidoActual);
  let porcentajeFrecuencia = calcularPorcentajeFrecuencia(frecuenciaDominanteHz);
  let porcentajeAmplitud = constrain(amplitudMicrofono * 100, 0, 100);
  let frecuenciaVisible = frecuenciaDominanteHz > 0 ? round(frecuenciaDominanteHz) : 0;

  frecuenciaTexto.html("Frecuencia: " + frecuenciaVisible + " Hz");
  tipoSonidoTexto.html("Sonido: " + obtenerTextoTipoSonido(tipoSonidoActual));
  tipoSonidoTexto.style("color", colorSonido);

  barraFrecuenciaRelleno.style("width", porcentajeFrecuencia + "%");
  barraFrecuenciaRelleno.style("background", colorSonido);
  barraFrecuenciaIndicador.style("left", porcentajeFrecuencia + "%");

  marcaUmbralGrave.style("left", calcularPorcentajeFrecuencia(umbralGraveHz) + "%");
  marcaUmbralAgudo.style("left", calcularPorcentajeFrecuencia(umbralAgudoHz) + "%");

  amplitudTexto.html("Amplitud: " + round(porcentajeAmplitud) + "%");
  barraAmplitudRelleno.style("width", porcentajeAmplitud + "%");
  barraAmplitudRelleno.style("background", porcentajeAmplitud > 65 ? "#f25f5c" : "#62b6ff");
}

// Actualiza la descripcion de la interaccion sonora activa.
function actualizarInteraccionesPanel() {
  let texto = obtenerTextoInteraccionActual();
  let color = obtenerColorTipoSonido(tipoSonidoActual);

  interaccionActualTexto.html("Actual: " + texto);
  interaccionActualTexto.style("color", color);
  aplausosTexto.html("Aplausos detectados: " + contadorAplausos);
  recargasTexto.html("Recargas detectadas: " + contadorRecargas);
}

// Convierte una frecuencia en posicion porcentual para la barra.
function calcularPorcentajeFrecuencia(frecuenciaHz) {
  if (frecuenciaHz <= 0) {
    return 0;
  }

  let minimo = Math.log(frecuenciaMinimaPanelHz);
  let maximo = Math.log(frecuenciaMaximaPanelHz);
  let actual = Math.log(constrain(frecuenciaHz, frecuenciaMinimaPanelHz, frecuenciaMaximaPanelHz));

  return constrain(map(actual, minimo, maximo, 0, 100), 0, 100);
}

// Devuelve el color asociado a cada tipo de sonido.
function obtenerColorTipoSonido(tipo) {
  if (tipo === "grave") {
    return "#62b6ff";
  }

  if (tipo === "agudo") {
    return "#f2c94c";
  }

  if (tipo === "aplauso") {
    return "#f25f5c";
  }

  if (tipo === "recarga") {
    return "#9fe870";
  }

  if (tipo === "medio") {
    return "#d7d7de";
  }

  return "#777984";
}

// Devuelve el texto que se muestra para la clasificacion tonal.
function obtenerTextoTipoSonido(tipo) {
  if (tipo === "grave") {
    return "grave";
  }

  if (tipo === "agudo") {
    return "agudo";
  }

  if (tipo === "aplauso") {
    return "aplauso";
  }

  if (tipo === "recarga") {
    return "pop/pup";
  }

  if (tipo === "medio") {
    return "medio";
  }

  return "silencio";
}

// Describe la accion visual que se esta disparando con el audio.
function obtenerTextoInteraccionActual() {
  if (microfonoSolicitado && !microfonoListo) {
    return "esperando permiso";
  }

  if (!microfonoListo) {
    return "microfono apagado";
  }

  if (recargaObraDetectada || tipoSonidoActual === "recarga") {
    return "pop/pup, obra recargada";
  }

  if (aplausoDetectado || tipoSonidoActual === "aplauso") {
    return "aplauso, colores invertidos";
  }

  if (amplitudMicrofono < 0.04) {
    return "silencio";
  }

  if (tipoSonidoActual === "agudo") {
    return "agudo, vibracion de lineas";
  }

  if (tipoSonidoActual === "grave") {
    return "grave, movimiento de ondas";
  }

  return "voz, movimiento de ondas";
}

// Dispara la reaccion visual cuando el modelo ML reconoce un aplauso.
function reaccionarAplauso() {
  contadorAplausos++;
  invertirColoresObra();
  impactoAplauso = 1;
}

// Regenera la composicion cuando el modelo pup/pop llega al 100%.
function reaccionarRecargaObra() {
  contadorRecargas++;
  impactoAplauso = 0;
  crearObra();
}

// Intercambia los colores del fondo y las lineas.
function invertirColoresObra() {
  for (let pieza of obra) {
    pieza.paleta.invertir();

    pieza.fondo.colores = pieza.paleta.coloresFondo;
    pieza.lineas.colores = pieza.paleta.coloresLineas;
  }
}

// Activa el microfono con un clic del mouse.
function mousePressed() {
  iniciarMicrofono();
}

// Activa el microfono con un toque en pantallas tactiles.
function touchStarted() {
  iniciarMicrofono();
  return false;
}
