class Paleta {

  constructor(cantidadColores, indicePaleta) {
    this.cantidadColores = cantidadColores;
    this.indicePaleta = indicePaleta;

    this.paletaCalida = this.crearPaletaCalida();
    this.paletaFria = this.crearPaletaFria();

    this.fondoUsaCalidos = indicePaleta % 2 === 0;

    this.actualizarSeleccion();
  }

  crearPaletaCalida() {
    let bases = [
      [
        [231, 68, 54],
        [244, 104, 74],
        [239, 147, 58],
        [255, 194, 82],
        [178, 80, 66]
      ],
      [
        [211, 54, 80],
        [247, 78, 100],
        [246, 143, 128],
        [252, 187, 137],
        [160, 78, 94]
      ],
      [
        [236, 203, 63],
        [203, 167, 72],
        [183, 111, 66],
        [122, 81, 57],
        [255, 226, 88]
      ],
      [
        [255, 54, 92],
        [239, 82, 114],
        [214, 72, 79],
        [246, 139, 89],
        [163, 67, 73]
      ]
    ];

    return this.crearPaletaDesdeBases(bases);
  }

  crearPaletaFria() {
    let bases = [
      [
        [20, 107, 118],
        [39, 142, 151],
        [92, 177, 194],
        [71, 82, 134],
        [29, 76, 94]
      ],
      [
        [32, 74, 111],
        [61, 104, 142],
        [113, 166, 190],
        [170, 202, 216],
        [80, 79, 130]
      ],
      [
        [66, 105, 82],
        [91, 130, 87],
        [122, 151, 103],
        [133, 158, 145],
        [75, 92, 108]
      ],
      [
        [42, 74, 90],
        [71, 94, 127],
        [117, 146, 181],
        [156, 193, 213],
        [85, 118, 129]
      ]
    ];

    return this.crearPaletaDesdeBases(bases);
  }

  crearPaletaDesdeBases(familias) {
    let paleta = [];
    let base = familias[this.indicePaleta % familias.length];

    for (let i = 0; i < this.cantidadColores; i++) {
      let colorBase = base[i % base.length];

      let r = constrain(colorBase[0] + random(-18, 18), 0, 255);
      let g = constrain(colorBase[1] + random(-18, 18), 0, 255);
      let b = constrain(colorBase[2] + random(-18, 18), 0, 255);

      paleta.push(color(r, g, b));
    }

    return paleta;
  }

  actualizarSeleccion() {
    if (this.fondoUsaCalidos) {
      this.coloresFondo = this.paletaCalida;
      this.coloresLineas = this.paletaFria;
    } else {
      this.coloresFondo = this.paletaFria;
      this.coloresLineas = this.paletaCalida;
    }
  }

  invertir() {
    this.fondoUsaCalidos = !this.fondoUsaCalidos;
    this.actualizarSeleccion();
  }
}
