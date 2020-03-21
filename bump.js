// SPDX-FileCopyrightText: 2020 Theo Dedeken
//
// SPDX-License-Identifier: MIT

var canvas;
var gl;

var numVertices = 6;

var pointsArray = [];
var texCoordsArray = [];

var texCoord = [
  vec2(0, 0),
  vec2(0, 1),
  vec2(1, 1),
  vec2(1, 0)
];

var vertices = [
  vec4(0.0, 0.0, 0.0, 1.0),
  vec4(1.0, 0.0, 0.0, 1.0),
  vec4(1.0, 0.0, 1.0, 1.0),
  vec4(0.0, 0.0, 1.0, 1.0)
];

var modelViewMatrix, projectionMatrix, normalMatrix;

var eye = vec3(2.0, 2.0, 2.0);
var at = vec3(0.5, 0.0, 0.5);
var up = vec3(0.0, 1.0, 0.0);

var normal = vec4(0.0, 1.0, 0.0, 0.0);
var tangent = vec3(1.0, 0.0, 0.0);

var lightPosition = vec4(0.0, 2.0, 0.0, 1.0);

var program;

var time = 0;

var bumpStatus = true;
var texStatus = true;

// from glMatrix.js
// Put in MV.js

function mat4ToInverseMat3 (mat) {
  const dest = mat3();

  var a00 = mat[0][0];
  var a01 = mat[0][1];
  var a02 = mat[0][2];
  var a10 = mat[1][0];
  var a11 = mat[1][1];
  var a12 = mat[1][2];
  var a20 = mat[2][0];
  var a21 = mat[2][1];
  var a22 = mat[2][2];

  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20;

  var d = a00 * b01 + a01 * b11 + a02 * b21;
  if (!d) { return null; }
  var id = 1 / d;

  dest[0][0] = b01 * id;
  dest[0][1] = (-a22 * a01 + a02 * a21) * id;
  dest[0][2] = (a12 * a01 - a02 * a11) * id;
  dest[1][0] = b11 * id;
  dest[1][1] = (a22 * a00 - a02 * a20) * id;
  dest[1][2] = (-a12 * a00 + a02 * a10) * id;
  dest[2][0] = b21 * id;
  dest[2[1]] = (-a21 * a00 + a01 * a20) * id;
  dest[2][2] = (a11 * a00 - a01 * a10) * id;

  return dest;
}

function mesh () {
  pointsArray.push(vertices[0]);
  texCoordsArray.push(texCoord[0]);

  pointsArray.push(vertices[1]);
  texCoordsArray.push(texCoord[1]);

  pointsArray.push(vertices[2]);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[2]);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[3]);
  texCoordsArray.push(texCoord[3]);

  pointsArray.push(vertices[0]);
  texCoordsArray.push(texCoord[0]);
}

function render () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  lightPosition[0] = 5.5 * Math.sin(0.01 * time);
  lightPosition[2] = 5.5 * Math.cos(0.01 * time);

  time += 1;

  gl.uniform4fv(gl.getUniformLocation(program, 'lightPosition'), flatten(lightPosition));
  gl.uniform1i(gl.getUniformLocation(program,
    'apply_bump'), bumpStatus);
  gl.uniform1i(gl.getUniformLocation(program,
    'apply_texture'), texStatus);

  gl.drawArrays(gl.TRIANGLES, 0, numVertices);

  requestAnimFrame(render);
}

function loadTexture (id, val, img, uniform) {
  return function () {
    gl.activeTexture(val);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
      gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.uniform1i(gl.getUniformLocation(program, uniform), id);
  };
}

window.onload = function init () {
  canvas = document.getElementById('gl-canvas');

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, 'vertex-shader', 'fragment-shader');
  gl.useProgram(program);

  modelViewMatrix = lookAt(eye, at, up);
  projectionMatrix = ortho(-0.75, 0.75, -0.75, 0.75, -5.5, 5.5);

  var normalMatrix = mat4ToInverseMat3(modelViewMatrix);

  mesh();

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, 'vPosition');
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

  var vTexCoord = gl.getAttribLocation(program, 'vTexCoord');
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  // Load texture
  const img = new Image();
  img.onload = loadTexture(1, gl.TEXTURE1, img, 'texture');
  img.src = 'img/Brick_Wall_010_COLOR.gif';

  // Load normal map
  const norm = new Image();
  norm.onload = loadTexture(0, gl.TEXTURE0, norm, 'normalMap');
  norm.src = 'img/Brick_Wall_010_NORM.gif';

  gl.uniform4fv(gl.getUniformLocation(program, 'lightPosition'), flatten(lightPosition));
  gl.uniform4fv(gl.getUniformLocation(program, 'normal'), flatten(normal));
  gl.uniform3fv(gl.getUniformLocation(program, 'objTangent'), flatten(tangent));

  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix'), false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, flatten(projectionMatrix));
  gl.uniformMatrix3fv(gl.getUniformLocation(program, 'normalMatrix'), false, flatten(normalMatrix));

  render();
};

function applySettings () {
  bumpStatus = document.getElementById('bump-switch').checked;
  texStatus = document.getElementById('texture-switch').checked;
}
