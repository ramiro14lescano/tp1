PImage referencia;

// No usa arreglos ni clases propias. PImage solo carga la referencia.
int niveles;
int sentido;
int semilla;
float angulo;
float velocidad;
float desorden;
boolean animar;
boolean invertir;

void setup() {
  size(800, 400);
  smooth(8);
  referencia = loadImage("tp3.jpeg.jpeg");
  reiniciar();
}

void draw() {
  background(0);

  dibujarReferencia();
  dibujarRecreacion();

  if (animar) {
    angulo += velocidad * sentido;
  } else {
    angulo += 0;
  }
}

void dibujarReferencia() {
  noStroke();
  fill(0);
  rect(0, 0, 400, 400);

  if (referencia != null) {
    imageMode(CORNER);
    image(referencia, 0, 0, 400, 400);
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    text("Falta la imagen en data/tp3.jpeg.jpeg", 200, 200);
  }

  stroke(255);
  line(400, 0, 400, height);
}

void dibujarRecreacion() {
  noStroke();
  fill(0);
  rect(400, 0, 400, 400);

  float centroX = 600;
  float centroY = 200;
  float distanciaMouse = dist(mouseX, mouseY, centroX, centroY);
  float respiracion = map(constrain(distanciaMouse, 0, 280), 0, 280, 1.08, 0.94);

  randomSeed(semilla);

  pushMatrix();
  translate(centroX, centroY);
  rotate(angulo * 0.15);

  for (int i = 0; i < niveles; i++) {
    float tam = calcularTamano(i, 384) * respiracion;
    float vibracion = random(-desorden, desorden) * tam;
    dibujarCapa(i, tam + vibracion, distanciaMouse);
  }

  dibujarCentro();
  popMatrix();
}

// Funcion propia con parametros que no retorna valor.
void dibujarCapa(int nivel, float tam, float distanciaMouse) {
  pushMatrix();

  if (nivel % 2 == 0) {
    rotate(angulo * (nivel + 1) * 0.08);
  } else {
    rotate(-angulo * (nivel + 1) * 0.08);
  }

  float grisCirculo = calcularGrisCirculo(nivel, distanciaMouse);
  float grisCuadrado;

  if (invertir) {
    grisCuadrado = map(nivel, 0, niveles - 1, 255, 35);
  } else {
    grisCuadrado = map(nivel, 0, niveles - 1, 0, 230);
  }

  noStroke();
  fill(grisCirculo);
  ellipse(0, 0, tam, tam);

  rectMode(CENTER);
  fill(grisCuadrado);
  rect(0, 0, tam * 0.72, tam * 0.72);

  popMatrix();
}

// Ciclos FOR anidados para construir el centro de la obra.
void dibujarCentro() {
  rectMode(CENTER);

  for (int fila = -1; fila <= 1; fila++) {
    for (int columna = -1; columna <= 1; columna++) {
      float distancia = dist(0, 0, columna, fila);

      if (distancia < 1.1) {
        fill(230);
      } else {
        fill(25);
      }

      pushMatrix();
      translate(columna * 9, fila * 9);
      rotate(angulo * (fila + columna + 1) * 0.5);
      rect(0, 0, 20, 20);
      popMatrix();
    }
  }
}

// Funcion propia con parametros que retorna un valor.
float calcularTamano(int nivel, float tamMaximo) {
  return tamMaximo * pow(0.72, nivel);
}

float calcularGrisCirculo(int nivel, float distanciaMouse) {
  float brilloMouse = map(constrain(distanciaMouse, 0, 300), 0, 300, 26, -12);
  float gris = map(nivel, 0, niveles - 1, 255, 78) + brilloMouse;

  if (invertir) {
    gris = 255 - gris;
  } else {
    gris = gris;
  }

  return constrain(gris, 0, 255);
}

// Evento de mouse: cambia variables con random().
void mousePressed() {
  semilla = int(random(10000));
  desorden = random(0.00, 0.045);
  sentido = sentido * -1;
}

// Evento de mouse: modifica la velocidad usando map().
void mouseDragged() {
  velocidad = map(constrain(mouseX, 400, 800), 400, 800, 0.002, 0.045);
}

// Evento de teclado: cambia variables y permite reiniciar.
void keyPressed() {
  if (key == 'r' || key == 'R') {
    reiniciar();
  } else if (key == '+') {
    niveles = min(niveles + 1, 12);
  } else if (key == '-') {
    niveles = max(niveles - 1, 4);
  } else if (key == ' ') {
    animar = !animar;
  } else if (key == 'c' || key == 'C') {
    invertir = !invertir;
  }
}

// Reinicia el programa al estado original.
void reiniciar() {
  niveles = 9;
  sentido = 1;
  semilla = 1234;
  angulo = 0;
  velocidad = 0.012;
  desorden = 0;
  animar = true;
  invertir = false;
}
