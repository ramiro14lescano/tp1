let microfono;
let analizadorTono;

let microfonoListo = false;
let microfonoSolicitado = false;

let nivelVoz = 0;
let nivelGraves = 0;
let nivelAgudos = 0;
let vibracionAgudos = 0;
let frecuenciaDominanteHz = 0;
let amplitudMicrofono = 0;
let tipoSonidoActual = "silencio";

let aplausoDetectado = false;
let recargaObraDetectada = false;
let confianzaAplauso = 0;
let confianzaAplausoSuavizada = 0;
let confianzaRecargaObra = 0;

let modeloAplausosML;
let espectroAnteriorAplauso = [];
let nivelAnteriorAplauso = 0;
let ultimoAplauso = -1000;
let ultimaRecargaObra = -1000;
let bloquearVozHasta = 0;

let umbralAplauso = 0.30;
let esperaAplauso = 720;
let sensibilidadMicrofono = 0.60;
// CAMBIAR ACA: porcentaje minimo para que el modelo tome un sonido como aplauso.
let porcentajeMinimoAplauso = 70;
// CAMBIAR ACA: porcentaje minimo para que el modelo pup/pop recargue la obra.
let porcentajeMinimoRecargaObra = 97;
let esperaRecargaObra = 1200;
let umbralGraveHz = 280;
let umbralAgudoHz = 1200;
let frecuenciaMinimaPanelHz = 60;
let frecuenciaMaximaPanelHz = 5000;

let clasificadorAplausosTM;
let modeloAplausosTMCargando = false;
let modeloAplausosTMListo = false;
let clasificacionAplausosTMActiva = false;
let estadoModeloAplausos = "modelo manual";
let etiquetaActualModeloAplausos = "";
let etiquetasModeloAplausos = [];
let confianzaModeloAplausosTM = 0;
let rutaModeloAplausosTM = "tm-my-audio-model/";

let clasificadorRecargaTM;
let modeloRecargaTMCargando = false;
let modeloRecargaTMListo = false;
let clasificacionRecargaTMActiva = false;
let estadoModeloRecarga = "modelo pop/pup pendiente";
let etiquetaActualModeloRecarga = "";
let etiquetasModeloRecarga = [];
let confianzaModeloRecargaTM = 0;
let rutaModeloRecargaTM = "pup/";

// Activa el microfono despues de una interaccion del usuario.
function iniciarMicrofono() {
  if (microfonoListo || microfonoSolicitado) {
    return;
  }

  userStartAudio();
  prepararModeloAplausosML();
  prepararClasificadorRecargaTM();

  if (!microfono) {
    microfono = new p5.AudioIn();
  }

  microfonoSolicitado = true;
  activarClasificadorAplausosTM();
  activarClasificadorRecargaTM();

  microfono.start(
    function () {
    microfonoSolicitado = false;
    microfonoListo = true;
    prepararAnalizadorTono();
    activarClasificadorAplausosTM();
    activarClasificadorRecargaTM();
  }
  ,
    function () {
    microfonoSolicitado = false;
    microfonoListo = false;
  }
  );
}

// Prepara el analizador de frecuencias para separar graves, medios y agudos.
function prepararAnalizadorTono() {
  if (!analizadorTono) {
    analizadorTono = new p5.FFT(0.65, 512);
  }

  analizadorTono.setInput(microfono);
}

// Cambia la sensibilidad del detector segun un valor entre 0 y 100.
function configurarSensibilidadMicrofono(valor) {
  sensibilidadMicrofono = constrain(valor / 100, 0, 1);
  umbralAplauso = map(sensibilidadMicrofono, 0, 1, 0.82, 0.42);
}

// Cambia los cortes que separan sonidos graves, medios y agudos.
function configurarUmbralesFrecuencia(graveHz, agudoHz) {
  let graveSeguro = constrain(graveHz, 80, 900);
  let agudoSeguro = constrain(agudoHz, 500, 5000);

  if (graveSeguro > agudoSeguro - 100) {
    if (graveHz !== umbralGraveHz) {
      graveSeguro = agudoSeguro - 100;
    } else {
      agudoSeguro = graveSeguro + 100;
    }
  }

  umbralGraveHz = floor(constrain(graveSeguro, 80, 900));
  umbralAgudoHz = floor(constrain(agudoSeguro, umbralGraveHz + 100, 5000));
}

// Carga el modelo de Teachable Machine entrenado con el sonido de aplauso.
function prepararClasificadorAplausosTM() {
  if (modeloAplausosTMListo || modeloAplausosTMCargando) {
    return;
  }

  if (typeof speechCommands === "undefined") {
    estadoModeloAplausos = "libreria de audio no cargada, usando respaldo";
    return;
  }

  let rutaModelo = obtenerRutaBaseModeloAplausosTM();

  if (!rutaModelo) {
    estadoModeloAplausos = "abrir con localhost para usar el modelo";
    return;
  }

  modeloAplausosTMCargando = true;
  estadoModeloAplausos = "cargando modelo de aplausos";

  try {
    clasificadorAplausosTM = speechCommands.create(
      "BROWSER_FFT",
      undefined,
      new URL("model.json", rutaModelo).href,
      new URL("metadata.json", rutaModelo).href
      );

    clasificadorAplausosTM.ensureModelLoaded()
      .then(modeloAplausosTMPreparado)
      .catch(function () {
      modeloAplausosTMCargando = false;
      estadoModeloAplausos = "modelo local no disponible";
    }
    );
  }
  catch (error) {
    modeloAplausosTMCargando = false;
    estadoModeloAplausos = "modelo local no disponible";
  }
}

// Convierte la ruta local del modelo en una URL valida para Teachable Machine.
function obtenerRutaBaseModeloAplausosTM() {
  if (typeof window === "undefined" || !window.location) {
    return rutaModeloAplausosTM;
  }

  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
    return "";
  }

  return new URL(rutaModeloAplausosTM, window.location.href).href;
}

// Inicia la escucha continua del clasificador de Teachable Machine.
function modeloAplausosTMPreparado() {
  modeloAplausosTMCargando = false;
  modeloAplausosTMListo = true;
  etiquetasModeloAplausos = clasificadorAplausosTM.wordLabels();
  estadoModeloAplausos = "modelo de aplausos listo";

  activarClasificadorAplausosTM();
}

// Carga el modelo de Teachable Machine que reconoce el sonido de recarga.
function prepararClasificadorRecargaTM() {
  if (modeloRecargaTMListo || modeloRecargaTMCargando) {
    return;
  }

  if (typeof speechCommands === "undefined") {
    estadoModeloRecarga = "libreria de audio no cargada";
    return;
  }

  let rutaModelo = obtenerRutaBaseModeloRecargaTM();

  if (!rutaModelo) {
    estadoModeloRecarga = "abrir con localhost para usar el modelo";
    return;
  }

  modeloRecargaTMCargando = true;
  estadoModeloRecarga = "cargando modelo pop/pup";

  try {
    clasificadorRecargaTM = speechCommands.create(
      "BROWSER_FFT",
      undefined,
      new URL("model.json", rutaModelo).href,
      new URL("metadata.json", rutaModelo).href
      );

    clasificadorRecargaTM.ensureModelLoaded()
      .then(modeloRecargaTMPreparado)
      .catch(function () {
      modeloRecargaTMCargando = false;
      estadoModeloRecarga = "modelo pop/pup no disponible";
    }
    );
  }
  catch (error) {
    modeloRecargaTMCargando = false;
    estadoModeloRecarga = "modelo pop/pup no disponible";
  }
}

// Convierte la ruta local del modelo pup en una URL valida.
function obtenerRutaBaseModeloRecargaTM() {
  if (typeof window === "undefined" || !window.location) {
    return rutaModeloRecargaTM;
  }

  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
    return "";
  }

  return new URL(rutaModeloRecargaTM, window.location.href).href;
}

// Inicia la escucha continua del modelo pup despues de cargarlo.
function modeloRecargaTMPreparado() {
  modeloRecargaTMCargando = false;
  modeloRecargaTMListo = true;
  etiquetasModeloRecarga = clasificadorRecargaTM.wordLabels();
  estadoModeloRecarga = "modelo pop/pup listo";

  activarClasificadorRecargaTM();
}

// Activa la clasificacion de audio solo despues de que el usuario pidio microfono.
function activarClasificadorAplausosTM() {
  if (
    !modeloAplausosTMListo ||
    clasificacionAplausosTMActiva ||
    (!microfonoSolicitado && !microfonoListo)
    ) {
    return;
  }

  if (clasificadorAplausosTM && clasificadorAplausosTM.listen) {
    try {
      clasificacionAplausosTMActiva = true;
      clasificadorAplausosTM.listen(recibirResultadoAplausosTM, {
      includeSpectrogram:
        false,
        invokeCallbackOnNoiseAndUnknown:
        true,
        overlapFactor:
        0.50,
        probabilityThreshold:
        0
      }
      );
    }
    catch (error) {
      clasificacionAplausosTMActiva = false;
      estadoModeloAplausos = "no se pudo activar el modelo";
    }
  }
}

// Activa la clasificacion del modelo pup solo cuando el microfono esta pedido o activo.
function activarClasificadorRecargaTM() {
  if (
    !modeloRecargaTMListo ||
    clasificacionRecargaTMActiva ||
    (!microfonoSolicitado && !microfonoListo)
    ) {
    return;
  }

  if (clasificadorRecargaTM && clasificadorRecargaTM.listen) {
    try {
      clasificacionRecargaTMActiva = true;
      clasificadorRecargaTM.listen(recibirResultadoRecargaTM, {
      includeSpectrogram:
        false,
        invokeCallbackOnNoiseAndUnknown:
        true,
        overlapFactor:
        0.50,
        probabilityThreshold:
        0
      }
      );
    }
    catch (error) {
      clasificacionRecargaTMActiva = false;
      estadoModeloRecarga = "no se pudo activar modelo pop/pup";
    }
  }
}

// Recibe las predicciones del modelo y guarda la confianza del aplauso.
function recibirResultadoAplausosTM(resultado) {
  if (!resultado || !resultado.scores) {
    estadoModeloAplausos = "modelo sin lectura";
    return;
  }

  let indiceAplauso = buscarIndiceAplauso(resultado.scores);

  etiquetaActualModeloAplausos = etiquetasModeloAplausos[indiceAplauso] || "";
  confianzaModeloAplausosTM = resultado.scores[indiceAplauso] || 0;
  estadoModeloAplausos = "escuchando modelo de aplausos";
}

// Recibe las predicciones del modelo pup y guarda la confianza de recarga.
function recibirResultadoRecargaTM(resultado) {
  if (!resultado || !resultado.scores) {
    estadoModeloRecarga = "modelo pop/pup sin lectura";
    return;
  }

  let indiceRecarga = buscarIndiceRecarga(resultado.scores);

  etiquetaActualModeloRecarga = etiquetasModeloRecarga[indiceRecarga] || "";
  confianzaModeloRecargaTM = resultado.scores[indiceRecarga] || 0;
  estadoModeloRecarga = "escuchando modelo pop/pup";
}

// Busca la clase entrenada como aplauso y evita la clase de ruido de fondo.
function buscarIndiceAplauso(puntajes) {
  let mejorIndice = 0;
  let mejorPuntaje = -1;

  for (let i = 0; i < puntajes.length; i++) {
    let etiqueta = etiquetasModeloAplausos[i] || "";

    if (esEtiquetaAplauso(etiqueta) && puntajes[i] > mejorPuntaje) {
      mejorPuntaje = puntajes[i];
      mejorIndice = i;
    }
  }

  return mejorIndice;
}

// Decide si una etiqueta del modelo corresponde al aplauso.
function esEtiquetaAplauso(etiqueta) {
  let nombre = etiqueta.toLowerCase();

  return (
    nombre.length > 0 &&
    nombre.indexOf("ruido") === -1 &&
    nombre.indexOf("fondo") === -1 &&
    nombre.indexOf("background") === -1 &&
    nombre.indexOf("noise") === -1
    );
}

// Busca la clase pup/pop y evita la clase de ruido de fondo.
function buscarIndiceRecarga(puntajes) {
  let indicePorNombre = -1;
  let mejorIndice = 0;
  let mejorPuntaje = -1;

  for (let i = 0; i < puntajes.length; i++) {
    let etiqueta = etiquetasModeloRecarga[i] || "";
    let nombre = etiqueta.toLowerCase();

    if (nombre.indexOf("pup") !== -1 || nombre.indexOf("pop") !== -1) {
      indicePorNombre = i;
    }

    if (esEtiquetaRecarga(etiqueta) && puntajes[i] > mejorPuntaje) {
      mejorPuntaje = puntajes[i];
      mejorIndice = i;
    }
  }

  return indicePorNombre >= 0 ? indicePorNombre : mejorIndice;
}

// Decide si una etiqueta del modelo corresponde al sonido de recarga.
function esEtiquetaRecarga(etiqueta) {
  let nombre = etiqueta.toLowerCase();

  return (
    nombre.length > 0 &&
    nombre.indexOf("ruido") === -1 &&
    nombre.indexOf("fondo") === -1 &&
    nombre.indexOf("background") === -1 &&
    nombre.indexOf("noise") === -1
    );
}

// Compara la confianza del modelo usando el mismo redondeo que se ve en el panel.
function confianzaLlegaAPorcentaje(confianza, porcentaje) {
  return Math.round(constrain(confianza, 0, 1) * 100) >= porcentaje;
}

// Usa el mismo criterio que el panel: si se ve como 100%, cuenta como 100%.
function confianzaLlegaA100(confianza) {
  return confianzaLlegaAPorcentaje(confianza, 100);
}

// Entrena una regresion logistica pequena con ejemplos tipicos de aplauso y ambiente.
function prepararModeloAplausosML() {
  prepararClasificadorAplausosTM();

  if (modeloAplausosML) {
    return;
  }

  let datos = [
  {
  x:
  [0.03, 0.02, 0.05, 0.04, 0.20, 0.03, 0.06], y:
    0
  }
  ,
  {
  x:
  [0.06, 0.04, 0.08, 0.06, 0.28, 0.05, 0.10], y:
    0
  }
  ,
  {
  x:
  [0.10, 0.05, 0.12, 0.08, 0.34, 0.08, 0.12], y:
    0
  }
  ,
  {
  x:
  [0.16, 0.06, 0.16, 0.10, 0.32, 0.10, 0.16], y:
    0
  }
  ,
  {
  x:
  [0.18, 0.10, 0.22, 0.14, 0.40, 0.12, 0.20], y:
    0
  }
  ,
  {
  x:
  [0.22, 0.12, 0.18, 0.12, 0.30, 0.11, 0.18], y:
    0
  }
  ,
  {
  x:
  [0.35, 0.35, 0.40, 0.35, 0.72, 0.40, 0.55], y:
    1
  }
  ,
  {
  x:
  [0.48, 0.45, 0.50, 0.48, 0.86, 0.52, 0.72], y:
    1
  }
  ,
  {
  x:
  [0.62, 0.58, 0.60, 0.55, 0.95, 0.68, 0.82], y:
    1
  }
  ,
  {
  x:
  [0.75, 0.70, 0.68, 0.64, 0.98, 0.78, 0.92], y:
    1
  }
  ,
  {
  x:
  [0.52, 0.62, 0.58, 0.52, 0.88, 0.70, 0.86], y:
    1
  }
  ,
  {
  x:
  [0.40, 0.52, 0.46, 0.44, 0.82, 0.60, 0.78], y:
    1
  }
  ];

  modeloAplausosML = entrenarRegresionLogistica(datos, 7);
}

// Ajusta los pesos del modelo con descenso de gradiente.
function entrenarRegresionLogistica(datos, cantidadRasgos) {
  let pesos = [];

  for (let i = 0; i <= cantidadRasgos; i++) {
    pesos.push(0);
  }

  let tasaAprendizaje = 0.42;

  for (let epoca = 0; epoca < 420; epoca++) {
    for (let dato of datos) {
      let entrada = [1].concat(dato.x);
      let prediccion = activarSigmoide(productoPunto(pesos, entrada));
      let error = dato.y - prediccion;

      for (let i = 0; i < pesos.length; i++) {
        pesos[i] += tasaAprendizaje * error * entrada[i];
      }
    }
  }

  return {
  pesos:
    pesos
  };
}

// Calcula el producto entre dos vectores numericos.
function productoPunto(a, b) {
  let total = 0;

  for (let i = 0; i < a.length; i++) {
    total += a[i] * b[i];
  }

  return total;
}

// Convierte un puntaje del modelo en una probabilidad entre 0 y 1.
function activarSigmoide(valor) {
  return 1 / (1 + exp(-constrain(valor, -40, 40)));
}

// Actualiza el audio de entrada y devuelve el nivel crudo del microfono.
function actualizarVoz() {
  aplausoDetectado = false;
  recargaObraDetectada = false;

  let nivelCrudo = 0;
  let nivelObjetivo = 0;
  let rasgos = crearRasgosVacios();

  if (microfonoListo && microfono) {
    nivelCrudo = microfono.getLevel();
    rasgos = calcularRasgosAudio(nivelCrudo);
    amplitudMicrofono = constrain(map(nivelCrudo, 0.005, 0.30, 0, 1), 0, 1);
    actualizarLecturaFrecuencia(rasgos);

    if (detectarAplausoML(rasgos)) {
      aplausoDetectado = true;
      bloquearVozHasta = millis() + 350;

      nivelVoz = 0;
      vibracionAgudos = 1;
      tipoSonidoActual = "aplauso";

      return nivelCrudo;
    }

    if (detectarRecargaObraTM()) {
      recargaObraDetectada = true;
      bloquearVozHasta = millis() + 350;

      nivelVoz = 0;
      vibracionAgudos = 0;
      tipoSonidoActual = "recarga";

      return nivelCrudo;
    }

    if (millis() < bloquearVozHasta) {
      nivelVoz = lerp(nivelVoz, 0, 0.4);
      vibracionAgudos = lerp(vibracionAgudos, 0, 0.12);
      actualizarTonos(rasgos);
      return nivelCrudo;
    }

    nivelObjetivo = constrain(map(nivelCrudo, 0.01, 0.30, 0, 1), 0, 1);
  } else {
    amplitudMicrofono = lerp(amplitudMicrofono, 0, 0.18);
    actualizarLecturaFrecuencia(rasgos);
  }

  nivelVoz = lerp(nivelVoz, nivelObjetivo, 0.22);

  actualizarTonos(rasgos);

  return nivelCrudo;
}

// Crea un paquete de rasgos neutros para cuando el microfono todavia no esta listo.
function crearRasgosVacios() {
  return {
  nivelCrudo:
    0,
    subidaRapida:
    0,
    gravesCrudos:
    0,
    mediosCrudos:
    0,
    agudosCrudos:
    0,
    energiaAlta:
    0,
    relacionAguda:
    0,
    flujoEspectral:
    0,
    frecuenciaDominante:
    0
  };
}

// Extrae rasgos de volumen y frecuencia que sirven para reconocer aplausos.
function calcularRasgosAudio(nivelCrudo) {
  if (!analizadorTono) {
    return crearRasgosVacios();
  }

  let espectro = analizadorTono.analyze();
  let limiteGraves = max(umbralGraveHz, 90);
  let inicioAgudos = max(umbralAgudoHz, limiteGraves + 100);
  let gravesCrudos = analizadorTono.getEnergy(70, limiteGraves) / 255;
  let mediosCrudos = analizadorTono.getEnergy(limiteGraves, inicioAgudos) / 255;
  let agudosCrudos = analizadorTono.getEnergy(inicioAgudos, 8000) / 255;
  let energiaAlta = analizadorTono.getEnergy(max(inicioAgudos, 2500), 8000) / 255;
  let relacionAguda = agudosCrudos / (gravesCrudos + mediosCrudos + 0.001);
  let subidaRapida = max(0, nivelCrudo - nivelAnteriorAplauso);
  let flujoEspectral = calcularFlujoEspectral(espectro);
  let frecuenciaDominante = calcularFrecuenciaDominante(espectro);

  nivelAnteriorAplauso = max(nivelCrudo, nivelAnteriorAplauso * 0.72);

  return {
  nivelCrudo:
    nivelCrudo,
    subidaRapida:
    subidaRapida,
    gravesCrudos:
    gravesCrudos,
    mediosCrudos:
    mediosCrudos,
    agudosCrudos:
    agudosCrudos,
    energiaAlta:
    energiaAlta,
    relacionAguda:
    relacionAguda,
    flujoEspectral:
    flujoEspectral,
    frecuenciaDominante:
    frecuenciaDominante
  };
}

// Busca la frecuencia mas fuerte del espectro para mostrarla en el panel.
function calcularFrecuenciaDominante(espectro) {
  if (!espectro || espectro.length === 0) {
    return 0;
  }

  let frecuenciaMaxima = sampleRate() / 2;
  let indiceMinimo = floor((frecuenciaMinimaPanelHz / frecuenciaMaxima) * espectro.length);
  let indiceMaximo = floor((frecuenciaMaximaPanelHz / frecuenciaMaxima) * espectro.length);
  let mejorIndice = indiceMinimo;
  let mejorEnergia = 0;

  indiceMinimo = constrain(indiceMinimo, 0, espectro.length - 1);
  indiceMaximo = constrain(indiceMaximo, indiceMinimo + 1, espectro.length - 1);

  for (let i = indiceMinimo; i <= indiceMaximo; i++) {
    if (espectro[i] > mejorEnergia) {
      mejorEnergia = espectro[i];
      mejorIndice = i;
    }
  }

  if (mejorEnergia < 8) {
    return 0;
  }

  return map(mejorIndice, 0, espectro.length - 1, 0, frecuenciaMaxima);
}

// Suaviza la lectura de frecuencia y decide si el sonido es grave, medio o agudo.
function actualizarLecturaFrecuencia(rasgos) {
  let hayLectura = microfonoListo && rasgos.nivelCrudo > 0.006 && rasgos.frecuenciaDominante > 0;
  let frecuenciaObjetivo = hayLectura ? rasgos.frecuenciaDominante : 0;

  frecuenciaDominanteHz = lerp(
    frecuenciaDominanteHz,
    frecuenciaObjetivo,
    hayLectura ? 0.35 : 0.18
    );

  if (!hayLectura && frecuenciaDominanteHz < 5) {
    frecuenciaDominanteHz = 0;
  }

  tipoSonidoActual = clasificarTipoSonido(frecuenciaDominanteHz, rasgos.nivelCrudo);
}

// Clasifica la frecuencia actual usando los umbrales elegidos desde el panel.
function clasificarTipoSonido(frecuenciaHz, nivelCrudo) {
  if (!microfonoListo || nivelCrudo < 0.006 || frecuenciaHz <= 0) {
    return "silencio";
  }

  if (frecuenciaHz <= umbralGraveHz) {
    return "grave";
  }

  if (frecuenciaHz >= umbralAgudoHz) {
    return "agudo";
  }

  return "medio";
}

// Mide cambios bruscos entre el espectro actual y el anterior.
function calcularFlujoEspectral(espectro) {
  if (espectroAnteriorAplauso.length !== espectro.length) {
    espectroAnteriorAplauso = espectro.slice();
    return 0;
  }

  let flujo = 0;

  for (let i = 0; i < espectro.length; i++) {
    let diferencia = espectro[i] - espectroAnteriorAplauso[i];

    if (diferencia > 0) {
      flujo += diferencia;
    }
  }

  espectroAnteriorAplauso = espectro.slice();

  return constrain(flujo / (espectro.length * 42), 0, 1);
}

// Convierte los rasgos de audio en valores normalizados para el modelo ML.
function normalizarRasgosAplauso(rasgos) {
  return [
    constrain(map(rasgos.nivelCrudo, 0.01, 0.26, 0, 1), 0, 1),
    constrain(map(rasgos.subidaRapida, 0.006, 0.14, 0, 1), 0, 1),
    constrain(map(rasgos.agudosCrudos, 0.02, 0.58, 0, 1), 0, 1),
    constrain(map(rasgos.energiaAlta, 0.01, 0.52, 0, 1), 0, 1),
    constrain(map(rasgos.relacionAguda, 0.35, 2.2, 0, 1), 0, 1),
    constrain(rasgos.flujoEspectral, 0, 1),
    constrain(map(rasgos.subidaRapida + rasgos.flujoEspectral, 0.03, 0.85, 0, 1), 0, 1)
  ];
}

// Usa el modelo entrenado para detectar si el sonido actual parece un aplauso.
function detectarAplausoML(rasgos) {
  prepararModeloAplausosML();

  let ahora = millis();
  let pasoEspera = ahora - ultimoAplauso > esperaAplauso;

  if (modeloAplausosTMListo) {
    confianzaAplauso = confianzaModeloAplausosTM;
    confianzaAplausoSuavizada = lerp(confianzaAplausoSuavizada, confianzaAplauso, 0.35);

    let hayAplausoModelo =
      confianzaLlegaAPorcentaje(confianzaAplauso, porcentajeMinimoAplauso) &&
      pasoEspera;

    if (hayAplausoModelo) {
      ultimoAplauso = ahora;
      return true;
    }

    return false;
  }

  let vector = normalizarRasgosAplauso(rasgos);
  let entrada = [1].concat(vector);
  let prediccion = activarSigmoide(productoPunto(modeloAplausosML.pesos, entrada));

  confianzaAplauso = prediccion;
  confianzaAplausoSuavizada = lerp(confianzaAplausoSuavizada, prediccion, 0.35);

  let energiaMinima = map(sensibilidadMicrofono, 0, 1, 0.055, 0.022);
  let subidaMinima = map(sensibilidadMicrofono, 0, 1, 0.040, 0.014);
  let agudosMinimos = map(sensibilidadMicrofono, 0, 1, 0.050, 0.020);
  let energiaSuficiente = rasgos.nivelCrudo > energiaMinima || rasgos.subidaRapida > subidaMinima;
  let golpeAgudo = rasgos.agudosCrudos > agudosMinimos || rasgos.energiaAlta > agudosMinimos;
  let hayAplauso =
    confianzaLlegaAPorcentaje(confianzaAplauso, porcentajeMinimoAplauso) &&
    energiaSuficiente &&
    golpeAgudo &&
    pasoEspera;

  if (hayAplauso) {
    ultimoAplauso = ahora;
    return true;
  }

  return false;
}

// Detecta el sonido pup/pop al porcentaje elegido y prepara la recarga de la obra.
function detectarRecargaObraTM() {
  prepararClasificadorRecargaTM();

  if (!modeloRecargaTMListo) {
    return false;
  }

  let ahora = millis();
  let pasoEspera = ahora - ultimaRecargaObra > esperaRecargaObra;

  confianzaRecargaObra = confianzaModeloRecargaTM;

  if (confianzaLlegaAPorcentaje(confianzaRecargaObra, porcentajeMinimoRecargaObra) && pasoEspera) {
    ultimaRecargaObra = ahora;
    return true;
  }

  return false;
}

// Actualiza los valores que mueven la obra con voz y sonidos agudos.
function actualizarTonos(rasgos) {
  if (!microfonoListo || !analizadorTono) {
    nivelGraves = lerp(nivelGraves, 0, 0.18);
    nivelAgudos = lerp(nivelAgudos, 0, 0.18);
    vibracionAgudos = lerp(vibracionAgudos, 0, 0.18);
    return;
  }

  let objetivoVibracion = 0;
  let hayFrecuenciaAguda = rasgos.frecuenciaDominante >= umbralAgudoHz;
  let hayEnergiaAguda = rasgos.nivelCrudo > 0.008 && rasgos.agudosCrudos > 0.018;

  if (hayFrecuenciaAguda && hayEnergiaAguda) {
    let limiteSuperior = max(umbralAgudoHz + 1, frecuenciaMaximaPanelHz);
    let fuerzaPorFrecuencia = constrain(
      map(rasgos.frecuenciaDominante, umbralAgudoHz, limiteSuperior, 0.25, 1),
      0.25,
      1
      );
    let fuerzaPorEnergia = constrain(map(rasgos.agudosCrudos, 0.018, 0.20, 0.2, 1), 0.2, 1);
    let fuerzaPorRelacion = constrain(map(rasgos.relacionAguda, 0.35, 1.4, 0.2, 1), 0.2, 1);

    objetivoVibracion = constrain(
      (fuerzaPorFrecuencia + fuerzaPorEnergia + fuerzaPorRelacion) / 3,
      0,
      1
      );
  }

  nivelGraves = lerp(nivelGraves, rasgos.gravesCrudos, 0.22);
  nivelAgudos = lerp(nivelAgudos, rasgos.agudosCrudos, 0.22);

  vibracionAgudos = lerp(
    vibracionAgudos,
    objetivoVibracion,
    objetivoVibracion > vibracionAgudos ? 0.28 : 0.12
    );
}
