var webglCanvas, canvas, webglContext;

function postprocessWebGL(canvas, gl, sourceCanvas) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function prepareWebGL(canvas, gl, sourceCanvas) {
    var program = gl.createProgram();

    var vertexCode = `
        attribute vec2 coordinates;
        attribute vec2 texture_coordinates;
        varying vec2 v_texcoord;
        void main() {
          gl_Position = vec4(coordinates,0.0, 1.0);
          v_texcoord = texture_coordinates;
        }
        `;

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexCode);
    gl.compileShader(vertexShader);

    var fragmentCode =
        ` 
        precision mediump float;
        varying vec2 v_texcoord;
        uniform sampler2D u_texture;
        uniform float u_time;
        float grayScaleAt(vec2 point) {
            return (0.3 * texture2D(u_texture, point).r) + (0.59 * texture2D(u_texture, point).g) + (0.11 * texture2D(u_texture, point).b);
        }
        float random(float x, float y, float color) {
            return abs(fract(sin(dot(vec2(x + y, color + y) ,vec2(12.9898,78.233))) * 43758.5453));
        }
        void main() {
            float x = v_texcoord.x;
            float y = v_texcoord.y;
            float color = grayScaleAt(v_texcoord);
            float newColor = 0.0;
            float prev = 0.0;
            for (int i = 0; i < 5; i++) {
                float dx = (random(x, y, prev) - 0.5) / 100.0;
                float dy = (random(x, y, prev) - 0.5) / 100.0;
                newColor += grayScaleAt(vec2(x + dx, y + dy));
                prev = dx * dy;
            }
            newColor = newColor / 5.0;
            
            // если полученный цвет сильно отличается от исходного, то он сглаживается
            if (abs(newColor / color) > 1.25) {
                newColor = (newColor + color) / 2.0;
            }
            gl_FragColor = vec4(newColor, newColor, newColor, 1.0);
        }
        `;

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentCode);
    gl.compileShader(fragmentShader);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    gl.useProgram(program);

    var positionLocation = gl.getAttribLocation(program, 'coordinates');
    var texcoordLocation = gl.getAttribLocation(program, 'texture_coordinates');

    var buffer = gl.createBuffer();
    var vertices = [
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    buffer = gl.createBuffer();
    var textureCoordinates = [
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function makeGrayScale() {
    postprocessWebGL(webglCanvas, webglContext, canvas);
}

function init() {
    webglCanvas = document.querySelector('.player__webgl-canvas');
    canvas = document.querySelector('.player__canvas');
    webglContext = webglCanvas.getContext('webgl');
    prepareWebGL(webglCanvas, webglContext, canvas);
}

init()

module.exports = makeGrayScale;