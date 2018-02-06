(function () {

  angular
    .module('autonomappr_app')
    .service('graphics', graphics);

  const vsSourceRoad = `
    attribute vec2 coordinates;
    uniform vec3 colorInput;
    varying vec3 color;

    void main() {
      color = colorInput;
      gl_Position = vec4(coordinates, 1.0, 1.0) * 2.0 - 1.0;
      gl_PointSize = 10.0;
    }
  `;

  const vsSourcePOI = `
    attribute vec2 coordinates;
    uniform vec3 colorInput;
    varying vec3 color;

    void main() {
      color = colorInput;
      gl_Position = vec4(coordinates, 1.0, 1.0) * 2.0 - 1.0;
      gl_PointSize = 30.0;
    }
  `;


  const fsSourceRoadPoints = `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif
    precision mediump float;
    varying vec3 color;

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
      gl_FragColor = vec4(color, alpha);
    }`;

    const fsSourceRoadLines = `
      precision mediump float;
      varying vec3 color;

      void main() {
        gl_FragColor = vec4(color, 1.0);
      }`;

    const fsSourcePOI = `
      #ifdef GL_OES_standard_derivatives
      #extension GL_OES_standard_derivatives : enable
      #endif
      precision mediump float;
      varying vec3 color;

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
        gl_FragColor = vec4(color, alpha);
      }`;

  var gl, roadPointsProgramInfo, roadLinesProgramInfo, poiProgramInfo;

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

    function clearScreen() {
      gl.enable(gl.DEPTH_TEST);  // Enable depth testing
      gl.depthFunc(gl.LEQUAL);   // Near things obscure far things
      gl.clear(gl.GL_COLOR_BUFFER_BIT); // Clear everything
      // console.log('cleared');
    }

    function initGraphics(gl_set) {
      gl = gl_set;

      var roadPointsShaderProgram = initShaderProgram(vsSourceRoad, fsSourceRoadPoints);
      roadPointsProgramInfo = {
        program: roadPointsShaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(roadPointsShaderProgram, 'coordinates'),
        },
        uniformLocations: {
          colorLocation: gl.getUniformLocation(roadPointsShaderProgram, 'colorInput')
        }
      };

      var roadLinesShaderProgram = initShaderProgram(vsSourceRoad, fsSourceRoadLines);
      roadLinesProgramInfo = {
        program: roadLinesShaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(roadLinesShaderProgram, 'coordinates'),
        },
        uniformLocations: {
          colorLocation: gl.getUniformLocation(roadLinesShaderProgram, 'colorInput')
        }
      };

      var poiShaderProgram = initShaderProgram(vsSourcePOI, fsSourcePOI);
      poiProgramInfo = {
        program: poiShaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(poiShaderProgram, 'coordinates'),
        },
        uniformLocations: {
          colorLocation: gl.getUniformLocation(poiShaderProgram, 'colorInput')
        }
      };

      clearScreen();
    }

    function drawRoads(roadGraphs, activeRoadId, activeNode) {
      for (roadId in roadGraphs) {
        var pointsArray = [],
            linesArray = [];

        for (var i = 0; i < roadGraphs[roadId].vertices.length; i++) {
          pointsArray.push(roadGraphs[roadId].vertices[i][0]);
          pointsArray.push(roadGraphs[roadId].vertices[i][1]);
        }

        for (var j = 0; j < roadGraphs[roadId].edges.length; j++) {
          linesArray.push(roadGraphs[roadId].edges[j][0][0]);
          linesArray.push(roadGraphs[roadId].edges[j][0][1]);
          linesArray.push(roadGraphs[roadId].edges[j][1][0]);
          linesArray.push(roadGraphs[roadId].edges[j][1][1]);
        }

        if (linesArray.length) {
          gl.useProgram(roadLinesProgramInfo.program);

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
            gl.uniform3f(roadLinesProgramInfo.uniformLocations.colorLocation, roadGraphs[roadId].color[0], roadGraphs[roadId].color[1], roadGraphs[roadId].color[2]);
          }

          // Tell WebGL to use our program when drawing
          gl.drawArrays(gl.LINES, 0, linesArray.length/2);
        }

        if (pointsArray.length) {
          gl.useProgram(roadPointsProgramInfo.program);

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
            gl.uniform3f(roadPointsProgramInfo.uniformLocations.colorLocation, roadGraphs[roadId].color[0], roadGraphs[roadId].color[1], roadGraphs[roadId].color[2]);
          }

          // Tell WebGL to use our program when drawing
          gl.drawArrays(gl.POINTS, 0, pointsArray.length/2);

          if(roadId != null && roadId == activeRoadId && activeNode != null) {
            pointPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(activeNode), gl.STATIC_DRAW);
            gl.vertexAttribPointer(roadPointsProgramInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(roadPointsProgramInfo.attribLocations.vertexPosition);
            gl.uniform3f(roadPointsProgramInfo.uniformLocations.colorLocation, 1.0, 1.0, 1.0);

            // Tell WebGL to use our program when drawing
            gl.drawArrays(gl.POINTS, 0, 1);
          }
        }
      }
    }

    function drawPOI(poiList) {
      for (pointsId in poiList) {
        var pointsArray = [];

        console.log(poiList);
        console.log(pointsId);

        for (var i = 0; i < poiList[pointsId].vertices.length; i++) {
          pointsArray.push(poiList[pointsId].vertices[i][0]);
          pointsArray.push(poiList[pointsId].vertices[i][1]);
        }

        if (pointsArray.length) {
          gl.useProgram(poiProgramInfo.program);

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
            gl.vertexAttribPointer(poiProgramInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(poiProgramInfo.attribLocations.vertexPosition);
            gl.uniform3f(poiProgramInfo.uniformLocations.colorLocation, poiList[pointsId].color[0], poiList[pointsId].color[1], poiList[pointsId].color[2]);
          }

          // Tell WebGL to use our program when drawing
          gl.drawArrays(gl.POINTS, 0, pointsArray.length/2);
        }
      }
    }

    return {
      initGraphics : initGraphics,
      drawRoads : drawRoads,
      drawPOI : drawPOI,
      clearScreen : clearScreen
    };
  }
})();
