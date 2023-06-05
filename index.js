// Todo:
// serve via webhost (github pages)
// If not add instructions for servez

// Add text denoting features

// Features of this program:
// Fixed snap rotation
// Added texture mapping
// Added XYZ translation (AD / WS / QE)
// Added scale transformation (+-)
// Added div buttons to change cube texture

// Required code for mounting WebGL2 to program
const canvas = document.querySelector("#output");
const gl = canvas.getContext("webgl2");

const createShader = (gl, type, sourceCode) => {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);    
    
    return shader;
};

// Getting the shader source from index.html
const vertexShaderSource = document.querySelector("#vertex-shader").textContent;
const fragmentShaderSource = document.querySelector("#fragment-shader").textContent;

// Mounting the source into actual shaders
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Creating, attaching, linking, and using the program
let program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Initialization of required components for the object
// Point coordinates
const aPositionPointer = gl.getAttribLocation(program, 'a_position');
// Texture coordinates
const texcoordAttributeLocation = gl.getAttribLocation(program, 'a_texcoord');

// Initialization of required components for 3D rendering
const uModelMatrix = gl.getUniformLocation(program, "u_model_matrix");
const uViewMatrix = gl.getUniformLocation(program, "u_view_matrix");
const uProjectionMatrix = gl.getUniformLocation(program, "u_projection_matrix");

// Creation of the model matrix
const model_matrix = glMatrix.mat4.create();

// Creation and mounting of the view matrix
const view_matrix = glMatrix.mat4.create();
glMatrix.mat4.lookAt(view_matrix, [0, 0, 0, 1], [0, 0, 0, 1], [0, 1, 0, 1]);

// Creation and mounting of the projection matrix
const projection_matrix = glMatrix.mat4.create();
glMatrix.mat4.ortho(projection_matrix, -1, 1, -1, 1, -1, 10);

// Coordinate data for the cube and its texture mapping
var matrixData = {
    // Array for cube coordinate data
    cube: [
        // Cube
        // Front Face - Upper
        -0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0,
        -0.5, -0.5, 0.5, 1.0,
        // Front Face - Lower
        0.5, 0.5, 0.5, 1.0,
        0.5, -0.5, 0.5, 1.0,
        -0.5, -0.5, 0.5, 1.0,

        // Top Face – Upper
        -0.5, 0.5, -0.5, 1.0,
        0.5, 0.5, -0.5, 1.0,
        -0.5, 0.5, 0.5, 1.0,
        // Top Face – Lower
        0.5, 0.5, -0.5, 1.0,
        0.5, 0.5, 0.5, 1.0,
        -0.5, 0.5, 0.5, 1.0,

        // Left Face - Upper
        -0.5, 0.5, -0.5, 1.0,
        -0.5, 0.5, 0.5, 1.0,
        -0.5, -0.5, -0.5, 1.0,
        // Left Face - Lower
        -0.5, 0.5, 0.5, 1.0,
        -0.5, -0.5, 0.5, 1.0,
        -0.5, -0.5, -0.5, 1.0,
        
        // Back Face - Upper
        0.5, 0.5, -0.5, 1.0,
        -0.5, 0.5, -0.5, 1.0,
        0.5, -0.5, -0.5, 1.0,
        // Back Face - Lower
        -0.5, 0.5, -0.5, 1.0,
        -0.5, -0.5, -0.5, 1.0,
        0.5, -0.5, -0.5, 1.0,

        // Right Face - Upper
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, -0.5, 1.0,
        0.5, -0.5, 0.5, 1.0,
        // Right Face - Lower
        0.5, 0.5, -0.5, 1.0,
        0.5, -0.5, -0.5, 1.0,
        0.5, -0.5, 0.5, 1.0,

        // Bottom Face – Upper
        -0.5, -0.5, 0.5, 1.0,
        0.5, -0.5, 0.5, 1.0,
        -0.5, -0.5, -0.5, 1.0,
        // Bottom Face – Lower
        0.5, -0.5, 0.5, 1.0,
        0.5, -0.5, -0.5, 1.0,
        -0.5, -0.5, -0.5, 1.0,
    ],

    // Array for texture mapping coordinate data
    texture: [
        // front face
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        // top face
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        // left face
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        // back face
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        // right face
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,

        // bottom face
        0, 0,
        0, 1,
        1, 0,
        0, 1,
        1, 1,
        1, 0,
    ]
};

// Initialization for image sources used for textures
const sad = "images/bocchi-sad.png";
const happy = "images/bocchi-happy.png";
const confused = "images/bocchi-confused.png";

// Check variable to know which image source is to be used
var imageType = 0;
// New image object for texture mapping
var image = new Image();

// Function to map the textures to the cube
const setTexture = (buffer, textureData, imageType) => {
    // Getting and mounting the texture coordinate data to a buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureData), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texcoordAttributeLocation);
    gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, true, 0, 0);

    // Creating the actual texture to be mapped with the buffer
    var texture = gl.createTexture();

    // Checks which image is to be used as the texture
    switch(imageType) {
        case 0: image.src = happy; break;
        case 1: image.src = sad; break;
        case 2: image.src = confused; break;
    }

    // Maps the image onto the texture on loading the image data
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    
    // Unmounting the buffer data to be reused
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

// Function that draws the cube
const drawCube = (buffer, coordinateData) => {
    // Getting and mounting the cube coordinate data to a buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordinateData), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPositionPointer, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(aPositionPointer);

    // Setting and mounting the 3D matrices for rendering
    gl.uniformMatrix4fv(uModelMatrix, false, new Float32Array(model_matrix));
    gl.uniformMatrix4fv(uViewMatrix, false, new Float32Array(view_matrix));
    gl.uniformMatrix4fv(uProjectionMatrix, false, new Float32Array(projection_matrix));
    // Enables 3D rendering
    gl.enable(gl.DEPTH_TEST);

    // Actual drawing of the cube coordinates
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    
    // Unmounting the buffer data to be reused
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

// Function for drawing the cube
const drawScene = () => {
    // Refreshes the canvas for redrawing
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Actual drawing of the cube
    const cubeBuffer = gl.createBuffer();
    drawCube(cubeBuffer, matrixData.cube);

    // Actual mounting of the texture
    const textureBuffer = gl.createBuffer();
    setTexture(textureBuffer, matrixData.texture, imageType);
};

// Variable initialization used for rotation transformations via mouse movement
var direction = {
    initialX: 0,
    initialY: 0,
    noise: 5,
    dirX: 0,
    dirY: 0,
    Rx: 0,
    Ry: 0,
}

// Function to mount given callback function when mouse is pressed and moving
// And unmounts after mouse press is released
const mouseMoveTest = (target, whileMove) => {
    var endMove = () => {
        target.removeEventListener("mousemove", whileMove);
        target.removeEventListener("mouseup", endMove);
    };

    target.addEventListener("mousedown", (event) => {
        event.stopPropagation();
        target.addEventListener("mousemove", whileMove);
        target.addEventListener("mouseup", endMove);
    });
};

// Function call to mount this callback function
mouseMoveTest(document.getElementById("output"), (event) => {
    // Gets the direction where the mouse moves relative to when the mouse is pressed
    direction.dirX = direction.initialX - event.clientX;
    direction.dirY = direction.initialY - event.clientY;

    // Calculates the actual direction of the mouse movement relative to the x axis
    if (Math.abs(direction.dirX) > direction.noise) {
        (direction.dirX <= 0)? direction.Ry = (1 / 10) : direction.Ry = -(1 / 10);
        direction.initialX = event.clientX;
    }

    // Calculates the actual direction of the mouse movement relative to the y axis
    if (Math.abs(direction.dirY) > direction.noise) {
        (direction.dirY <= 0)? direction.Rx = (1 / 10) : direction.Rx = -(1 / 10);
        direction.initialY = event.clientY;
    }

    // Then rotates the cube relative to the calculated directions
    glMatrix.mat4.rotateX(model_matrix, model_matrix, glMatrix.glMatrix.toRadian(direction.Rx * Math.PI));
    glMatrix.mat4.rotateY(model_matrix, model_matrix, glMatrix.glMatrix.toRadian(direction.Ry * Math.PI));

    // Then redraws the cube and its textures
    drawScene();
});

// Function call to mount key press events for translation and scaling transformations
document.addEventListener("keydown", (event) => {
    // Initialization of required transformation variables
    let Tx = 0, Ty = 0, Tz = 0, scale = 1;

    // Event getter for translation transformations
    if (event.key === 'w' || event.key === 'ArrowUp') Ty = 0.1;
    if (event.key === 's' || event.key === 'ArrowDown') Ty = -0.1;
    if (event.key === 'a' || event.key === 'ArrowLeft') Tx = -0.1;
    if (event.key === 'd' || event.key === 'ArrowRight') Tx = 0.1;
    if (event.key === 'q') Tz = 0.1;
    if (event.key === 'e') Tz = -0.1;

    // Event getter for scaling transformations
    if (event.key === '+') scale = 1.6;
    if (event.key === '-') scale = 0.625;

    // Translates the cube relative to the input
    glMatrix.mat4.translate(model_matrix, model_matrix, [Tx, Ty, Tz, 0]);
    // Scales the cube relative to the input
    glMatrix.mat4.scale(model_matrix, model_matrix, [scale, scale, scale, 0]);
    
    // Then redraws the cube and its textures
    drawScene();

    // And reinitializes the variables
    Tx = 0, Ty = 0, Tz = 0, scale = 1;
});

// Function to change the texture image when the left most div button is clicked
document.getElementById("happy").addEventListener("click", () => {
    imageType = 0;
});

// Function to change the texture image when the middle div button is clicked
document.getElementById("sad").addEventListener("click", () => {
    imageType = 1;
});

// Function to change the texture image when the right most div button is clicked
document.getElementById("confused").addEventListener("click", () => {
    imageType = 2;
});

// Initial drawing of cube and its texture
drawScene();