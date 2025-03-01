let widthCanvas = 512; // Aumentamos la resolución de la textura
let heightCanvas = 512;
let modelo, textureGraphics;


let zoom = 3; // Factor de zoom inicial aumentado

// Matrices de concentraciones de sustancias A y B
let currentA = [], currentB = [], nextA = [], nextB = [];

// Parámetros de la simulación
let dA = 1.0, dB = 0.5, feed = 0.0367, kill = 0.0649;

function preload() {
  modelo = loadModel('../tiger.obj', true); // Cargar el modelo 3D con materiales
}

function setup() {
  createCanvas(600, 600, WEBGL);
  pixelDensity(1);

  // Crear un gráfico de textura para la simulación (sin dibujar en canvas)
  textureGraphics = createGraphics(widthCanvas, heightCanvas);
  textureGraphics.pixelDensity(1);

  // Inicializar las matrices
  for (let x = 0; x < widthCanvas; x++) {
    currentA[x] = [];
    currentB[x] = [];
    nextA[x] = [];
    nextB[x] = [];
    for (let y = 0; y < heightCanvas; y++) {
      currentA[x][y] = 1;
      currentB[x][y] = random(0, 0.1);
    }
  }

  // Parche inicial de B para comenzar el patrón
  for (let i = 200; i < 300; i++) {
    for (let j = 200; j < 300; j++) {
      currentB[i][j] = 1.0;
    }
  }
}

function draw() {
  background(50); // Fondo oscuro para mejor visibilidad

  // Permite rotar con el mouse y hacer zoom con la rueda
  orbitControl();

  // 1. Simular reacción-difusión
  for (let x = 0; x < widthCanvas; x++) {
    for (let y = 0; y < heightCanvas; y++) {
      let a = currentA[x][y];
      let b = currentB[x][y];

      let lapA = laplacianA(x, y);
      let lapB = laplacianB(x, y);

      let reactionA = a + (dA * lapA) - (a * b * b) + (feed * (1 - a));
      let reactionB = b + (dB * lapB) + (a * b * b) - ((kill + feed) * b);

      nextA[x][y] = constrain(reactionA, 0, 1);
      nextB[x][y] = constrain(reactionB, 0, 1);
    }
  }
  swap();

  // 2. Dibujar el patrón de Turing en `textureGraphics`
  textureGraphics.loadPixels();
  for (let x = 0; x < widthCanvas; x++) {
    for (let y = 0; y < heightCanvas; y++) {
      let index = (x + y * widthCanvas) * 4;
      let a = currentA[x][y];
      let b = currentB[x][y];

      let c = floor((a - b) * 255);
      let threshold = 10;

      if (c > threshold) {
        textureGraphics.pixels[index + 0] = 255; // R
        textureGraphics.pixels[index + 1] = 120; // G
        textureGraphics.pixels[index + 2] = 0;   // B
      } else {
        textureGraphics.pixels[index + 0] = 0;
        textureGraphics.pixels[index + 1] = 0;
        textureGraphics.pixels[index + 2] = 0;
      }
      textureGraphics.pixels[index + 3] = 255;
    }
  }
  textureGraphics.updatePixels();

  // 3. Dibujar el modelo 3D con la textura generada
  push();
  rotateX(PI);         // Corregir la orientación (invertido)
  scale(zoom * 3);     // Aumentar el tamaño del modelo
  translate(0, -20, 0); // Acercar la cámara al modelo
  normalMaterial();
  texture(textureGraphics);
  model(modelo);
  pop();
}

// Laplacianos
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

// Intercambiar matrices
function swap() {
  let tempA = currentA;
  currentA = nextA;
  nextA = tempA;

  let tempB = currentB;
  currentB = nextB;
  nextB = tempB;
}

// Permitir zoom con la rueda del mouse
function mouseWheel(event) {
  zoom += event.delta * -0.002; // Aumentar sensibilidad del zoom
  zoom = constrain(zoom, 2, 10); // Limitar el zoom mínimo y máximo
}
