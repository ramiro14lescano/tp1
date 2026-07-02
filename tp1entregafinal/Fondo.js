class FondoOndulado {

  constructor(x, y, w, h, cantidadCapas, colores) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.cantidadCapas = cantidadCapas;
    this.colores = colores;

    this.desplazamiento = random(TWO_PI);
    this.velocidad = random(0.012, 0.026);

    this.interaccion = 0;
    this.interaccionVoz = 0;

    this.configurarOndas();
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

  actualizar(intensidadVoz) {
    this.interaccionVoz = intensidadVoz || 0;
    this.interaccion = this.interaccionVoz;

    this.desplazamiento += this.velocidad * this.interaccionVoz * 15.9;
  }

  calcularOnda(indice, px) {
    let altoCapa = this.h / this.cantidadCapas;
    let amplitud = this.amplitudes[indice] * (1 + this.interaccion * 0.35 + this.interaccionVoz * 0.45);
    let frecuencia = this.frecuencias[indice];
    let fase = this.fases[indice];
    let xLocal = px - this.x;

    let onda =
      this.y +
      indice * altoCapa +
      altoCapa / 2 +
      sin(xLocal * frecuencia + fase + this.desplazamiento) * amplitud +
      sin(xLocal * frecuencia * 0.43 + fase * 0.7 - this.desplazamiento * 0.6) * amplitud * 0.28;

    return constrain(onda, this.y, this.y + this.h);
  }

  mostrar() {
    noStroke();

    for (let i = 0; i < this.cantidadCapas; i++) {
      fill(this.colores[i % this.colores.length]);

      beginShape();

      for (let px = this.x; px <= this.x + this.w; px += 8) {
        let yArriba;

        if (i === 0) {
          yArriba = this.y;
        } else {
          yArriba = this.calcularOnda(i - 1, px);
        }

        vertex(px, yArriba);
      }

      for (let px = this.x + this.w; px >= this.x; px -= 8) {
        let yAbajo;

        if (i === this.cantidadCapas - 1) {
          yAbajo = this.y + this.h;
        } else {
          yAbajo = this.calcularOnda(i, px);
        }

        vertex(px, yAbajo);
      }

      endShape(CLOSE);
    }
  }
}
