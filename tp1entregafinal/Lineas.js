class LineasFrente {

  constructor(x, y, w, h, cantidad, cantidadCapas, colores) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.cantidad = cantidad;
    this.cantidadCapas = cantidadCapas;
    this.colores = colores;

    this.grosor = random(0.50, 0.65);
    this.grosorBase = this.grosor;

    this.desplazamiento = random(TWO_PI);
    this.velocidad = random(0.018, 0.038);
    this.desplazamientoDerecha = random(this.w);
    this.velocidadDerecha = random(1.2, 2.6);

    this.interaccion = 0;
    this.interaccionVoz = 0;
    this.vibracionAgudos = 0;
    this.amplitudMovimiento = 0;

    this.faseVibracion = random(TWO_PI);
    this.velocidadVibracion = random(0.45, 0.72);

    this.configurarOndas();
    this.configurarVibracion();
  }

  configurarOndas() {
    this.amplitudes = [];
    this.frecuencias = [];
    this.fases = [];

    for (let i = 0; i < this.cantidadCapas; i++) {
      this.amplitudes.push(random(this.h * 0.05, this.h * 0.08));
      this.frecuencias.push(random(0.012, 0.018));
      this.fases.push(random(TWO_PI));
    }
  }

  configurarVibracion() {
    this.semillasVibracion = [];

    for (let i = 0; i < this.cantidad; i++) {
      this.semillasVibracion.push(random(TWO_PI));
    }
  }

  actualizar(intensidadAgudos, intensidadAmplitud) {
    this.vibracionAgudos = constrain(intensidadAgudos || 0, 0, 1);
    this.amplitudMovimiento = constrain(intensidadAmplitud || 0, 0, 1);
    this.interaccionVoz = this.amplitudMovimiento;
    this.interaccion = max(this.vibracionAgudos, this.amplitudMovimiento);

    this.grosor = this.grosorBase;
    this.desplazamientoDerecha += this.velocidadDerecha * this.amplitudMovimiento * 5.5;

    if (this.vibracionAgudos > 0.001) {
      this.faseVibracion += this.velocidadVibracion * (0.55 + this.vibracionAgudos * 1.4);
    }
  }

  calcularOnda(indice, px) {
    let altoCapa = this.h / this.cantidadCapas;
    let amplitud = this.amplitudes[indice] * (1 + this.interaccion * 0.45 + this.interaccionVoz * 0.75);
    let frecuencia = this.frecuencias[indice];
    let fase = this.fases[indice];
    let xLocal = px - this.x - this.desplazamientoDerecha;

    let onda =
      this.y +
      indice * altoCapa +
      altoCapa / 2 +
      sin(xLocal * frecuencia + fase + this.desplazamiento) * amplitud +
      sin(xLocal * frecuencia * 0.55 + fase - this.desplazamiento * 0.7) * amplitud * 0.24;

    return constrain(onda, this.y, this.y + this.h);
  }

  calcularVibracionLinea(indice) {
    if (this.vibracionAgudos <= 0.001) {
      return 0;
    }

    let semilla = this.semillasVibracion[indice % this.semillasVibracion.length];

    let pulso =
      sin(this.faseVibracion + semilla) +
      sin(this.faseVibracion * 1.9 + semilla * 0.7) * 0.35;

    return pulso * this.vibracionAgudos * 6;
  }

  mostrar() {
    noStroke();

    let espacio = this.w / this.cantidad;
    let anchoLinea = espacio * this.grosor;

    for (let i = 0; i < this.cantidad; i++) {
      let px = this.x + i * espacio + this.calcularVibracionLinea(i);
      let inicio = max(px, this.x);
      let fin = min(px + anchoLinea, this.x + this.w);

      if (fin <= inicio) {
        continue;
      }

      for (let c = 0; c < this.cantidadCapas; c++) {
        fill(this.colores[c % this.colores.length]);

        beginShape();

        for (let xReal = inicio; xReal <= fin; xReal += 2) {
          let yArriba;

          if (c === 0) {
            yArriba = this.y;
          } else {
            yArriba = this.calcularOnda(c - 1, xReal);
          }

          vertex(xReal, yArriba);
        }

        for (let xReal = fin; xReal >= inicio; xReal -= 2) {
          let yAbajo;

          if (c === this.cantidadCapas - 1) {
            yAbajo = this.y + this.h;
          } else {
            yAbajo = this.calcularOnda(c, xReal);
          }

          vertex(xReal, yAbajo);
        }

        endShape(CLOSE);
      }
    }
  }
}
