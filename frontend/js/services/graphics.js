(function () {

  angular
    .module('autonomappr_app')
    .service('graphics', graphics);

  const vsSourceRoad = `
    attribute vec2 coordinates;

    void main() {
      gl_Position = vec4(coordinates, 1.0, 1.0) * 2.0 - 1.0;
      gl_PointSize = 10.0;
    }
  `;


  const fsSourceRoadPoints = `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif
    precision mediump float;

    void main() {
      float r = 0.0, delta = 0.0, alpha = 1.0;
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      r = dot(cxy, cxy);
      #ifdef GL_OES_standard_derivatives
        delta = fwidth(r);
        alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      #endif
      #ifndef GL_OES_standard_derivatives
        if (r > 1.0) {
          discard;
        }
      #endif
      gl_FragColor = vec4(1.0, 0.0, 0.0, alpha);
    }`;

    const fsSourceRoadLines = `
      precision mediump float;

      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }`;

  var gl, roadPointsProgramInfo, roadLinesProgramInfo;

  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function initShaderProgram(vsCode, fsCode) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsCode);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsCode);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  }

  function graphics() {

    function initGraphics(gl_set) {
      gl = gl_set;

      var roadPointsShaderProgram = initShaderProgram(vsSourceRoad, fsSourceRoadPoints);
      roadPointsProgramInfo = {
        program: roadPointsShaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(roadPointsShaderProgram, 'coordinates'),
        }
      };

      var roadLinesShaderProgram = initShaderProgram(vsSourceRoad, fsSourceRoadLines);
      roadLinesProgramInfo = {
        program: roadLinesShaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(roadLinesShaderProgram, 'coordinates'),
        }
      };
    }

    function clearScreen() {
      gl.clearColor(0.0, 0.0, 0.0, 0.0);  // Clear to black, fully opaque
      gl.clearDepth(1.0);                 // Clear everything
      gl.enable(gl.DEPTH_TEST);           // Enable depth testing
      gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    }

    function drawRoadPoints(pointsArray) {
      var pointPositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointsArray), gl.STATIC_DRAW);

      {
        // const numComponents = 2;  // pull out 2 values per iteration
        // const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        // const normalize = false;  // don't normalize
        // const stride = 0;         // how many bytes to get from one set of values to the next
        //                           // 0 = use type and numComponents above
        // const offset = 0;         // how many bytes inside the buffer to start from
        // gl.vertexAttribPointer(roadProgramInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
        gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
        gl.vertexAttribPointer(roadPointsProgramInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(roadPointsProgramInfo.attribLocations.vertexPosition);
      }

      // Tell WebGL to use our program when drawing
      gl.useProgram(roadPointsProgramInfo.program);
      gl.drawArrays(gl.POINTS, 0, pointsArray.length/2);
    }

    function drawRoadLines(linesArray) {
      var linePositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, linePositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linesArray), gl.STATIC_DRAW);

      {
        // const numComponents = 2;  // pull out 2 values per iteration
        // const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        // const normalize = false;  // don't normalize
        // const stride = 0;         // how many bytes to get from one set of values to the next
        //                           // 0 = use type and numComponents above
        // const offset = 0;         // how many bytes inside the buffer to start from
        // gl.vertexAttribPointer(roadProgramInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
        gl.bindBuffer(gl.ARRAY_BUFFER, linePositionBuffer);
        gl.vertexAttribPointer(roadLinesProgramInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(roadLinesProgramInfo.attribLocations.vertexPosition);
      }

      // Tell WebGL to use our program when drawing

      gl.useProgram(roadLinesProgramInfo.program);
      gl.drawArrays(gl.LINE_STRIP, 0, linesArray.length/2);
    }

    return {
      initGraphics : initGraphics,
      drawRoadPoints : drawRoadPoints,
      drawRoadLines : drawRoadLines,
      clearScreen : clearScreen
    };
  }
})();
