  // ---------------------
  // Configuración General
  // ---------------------
  let widthCanvas = 512;  // Resolución de la textura
  let heightCanvas = 512;
  let modelo, textureGraphics;
  let zoom = 3; // Factor de zoom inicial

  // Matrices de concentraciones de sustancias A y B
  let currentA = [], currentB = [], nextA = [], nextB = [];

  // Parámetros de la simulación Turing
  let dA = 1.1,    // Difusión A
      dB = 0.5,    // Difusión B
      feed = 0.0367,
      kill = 0.06;

  // ---------------------
  // Funciones p5.js
  // ---------------------
  function preload() {
    // Cargar el modelo 3D (debe estar en la misma carpeta)
    modelo = loadModel('../tiger.obj', true); 
  }

  function setup() {
    createCanvas(600, 600, WEBGL);
    pixelDensity(1);

    // Crear un gráfico para la textura (no se dibuja en pantalla directamente)
    textureGraphics = createGraphics(widthCanvas, heightCanvas);
    textureGraphics.pixelDensity(1);

    // Inicializar las matrices A y B
    for (let x = 0; x < widthCanvas; x++) {
      currentA[x] = [];
      currentB[x] = [];
      nextA[x] = [];
      nextB[x] = [];
      for (let y = 0; y < heightCanvas; y++) {
        currentA[x][y] = 1;            // Sustancia A inicia en 1
        currentB[x][y] = random(0, 0.1); // Sustancia B con ruido aleatorio
      }
    }

    // Parche inicial de B (alto valor) en el centro
    for (let i = 200; i < 300; i++) {
      for (let j = 200; j < 300; j++) {
        currentB[i][j] = 1.0;
      }
    }
  }

  function draw() {
    background(50); // Fondo oscuro

    // Control de rotación y zoom con el mouse
    orbitControl();

    // 1. Actualizar simulación de Reacción-Difusión
    for (let x = 0; x < widthCanvas; x++) {
      for (let y = 0; y < heightCanvas; y++) {
        let a = currentA[x][y];
        let b = currentB[x][y];

        let lapA = laplacianA(x, y);
        let lapB = laplacianB(x, y);

        // Ecuaciones de Turing
        let reactionA = a + (dA * lapA) - (a * b * b) + (feed * (1 - a));
        let reactionB = b + (dB * lapB) + (a * b * b) - ((kill + feed) * b);

        nextA[x][y] = constrain(reactionA, 0, 1);
        nextB[x][y] = constrain(reactionB, 0, 1);
      }
    }
    swap();

    // 2. Dibujar el patrón de Turing en la textura
    textureGraphics.loadPixels();
    for (let x = 0; x < widthCanvas; x++) {
      for (let y = 0; y < heightCanvas; y++) {
        let index = (x + y * widthCanvas) * 4;
        let a = currentA[x][y];
        let b = currentB[x][y];

        // Calcular una diferencia para definir color
        let c = floor((a - b) * 255);
        let threshold = 10;

        if (c > threshold) {
          // Naranja
          textureGraphics.pixels[index + 0] = 255; // R
          textureGraphics.pixels[index + 1] = 120; // G
          textureGraphics.pixels[index + 2] = 0;   // B
        } else {
          // Negro
          textureGraphics.pixels[index + 0] = 0;
          textureGraphics.pixels[index + 1] = 0;
          textureGraphics.pixels[index + 2] = 0;
        }
        textureGraphics.pixels[index + 3] = 255; // Alpha
      }
    }
    textureGraphics.updatePixels();

    // 3. Dibujar el modelo 3D con la textura generada
    push();
      rotateX(PI);      // Corregir orientación
      scale(zoom * 3);  // Ajustar tamaño del modelo
      translate(0, -20, 0);

      // Material normal + textura (puede dar un efecto algo plano; 
      // si quieres ver la textura pura, quita "normalMaterial()")
      normalMaterial();
      texture(textureGraphics);

      model(modelo);
    pop();
  }

  // ---------------------
  // Simulación: Laplacianos
  // ---------------------
  function laplacianA(x, y) {
    let xm1 = (x - 1 + widthCanvas) % widthCanvas;
    let xp1 = (x + 1) % widthCanvas;
    let ym1 = (y - 1 + heightCanvas) % heightCanvas;
    let yp1 = (y + 1) % heightCanvas;

    let sumA = 0;
    sumA += currentA[x][y] * -1;
    sumA += currentA[xm1][y] * 0.2;
    sumA += currentA[xp1][y] * 0.2;
    sumA += currentA[x][ym1] * 0.2;
    sumA += currentA[x][yp1] * 0.2;
    sumA += currentA[xm1][ym1] * 0.05;
    sumA += currentA[xp1][ym1] * 0.05;
    sumA += currentA[xp1][yp1] * 0.05;
    sumA += currentA[xm1][yp1] * 0.05;

    return sumA;
  }

  function laplacianB(x, y) {
    let xm1 = (x - 1 + widthCanvas) % widthCanvas;
    let xp1 = (x + 1) % widthCanvas;
    let ym1 = (y - 1 + heightCanvas) % heightCanvas;
    let yp1 = (y + 1) % heightCanvas;

    let sumB = 0;
    sumB += currentB[x][y] * -1;
    sumB += currentB[xm1][y] * 0.2;
    sumB += currentB[xp1][y] * 0.2;
    sumB += currentB[x][ym1] * 0.2;
    sumB += currentB[x][yp1] * 0.2;
    sumB += currentB[xm1][ym1] * 0.05;
    sumB += currentB[xp1][ym1] * 0.05;
    sumB += currentB[xp1][yp1] * 0.05;
    sumB += currentB[xm1][yp1] * 0.05;

    return sumB;
  }

  // ---------------------
  // Intercambio de buffers (A y B)
  // ---------------------
  function swap() {
    let tempA = currentA;
    currentA = nextA;
    nextA = tempA;

    let tempB = currentB;
    currentB = nextB;
    nextB = tempB;
  }

  // ---------------------
  // Zoom con la rueda del mouse
  // ---------------------
  function mouseWheel(event) {
    zoom += event.delta * -0.002;
    zoom = constrain(zoom, 2, 10);
  }