// ---------------------
// Configuración General
// ---------------------
let widthCanvas = 512;  // Resolución de la textura
let heightCanvas = 512;
let modelo, textureGraphics;
let zoom = 3; // Factor de zoom inicial

// Matrices de concentraciones de sustancias A y B
let currentA = [], currentB = [], nextA = [], nextB = [];

// Parámetros de la simulación Turing (iniciales)
let dA = 1.1,    // Difusión A
    dB = 0.5,    // Difusión B
    feed = 0.0367,
    kill = 0.06;

// GUI elements
let dASlider, dBSlider, feedSlider, killSlider, zoomSlider, resetButton;

// ---------------------
// Funciones p5.js
// ---------------------
function preload() {
    modelo = loadModel('../tiger.obj', true);
}

function setup() {
    createCanvas(800, 600, WEBGL);
    pixelDensity(1);

    // Crear un gráfico para la textura
    textureGraphics = createGraphics(widthCanvas, heightCanvas);
    textureGraphics.pixelDensity(1);

    // Inicializar las matrices A y B
    initializeSimulation();

    // Crear GUI
    createGUI();
}

function draw() {
    background(50);
    orbitControl();

    // Actualizar parámetros desde la GUI
    dA = dASlider.value();
    dB = dBSlider.value();
    feed = feedSlider.value();
    kill = killSlider.value();
    zoom = zoomSlider.value();

    // 1. Simulación de Reacción-Difusión
    updateSimulation();
    swap();

    // 2. Dibujar el patrón en la textura
    renderTexture();

    // 3. Dibujar el modelo 3D con la textura
    push();
    rotateX(PI);
    scale(zoom * 3);
    translate(0, -20, 0);
    normalMaterial();
    texture(textureGraphics);
    model(modelo);
    pop();
}

// ---------------------
// Inicializar la simulación
// ---------------------
function initializeSimulation() {
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
    // Parche inicial de B en el centro
    /*for (let i = 200; i < 300; i++) {
        for (let j = 200; j < 300; j++) {
            currentB[i][j] = 1.0;
        }
    }*/
}

// ---------------------
// Crear GUI
// ---------------------
function createGUI() {
    createP("Difusión A").position(10, 630 + 10);
    dASlider = createSlider(0.8, 2.0, dA, 0.01).position(10, 650 + 30);

    createP("Difusión B").position(10, 630 + 60);
    dBSlider = createSlider(0.1, 1.0, dB, 0.01).position(10, 650 + 80);

    createP("Tasa de Alimentación").position(10, 630 + 110);
    feedSlider = createSlider(0.01, 0.08, feed, 0.0001).position(10, 650 + 130);

    createP("Tasa de Eliminación").position(10, 630 + 160);
    killSlider = createSlider(0.01, 0.08, kill, 0.0001).position(10, 650 + 180);

    createP("Zoom").position(10, 630 + 210);
    zoomSlider = createSlider(2, 10, zoom, 0.1).position(10, 650 + 230);

    resetButton = createButton("Reset Simulación");
    resetButton.position(10, 650 + 270);
    resetButton.mousePressed(initializeSimulation);
}

// ---------------------
// Simulación de Reacción-Difusión
// ---------------------
function updateSimulation() {
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
}

// ---------------------
// Renderizar textura
// ---------------------
function renderTexture() {
    textureGraphics.loadPixels();
    for (let x = 0; x < widthCanvas; x++) {
        for (let y = 0; y < heightCanvas; y++) {
            let index = (x + y * widthCanvas) * 4;
            let a = currentA[x][y];
            let b = currentB[x][y];

            let c = floor((a - b) * 255);
            let threshold = 10;

            if (c > threshold) {
                textureGraphics.pixels[index + 0] = 255;
                textureGraphics.pixels[index + 1] = 120;
                textureGraphics.pixels[index + 2] = 0;
            } else {
                textureGraphics.pixels[index + 0] = 0;
                textureGraphics.pixels[index + 1] = 0;
                textureGraphics.pixels[index + 2] = 0;
            }
            textureGraphics.pixels[index + 3] = 255;
        }
    }
    textureGraphics.updatePixels();
}

// ---------------------
// Laplacianos
// ---------------------
function laplacianA(x, y) {
    let xm1 = (x - 1 + widthCanvas) % widthCanvas;
    let xp1 = (x + 1) % widthCanvas;
    let ym1 = (y - 1 + heightCanvas) % heightCanvas;
    let yp1 = (y + 1) % heightCanvas;

    return currentA[x][y] * -1 +
        currentA[xm1][y] * 0.2 + currentA[xp1][y] * 0.2 +
        currentA[x][ym1] * 0.2 + currentA[x][yp1] * 0.2 +
        currentA[xm1][ym1] * 0.05 + currentA[xp1][ym1] * 0.05 +
        currentA[xp1][yp1] * 0.05 + currentA[xm1][yp1] * 0.05;
}

function laplacianB(x, y) {
    return laplacianA(x, y); // Misma estructura que laplacianA
}

// ---------------------
// Intercambio de buffers
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
