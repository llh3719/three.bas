(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	(factory((global.BAS = {}),global.THREE));
}(this, (function (exports,three) { 'use strict';

function BaseAnimationMaterial(parameters, uniforms) {
  var _this = this;

  three.ShaderMaterial.call(this);

  if (parameters.uniformValues) {
    console.warn('THREE.BAS - `uniformValues` is deprecated. Put their values directly into the parameters.');

    Object.keys(parameters.uniformValues).forEach(function (key) {
      parameters[key] = parameters.uniformValues[key];
    });

    delete parameters.uniformValues;
  }

  // copy parameters to (1) make use of internal #define generation
  // and (2) prevent 'x is not a property of this material' warnings.
  Object.keys(parameters).forEach(function (key) {
    _this[key] = parameters[key];
  });

  // override default parameter values
  this.setValues(parameters);

  // override uniforms
  this.uniforms = three.UniformsUtils.merge([uniforms, parameters.uniforms || {}]);

  // set uniform values from parameters that affect uniforms
  this.setUniformValues(parameters);
}

BaseAnimationMaterial.prototype = Object.assign(Object.create(three.ShaderMaterial.prototype), {
  constructor: BaseAnimationMaterial,

  setUniformValues: function setUniformValues(values) {
    var _this2 = this;

    if (!values) return;

    var keys = Object.keys(values);

    keys.forEach(function (key) {
      key in _this2.uniforms && (_this2.uniforms[key].value = values[key]);
    });
  },
  stringifyChunk: function stringifyChunk(name) {
    var value = void 0;

    if (!this[name]) {
      value = '';
    } else if (typeof this[name] === 'string') {
      value = this[name];
    } else {
      value = this[name].join('\n');
    }

    return value;
  }
});

/**
 * Extends THREE.MeshBasicMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_basic/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
function BasicAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['basic'].uniforms);

  this.lights = false;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
BasicAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
BasicAnimationMaterial.prototype.constructor = BasicAnimationMaterial;

BasicAnimationMaterial.prototype.concatVertexShader = function () {
  return three.ShaderLib.basic.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <beginnormal_vertex>', '\n      #include <beginnormal_vertex>\n      ' + this.stringifyChunk('vertexNormal') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

BasicAnimationMaterial.prototype.concatFragmentShader = function () {
  return three.ShaderLib.basic.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ');
};

function LambertAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['lambert'].uniforms);

  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
LambertAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
LambertAnimationMaterial.prototype.constructor = LambertAnimationMaterial;

LambertAnimationMaterial.prototype.concatVertexShader = function () {
  return three.ShaderLib.lambert.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <beginnormal_vertex>', '\n      #include <beginnormal_vertex>\n\n      ' + this.stringifyChunk('vertexNormal') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

LambertAnimationMaterial.prototype.concatFragmentShader = function () {
  return three.ShaderLib.lambert.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ').replace('#include <emissivemap_fragment>', '\n      ' + this.stringifyChunk('fragmentEmissive') + '\n\n      #include <emissivemap_fragment>\n      ');
  return '\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float opacity;\n\n  varying vec3 vLightFront;\n  varying vec3 vIndirectFront;\n\n  #ifdef DOUBLE_SIDED\n    varying vec3 vLightBack;\n    varying vec3 vIndirectBack;\n  #endif\n\n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_common_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <cube_uv_reflection_fragment>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <fog_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <shadowmask_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n\n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n\n  void main() {\n\n    ' + this.stringifyChunk('fragmentInit') + '\n\n    #include <clipping_planes_fragment>\n\n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n\n    #include <logdepthbuf_fragment>\n\n    ' + this.stringifyChunk('fragmentDiffuse') + '\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n\n    ' + this.stringifyChunk('fragmentEmissive') + '\n\n    #include <emissivemap_fragment>\n\n    // accumulation\n    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );\n\n    #ifdef DOUBLE_SIDED\n      reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;\n    #else\n      reflectedLight.indirectDiffuse += vIndirectFront;\n    #endif\n\n    #include <lightmap_fragment>\n\n    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );\n\n    #ifdef DOUBLE_SIDED\n      reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;\n    #else\n      reflectedLight.directDiffuse = vLightFront;\n    #endif\n\n    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();\n    // modulation\n    #include <aomap_fragment>\n\n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n\n    #include <envmap_fragment>\n\n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  }';
};

function PhongAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['phong'].uniforms);

  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
PhongAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
PhongAnimationMaterial.prototype.constructor = PhongAnimationMaterial;

PhongAnimationMaterial.prototype.concatVertexShader = function () {
  return three.ShaderLib.phong.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <beginnormal_vertex>', '\n      #include <beginnormal_vertex>\n\n      ' + this.stringifyChunk('vertexNormal') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

PhongAnimationMaterial.prototype.concatFragmentShader = function () {
  return three.ShaderLib.phong.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ').replace('#include <emissivemap_fragment>', '\n      ' + this.stringifyChunk('fragmentEmissive') + '\n\n      #include <emissivemap_fragment>\n      ').replace('#include <lights_phong_fragment>', '\n      #include <lights_phong_fragment>\n      ' + this.stringifyChunk('fragmentSpecular') + '\n      ');
};

function StandardAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['physical'].uniforms);

  this.lights = true;
  this.extensions = this.extensions || {};
  this.extensions.derivatives = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
StandardAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
StandardAnimationMaterial.prototype.constructor = StandardAnimationMaterial;

StandardAnimationMaterial.prototype.concatVertexShader = function () {
  return three.ShaderLib.standard.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <beginnormal_vertex>', '\n      #include <beginnormal_vertex>\n\n      ' + this.stringifyChunk('vertexNormal') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

StandardAnimationMaterial.prototype.concatFragmentShader = function () {
  return three.ShaderLib.standard.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ').replace('#include <emissivemap_fragment>', '\n      ' + this.stringifyChunk('fragmentEmissive') + '\n\n      #include <emissivemap_fragment>\n      ').replace('#include <roughnessmap_fragment>', '\n      float roughnessFactor = roughness;\n      ' + this.stringifyChunk('fragmentRoughness') + '\n      #ifdef USE_ROUGHNESSMAP\n\n      vec4 texelRoughness = texture2D( roughnessMap, vUv );\n        roughnessFactor *= texelRoughness.g;\n      #endif\n      ').replace('#include <metalnessmap_fragment>', '\n      float metalnessFactor = metalness;\n      ' + this.stringifyChunk('fragmentMetalness') + '\n\n      #ifdef USE_METALNESSMAP\n        vec4 texelMetalness = texture2D( metalnessMap, vUv );\n        metalnessFactor *= texelMetalness.b;\n      #endif\n      ');
};

function ToonAnimationMaterial(parameters) {
  if (!parameters.defines) {
    parameters.defines = {};
  }
  parameters.defines['TOON'] = '';

  PhongAnimationMaterial.call(this, parameters);
}
ToonAnimationMaterial.prototype = Object.create(PhongAnimationMaterial.prototype);
ToonAnimationMaterial.prototype.constructor = ToonAnimationMaterial;

function PointsAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['points'].uniforms);

  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}

PointsAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
PointsAnimationMaterial.prototype.constructor = PointsAnimationMaterial;

PointsAnimationMaterial.prototype.concatVertexShader = function () {
  return three.ShaderLib.points.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ');
};

PointsAnimationMaterial.prototype.concatFragmentShader = function () {
  return three.ShaderLib.points.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ').replace('#include <premultiplied_alpha_fragment>', '\n      ' + this.stringifyChunk('fragmentShape') + '\n\n      #include <premultiplied_alpha_fragment>\n      ');
};

function DepthAnimationMaterial(parameters) {
  this.depthPacking = three.RGBADepthPacking;
  this.clipping = true;

  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['depth'].uniforms);

  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = three.ShaderLib['depth'].fragmentShader;
}
DepthAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DepthAnimationMaterial.prototype.constructor = DepthAnimationMaterial;

DepthAnimationMaterial.prototype.concatVertexShader = function () {
  return three.ShaderLib.depth.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

function DistanceAnimationMaterial(parameters) {
  this.depthPacking = three.RGBADepthPacking;
  this.clipping = true;

  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['distanceRGBA'].uniforms);

  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = three.ShaderLib['distanceRGBA'].fragmentShader;
}
DistanceAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DistanceAnimationMaterial.prototype.constructor = DistanceAnimationMaterial;

DistanceAnimationMaterial.prototype.concatVertexShader = function () {
  return three.ShaderLib.distanceRGBA.vertexShader.replace('void main() {', '\n    ' + this.stringifyChunk('vertexParameters') + '\n    ' + this.stringifyChunk('vertexFunctions') + '\n\n    void main() {\n      ' + this.stringifyChunk('vertexInit') + '\n    ').replace('#include <begin_vertex>', '\n    #include <begin_vertex>\n\n    ' + this.stringifyChunk('vertexPosition') + '\n    ').replace('#include <morphtarget_vertex>', '\n    #include <morphtarget_vertex>\n\n    ' + this.stringifyChunk('vertexPostMorph') + '\n    ').replace('#include <skinning_vertex>', '\n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    ');
};

function PrefabBufferGeometry(prefab, count) {
  three.BufferGeometry.call(this);

  /**
   * A reference to the prefab geometry used to create this instance.
   * @type {Geometry|BufferGeometry}
   */
  this.prefabGeometry = prefab;
  this.isPrefabBufferGeometry = prefab.isBufferGeometry;

  /**
   * Number of prefabs.
   * @type {Number}
   */
  this.prefabCount = count;

  /**
   * Number of vertices of the prefab.
   * @type {Number}
   */
  if (this.isPrefabBufferGeometry) {
    this.prefabVertexCount = prefab.attributes.position.count;
  } else {
    this.prefabVertexCount = prefab.vertices.length;
  }

  this.bufferIndices();
  this.bufferPositions();
}
PrefabBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
PrefabBufferGeometry.prototype.constructor = PrefabBufferGeometry;

PrefabBufferGeometry.prototype.bufferIndices = function () {
  var prefabIndices = [];
  var prefabIndexCount = void 0;

  if (this.isPrefabBufferGeometry) {
    if (this.prefabGeometry.index) {
      prefabIndexCount = this.prefabGeometry.index.count;
      prefabIndices = this.prefabGeometry.index.array;
    } else {
      prefabIndexCount = this.prefabVertexCount;

      for (var i = 0; i < prefabIndexCount; i++) {
        prefabIndices.push(i);
      }
    }
  } else {
    var prefabFaceCount = this.prefabGeometry.faces.length;
    prefabIndexCount = prefabFaceCount * 3;

    for (var _i = 0; _i < prefabFaceCount; _i++) {
      var face = this.prefabGeometry.faces[_i];
      prefabIndices.push(face.a, face.b, face.c);
    }
  }

  var indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);

  this.setIndex(new three.BufferAttribute(indexBuffer, 1));

  for (var _i2 = 0; _i2 < this.prefabCount; _i2++) {
    for (var k = 0; k < prefabIndexCount; k++) {
      indexBuffer[_i2 * prefabIndexCount + k] = prefabIndices[k] + _i2 * this.prefabVertexCount;
    }
  }
};

PrefabBufferGeometry.prototype.bufferPositions = function () {
  var positionBuffer = this.createAttribute('position', 3).array;

  if (this.isPrefabBufferGeometry) {
    var positions = this.prefabGeometry.attributes.position.array;

    for (var i = 0, offset = 0; i < this.prefabCount; i++) {
      for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
        positionBuffer[offset] = positions[j * 3];
        positionBuffer[offset + 1] = positions[j * 3 + 1];
        positionBuffer[offset + 2] = positions[j * 3 + 2];
      }
    }
  } else {
    for (var _i3 = 0, _offset = 0; _i3 < this.prefabCount; _i3++) {
      for (var _j = 0; _j < this.prefabVertexCount; _j++, _offset += 3) {
        var prefabVertex = this.prefabGeometry.vertices[_j];

        positionBuffer[_offset] = prefabVertex.x;
        positionBuffer[_offset + 1] = prefabVertex.y;
        positionBuffer[_offset + 2] = prefabVertex.z;
      }
    }
  }
};

/**
 * Creates a BufferAttribute with UV coordinates.
 */
PrefabBufferGeometry.prototype.bufferUvs = function () {
  var uvBuffer = this.createAttribute('uv', 2).array;

  if (this.isPrefabBufferGeometry) {
    var uvs = this.prefabGeometry.attributes.uv.array;

    for (var i = 0, offset = 0; i < this.prefabCount; i++) {
      for (var j = 0; j < this.prefabVertexCount; j++, offset += 2) {
        uvBuffer[offset] = uvs[j * 2];
        uvBuffer[offset + 1] = uvs[j * 2 + 1];
      }
    }
  } else {
    var prefabFaceCount = this.prefabGeometry.faces.length;
    var _uvs = [];

    for (var _i4 = 0; _i4 < prefabFaceCount; _i4++) {
      var face = this.prefabGeometry.faces[_i4];
      var uv = this.prefabGeometry.faceVertexUvs[0][_i4];

      _uvs[face.a] = uv[0];
      _uvs[face.b] = uv[1];
      _uvs[face.c] = uv[2];
    }

    for (var _i5 = 0, _offset2 = 0; _i5 < this.prefabCount; _i5++) {
      for (var _j2 = 0; _j2 < this.prefabVertexCount; _j2++, _offset2 += 2) {
        var _uv = _uvs[_j2];

        uvBuffer[_offset2] = _uv.x;
        uvBuffer[_offset2 + 1] = _uv.y;
      }
    }
  }
};

/**
 * Creates a BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {BufferAttribute}
 */
PrefabBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
  var attribute = new three.BufferAttribute(buffer, itemSize);

  this.setAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.prefabCount; i++) {
      factory(data, i, this.prefabCount);
      this.setPrefabData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a prefab at a given index.
 * Usually called in a loop.
 *
 * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
PrefabBufferGeometry.prototype.setPrefabData = function (attribute, prefabIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var offset = prefabIndex * this.prefabVertexCount * attribute.itemSize;

  for (var i = 0; i < this.prefabVertexCount; i++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

function MultiPrefabBufferGeometry(prefabs, repeatCount) {
  three.BufferGeometry.call(this);

  if (Array.isArray(prefabs)) {
    this.prefabGeometries = prefabs;
  } else {
    this.prefabGeometries = [prefabs];
  }

  this.prefabGeometriesCount = this.prefabGeometries.length;

  /**
   * Number of prefabs.
   * @type {Number}
   */
  this.prefabCount = repeatCount * this.prefabGeometriesCount;
  /**
   * How often the prefab array is repeated.
   * @type {Number}
   */
  this.repeatCount = repeatCount;

  /**
   * Array of vertex counts per prefab.
   * @type {Array}
   */
  this.prefabVertexCounts = this.prefabGeometries.map(function (p) {
    return p.isBufferGeometry ? p.attributes.position.count : p.vertices.length;
  });
  /**
   * Total number of vertices for one repetition of the prefabs
   * @type {number}
   */
  this.repeatVertexCount = this.prefabVertexCounts.reduce(function (r, v) {
    return r + v;
  }, 0);

  this.bufferIndices();
  this.bufferPositions();
}
MultiPrefabBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
MultiPrefabBufferGeometry.prototype.constructor = MultiPrefabBufferGeometry;

MultiPrefabBufferGeometry.prototype.bufferIndices = function () {
  var repeatIndexCount = 0;

  this.prefabIndices = this.prefabGeometries.map(function (geometry) {
    var indices = [];

    if (geometry.isBufferGeometry) {
      if (geometry.index) {
        indices = geometry.index.array;
      } else {
        for (var i = 0; i < geometry.attributes.position.count; i++) {
          indices.push(i);
        }
      }
    } else {
      for (var _i = 0; _i < geometry.faces.length; _i++) {
        var face = geometry.faces[_i];
        indices.push(face.a, face.b, face.c);
      }
    }

    repeatIndexCount += indices.length;

    return indices;
  });

  var indexBuffer = new Uint32Array(repeatIndexCount * this.repeatCount);
  var indexOffset = 0;
  var prefabOffset = 0;

  for (var i = 0; i < this.prefabCount; i++) {
    var index = i % this.prefabGeometriesCount;
    var indices = this.prefabIndices[index];
    var vertexCount = this.prefabVertexCounts[index];

    for (var j = 0; j < indices.length; j++) {
      indexBuffer[indexOffset++] = indices[j] + prefabOffset;
    }

    prefabOffset += vertexCount;
  }

  this.setIndex(new three.BufferAttribute(indexBuffer, 1));
};

MultiPrefabBufferGeometry.prototype.bufferPositions = function () {
  var _this = this;

  var positionBuffer = this.createAttribute('position', 3).array;

  var prefabPositions = this.prefabGeometries.map(function (geometry, i) {
    var positions = void 0;

    if (geometry.isBufferGeometry) {
      positions = geometry.attributes.position.array;
    } else {

      var vertexCount = _this.prefabVertexCounts[i];

      positions = [];

      for (var j = 0, offset = 0; j < vertexCount; j++) {
        var prefabVertex = geometry.vertices[j];

        positions[offset++] = prefabVertex.x;
        positions[offset++] = prefabVertex.y;
        positions[offset++] = prefabVertex.z;
      }
    }

    return positions;
  });

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    var index = i % this.prefabGeometries.length;
    var vertexCount = this.prefabVertexCounts[index];
    var positions = prefabPositions[index];

    for (var j = 0; j < vertexCount; j++) {
      positionBuffer[offset++] = positions[j * 3];
      positionBuffer[offset++] = positions[j * 3 + 1];
      positionBuffer[offset++] = positions[j * 3 + 2];
    }
  }
};

/**
 * Creates a BufferAttribute with UV coordinates.
 */
MultiPrefabBufferGeometry.prototype.bufferUvs = function () {
  var _this2 = this;

  var uvBuffer = this.createAttribute('uv', 2).array;

  var prefabUvs = this.prefabGeometries.map(function (geometry, i) {
    var uvs = void 0;

    if (geometry.isBufferGeometry) {
      if (!geometry.attributes.uv) {
        console.error('No UV found in prefab geometry', geometry);
      }

      uvs = geometry.attributes.uv.array;
    } else {
      var prefabFaceCount = _this2.prefabIndices[i].length / 3;
      var uvObjects = [];

      for (var j = 0; j < prefabFaceCount; j++) {
        var face = geometry.faces[j];
        var uv = geometry.faceVertexUvs[0][j];

        uvObjects[face.a] = uv[0];
        uvObjects[face.b] = uv[1];
        uvObjects[face.c] = uv[2];
      }

      uvs = [];

      for (var k = 0; k < uvObjects.length; k++) {
        uvs[k * 2] = uvObjects[k].x;
        uvs[k * 2 + 1] = uvObjects[k].y;
      }
    }

    return uvs;
  });

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {

    var index = i % this.prefabGeometries.length;
    var vertexCount = this.prefabVertexCounts[index];
    var uvs = prefabUvs[index];

    for (var j = 0; j < vertexCount; j++) {
      uvBuffer[offset++] = uvs[j * 2];
      uvBuffer[offset++] = uvs[j * 2 + 1];
    }
  }
};

/**
 * Creates a BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {BufferAttribute}
 */
MultiPrefabBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.repeatCount * this.repeatVertexCount * itemSize);
  var attribute = new three.BufferAttribute(buffer, itemSize);

  this.setAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.prefabCount; i++) {
      factory(data, i, this.prefabCount);
      this.setPrefabData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a prefab at a given index.
 * Usually called in a loop.
 *
 * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
MultiPrefabBufferGeometry.prototype.setPrefabData = function (attribute, prefabIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var prefabGeometryIndex = prefabIndex % this.prefabGeometriesCount;
  var prefabGeometryVertexCount = this.prefabVertexCounts[prefabGeometryIndex];
  var whole = (prefabIndex / this.prefabGeometriesCount | 0) * this.prefabGeometriesCount;
  var wholeOffset = whole * this.repeatVertexCount;
  var part = prefabIndex - whole;
  var partOffset = 0;
  var i = 0;

  while (i < part) {
    partOffset += this.prefabVertexCounts[i++];
  }

  var offset = (wholeOffset + partOffset) * attribute.itemSize;

  for (var _i2 = 0; _i2 < prefabGeometryVertexCount; _i2++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

function InstancedPrefabBufferGeometry(prefab, count) {
  if (prefab.isGeometry === true) {
    console.error('InstancedPrefabBufferGeometry prefab must be a BufferGeometry.');
  }

  three.InstancedBufferGeometry.call(this);

  this.prefabGeometry = prefab;
  this.copy(prefab);

  this.maxInstancedCount = count;
  this.prefabCount = count;
}
InstancedPrefabBufferGeometry.prototype = Object.create(three.InstancedBufferGeometry.prototype);
InstancedPrefabBufferGeometry.prototype.constructor = InstancedPrefabBufferGeometry;

/**
 * Creates a BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {BufferAttribute}
 */
InstancedPrefabBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.prefabCount * itemSize);
  var attribute = new three.InstancedBufferAttribute(buffer, itemSize);

  this.setAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.prefabCount; i++) {
      factory(data, i, this.prefabCount);
      this.setPrefabData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for a prefab at a given index.
 * Usually called in a loop.
 *
 * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
InstancedPrefabBufferGeometry.prototype.setPrefabData = function (attribute, prefabIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var offset = prefabIndex * attribute.itemSize;

  for (var j = 0; j < attribute.itemSize; j++) {
    attribute.array[offset++] = data[j];
  }
};

var Utils = {
  /**
   * Duplicates vertices so each face becomes separate.
   * Same as THREE.ExplodeModifier.
   *
   * @param {THREE.Geometry} geometry Geometry instance to modify.
   */
  separateFaces: function separateFaces(geometry) {
    var vertices = [];

    for (var i = 0, il = geometry.faces.length; i < il; i++) {
      var n = vertices.length;
      var face = geometry.faces[i];

      var a = face.a;
      var b = face.b;
      var c = face.c;

      var va = geometry.vertices[a];
      var vb = geometry.vertices[b];
      var vc = geometry.vertices[c];

      vertices.push(va.clone());
      vertices.push(vb.clone());
      vertices.push(vc.clone());

      face.a = n;
      face.b = n + 1;
      face.c = n + 2;
    }

    geometry.vertices = vertices;
  },

  /**
   * Compute the centroid (center) of a THREE.Face3.
   *
   * @param {THREE.Geometry} geometry Geometry instance the face is in.
   * @param {THREE.Face3} face Face object from the THREE.Geometry.faces array
   * @param {THREE.Vector3=} v Optional vector to store result in.
   * @returns {THREE.Vector3}
   */
  computeCentroid: function computeCentroid(geometry, face, v) {
    var a = geometry.vertices[face.a];
    var b = geometry.vertices[face.b];
    var c = geometry.vertices[face.c];

    v = v || new three.Vector3();

    v.x = (a.x + b.x + c.x) / 3;
    v.y = (a.y + b.y + c.y) / 3;
    v.z = (a.z + b.z + c.z) / 3;

    return v;
  },

  /**
   * Get a random vector between box.min and box.max.
   *
   * @param {THREE.Box3} box THREE.Box3 instance.
   * @param {THREE.Vector3=} v Optional vector to store result in.
   * @returns {THREE.Vector3}
   */
  randomInBox: function randomInBox(box, v) {
    v = v || new three.Vector3();

    v.x = three.Math.randFloat(box.min.x, box.max.x);
    v.y = three.Math.randFloat(box.min.y, box.max.y);
    v.z = three.Math.randFloat(box.min.z, box.max.z);

    return v;
  },

  /**
   * Get a random axis for quaternion rotation.
   *
   * @param {THREE.Vector3=} v Option vector to store result in.
   * @returns {THREE.Vector3}
   */
  randomAxis: function randomAxis(v) {
    v = v || new three.Vector3();

    v.x = three.Math.randFloatSpread(2.0);
    v.y = three.Math.randFloatSpread(2.0);
    v.z = three.Math.randFloatSpread(2.0);
    v.normalize();

    return v;
  },

  /**
   * Create a THREE.BAS.DepthAnimationMaterial for shadows from a THREE.SpotLight or THREE.DirectionalLight by copying relevant shader chunks.
   * Uniform values must be manually synced between the source material and the depth material.
   *
   * @see {@link http://three-bas-examples.surge.sh/examples/shadows/}
   *
   * @param {THREE.BAS.BaseAnimationMaterial} sourceMaterial Instance to get the shader chunks from.
   * @returns {THREE.BAS.DepthAnimationMaterial}
   */
  createDepthAnimationMaterial: function createDepthAnimationMaterial(sourceMaterial) {
    return new DepthAnimationMaterial({
      uniforms: sourceMaterial.uniforms,
      defines: sourceMaterial.defines,
      vertexFunctions: sourceMaterial.vertexFunctions,
      vertexParameters: sourceMaterial.vertexParameters,
      vertexInit: sourceMaterial.vertexInit,
      vertexPosition: sourceMaterial.vertexPosition
    });
  },

  /**
   * Create a THREE.BAS.DistanceAnimationMaterial for shadows from a THREE.PointLight by copying relevant shader chunks.
   * Uniform values must be manually synced between the source material and the distance material.
   *
   * @see {@link http://three-bas-examples.surge.sh/examples/shadows/}
   *
   * @param {THREE.BAS.BaseAnimationMaterial} sourceMaterial Instance to get the shader chunks from.
   * @returns {THREE.BAS.DistanceAnimationMaterial}
   */
  createDistanceAnimationMaterial: function createDistanceAnimationMaterial(sourceMaterial) {
    return new DistanceAnimationMaterial({
      uniforms: sourceMaterial.uniforms,
      defines: sourceMaterial.defines,
      vertexFunctions: sourceMaterial.vertexFunctions,
      vertexParameters: sourceMaterial.vertexParameters,
      vertexInit: sourceMaterial.vertexInit,
      vertexPosition: sourceMaterial.vertexPosition
    });
  }
};

function ModelBufferGeometry(model, options) {
  three.BufferGeometry.call(this);

  /**
   * A reference to the geometry used to create this instance.
   * @type {THREE.Geometry}
   */
  this.modelGeometry = model;

  /**
   * Number of faces of the model.
   * @type {Number}
   */
  this.faceCount = this.modelGeometry.faces.length;

  /**
   * Number of vertices of the model.
   * @type {Number}
   */
  this.vertexCount = this.modelGeometry.vertices.length;

  options = options || {};
  options.computeCentroids && this.computeCentroids();

  this.bufferIndices();
  this.bufferPositions(options.localizeFaces);
}
ModelBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
ModelBufferGeometry.prototype.constructor = ModelBufferGeometry;

/**
 * Computes a centroid for each face and stores it in THREE.BAS.ModelBufferGeometry.centroids.
 */
ModelBufferGeometry.prototype.computeCentroids = function () {
  /**
   * An array of centroids corresponding to the faces of the model.
   *
   * @type {Array}
   */
  this.centroids = [];

  for (var i = 0; i < this.faceCount; i++) {
    this.centroids[i] = Utils.computeCentroid(this.modelGeometry, this.modelGeometry.faces[i]);
  }
};

ModelBufferGeometry.prototype.bufferIndices = function () {
  var indexBuffer = new Uint32Array(this.faceCount * 3);

  this.setIndex(new three.BufferAttribute(indexBuffer, 1));

  for (var i = 0, offset = 0; i < this.faceCount; i++, offset += 3) {
    var face = this.modelGeometry.faces[i];

    indexBuffer[offset] = face.a;
    indexBuffer[offset + 1] = face.b;
    indexBuffer[offset + 2] = face.c;
  }
};

ModelBufferGeometry.prototype.bufferPositions = function (localizeFaces) {
  var positionBuffer = this.createAttribute('position', 3).array;
  var i = void 0,
      offset = void 0;

  if (localizeFaces === true) {
    for (i = 0; i < this.faceCount; i++) {
      var face = this.modelGeometry.faces[i];
      var centroid = this.centroids ? this.centroids[i] : Utils.computeCentroid(this.modelGeometry, face);

      var a = this.modelGeometry.vertices[face.a];
      var b = this.modelGeometry.vertices[face.b];
      var c = this.modelGeometry.vertices[face.c];

      positionBuffer[face.a * 3] = a.x - centroid.x;
      positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
      positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

      positionBuffer[face.b * 3] = b.x - centroid.x;
      positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
      positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

      positionBuffer[face.c * 3] = c.x - centroid.x;
      positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
      positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
    }
  } else {
    for (i = 0, offset = 0; i < this.vertexCount; i++, offset += 3) {
      var vertex = this.modelGeometry.vertices[i];

      positionBuffer[offset] = vertex.x;
      positionBuffer[offset + 1] = vertex.y;
      positionBuffer[offset + 2] = vertex.z;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute with UV coordinates.
 */
ModelBufferGeometry.prototype.bufferUvs = function () {
  var uvBuffer = this.createAttribute('uv', 2).array;

  for (var i = 0; i < this.faceCount; i++) {

    var face = this.modelGeometry.faces[i];
    var uv = void 0;

    uv = this.modelGeometry.faceVertexUvs[0][i][0];
    uvBuffer[face.a * 2] = uv.x;
    uvBuffer[face.a * 2 + 1] = uv.y;

    uv = this.modelGeometry.faceVertexUvs[0][i][1];
    uvBuffer[face.b * 2] = uv.x;
    uvBuffer[face.b * 2 + 1] = uv.y;

    uv = this.modelGeometry.faceVertexUvs[0][i][2];
    uvBuffer[face.c * 2] = uv.x;
    uvBuffer[face.c * 2 + 1] = uv.y;
  }
};

/**
 * Creates two THREE.BufferAttributes: skinIndex and skinWeight. Both are required for skinning.
 */
ModelBufferGeometry.prototype.bufferSkinning = function () {
  var skinIndexBuffer = this.createAttribute('skinIndex', 4).array;
  var skinWeightBuffer = this.createAttribute('skinWeight', 4).array;

  for (var i = 0; i < this.vertexCount; i++) {
    var skinIndex = this.modelGeometry.skinIndices[i];
    var skinWeight = this.modelGeometry.skinWeights[i];

    skinIndexBuffer[i * 4] = skinIndex.x;
    skinIndexBuffer[i * 4 + 1] = skinIndex.y;
    skinIndexBuffer[i * 4 + 2] = skinIndex.z;
    skinIndexBuffer[i * 4 + 3] = skinIndex.w;

    skinWeightBuffer[i * 4] = skinWeight.x;
    skinWeightBuffer[i * 4 + 1] = skinWeight.y;
    skinWeightBuffer[i * 4 + 2] = skinWeight.z;
    skinWeightBuffer[i * 4 + 3] = skinWeight.w;
  }
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {int} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each face upon creation. Accepts 3 arguments: data[], index and faceCount. Calls setFaceData.
 *
 * @returns {BufferAttribute}
 */
ModelBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.vertexCount * itemSize);
  var attribute = new three.BufferAttribute(buffer, itemSize);

  this.setAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.faceCount; i++) {
      factory(data, i, this.faceCount);
      this.setFaceData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a face at a given index.
 * Usually called in a loop.
 *
 * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {int} faceIndex Index of the face in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
ModelBufferGeometry.prototype.setFaceData = function (attribute, faceIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var offset = faceIndex * 3 * attribute.itemSize;

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

function PointBufferGeometry(count) {
  three.BufferGeometry.call(this);

  /**
   * Number of points.
   * @type {Number}
   */
  this.pointCount = count;

  this.bufferPositions();
}
PointBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
PointBufferGeometry.prototype.constructor = PointBufferGeometry;

PointBufferGeometry.prototype.bufferPositions = function () {
  this.createAttribute('position', 3);
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each point upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPointData.
 *
 * @returns {THREE.BufferAttribute}
 */
PointBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.pointCount * itemSize);
  var attribute = new three.BufferAttribute(buffer, itemSize);

  this.setAttribute(name, attribute);

  if (factory) {
    var data = [];
    for (var i = 0; i < this.pointCount; i++) {
      factory(data, i, this.pointCount);
      this.setPointData(attribute, i, data);
    }
  }

  return attribute;
};

PointBufferGeometry.prototype.setPointData = function (attribute, pointIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var offset = pointIndex * attribute.itemSize;

  for (var j = 0; j < attribute.itemSize; j++) {
    attribute.array[offset++] = data[j];
  }
};

var catmull_rom_spline = "vec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t, vec2 c) {\n    vec4 v0 = (p2 - p0) * c.x;\n    vec4 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n    return vec4((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\nvec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t, vec2 c) {\n    vec3 v0 = (p2 - p0) * c.x;\n    vec3 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\nvec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t, vec2 c) {\n    vec2 v0 = (p2 - p0) * c.x;\n    vec2 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n    return vec2((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\nfloat catmullRomSpline(float p0, float p1, float p2, float p3, float t, vec2 c) {\n    float v0 = (p2 - p0) * c.x;\n    float v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nfloat catmullRomSpline(float p0, float p1, float p2, float p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\nivec4 getCatmullRomSplineIndices(float l, float p) {\n    float index = floor(p);\n    int i0 = int(max(0.0, index - 1.0));\n    int i1 = int(index);\n    int i2 = int(min(index + 1.0, l));\n    int i3 = int(min(index + 2.0, l));\n    return ivec4(i0, i1, i2, i3);\n}\nivec4 getCatmullRomSplineIndicesClosed(float l, float p) {\n    float index = floor(p);\n    int i0 = int(index == 0.0 ? l : index - 1.0);\n    int i1 = int(index);\n    int i2 = int(mod(index + 1.0, l));\n    int i3 = int(mod(index + 2.0, l));\n    return ivec4(i0, i1, i2, i3);\n}\n";

var cubic_bezier = "vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) {\n    float tn = 1.0 - t;\n    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;\n}\nvec2 cubicBezier(vec2 p0, vec2 c0, vec2 c1, vec2 p1, float t) {\n    float tn = 1.0 - t;\n    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;\n}\n";

var ease_back_in = "float easeBackIn(float p, float amplitude) {\n    return p * p * ((amplitude + 1.0) * p - amplitude);\n}\nfloat easeBackIn(float p) {\n    return easeBackIn(p, 1.70158);\n}\nfloat easeBackIn(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackIn(t / d, amplitude) * c;\n}\nfloat easeBackIn(float t, float b, float c, float d) {\n    return b + easeBackIn(t / d) * c;\n}\n";

var ease_back_in_out = "float easeBackInOut(float p, float amplitude) {\n    amplitude *= 1.525;\n    return ((p *= 2.0) < 1.0) ? 0.5 * p * p * ((amplitude + 1.0) * p - amplitude) : 0.5 * ((p -= 2.0) * p * ((amplitude + 1.0) * p + amplitude) + 2.0);\n}\nfloat easeBackInOut(float p) {\n    return easeBackInOut(p, 1.70158);\n}\nfloat easeBackInOut(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackInOut(t / d, amplitude) * c;\n}\nfloat easeBackInOut(float t, float b, float c, float d) {\n    return b + easeBackInOut(t / d) * c;\n}\n";

var ease_back_out = "float easeBackOut(float p, float amplitude) {\n    return ((p = p - 1.0) * p * ((amplitude + 1.0) * p + amplitude) + 1.0);\n}\nfloat easeBackOut(float p) {\n    return easeBackOut(p, 1.70158);\n}\nfloat easeBackOut(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackOut(t / d, amplitude) * c;\n}\nfloat easeBackOut(float t, float b, float c, float d) {\n    return b + easeBackOut(t / d) * c;\n}\n";

var ease_bezier = "float easeBezier(float p, vec4 curve) {\n    float ip = 1.0 - p;\n    return (3.0 * ip * ip * p * curve.xy + 3.0 * ip * p * p * curve.zw + p * p * p).y;\n}\nfloat easeBezier(float t, float b, float c, float d, vec4 curve) {\n    return b + easeBezier(t / d, curve) * c;\n}\n";

var ease_bounce_in = "float easeBounceIn(float p) {\n    if ((p = 1.0 - p) < 1.0 / 2.75) {\n        return 1.0 - (7.5625 * p * p);\n    } else if (p < 2.0 / 2.75) {\n        return 1.0 - (7.5625 * (p -= 1.5 / 2.75) * p + 0.75);\n    } else if (p < 2.5 / 2.75) {\n        return 1.0 - (7.5625 * (p -= 2.25 / 2.75) * p + 0.9375);\n    }\n    return 1.0 - (7.5625 * (p -= 2.625 / 2.75) * p + 0.984375);\n}\nfloat easeBounceIn(float t, float b, float c, float d) {\n    return b + easeBounceIn(t / d) * c;\n}\n";

var ease_bounce_in_out = "float easeBounceInOut(float p) {\n    bool invert = (p < 0.5);\n    p = invert ? (1.0 - (p * 2.0)) : ((p * 2.0) - 1.0);\n    if (p < 1.0 / 2.75) {\n        p = 7.5625 * p * p;\n    } else if (p < 2.0 / 2.75) {\n        p = 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;\n    } else if (p < 2.5 / 2.75) {\n        p = 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;\n    } else {\n        p = 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;\n    }\n    return invert ? (1.0 - p) * 0.5 : p * 0.5 + 0.5;\n}\nfloat easeBounceInOut(float t, float b, float c, float d) {\n    return b + easeBounceInOut(t / d) * c;\n}\n";

var ease_bounce_out = "float easeBounceOut(float p) {\n    if (p < 1.0 / 2.75) {\n        return 7.5625 * p * p;\n    } else if (p < 2.0 / 2.75) {\n        return 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;\n    } else if (p < 2.5 / 2.75) {\n        return 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;\n    }\n    return 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;\n}\nfloat easeBounceOut(float t, float b, float c, float d) {\n    return b + easeBounceOut(t / d) * c;\n}\n";

var ease_circ_in = "float easeCircIn(float p) {\n    return -(sqrt(1.0 - p * p) - 1.0);\n}\nfloat easeCircIn(float t, float b, float c, float d) {\n    return b + easeCircIn(t / d) * c;\n}\n";

var ease_circ_in_out = "float easeCircInOut(float p) {\n    return ((p *= 2.0) < 1.0) ? -0.5 * (sqrt(1.0 - p * p) - 1.0) : 0.5 * (sqrt(1.0 - (p -= 2.0) * p) + 1.0);\n}\nfloat easeCircInOut(float t, float b, float c, float d) {\n    return b + easeCircInOut(t / d) * c;\n}\n";

var ease_circ_out = "float easeCircOut(float p) {\n  return sqrt(1.0 - (p = p - 1.0) * p);\n}\nfloat easeCircOut(float t, float b, float c, float d) {\n  return b + easeCircOut(t / d) * c;\n}\n";

var ease_cubic_in = "float easeCubicIn(float t) {\n  return t * t * t;\n}\nfloat easeCubicIn(float t, float b, float c, float d) {\n  return b + easeCubicIn(t / d) * c;\n}\n";

var ease_cubic_in_out = "float easeCubicInOut(float t) {\n  return (t /= 0.5) < 1.0 ? 0.5 * t * t * t : 0.5 * ((t-=2.0) * t * t + 2.0);\n}\nfloat easeCubicInOut(float t, float b, float c, float d) {\n  return b + easeCubicInOut(t / d) * c;\n}\n";

var ease_cubic_out = "float easeCubicOut(float t) {\n  float f = t - 1.0;\n  return f * f * f + 1.0;\n}\nfloat easeCubicOut(float t, float b, float c, float d) {\n  return b + easeCubicOut(t / d) * c;\n}\n";

var ease_elastic_in = "float easeElasticIn(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n    return -(p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2));\n}\nfloat easeElasticIn(float p) {\n    return easeElasticIn(p, 1.0, 0.3);\n}\nfloat easeElasticIn(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticIn(t / d, amplitude, period) * c;\n}\nfloat easeElasticIn(float t, float b, float c, float d) {\n    return b + easeElasticIn(t / d) * c;\n}\n";

var ease_elastic_in_out = "float easeElasticInOut(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n    return ((p *= 2.0) < 1.0) ? -0.5 * (p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2)) : p1 * pow(2.0, -10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2) * 0.5 + 1.0;\n}\nfloat easeElasticInOut(float p) {\n    return easeElasticInOut(p, 1.0, 0.3);\n}\nfloat easeElasticInOut(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticInOut(t / d, amplitude, period) * c;\n}\nfloat easeElasticInOut(float t, float b, float c, float d) {\n    return b + easeElasticInOut(t / d) * c;\n}\n";

var ease_elastic_out = "float easeElasticOut(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n    return p1 * pow(2.0, -10.0 * p) * sin((p - p3) * PI2 / p2) + 1.0;\n}\nfloat easeElasticOut(float p) {\n    return easeElasticOut(p, 1.0, 0.3);\n}\nfloat easeElasticOut(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticOut(t / d, amplitude, period) * c;\n}\nfloat easeElasticOut(float t, float b, float c, float d) {\n    return b + easeElasticOut(t / d) * c;\n}\n";

var ease_expo_in = "float easeExpoIn(float p) {\n    return pow(2.0, 10.0 * (p - 1.0));\n}\nfloat easeExpoIn(float t, float b, float c, float d) {\n    return b + easeExpoIn(t / d) * c;\n}\n";

var ease_expo_in_out = "float easeExpoInOut(float p) {\n    return ((p *= 2.0) < 1.0) ? 0.5 * pow(2.0, 10.0 * (p - 1.0)) : 0.5 * (2.0 - pow(2.0, -10.0 * (p - 1.0)));\n}\nfloat easeExpoInOut(float t, float b, float c, float d) {\n    return b + easeExpoInOut(t / d) * c;\n}\n";

var ease_expo_out = "float easeExpoOut(float p) {\n  return 1.0 - pow(2.0, -10.0 * p);\n}\nfloat easeExpoOut(float t, float b, float c, float d) {\n  return b + easeExpoOut(t / d) * c;\n}\n";

var ease_quad_in = "float easeQuadIn(float t) {\n    return t * t;\n}\nfloat easeQuadIn(float t, float b, float c, float d) {\n  return b + easeQuadIn(t / d) * c;\n}\n";

var ease_quad_in_out = "float easeQuadInOut(float t) {\n    float p = 2.0 * t * t;\n    return t < 0.5 ? p : -p + (4.0 * t) - 1.0;\n}\nfloat easeQuadInOut(float t, float b, float c, float d) {\n    return b + easeQuadInOut(t / d) * c;\n}\n";

var ease_quad_out = "float easeQuadOut(float t) {\n  return -t * (t - 2.0);\n}\nfloat easeQuadOut(float t, float b, float c, float d) {\n  return b + easeQuadOut(t / d) * c;\n}\n";

var ease_quart_in = "float easeQuartIn(float t) {\n  return t * t * t * t;\n}\nfloat easeQuartIn(float t, float b, float c, float d) {\n  return b + easeQuartIn(t / d) * c;\n}\n";

var ease_quart_in_out = "float easeQuartInOut(float t) {\n    return t < 0.5 ? 8.0 * pow(t, 4.0) : -8.0 * pow(t - 1.0, 4.0) + 1.0;\n}\nfloat easeQuartInOut(float t, float b, float c, float d) {\n    return b + easeQuartInOut(t / d) * c;\n}\n";

var ease_quart_out = "float easeQuartOut(float t) {\n  return 1.0 - pow(1.0 - t, 4.0);\n}\nfloat easeQuartOut(float t, float b, float c, float d) {\n  return b + easeQuartOut(t / d) * c;\n}\n";

var ease_quint_in = "float easeQuintIn(float t) {\n    return pow(t, 5.0);\n}\nfloat easeQuintIn(float t, float b, float c, float d) {\n    return b + easeQuintIn(t / d) * c;\n}\n";

var ease_quint_in_out = "float easeQuintInOut(float t) {\n    return (t /= 0.5) < 1.0 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2.0) * t * t * t * t + 2.0);\n}\nfloat easeQuintInOut(float t, float b, float c, float d) {\n    return b + easeQuintInOut(t / d) * c;\n}\n";

var ease_quint_out = "float easeQuintOut(float t) {\n    return (t -= 1.0) * t * t * t * t + 1.0;\n}\nfloat easeQuintOut(float t, float b, float c, float d) {\n    return b + easeQuintOut(t / d) * c;\n}\n";

var ease_sine_in = "float easeSineIn(float p) {\n  return -cos(p * 1.57079632679) + 1.0;\n}\nfloat easeSineIn(float t, float b, float c, float d) {\n  return b + easeSineIn(t / d) * c;\n}\n";

var ease_sine_in_out = "float easeSineInOut(float p) {\n  return -0.5 * (cos(PI * p) - 1.0);\n}\nfloat easeSineInOut(float t, float b, float c, float d) {\n  return b + easeSineInOut(t / d) * c;\n}\n";

var ease_sine_out = "float easeSineOut(float p) {\n  return sin(p * 1.57079632679);\n}\nfloat easeSineOut(float t, float b, float c, float d) {\n  return b + easeSineOut(t / d) * c;\n}\n";

var quadratic_bezier = "vec3 quadraticBezier(vec3 p0, vec3 c0, vec3 p1, float t) {\n    float tn = 1.0 - t;\n    return tn * tn * p0 + 2.0 * tn * t * c0 + t * t * p1;\n}\nvec2 quadraticBezier(vec2 p0, vec2 c0, vec2 p1, float t) {\n    float tn = 1.0 - t;\n    return tn * tn * p0 + 2.0 * tn * t * c0 + t * t * p1;\n}";

var quaternion_rotation = "vec3 rotateVector(vec4 q, vec3 v) {\n    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n}\nvec4 quatFromAxisAngle(vec3 axis, float angle) {\n    float halfAngle = angle * 0.5;\n    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));\n}\n";

var quaternion_slerp = "vec4 quatSlerp(vec4 q0, vec4 q1, float t) {\n    float s = 1.0 - t;\n    float c = dot(q0, q1);\n    float dir = -1.0;    float sqrSn = 1.0 - c * c;\n    if (sqrSn > 2.220446049250313e-16) {\n        float sn = sqrt(sqrSn);\n        float len = atan(sn, c * dir);\n        s = sin(s * len) / sn;\n        t = sin(t * len) / sn;\n    }\n    float tDir = t * dir;\n    return normalize(q0 * s + q1 * tDir);\n}\n";

// generated by scripts/build_shader_chunks.js

var ShaderChunk = {
  catmull_rom_spline: catmull_rom_spline,
  cubic_bezier: cubic_bezier,
  ease_back_in: ease_back_in,
  ease_back_in_out: ease_back_in_out,
  ease_back_out: ease_back_out,
  ease_bezier: ease_bezier,
  ease_bounce_in: ease_bounce_in,
  ease_bounce_in_out: ease_bounce_in_out,
  ease_bounce_out: ease_bounce_out,
  ease_circ_in: ease_circ_in,
  ease_circ_in_out: ease_circ_in_out,
  ease_circ_out: ease_circ_out,
  ease_cubic_in: ease_cubic_in,
  ease_cubic_in_out: ease_cubic_in_out,
  ease_cubic_out: ease_cubic_out,
  ease_elastic_in: ease_elastic_in,
  ease_elastic_in_out: ease_elastic_in_out,
  ease_elastic_out: ease_elastic_out,
  ease_expo_in: ease_expo_in,
  ease_expo_in_out: ease_expo_in_out,
  ease_expo_out: ease_expo_out,
  ease_quad_in: ease_quad_in,
  ease_quad_in_out: ease_quad_in_out,
  ease_quad_out: ease_quad_out,
  ease_quart_in: ease_quart_in,
  ease_quart_in_out: ease_quart_in_out,
  ease_quart_out: ease_quart_out,
  ease_quint_in: ease_quint_in,
  ease_quint_in_out: ease_quint_in_out,
  ease_quint_out: ease_quint_out,
  ease_sine_in: ease_sine_in,
  ease_sine_in_out: ease_sine_in_out,
  ease_sine_out: ease_sine_out,
  quadratic_bezier: quadratic_bezier,
  quaternion_rotation: quaternion_rotation,
  quaternion_slerp: quaternion_slerp

};

/**
 * A timeline transition segment. An instance of this class is created internally when calling {@link THREE.BAS.Timeline.add}, so you should not use this class directly.
 * The instance is also passed the the compiler function if you register a transition through {@link THREE.BAS.Timeline.register}. There you can use the public properties of the segment to compile the glsl string.
 * @param {string} key A string key generated by the timeline to which this segment belongs. Keys are unique.
 * @param {number} start Start time of this segment in a timeline in seconds.
 * @param {number} duration Duration of this segment in seconds.
 * @param {object} transition Object describing the transition.
 * @param {function} compiler A reference to the compiler function from a transition definition.
 * @constructor
 */
function TimelineSegment(key, start, duration, transition, compiler) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.transition = transition;
  this.compiler = compiler;

  this.trail = 0;
}

TimelineSegment.prototype.compile = function () {
  return this.compiler(this);
};

Object.defineProperty(TimelineSegment.prototype, 'end', {
  get: function get() {
    return this.start + this.duration;
  }
});

function Timeline() {
  /**
   * The total duration of the timeline in seconds.
   * @type {number}
   */
  this.duration = 0;

  /**
   * The name of the value that segments will use to read the time. Defaults to 'tTime'.
   * @type {string}
   */
  this.timeKey = 'tTime';

  this.segments = {};
  this.__key = 0;
}

// static definitions map
Timeline.segmentDefinitions = {};

/**
 * Registers a transition definition for use with {@link THREE.BAS.Timeline.add}.
 * @param {String} key Name of the transition. Defaults include 'scale', 'rotate' and 'translate'.
 * @param {Object} definition
 * @param {Function} definition.compiler A function that generates a glsl string for a transition segment. Accepts a THREE.BAS.TimelineSegment as the sole argument.
 * @param {*} definition.defaultFrom The initial value for a transform.from. For example, the defaultFrom for a translation is THREE.Vector3(0, 0, 0).
 * @static
 */
Timeline.register = function (key, definition) {
  Timeline.segmentDefinitions[key] = definition;

  return definition;
};

/**
 * Add a transition to the timeline.
 * @param {number} duration Duration in seconds
 * @param {object} transitions An object containing one or several transitions. The keys should match transform definitions.
 * The transition object for each key will be passed to the matching definition's compiler. It can have arbitrary properties, but the Timeline expects at least a 'to', 'from' and an optional 'ease'.
 * @param {number|string} [positionOffset] Position in the timeline. Defaults to the end of the timeline. If a number is provided, the transition will be inserted at that time in seconds. Strings ('+=x' or '-=x') can be used for a value relative to the end of timeline.
 */
Timeline.prototype.add = function (duration, transitions, positionOffset) {
  // stop rollup from complaining about eval
  var _eval = eval;

  var start = this.duration;

  if (positionOffset !== undefined) {
    if (typeof positionOffset === 'number') {
      start = positionOffset;
    } else if (typeof positionOffset === 'string') {
      _eval('start' + positionOffset);
    }

    this.duration = Math.max(this.duration, start + duration);
  } else {
    this.duration += duration;
  }

  var keys = Object.keys(transitions),
      key = void 0;

  for (var i = 0; i < keys.length; i++) {
    key = keys[i];

    this.processTransition(key, transitions[key], start, duration);
  }
};

Timeline.prototype.processTransition = function (key, transition, start, duration) {
  var definition = Timeline.segmentDefinitions[key];

  var segments = this.segments[key];
  if (!segments) segments = this.segments[key] = [];

  if (transition.from === undefined) {
    if (segments.length === 0) {
      transition.from = definition.defaultFrom;
    } else {
      transition.from = segments[segments.length - 1].transition.to;
    }
  }

  segments.push(new TimelineSegment((this.__key++).toString(), start, duration, transition, definition.compiler));
};

/**
 * Compiles the timeline into a glsl string array that can be injected into a (vertex) shader.
 * @returns {Array}
 */
Timeline.prototype.compile = function () {
  var c = [];

  var keys = Object.keys(this.segments);
  var segments = void 0;

  for (var i = 0; i < keys.length; i++) {
    segments = this.segments[keys[i]];

    this.fillGaps(segments);

    segments.forEach(function (s) {
      c.push(s.compile());
    });
  }

  return c;
};
Timeline.prototype.fillGaps = function (segments) {
  if (segments.length === 0) return;

  var s0 = void 0,
      s1 = void 0;

  for (var i = 0; i < segments.length - 1; i++) {
    s0 = segments[i];
    s1 = segments[i + 1];

    s0.trail = s1.start - s0.end;
  }

  // pad last segment until end of timeline
  s0 = segments[segments.length - 1];
  s0.trail = this.duration - s0.end;
};

/**
 * Get a compiled glsl string with calls to transform functions for a given key.
 * The order in which these transitions are applied matters because they all operate on the same value.
 * @param {string} key A key matching a transform definition.
 * @returns {string}
 */
Timeline.prototype.getTransformCalls = function (key) {
  var t = this.timeKey;

  return this.segments[key] ? this.segments[key].map(function (s) {
    return 'applyTransform' + s.key + '(' + t + ', transformed);';
  }).join('\n') : '';
};

var TimelineChunks = {
  vec3: function vec3(n, v, p) {
    var x = (v.x || 0).toPrecision(p);
    var y = (v.y || 0).toPrecision(p);
    var z = (v.z || 0).toPrecision(p);

    return "vec3 " + n + " = vec3(" + x + ", " + y + ", " + z + ");";
  },
  vec4: function vec4(n, v, p) {
    var x = (v.x || 0).toPrecision(p);
    var y = (v.y || 0).toPrecision(p);
    var z = (v.z || 0).toPrecision(p);
    var w = (v.w || 0).toPrecision(p);

    return "vec4 " + n + " = vec4(" + x + ", " + y + ", " + z + ", " + w + ");";
  },
  delayDuration: function delayDuration(segment) {
    return "\n    float cDelay" + segment.key + " = " + segment.start.toPrecision(4) + ";\n    float cDuration" + segment.key + " = " + segment.duration.toPrecision(4) + ";\n    ";
  },
  progress: function progress(segment) {
    // zero duration segments should always render complete
    if (segment.duration === 0) {
      return "float progress = 1.0;";
    } else {
      return "\n      float progress = clamp(time - cDelay" + segment.key + ", 0.0, cDuration" + segment.key + ") / cDuration" + segment.key + ";\n      " + (segment.transition.ease ? "progress = " + segment.transition.ease + "(progress" + (segment.transition.easeParams ? ", " + segment.transition.easeParams.map(function (v) {
        return v.toPrecision(4);
      }).join(", ") : "") + ");" : "") + "\n      ";
    }
  },
  renderCheck: function renderCheck(segment) {
    var startTime = segment.start.toPrecision(4);
    var endTime = (segment.end + segment.trail).toPrecision(4);

    return "if (time < " + startTime + " || time > " + endTime + ") return;";
  }
};

var TranslationSegment = {
  compiler: function compiler(segment) {
    return '\n    ' + TimelineChunks.delayDuration(segment) + '\n    ' + TimelineChunks.vec3('cTranslateFrom' + segment.key, segment.transition.from, 2) + '\n    ' + TimelineChunks.vec3('cTranslateTo' + segment.key, segment.transition.to, 2) + '\n    \n    void applyTransform' + segment.key + '(float time, inout vec3 v) {\n    \n      ' + TimelineChunks.renderCheck(segment) + '\n      ' + TimelineChunks.progress(segment) + '\n    \n      v += mix(cTranslateFrom' + segment.key + ', cTranslateTo' + segment.key + ', progress);\n    }\n    ';
  },
  defaultFrom: new three.Vector3(0, 0, 0)
};

Timeline.register('translate', TranslationSegment);

var ScaleSegment = {
  compiler: function compiler(segment) {
    var origin = segment.transition.origin;

    return '\n    ' + TimelineChunks.delayDuration(segment) + '\n    ' + TimelineChunks.vec3('cScaleFrom' + segment.key, segment.transition.from, 2) + '\n    ' + TimelineChunks.vec3('cScaleTo' + segment.key, segment.transition.to, 2) + '\n    ' + (origin ? TimelineChunks.vec3('cOrigin' + segment.key, origin, 2) : '') + '\n    \n    void applyTransform' + segment.key + '(float time, inout vec3 v) {\n    \n      ' + TimelineChunks.renderCheck(segment) + '\n      ' + TimelineChunks.progress(segment) + '\n    \n      ' + (origin ? 'v -= cOrigin' + segment.key + ';' : '') + '\n      v *= mix(cScaleFrom' + segment.key + ', cScaleTo' + segment.key + ', progress);\n      ' + (origin ? 'v += cOrigin' + segment.key + ';' : '') + '\n    }\n    ';
  },
  defaultFrom: new three.Vector3(1, 1, 1)
};

Timeline.register('scale', ScaleSegment);

var RotationSegment = {
  compiler: function compiler(segment) {
    var fromAxisAngle = new three.Vector4(segment.transition.from.axis.x, segment.transition.from.axis.y, segment.transition.from.axis.z, segment.transition.from.angle);

    var toAxis = segment.transition.to.axis || segment.transition.from.axis;
    var toAxisAngle = new three.Vector4(toAxis.x, toAxis.y, toAxis.z, segment.transition.to.angle);

    var origin = segment.transition.origin;

    return '\n    ' + TimelineChunks.delayDuration(segment) + '\n    ' + TimelineChunks.vec4('cRotationFrom' + segment.key, fromAxisAngle, 8) + '\n    ' + TimelineChunks.vec4('cRotationTo' + segment.key, toAxisAngle, 8) + '\n    ' + (origin ? TimelineChunks.vec3('cOrigin' + segment.key, origin, 2) : '') + '\n    \n    void applyTransform' + segment.key + '(float time, inout vec3 v) {\n      ' + TimelineChunks.renderCheck(segment) + '\n      ' + TimelineChunks.progress(segment) + '\n\n      ' + (origin ? 'v -= cOrigin' + segment.key + ';' : '') + '\n      vec3 axis = normalize(mix(cRotationFrom' + segment.key + '.xyz, cRotationTo' + segment.key + '.xyz, progress));\n      float angle = mix(cRotationFrom' + segment.key + '.w, cRotationTo' + segment.key + '.w, progress);\n      vec4 q = quatFromAxisAngle(axis, angle);\n      v = rotateVector(q, v);\n      ' + (origin ? 'v += cOrigin' + segment.key + ';' : '') + '\n    }\n    ';
  },

  defaultFrom: { axis: new three.Vector3(), angle: 0 }
};

Timeline.register('rotate', RotationSegment);

exports.BasicAnimationMaterial = BasicAnimationMaterial;
exports.LambertAnimationMaterial = LambertAnimationMaterial;
exports.PhongAnimationMaterial = PhongAnimationMaterial;
exports.StandardAnimationMaterial = StandardAnimationMaterial;
exports.ToonAnimationMaterial = ToonAnimationMaterial;
exports.PointsAnimationMaterial = PointsAnimationMaterial;
exports.DepthAnimationMaterial = DepthAnimationMaterial;
exports.DistanceAnimationMaterial = DistanceAnimationMaterial;
exports.PrefabBufferGeometry = PrefabBufferGeometry;
exports.MultiPrefabBufferGeometry = MultiPrefabBufferGeometry;
exports.InstancedPrefabBufferGeometry = InstancedPrefabBufferGeometry;
exports.ModelBufferGeometry = ModelBufferGeometry;
exports.PointBufferGeometry = PointBufferGeometry;
exports.ShaderChunk = ShaderChunk;
exports.Timeline = Timeline;
exports.TimelineSegment = TimelineSegment;
exports.TimelineChunks = TimelineChunks;
exports.TranslationSegment = TranslationSegment;
exports.ScaleSegment = ScaleSegment;
exports.RotationSegment = RotationSegment;
exports.Utils = Utils;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvQmFzaWNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Ub29uQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL1BvaW50c0FuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL2dlb21ldHJ5L1ByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L011bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvVXRpbHMuanMiLCIuLi9zcmMvZ2VvbWV0cnkvTW9kZWxCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9Qb2ludEJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1NoYWRlckNodW5rLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZS5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZUNodW5rcy5qcyIsIi4uL3NyYy90aW1lbGluZS9UcmFuc2xhdGlvblNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvU2NhbGVTZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1JvdGF0aW9uU2VnbWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBNYXRlcmlhbCxcbiAgU2hhZGVyTWF0ZXJpYWwsXG4gIFVuaWZvcm1zVXRpbHMsXG59IGZyb20gJ3RocmVlJztcblxuZnVuY3Rpb24gQmFzZUFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMsIHVuaWZvcm1zKSB7XG4gIFNoYWRlck1hdGVyaWFsLmNhbGwodGhpcyk7XG5cbiAgaWYgKHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcykge1xuICAgIGNvbnNvbGUud2FybignVEhSRUUuQkFTIC0gYHVuaWZvcm1WYWx1ZXNgIGlzIGRlcHJlY2F0ZWQuIFB1dCB0aGVpciB2YWx1ZXMgZGlyZWN0bHkgaW50byB0aGUgcGFyYW1ldGVycy4nKVxuXG4gICAgT2JqZWN0LmtleXMocGFyYW1ldGVycy51bmlmb3JtVmFsdWVzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIHBhcmFtZXRlcnNba2V5XSA9IHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlc1trZXldXG4gICAgfSlcblxuICAgIGRlbGV0ZSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXNcbiAgfVxuXG4gIC8vIGNvcHkgcGFyYW1ldGVycyB0byAoMSkgbWFrZSB1c2Ugb2YgaW50ZXJuYWwgI2RlZmluZSBnZW5lcmF0aW9uXG4gIC8vIGFuZCAoMikgcHJldmVudCAneCBpcyBub3QgYSBwcm9wZXJ0eSBvZiB0aGlzIG1hdGVyaWFsJyB3YXJuaW5ncy5cbiAgT2JqZWN0LmtleXMocGFyYW1ldGVycykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgdGhpc1trZXldID0gcGFyYW1ldGVyc1trZXldXG4gIH0pXG5cbiAgLy8gb3ZlcnJpZGUgZGVmYXVsdCBwYXJhbWV0ZXIgdmFsdWVzXG4gIHRoaXMuc2V0VmFsdWVzKHBhcmFtZXRlcnMpO1xuXG4gIC8vIG92ZXJyaWRlIHVuaWZvcm1zXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFt1bmlmb3JtcywgcGFyYW1ldGVycy51bmlmb3JtcyB8fCB7fV0pO1xuXG4gIC8vIHNldCB1bmlmb3JtIHZhbHVlcyBmcm9tIHBhcmFtZXRlcnMgdGhhdCBhZmZlY3QgdW5pZm9ybXNcbiAgdGhpcy5zZXRVbmlmb3JtVmFsdWVzKHBhcmFtZXRlcnMpO1xufVxuXG5CYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKFNoYWRlck1hdGVyaWFsLnByb3RvdHlwZSksIHtcbiAgY29uc3RydWN0b3I6IEJhc2VBbmltYXRpb25NYXRlcmlhbCxcblxuICBzZXRVbmlmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm47XG5cbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKTtcblxuICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBrZXkgaW4gdGhpcy51bmlmb3JtcyAmJiAodGhpcy51bmlmb3Jtc1trZXldLnZhbHVlID0gdmFsdWVzW2tleV0pO1xuICAgIH0pO1xuICB9LFxuXG4gIHN0cmluZ2lmeUNodW5rKG5hbWUpIHtcbiAgICBsZXQgdmFsdWU7XG5cbiAgICBpZiAoIXRoaXNbbmFtZV0pIHtcbiAgICAgIHZhbHVlID0gJyc7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzW25hbWVdID09PSAgJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV0uam9pbignXFxuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsO1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfYmFzaWMvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQmFzaWNBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnYmFzaWMnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy5saWdodHMgPSBmYWxzZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFNoYWRlckxpYi5iYXNpYy52ZXJ0ZXhTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgIGBcbiAgICApXG59O1xuXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gU2hhZGVyTGliLmJhc2ljLmZyYWdtZW50U2hhZGVyXG4gICAgLnJlcGxhY2UoXG4gICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gICAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgICBgXG4gICAgKVxufTtcblxuZXhwb3J0IHsgQmFzaWNBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19sYW1iZXJ0L1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIExhbWJlcnRBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnbGFtYmVydCddLnVuaWZvcm1zKTtcblxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbDtcblxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBTaGFkZXJMaWIubGFtYmVydC52ZXJ0ZXhTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgICAgYFxuICAgIClcbn07XG5cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBTaGFkZXJMaWIubGFtYmVydC5mcmFnbWVudFNoYWRlclxuICAgIC5yZXBsYWNlKFxuICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuXG4gICAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gICAgICBgXG4gICAgKVxuICByZXR1cm4gYFxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG5cbiAgdmFyeWluZyB2ZWMzIHZMaWdodEZyb250O1xuICB2YXJ5aW5nIHZlYzMgdkluZGlyZWN0RnJvbnQ7XG5cbiAgI2lmZGVmIERPVUJMRV9TSURFRFxuICAgIHZhcnlpbmcgdmVjMyB2TGlnaHRCYWNrO1xuICAgIHZhcnlpbmcgdmVjMyB2SW5kaXJlY3RCYWNrO1xuICAjZW5kaWZcblxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9jb21tb25fcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y3ViZV91dl9yZWZsZWN0aW9uX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnNkZnM+XG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19iZWdpbj5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXNrX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuXG4gICAgLy8gYWNjdW11bGF0aW9uXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlID0gZ2V0QW1iaWVudExpZ2h0SXJyYWRpYW5jZSggYW1iaWVudExpZ2h0Q29sb3IgKTtcblxuICAgICNpZmRlZiBET1VCTEVfU0lERURcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSAoIGdsX0Zyb250RmFjaW5nICkgPyB2SW5kaXJlY3RGcm9udCA6IHZJbmRpcmVjdEJhY2s7XG4gICAgI2Vsc2VcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB2SW5kaXJlY3RGcm9udDtcbiAgICAjZW5kaWZcblxuICAgICNpbmNsdWRlIDxsaWdodG1hcF9mcmFnbWVudD5cblxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApO1xuXG4gICAgI2lmZGVmIERPVUJMRV9TSURFRFxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9ICggZ2xfRnJvbnRGYWNpbmcgKSA/IHZMaWdodEZyb250IDogdkxpZ2h0QmFjaztcbiAgICAjZWxzZVxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9IHZMaWdodEZyb250O1xuICAgICNlbmRpZlxuXG4gICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApICogZ2V0U2hhZG93TWFzaygpO1xuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG5cbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xuXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cblxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG5cbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19waG9uZy9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwaG9uZyddLnVuaWZvcm1zKTtcblxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGhvbmdBbmltYXRpb25NYXRlcmlhbDtcblxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gU2hhZGVyTGliLnBob25nLnZlcnRleFNoYWRlclxuICAgIC5yZXBsYWNlKFxuICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICBgXG4gICAgKVxufTtcblxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBTaGFkZXJMaWIucGhvbmcuZnJhZ21lbnRTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bGlnaHRzX3Bob25nX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX2ZyYWdtZW50PlxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNwZWN1bGFyJyl9XG4gICAgICBgXG4gICAgKVxufTtcblxuZXhwb3J0IHsgUGhvbmdBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoU3RhbmRhcmRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfc3RhbmRhcmQvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncGh5c2ljYWwnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLmV4dGVuc2lvbnMgPSAodGhpcy5leHRlbnNpb25zIHx8IHt9KTtcbiAgdGhpcy5leHRlbnNpb25zLmRlcml2YXRpdmVzID0gdHJ1ZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBTaGFkZXJMaWIuc3RhbmRhcmQudmVydGV4U2hhZGVyXG4gICAgLnJlcGxhY2UoXG4gICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgIGBcbiAgICApXG59O1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFNoYWRlckxpYi5zdGFuZGFyZC5mcmFnbWVudFNoYWRlclxuICAgIC5yZXBsYWNlKFxuICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuXG4gICAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxyb3VnaG5lc3NtYXBfZnJhZ21lbnQ+JyxcbiAgICAgIGBcbiAgICAgIGZsb2F0IHJvdWdobmVzc0ZhY3RvciA9IHJvdWdobmVzcztcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRSb3VnaG5lc3MnKX1cbiAgICAgICNpZmRlZiBVU0VfUk9VR0hORVNTTUFQXG5cbiAgICAgIHZlYzQgdGV4ZWxSb3VnaG5lc3MgPSB0ZXh0dXJlMkQoIHJvdWdobmVzc01hcCwgdlV2ICk7XG4gICAgICAgIHJvdWdobmVzc0ZhY3RvciAqPSB0ZXhlbFJvdWdobmVzcy5nO1xuICAgICAgI2VuZGlmXG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxtZXRhbG5lc3NtYXBfZnJhZ21lbnQ+JyxcbiAgICAgIGBcbiAgICAgIGZsb2F0IG1ldGFsbmVzc0ZhY3RvciA9IG1ldGFsbmVzcztcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNZXRhbG5lc3MnKX1cblxuICAgICAgI2lmZGVmIFVTRV9NRVRBTE5FU1NNQVBcbiAgICAgICAgdmVjNCB0ZXhlbE1ldGFsbmVzcyA9IHRleHR1cmUyRCggbWV0YWxuZXNzTWFwLCB2VXYgKTtcbiAgICAgICAgbWV0YWxuZXNzRmFjdG9yICo9IHRleGVsTWV0YWxuZXNzLmI7XG4gICAgICAjZW5kaWZcbiAgICAgIGBcbiAgICApXG59O1xuXG5leHBvcnQgeyBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hUb29uTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy4gTWVzaFRvb25NYXRlcmlhbCBpcyBtb3N0bHkgdGhlIHNhbWUgYXMgTWVzaFBob25nTWF0ZXJpYWwuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXMgYSBUT09OIGRlZmluZSwgYW5kIHN1cHBvcnQgZm9yIGEgZ3JhZGllbnRNYXAgdW5pZm9ybS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUb29uQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICBpZiAoIXBhcmFtZXRlcnMuZGVmaW5lcykge1xuICAgIHBhcmFtZXRlcnMuZGVmaW5lcyA9IHt9XG4gIH1cbiAgcGFyYW1ldGVycy5kZWZpbmVzWydUT09OJ10gPSAnJ1xuXG4gIFBob25nQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcbn1cblRvb25BbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblRvb25BbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUb29uQW5pbWF0aW9uTWF0ZXJpYWw7XG5cbmV4cG9ydCB7IFRvb25BbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5Qb2ludHNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwb2ludHMnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWw7XG5cblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBTaGFkZXJMaWIucG9pbnRzLnZlcnRleFNoYWRlclxuICAgIC5yZXBsYWNlKFxuICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICBgXG4gICAgKVxufTtcblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gU2hhZGVyTGliLnBvaW50cy5mcmFnbWVudFNoYWRlclxuICAgIC5yZXBsYWNlKFxuICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD4nLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNoYXBlJyl9XG5cbiAgICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICAgYFxuICAgIClcbn07XG5cbmV4cG9ydCB7IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuZnVuY3Rpb24gRGVwdGhBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydkZXB0aCddLnVuaWZvcm1zKTtcblxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2RlcHRoJ10uZnJhZ21lbnRTaGFkZXI7XG59XG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFNoYWRlckxpYi5kZXB0aC52ZXJ0ZXhTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgICAgYFxuICAgIClcbn07XG5cbmV4cG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgVW5pZm9ybXNVdGlscywgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5mdW5jdGlvbiBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLnVuaWZvcm1zKTtcblxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLmZyYWdtZW50U2hhZGVyO1xufVxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBTaGFkZXJMaWIuZGlzdGFuY2VSR0JBLnZlcnRleFNoYWRlclxuICAucmVwbGFjZShcbiAgICAndm9pZCBtYWluKCkgeycsXG4gICAgYFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICB2b2lkIG1haW4oKSB7XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICBgXG4gIClcbiAgLnJlcGxhY2UoXG4gICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICBgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICBgXG4gIClcbiAgLnJlcGxhY2UoXG4gICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICBgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgYFxuICApXG4gIC5yZXBsYWNlKFxuICAgICcjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PicsXG4gICAgYFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgIGBcbiAgKVxufTtcblxuZXhwb3J0IHsgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbi8qKlxuICogQSBCdWZmZXJHZW9tZXRyeSB3aGVyZSBhICdwcmVmYWInIGdlb21ldHJ5IGlzIHJlcGVhdGVkIGEgbnVtYmVyIG9mIHRpbWVzLlxuICpcbiAqIEBwYXJhbSB7R2VvbWV0cnl8QnVmZmVyR2VvbWV0cnl9IHByZWZhYiBUaGUgR2VvbWV0cnkgaW5zdGFuY2UgdG8gcmVwZWF0LlxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBnZW9tZXRyeS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWIsIGNvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBwcmVmYWIgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cbiAgICogQHR5cGUge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fVxuICAgKi9cbiAgdGhpcy5wcmVmYWJHZW9tZXRyeSA9IHByZWZhYjtcbiAgdGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5ID0gcHJlZmFiLmlzQnVmZmVyR2VvbWV0cnk7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIHByZWZhYi5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi52ZXJ0aWNlcy5sZW5ndGg7XG4gIH1cblxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbn1cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByZWZhYkJ1ZmZlckdlb21ldHJ5O1xuXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xuICBsZXQgcHJlZmFiSW5kaWNlcyA9IFtdO1xuICBsZXQgcHJlZmFiSW5kZXhDb3VudDtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgaWYgKHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXgpIHtcbiAgICAgIHByZWZhYkluZGV4Q291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4LmNvdW50O1xuICAgICAgcHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguYXJyYXk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiSW5kZXhDb3VudDsgaSsrKSB7XG4gICAgICAgIHByZWZhYkluZGljZXMucHVzaChpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG4gICAgcHJlZmFiSW5kZXhDb3VudCA9IHByZWZhYkZhY2VDb3VudCAqIDM7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIHByZWZhYkluZGljZXMucHVzaChmYWNlLmEsIGZhY2UuYiwgZmFjZS5jKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogcHJlZmFiSW5kZXhDb3VudCk7XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBrID0gMDsgayA8IHByZWZhYkluZGV4Q291bnQ7IGsrKykge1xuICAgICAgaW5kZXhCdWZmZXJbaSAqIHByZWZhYkluZGV4Q291bnQgKyBrXSA9IHByZWZhYkluZGljZXNba10gKyBpICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcbiAgICB9XG4gIH1cbn07XG5cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgY29uc3QgcG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHBvc2l0aW9uc1tqICogM107XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcG9zaXRpb25zW2ogKiAzICsgMV07XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS52ZXJ0aWNlc1tqXTtcblxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHByZWZhYlZlcnRleC54O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHByZWZhYlZlcnRleC55O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHByZWZhYlZlcnRleC56O1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgY29uc3QgdXZzID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgIHV2QnVmZmVyW29mZnNldCAgICBdID0gdXZzW2ogKiAyXTtcbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0ICsgMV0gPSB1dnNbaiAqIDIgKyAxXTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG4gICAgY29uc3QgdXZzID0gW11cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiRmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgY29uc3QgdXYgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV07XG5cbiAgICAgIHV2c1tmYWNlLmFdID0gdXZbMF07XG4gICAgICB1dnNbZmFjZS5iXSA9IHV2WzFdO1xuICAgICAgdXZzW2ZhY2UuY10gPSB1dlsyXTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgIGNvbnN0IHV2ID0gdXZzW2pdO1xuXG4gICAgICAgIHV2QnVmZmVyW29mZnNldF0gPSB1di54O1xuICAgICAgICB1dkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHV2Lnk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGxldCBvZmZzZXQgPSBwcmVmYWJJbmRleCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCB7IFByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIEJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgYXJyYXkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcHJlZmFicyBBbiBhcnJheSB3aXRoIEdlb21ldHJ5IGluc3RhbmNlcyB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gcmVwZWF0Q291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGFycmF5IG9mIEdlb21ldHJpZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWJzLCByZXBlYXRDb3VudCkge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHByZWZhYnMpKSB7XG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gcHJlZmFicztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnByZWZhYkdlb21ldHJpZXMgPSBbcHJlZmFic107XG4gIH1cblxuICB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wcmVmYWJDb3VudCA9IHJlcGVhdENvdW50ICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gIC8qKlxuICAgKiBIb3cgb2Z0ZW4gdGhlIHByZWZhYiBhcnJheSBpcyByZXBlYXRlZC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMucmVwZWF0Q291bnQgPSByZXBlYXRDb3VudDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgdmVydGV4IGNvdW50cyBwZXIgcHJlZmFiLlxuICAgKiBAdHlwZSB7QXJyYXl9XG4gICAqL1xuICB0aGlzLnByZWZhYlZlcnRleENvdW50cyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAocCA9PiBwLmlzQnVmZmVyR2VvbWV0cnkgPyBwLmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQgOiBwLnZlcnRpY2VzLmxlbmd0aCk7XG4gIC8qKlxuICAgKiBUb3RhbCBudW1iZXIgb2YgdmVydGljZXMgZm9yIG9uZSByZXBldGl0aW9uIG9mIHRoZSBwcmVmYWJzXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICB0aGlzLnJlcGVhdFZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMucmVkdWNlKChyLCB2KSA9PiByICsgdiwgMCk7XG5cbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XG59XG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeTtcblxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xuICBsZXQgcmVwZWF0SW5kZXhDb3VudCA9IDA7XG5cbiAgdGhpcy5wcmVmYWJJbmRpY2VzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcChnZW9tZXRyeSA9PiB7XG4gICAgbGV0IGluZGljZXMgPSBbXTtcblxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBpZiAoZ2VvbWV0cnkuaW5kZXgpIHtcbiAgICAgICAgaW5kaWNlcyA9IGdlb21ldHJ5LmluZGV4LmFycmF5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50OyBpKyspIHtcbiAgICAgICAgICBpbmRpY2VzLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICAgIGluZGljZXMucHVzaChmYWNlLmEsIGZhY2UuYiwgZmFjZS5jKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXBlYXRJbmRleENvdW50ICs9IGluZGljZXMubGVuZ3RoO1xuXG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH0pO1xuXG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHJlcGVhdEluZGV4Q291bnQgKiB0aGlzLnJlcGVhdENvdW50KTtcbiAgbGV0IGluZGV4T2Zmc2V0ID0gMDtcbiAgbGV0IHByZWZhYk9mZnNldCA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5wcmVmYWJJbmRpY2VzW2luZGV4XTtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5kaWNlcy5sZW5ndGg7IGorKykge1xuICAgICAgaW5kZXhCdWZmZXJbaW5kZXhPZmZzZXQrK10gPSBpbmRpY2VzW2pdICsgcHJlZmFiT2Zmc2V0O1xuICAgIH1cblxuICAgIHByZWZhYk9mZnNldCArPSB2ZXJ0ZXhDb3VudDtcbiAgfVxuXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xufTtcblxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG5cbiAgY29uc3QgcHJlZmFiUG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcCgoZ2VvbWV0cnksIGkpID0+IHtcbiAgICBsZXQgcG9zaXRpb25zO1xuXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIHBvc2l0aW9ucyA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpXTtcblxuICAgICAgcG9zaXRpb25zID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwLCBvZmZzZXQgPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSBnZW9tZXRyeS52ZXJ0aWNlc1tqXTtcblxuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lng7XG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXgueTtcbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC56O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH0pO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBwcmVmYWJQb3NpdGlvbnNbaW5kZXhdO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDNdO1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzICsgMV07XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDMgKyAyXTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxuICovXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcblxuICBjb25zdCBwcmVmYWJVdnMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKChnZW9tZXRyeSwgaSkgPT4ge1xuICAgIGxldCB1dnM7XG5cbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgaWYgKCFnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIFVWIGZvdW5kIGluIHByZWZhYiBnZW9tZXRyeScsIGdlb21ldHJ5KTtcbiAgICAgIH1cblxuICAgICAgdXZzID0gZ2VvbWV0cnkuYXR0cmlidXRlcy51di5hcnJheTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJJbmRpY2VzW2ldLmxlbmd0aCAvIDM7XG4gICAgICBjb25zdCB1dk9iamVjdHMgPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcmVmYWJGYWNlQ291bnQ7IGorKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbal07XG4gICAgICAgIGNvbnN0IHV2ID0gZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtqXTtcblxuICAgICAgICB1dk9iamVjdHNbZmFjZS5hXSA9IHV2WzBdO1xuICAgICAgICB1dk9iamVjdHNbZmFjZS5iXSA9IHV2WzFdO1xuICAgICAgICB1dk9iamVjdHNbZmFjZS5jXSA9IHV2WzJdO1xuICAgICAgfVxuXG4gICAgICB1dnMgPSBbXTtcblxuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCB1dk9iamVjdHMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgdXZzW2sgKiAyXSA9IHV2T2JqZWN0c1trXS54O1xuICAgICAgICB1dnNbayAqIDIgKyAxXSA9IHV2T2JqZWN0c1trXS55O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1dnM7XG4gIH0pO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG5cbiAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXMubGVuZ3RoO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuICAgIGNvbnN0IHV2cyA9IHByZWZhYlV2c1tpbmRleF07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMl07XG4gICAgICB1dkJ1ZmZlcltvZmZzZXQrK10gPSB1dnNbaiAqIDIgKyAxXTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXG4gKlxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnJlcGVhdENvdW50ICogdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wcmVmYWJDb3VudCk7XG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGNvbnN0IHByZWZhYkdlb21ldHJ5SW5kZXggPSBwcmVmYWJJbmRleCAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICBjb25zdCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbcHJlZmFiR2VvbWV0cnlJbmRleF07XG4gIGNvbnN0IHdob2xlID0gKHByZWZhYkluZGV4IC8gdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQgfCAwKSAqIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICBjb25zdCB3aG9sZU9mZnNldCA9IHdob2xlICogdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudDtcbiAgY29uc3QgcGFydCA9IHByZWZhYkluZGV4IC0gd2hvbGU7XG4gIGxldCBwYXJ0T2Zmc2V0ID0gMDtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlKGkgPCBwYXJ0KSB7XG4gICAgcGFydE9mZnNldCArPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpKytdO1xuICB9XG5cbiAgbGV0IG9mZnNldCA9ICh3aG9sZU9mZnNldCArIHBhcnRPZmZzZXQpICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgeyBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBJbnN0YW5jZWRCdWZmZXJHZW9tZXRyeSwgSW5zdGFuY2VkQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIFRIUkVFLkluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LCB3aGljaCBpcyBtb3JlIG1lbW9yeSBlZmZpY2llbnQgdGhhbiBQcmVmYWJCdWZmZXJHZW9tZXRyeSwgYnV0IHJlcXVpcmVzIHRoZSBBTkdMRV9pbnN0YW5jZWRfYXJyYXlzIGV4dGVuc2lvbi5cbiAqXG4gKiBAcGFyYW0ge0J1ZmZlckdlb21ldHJ5fSBwcmVmYWIgVGhlIEdlb21ldHJ5IGluc3RhbmNlIHRvIHJlcGVhdC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgZ2VvbWV0cnkuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYiwgY291bnQpIHtcbiAgaWYgKHByZWZhYi5pc0dlb21ldHJ5ID09PSB0cnVlKSB7XG4gICAgY29uc29sZS5lcnJvcignSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkgcHJlZmFiIG11c3QgYmUgYSBCdWZmZXJHZW9tZXRyeS4nKVxuICB9XG5cbiAgSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xuICB0aGlzLmNvcHkocHJlZmFiKVxuXG4gIHRoaXMubWF4SW5zdGFuY2VkQ291bnQgPSBjb3VudFxuICB0aGlzLnByZWZhYkNvdW50ID0gY291bnQ7XG59XG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgSW5zdGFuY2VkQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbkluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgfVxufTtcblxuZXhwb3J0IHsgSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IE1hdGggYXMgdE1hdGgsIFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbCc7XG5pbXBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiB1dGlsaXR5IGZ1bmN0aW9ucy5cbiAqIEBuYW1lc3BhY2VcbiAqL1xuY29uc3QgVXRpbHMgPSB7XG4gIC8qKlxuICAgKiBEdXBsaWNhdGVzIHZlcnRpY2VzIHNvIGVhY2ggZmFjZSBiZWNvbWVzIHNlcGFyYXRlLlxuICAgKiBTYW1lIGFzIFRIUkVFLkV4cGxvZGVNb2RpZmllci5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdG8gbW9kaWZ5LlxuICAgKi9cbiAgc2VwYXJhdGVGYWNlczogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG4gICAgbGV0IHZlcnRpY2VzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQgbiA9IHZlcnRpY2VzLmxlbmd0aDtcbiAgICAgIGxldCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgIGxldCBhID0gZmFjZS5hO1xuICAgICAgbGV0IGIgPSBmYWNlLmI7XG4gICAgICBsZXQgYyA9IGZhY2UuYztcblxuICAgICAgbGV0IHZhID0gZ2VvbWV0cnkudmVydGljZXNbYV07XG4gICAgICBsZXQgdmIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tiXTtcbiAgICAgIGxldCB2YyA9IGdlb21ldHJ5LnZlcnRpY2VzW2NdO1xuXG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZhLmNsb25lKCkpO1xuICAgICAgdmVydGljZXMucHVzaCh2Yi5jbG9uZSgpKTtcbiAgICAgIHZlcnRpY2VzLnB1c2godmMuY2xvbmUoKSk7XG5cbiAgICAgIGZhY2UuYSA9IG47XG4gICAgICBmYWNlLmIgPSBuICsgMTtcbiAgICAgIGZhY2UuYyA9IG4gKyAyO1xuICAgIH1cblxuICAgIGdlb21ldHJ5LnZlcnRpY2VzID0gdmVydGljZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbXB1dGUgdGhlIGNlbnRyb2lkIChjZW50ZXIpIG9mIGEgVEhSRUUuRmFjZTMuXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRoZSBmYWNlIGlzIGluLlxuICAgKiBAcGFyYW0ge1RIUkVFLkZhY2UzfSBmYWNlIEZhY2Ugb2JqZWN0IGZyb20gdGhlIFRIUkVFLkdlb21ldHJ5LmZhY2VzIGFycmF5XG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICBjb21wdXRlQ2VudHJvaWQ6IGZ1bmN0aW9uKGdlb21ldHJ5LCBmYWNlLCB2KSB7XG4gICAgbGV0IGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xuICAgIGxldCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICBsZXQgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gKGEueCArIGIueCArIGMueCkgLyAzO1xuICAgIHYueSA9IChhLnkgKyBiLnkgKyBjLnkpIC8gMztcbiAgICB2LnogPSAoYS56ICsgYi56ICsgYy56KSAvIDM7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgcmFuZG9tIHZlY3RvciBiZXR3ZWVuIGJveC5taW4gYW5kIGJveC5tYXguXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQm94M30gYm94IFRIUkVFLkJveDMgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICByYW5kb21JbkJveDogZnVuY3Rpb24oYm94LCB2KSB7XG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLngsIGJveC5tYXgueCk7XG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueSwgYm94Lm1heC55KTtcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi56LCBib3gubWF4LnopO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIHJhbmRvbSBheGlzIGZvciBxdWF0ZXJuaW9uIHJvdGF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbiB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIHJhbmRvbUF4aXM6IGZ1bmN0aW9uKHYpIHtcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi5ub3JtYWxpemUoKTtcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuU3BvdExpZ2h0IG9yIFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkZXB0aCBtYXRlcmlhbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsfVxuICAgKi9cbiAgY3JlYXRlRGVwdGhBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gbmV3IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwoe1xuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlBvaW50TGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkaXN0YW5jZSBtYXRlcmlhbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsfVxuICAgKi9cbiAgY3JlYXRlRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gbmV3IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwoe1xuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IHsgVXRpbHMgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4uL1V0aWxzJztcblxuLyoqXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGZvciBhbmltYXRpbmcgaW5kaXZpZHVhbCBmYWNlcyBvZiBhIFRIUkVFLkdlb21ldHJ5LlxuICpcbiAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IG1vZGVsIFRoZSBUSFJFRS5HZW9tZXRyeSB0byBiYXNlIHRoaXMgZ2VvbWV0cnkgb24uXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyBJZiB0cnVlLCBhIGNlbnRyb2lkcyB3aWxsIGJlIGNvbXB1dGVkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlZCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmxvY2FsaXplRmFjZXMgSWYgdHJ1ZSwgdGhlIHBvc2l0aW9ucyBmb3IgZWFjaCBmYWNlIHdpbGwgYmUgc3RvcmVkIHJlbGF0aXZlIHRvIHRoZSBjZW50cm9pZC4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gcm90YXRlIG9yIHNjYWxlIGZhY2VzIGFyb3VuZCB0aGVpciBjZW50ZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTW9kZWxCdWZmZXJHZW9tZXRyeShtb2RlbCwgb3B0aW9ucykge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cbiAgICogQHR5cGUge1RIUkVFLkdlb21ldHJ5fVxuICAgKi9cbiAgdGhpcy5tb2RlbEdlb21ldHJ5ID0gbW9kZWw7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBmYWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLmZhY2VDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnZlcnRleENvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aDtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzICYmIHRoaXMuY29tcHV0ZUNlbnRyb2lkcygpO1xuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucyhvcHRpb25zLmxvY2FsaXplRmFjZXMpO1xufVxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vZGVsQnVmZmVyR2VvbWV0cnk7XG5cbi8qKlxuICogQ29tcHV0ZXMgYSBjZW50cm9pZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZXMgaXQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb21wdXRlQ2VudHJvaWRzID0gZnVuY3Rpb24oKSB7XG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBjZW50cm9pZHMgY29ycmVzcG9uZGluZyB0byB0aGUgZmFjZXMgb2YgdGhlIG1vZGVsLlxuICAgKlxuICAgKiBAdHlwZSB7QXJyYXl9XG4gICAqL1xuICB0aGlzLmNlbnRyb2lkcyA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgIHRoaXMuY2VudHJvaWRzW2ldID0gVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldKTtcbiAgfVxufTtcblxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLmZhY2VDb3VudCAqIDMpO1xuXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICAgIF0gPSBmYWNlLmE7XG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMV0gPSBmYWNlLmI7XG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMl0gPSBmYWNlLmM7XG4gIH1cbn07XG5cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKGxvY2FsaXplRmFjZXMpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcbiAgbGV0IGksIG9mZnNldDtcblxuICBpZiAobG9jYWxpemVGYWNlcyA9PT0gdHJ1ZSkge1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgY29uc3QgY2VudHJvaWQgPSB0aGlzLmNlbnRyb2lkcyA/IHRoaXMuY2VudHJvaWRzW2ldIDogVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgZmFjZSk7XG5cbiAgICAgIGNvbnN0IGEgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICAgIGNvbnN0IGIgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICAgIGNvbnN0IGMgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogM10gICAgID0gYS54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAxXSA9IGEueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMl0gPSBhLnogLSBjZW50cm9pZC56O1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzXSAgICAgPSBiLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDFdID0gYi55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDMgKyAyXSA9IGIueiAtIGNlbnRyb2lkLno7XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDNdICAgICA9IGMueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMV0gPSBjLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDJdID0gYy56IC0gY2VudHJvaWQuejtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgIGNvbnN0IHZlcnRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tpXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSB2ZXJ0ZXgueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gdmVydGV4Lnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHZlcnRleC56O1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICBsZXQgdXY7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzBdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5hICogMiArIDFdID0gdXYueTtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMV07XG4gICAgdXZCdWZmZXJbZmFjZS5iICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyICsgMV0gPSB1di55O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsyXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDIgKyAxXSA9IHV2Lnk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyB0d28gVEhSRUUuQnVmZmVyQXR0cmlidXRlczogc2tpbkluZGV4IGFuZCBza2luV2VpZ2h0LiBCb3RoIGFyZSByZXF1aXJlZCBmb3Igc2tpbm5pbmcuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclNraW5uaW5nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHNraW5JbmRleEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luSW5kZXgnLCA0KS5hcnJheTtcbiAgY29uc3Qgc2tpbldlaWdodEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luV2VpZ2h0JywgNCkuYXJyYXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyspIHtcbiAgICBjb25zdCBza2luSW5kZXggPSB0aGlzLm1vZGVsR2VvbWV0cnkuc2tpbkluZGljZXNbaV07XG4gICAgY29uc3Qgc2tpbldlaWdodCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luV2VpZ2h0c1tpXTtcblxuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCAgICBdID0gc2tpbkluZGV4Lng7XG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgMV0gPSBza2luSW5kZXgueTtcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5JbmRleC56O1xuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDNdID0gc2tpbkluZGV4Lnc7XG5cbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICAgIF0gPSBza2luV2VpZ2h0Lng7XG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDFdID0gc2tpbldlaWdodC55O1xuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5XZWlnaHQuejtcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgM10gPSBza2luV2VpZ2h0Lnc7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7aW50fSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBmYWNlIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIGZhY2VDb3VudC4gQ2FsbHMgc2V0RmFjZURhdGEuXG4gKlxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5mYWNlQ291bnQpO1xuICAgICAgdGhpcy5zZXRGYWNlRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgZmFjZSBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtpbnR9IGZhY2VJbmRleCBJbmRleCBvZiB0aGUgZmFjZSBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRGYWNlRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgZmFjZUluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gZmFjZUluZGV4ICogMyAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgTW9kZWxCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGNvbnNpc3RzIG9mIHBvaW50cy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHBvaW50cy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQb2ludEJ1ZmZlckdlb21ldHJ5KGNvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwb2ludHMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnBvaW50Q291bnQgPSBjb3VudDtcblxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50QnVmZmVyR2VvbWV0cnk7XG5cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwb2ludCB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UG9pbnREYXRhLlxuICpcbiAqIEByZXR1cm5zIHtUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9XG4gKi9cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb2ludENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvaW50Q291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnBvaW50Q291bnQpO1xuICAgICAgdGhpcy5zZXRQb2ludERhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UG9pbnREYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwb2ludEluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gcG9pbnRJbmRleCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gIH1cbn07XG5cbmV4cG9ydCB7IFBvaW50QnVmZmVyR2VvbWV0cnkgfTtcbiIsIi8vIGdlbmVyYXRlZCBieSBzY3JpcHRzL2J1aWxkX3NoYWRlcl9jaHVua3MuanNcblxuaW1wb3J0IGNhdG11bGxfcm9tX3NwbGluZSBmcm9tICcuL2dsc2wvY2F0bXVsbF9yb21fc3BsaW5lLmdsc2wnO1xuaW1wb3J0IGN1YmljX2JlemllciBmcm9tICcuL2dsc2wvY3ViaWNfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbiBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JlemllciBmcm9tICcuL2dsc2wvZWFzZV9iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2Vfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbiBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW4gZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9vdXQuZ2xzbCc7XG5pbXBvcnQgcXVhZHJhdGljX2JlemllciBmcm9tICcuL2dsc2wvcXVhZHJhdGljX2Jlemllci5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3JvdGF0aW9uIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3JvdGF0aW9uLmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fc2xlcnAgZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fc2xlcnAuZ2xzbCc7XG5cblxuZXhwb3J0IGNvbnN0IFNoYWRlckNodW5rID0ge1xuICBjYXRtdWxsX3JvbV9zcGxpbmU6IGNhdG11bGxfcm9tX3NwbGluZSxcbiAgY3ViaWNfYmV6aWVyOiBjdWJpY19iZXppZXIsXG4gIGVhc2VfYmFja19pbjogZWFzZV9iYWNrX2luLFxuICBlYXNlX2JhY2tfaW5fb3V0OiBlYXNlX2JhY2tfaW5fb3V0LFxuICBlYXNlX2JhY2tfb3V0OiBlYXNlX2JhY2tfb3V0LFxuICBlYXNlX2JlemllcjogZWFzZV9iZXppZXIsXG4gIGVhc2VfYm91bmNlX2luOiBlYXNlX2JvdW5jZV9pbixcbiAgZWFzZV9ib3VuY2VfaW5fb3V0OiBlYXNlX2JvdW5jZV9pbl9vdXQsXG4gIGVhc2VfYm91bmNlX291dDogZWFzZV9ib3VuY2Vfb3V0LFxuICBlYXNlX2NpcmNfaW46IGVhc2VfY2lyY19pbixcbiAgZWFzZV9jaXJjX2luX291dDogZWFzZV9jaXJjX2luX291dCxcbiAgZWFzZV9jaXJjX291dDogZWFzZV9jaXJjX291dCxcbiAgZWFzZV9jdWJpY19pbjogZWFzZV9jdWJpY19pbixcbiAgZWFzZV9jdWJpY19pbl9vdXQ6IGVhc2VfY3ViaWNfaW5fb3V0LFxuICBlYXNlX2N1YmljX291dDogZWFzZV9jdWJpY19vdXQsXG4gIGVhc2VfZWxhc3RpY19pbjogZWFzZV9lbGFzdGljX2luLFxuICBlYXNlX2VsYXN0aWNfaW5fb3V0OiBlYXNlX2VsYXN0aWNfaW5fb3V0LFxuICBlYXNlX2VsYXN0aWNfb3V0OiBlYXNlX2VsYXN0aWNfb3V0LFxuICBlYXNlX2V4cG9faW46IGVhc2VfZXhwb19pbixcbiAgZWFzZV9leHBvX2luX291dDogZWFzZV9leHBvX2luX291dCxcbiAgZWFzZV9leHBvX291dDogZWFzZV9leHBvX291dCxcbiAgZWFzZV9xdWFkX2luOiBlYXNlX3F1YWRfaW4sXG4gIGVhc2VfcXVhZF9pbl9vdXQ6IGVhc2VfcXVhZF9pbl9vdXQsXG4gIGVhc2VfcXVhZF9vdXQ6IGVhc2VfcXVhZF9vdXQsXG4gIGVhc2VfcXVhcnRfaW46IGVhc2VfcXVhcnRfaW4sXG4gIGVhc2VfcXVhcnRfaW5fb3V0OiBlYXNlX3F1YXJ0X2luX291dCxcbiAgZWFzZV9xdWFydF9vdXQ6IGVhc2VfcXVhcnRfb3V0LFxuICBlYXNlX3F1aW50X2luOiBlYXNlX3F1aW50X2luLFxuICBlYXNlX3F1aW50X2luX291dDogZWFzZV9xdWludF9pbl9vdXQsXG4gIGVhc2VfcXVpbnRfb3V0OiBlYXNlX3F1aW50X291dCxcbiAgZWFzZV9zaW5lX2luOiBlYXNlX3NpbmVfaW4sXG4gIGVhc2Vfc2luZV9pbl9vdXQ6IGVhc2Vfc2luZV9pbl9vdXQsXG4gIGVhc2Vfc2luZV9vdXQ6IGVhc2Vfc2luZV9vdXQsXG4gIHF1YWRyYXRpY19iZXppZXI6IHF1YWRyYXRpY19iZXppZXIsXG4gIHF1YXRlcm5pb25fcm90YXRpb246IHF1YXRlcm5pb25fcm90YXRpb24sXG4gIHF1YXRlcm5pb25fc2xlcnA6IHF1YXRlcm5pb25fc2xlcnAsXG5cbn07XG5cbiIsIi8qKlxuICogQSB0aW1lbGluZSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgY3JlYXRlZCBpbnRlcm5hbGx5IHdoZW4gY2FsbGluZyB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0sIHNvIHlvdSBzaG91bGQgbm90IHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5LlxuICogVGhlIGluc3RhbmNlIGlzIGFsc28gcGFzc2VkIHRoZSB0aGUgY29tcGlsZXIgZnVuY3Rpb24gaWYgeW91IHJlZ2lzdGVyIGEgdHJhbnNpdGlvbiB0aHJvdWdoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUucmVnaXN0ZXJ9LiBUaGVyZSB5b3UgY2FuIHVzZSB0aGUgcHVibGljIHByb3BlcnRpZXMgb2YgdGhlIHNlZ21lbnQgdG8gY29tcGlsZSB0aGUgZ2xzbCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEgc3RyaW5nIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHRpbWVsaW5lIHRvIHdoaWNoIHRoaXMgc2VnbWVudCBiZWxvbmdzLiBLZXlzIGFyZSB1bmlxdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU3RhcnQgdGltZSBvZiB0aGlzIHNlZ21lbnQgaW4gYSB0aW1lbGluZSBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIG9mIHRoaXMgc2VnbWVudCBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb24gT2JqZWN0IGRlc2NyaWJpbmcgdGhlIHRyYW5zaXRpb24uXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb21waWxlciBBIHJlZmVyZW5jZSB0byB0aGUgY29tcGlsZXIgZnVuY3Rpb24gZnJvbSBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lbGluZVNlZ21lbnQoa2V5LCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGNvbXBpbGVyKSB7XG4gIHRoaXMua2V5ID0ga2V5O1xuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgdGhpcy50cmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyO1xuXG4gIHRoaXMudHJhaWwgPSAwO1xufVxuXG5UaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuY29tcGlsZXIodGhpcyk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZSwgJ2VuZCcsIHtcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFydCArIHRoaXMuZHVyYXRpb247XG4gIH1cbn0pO1xuXG5leHBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9IGZyb20gJy4vVGltZWxpbmVTZWdtZW50JztcblxuLyoqXG4gKiBBIHV0aWxpdHkgY2xhc3MgdG8gY3JlYXRlIGFuIGFuaW1hdGlvbiB0aW1lbGluZSB3aGljaCBjYW4gYmUgYmFrZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEJ5IGRlZmF1bHQgdGhlIHRpbWVsaW5lIHN1cHBvcnRzIHRyYW5zbGF0aW9uLCBzY2FsZSBhbmQgcm90YXRpb24uIFRoaXMgY2FuIGJlIGV4dGVuZGVkIG9yIG92ZXJyaWRkZW4uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZWxpbmUoKSB7XG4gIC8qKlxuICAgKiBUaGUgdG90YWwgZHVyYXRpb24gb2YgdGhlIHRpbWVsaW5lIGluIHNlY29uZHMuXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICB0aGlzLmR1cmF0aW9uID0gMDtcblxuICAvKipcbiAgICogVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRoYXQgc2VnbWVudHMgd2lsbCB1c2UgdG8gcmVhZCB0aGUgdGltZS4gRGVmYXVsdHMgdG8gJ3RUaW1lJy5cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMudGltZUtleSA9ICd0VGltZSc7XG5cbiAgdGhpcy5zZWdtZW50cyA9IHt9O1xuICB0aGlzLl9fa2V5ID0gMDtcbn1cblxuLy8gc3RhdGljIGRlZmluaXRpb25zIG1hcFxuVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zID0ge307XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uIGZvciB1c2Ugd2l0aCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0uXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IE5hbWUgb2YgdGhlIHRyYW5zaXRpb24uIERlZmF1bHRzIGluY2x1ZGUgJ3NjYWxlJywgJ3JvdGF0ZScgYW5kICd0cmFuc2xhdGUnLlxuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRlZmluaXRpb24uY29tcGlsZXIgQSBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBhIGdsc2wgc3RyaW5nIGZvciBhIHRyYW5zaXRpb24gc2VnbWVudC4gQWNjZXB0cyBhIFRIUkVFLkJBUy5UaW1lbGluZVNlZ21lbnQgYXMgdGhlIHNvbGUgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp9IGRlZmluaXRpb24uZGVmYXVsdEZyb20gVGhlIGluaXRpYWwgdmFsdWUgZm9yIGEgdHJhbnNmb3JtLmZyb20uIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdEZyb20gZm9yIGEgdHJhbnNsYXRpb24gaXMgVEhSRUUuVmVjdG9yMygwLCAwLCAwKS5cbiAqIEBzdGF0aWNcbiAqL1xuVGltZWxpbmUucmVnaXN0ZXIgPSBmdW5jdGlvbihrZXksIGRlZmluaXRpb24pIHtcbiAgVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV0gPSBkZWZpbml0aW9uO1xuICBcbiAgcmV0dXJuIGRlZmluaXRpb247XG59O1xuXG4vKipcbiAqIEFkZCBhIHRyYW5zaXRpb24gdG8gdGhlIHRpbWVsaW5lLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIGluIHNlY29uZHNcbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3Igc2V2ZXJhbCB0cmFuc2l0aW9ucy4gVGhlIGtleXMgc2hvdWxkIG1hdGNoIHRyYW5zZm9ybSBkZWZpbml0aW9ucy5cbiAqIFRoZSB0cmFuc2l0aW9uIG9iamVjdCBmb3IgZWFjaCBrZXkgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIG1hdGNoaW5nIGRlZmluaXRpb24ncyBjb21waWxlci4gSXQgY2FuIGhhdmUgYXJiaXRyYXJ5IHByb3BlcnRpZXMsIGJ1dCB0aGUgVGltZWxpbmUgZXhwZWN0cyBhdCBsZWFzdCBhICd0bycsICdmcm9tJyBhbmQgYW4gb3B0aW9uYWwgJ2Vhc2UnLlxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbcG9zaXRpb25PZmZzZXRdIFBvc2l0aW9uIGluIHRoZSB0aW1lbGluZS4gRGVmYXVsdHMgdG8gdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCB0aGUgdHJhbnNpdGlvbiB3aWxsIGJlIGluc2VydGVkIGF0IHRoYXQgdGltZSBpbiBzZWNvbmRzLiBTdHJpbmdzICgnKz14JyBvciAnLT14JykgY2FuIGJlIHVzZWQgZm9yIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIGVuZCBvZiB0aW1lbGluZS5cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGR1cmF0aW9uLCB0cmFuc2l0aW9ucywgcG9zaXRpb25PZmZzZXQpIHtcbiAgLy8gc3RvcCByb2xsdXAgZnJvbSBjb21wbGFpbmluZyBhYm91dCBldmFsXG4gIGNvbnN0IF9ldmFsID0gZXZhbDtcbiAgXG4gIGxldCBzdGFydCA9IHRoaXMuZHVyYXRpb247XG5cbiAgaWYgKHBvc2l0aW9uT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgc3RhcnQgPSBwb3NpdGlvbk9mZnNldDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgX2V2YWwoJ3N0YXJ0JyArIHBvc2l0aW9uT2Zmc2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLmR1cmF0aW9uID0gTWF0aC5tYXgodGhpcy5kdXJhdGlvbiwgc3RhcnQgKyBkdXJhdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5kdXJhdGlvbiArPSBkdXJhdGlvbjtcbiAgfVxuXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXModHJhbnNpdGlvbnMpLCBrZXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0ga2V5c1tpXTtcblxuICAgIHRoaXMucHJvY2Vzc1RyYW5zaXRpb24oa2V5LCB0cmFuc2l0aW9uc1trZXldLCBzdGFydCwgZHVyYXRpb24pO1xuICB9XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUucHJvY2Vzc1RyYW5zaXRpb24gPSBmdW5jdGlvbihrZXksIHRyYW5zaXRpb24sIHN0YXJ0LCBkdXJhdGlvbikge1xuICBjb25zdCBkZWZpbml0aW9uID0gVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV07XG5cbiAgbGV0IHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldO1xuICBpZiAoIXNlZ21lbnRzKSBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XSA9IFtdO1xuXG4gIGlmICh0cmFuc2l0aW9uLmZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IGRlZmluaXRpb24uZGVmYXVsdEZyb207XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0udHJhbnNpdGlvbi50bztcbiAgICB9XG4gIH1cblxuICBzZWdtZW50cy5wdXNoKG5ldyBUaW1lbGluZVNlZ21lbnQoKHRoaXMuX19rZXkrKykudG9TdHJpbmcoKSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBkZWZpbml0aW9uLmNvbXBpbGVyKSk7XG59O1xuXG4vKipcbiAqIENvbXBpbGVzIHRoZSB0aW1lbGluZSBpbnRvIGEgZ2xzbCBzdHJpbmcgYXJyYXkgdGhhdCBjYW4gYmUgaW5qZWN0ZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgYyA9IFtdO1xuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZ21lbnRzKTtcbiAgbGV0IHNlZ21lbnRzO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXlzW2ldXTtcblxuICAgIHRoaXMuZmlsbEdhcHMoc2VnbWVudHMpO1xuXG4gICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICBjLnB1c2gocy5jb21waWxlKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGM7XG59O1xuVGltZWxpbmUucHJvdG90eXBlLmZpbGxHYXBzID0gZnVuY3Rpb24oc2VnbWVudHMpIHtcbiAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGxldCBzMCwgczE7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBzMCA9IHNlZ21lbnRzW2ldO1xuICAgIHMxID0gc2VnbWVudHNbaSArIDFdO1xuXG4gICAgczAudHJhaWwgPSBzMS5zdGFydCAtIHMwLmVuZDtcbiAgfVxuXG4gIC8vIHBhZCBsYXN0IHNlZ21lbnQgdW50aWwgZW5kIG9mIHRpbWVsaW5lXG4gIHMwID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XG4gIHMwLnRyYWlsID0gdGhpcy5kdXJhdGlvbiAtIHMwLmVuZDtcbn07XG5cbi8qKlxuICogR2V0IGEgY29tcGlsZWQgZ2xzbCBzdHJpbmcgd2l0aCBjYWxscyB0byB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBhIGdpdmVuIGtleS5cbiAqIFRoZSBvcmRlciBpbiB3aGljaCB0aGVzZSB0cmFuc2l0aW9ucyBhcmUgYXBwbGllZCBtYXR0ZXJzIGJlY2F1c2UgdGhleSBhbGwgb3BlcmF0ZSBvbiB0aGUgc2FtZSB2YWx1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgbWF0Y2hpbmcgYSB0cmFuc2Zvcm0gZGVmaW5pdGlvbi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1DYWxscyA9IGZ1bmN0aW9uKGtleSkge1xuICBsZXQgdCA9IHRoaXMudGltZUtleTtcblxuICByZXR1cm4gdGhpcy5zZWdtZW50c1trZXldID8gIHRoaXMuc2VnbWVudHNba2V5XS5tYXAoZnVuY3Rpb24ocykge1xuICAgIHJldHVybiBgYXBwbHlUcmFuc2Zvcm0ke3Mua2V5fSgke3R9LCB0cmFuc2Zvcm1lZCk7YDtcbiAgfSkuam9pbignXFxuJykgOiAnJztcbn07XG5cbmV4cG9ydCB7IFRpbWVsaW5lIH1cbiIsImNvbnN0IFRpbWVsaW5lQ2h1bmtzID0ge1xuICB2ZWMzOiBmdW5jdGlvbihuLCB2LCBwKSB7XG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XG5cbiAgICByZXR1cm4gYHZlYzMgJHtufSA9IHZlYzMoJHt4fSwgJHt5fSwgJHt6fSk7YDtcbiAgfSxcbiAgdmVjNDogZnVuY3Rpb24obiwgdiwgcCkge1xuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHcgPSAodi53IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICBcbiAgICByZXR1cm4gYHZlYzQgJHtufSA9IHZlYzQoJHt4fSwgJHt5fSwgJHt6fSwgJHt3fSk7YDtcbiAgfSxcbiAgZGVsYXlEdXJhdGlvbjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgZmxvYXQgY0RlbGF5JHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCl9O1xuICAgIGZsb2F0IGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LmR1cmF0aW9uLnRvUHJlY2lzaW9uKDQpfTtcbiAgICBgO1xuICB9LFxuICBwcm9ncmVzczogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIC8vIHplcm8gZHVyYXRpb24gc2VnbWVudHMgc2hvdWxkIGFsd2F5cyByZW5kZXIgY29tcGxldGVcbiAgICBpZiAoc2VnbWVudC5kdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIGBmbG9hdCBwcm9ncmVzcyA9IDEuMDtgXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGBcbiAgICAgIGZsb2F0IHByb2dyZXNzID0gY2xhbXAodGltZSAtIGNEZWxheSR7c2VnbWVudC5rZXl9LCAwLjAsIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9KSAvIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9O1xuICAgICAgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZSA/IGBwcm9ncmVzcyA9ICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2V9KHByb2dyZXNzJHsoc2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMgPyBgLCAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zLm1hcCgodikgPT4gdi50b1ByZWNpc2lvbig0KSkuam9pbihgLCBgKX1gIDogYGApfSk7YCA6IGBgfVxuICAgICAgYDtcbiAgICB9XG4gIH0sXG4gIHJlbmRlckNoZWNrOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gc2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KTtcbiAgICBjb25zdCBlbmRUaW1lID0gKHNlZ21lbnQuZW5kICsgc2VnbWVudC50cmFpbCkudG9QcmVjaXNpb24oNCk7XG5cbiAgICByZXR1cm4gYGlmICh0aW1lIDwgJHtzdGFydFRpbWV9IHx8IHRpbWUgPiAke2VuZFRpbWV9KSByZXR1cm47YDtcbiAgfVxufTtcblxuZXhwb3J0IHsgVGltZWxpbmVDaHVua3MgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgVHJhbnNsYXRpb25TZWdtZW50ID0ge1xuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cbiAgICBcbiAgICAgIHYgKz0gbWl4KGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX0sIGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygwLCAwLCAwKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3RyYW5zbGF0ZScsIFRyYW5zbGF0aW9uU2VnbWVudCk7XG5cbmV4cG9ydCB7IFRyYW5zbGF0aW9uU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBTY2FsZVNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICBcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuICAgIFxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdiAqPSBtaXgoY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9LCBjU2NhbGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3NjYWxlJywgU2NhbGVTZWdtZW50KTtcblxuZXhwb3J0IHsgU2NhbGVTZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMsIFZlY3RvcjQgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFJvdGF0aW9uU2VnbWVudCA9IHtcbiAgY29tcGlsZXIoc2VnbWVudCkge1xuICAgIGNvbnN0IGZyb21BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueCxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueSxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueixcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3QgdG9BeGlzID0gc2VnbWVudC50cmFuc2l0aW9uLnRvLmF4aXMgfHwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcztcbiAgICBjb25zdCB0b0F4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxuICAgICAgdG9BeGlzLngsXG4gICAgICB0b0F4aXMueSxcbiAgICAgIHRvQXhpcy56LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLnRvLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fWAsIGZyb21BeGlzQW5nbGUsIDgpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fWAsIHRvQXhpc0FuZ2xlLCA4KX1cbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cblxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdmVjMyBheGlzID0gbm9ybWFsaXplKG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0ueHl6LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9Lnh5eiwgcHJvZ3Jlc3MpKTtcbiAgICAgIGZsb2F0IGFuZ2xlID0gbWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS53LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9LncsIHByb2dyZXNzKTtcbiAgICAgIHZlYzQgcSA9IHF1YXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGFuZ2xlKTtcbiAgICAgIHYgPSByb3RhdGVWZWN0b3IocSwgdik7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiB7YXhpczogbmV3IFZlY3RvcjMoKSwgYW5nbGU6IDB9XG59O1xuXG5UaW1lbGluZS5yZWdpc3Rlcigncm90YXRlJywgUm90YXRpb25TZWdtZW50KTtcblxuZXhwb3J0IHsgUm90YXRpb25TZWdtZW50IH07XG4iXSwibmFtZXMiOlsiQmFzZUFuaW1hdGlvbk1hdGVyaWFsIiwicGFyYW1ldGVycyIsInVuaWZvcm1zIiwiY2FsbCIsInVuaWZvcm1WYWx1ZXMiLCJ3YXJuIiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJzZXRWYWx1ZXMiLCJVbmlmb3Jtc1V0aWxzIiwibWVyZ2UiLCJzZXRVbmlmb3JtVmFsdWVzIiwicHJvdG90eXBlIiwiT2JqZWN0IiwiYXNzaWduIiwiY3JlYXRlIiwiU2hhZGVyTWF0ZXJpYWwiLCJ2YWx1ZXMiLCJ2YWx1ZSIsIm5hbWUiLCJqb2luIiwiQmFzaWNBbmltYXRpb25NYXRlcmlhbCIsIlNoYWRlckxpYiIsImxpZ2h0cyIsInZlcnRleFNoYWRlciIsImNvbmNhdFZlcnRleFNoYWRlciIsImZyYWdtZW50U2hhZGVyIiwiY29uY2F0RnJhZ21lbnRTaGFkZXIiLCJjb25zdHJ1Y3RvciIsImJhc2ljIiwicmVwbGFjZSIsInN0cmluZ2lmeUNodW5rIiwiTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIiwibGFtYmVydCIsIlBob25nQW5pbWF0aW9uTWF0ZXJpYWwiLCJwaG9uZyIsIlN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwiLCJleHRlbnNpb25zIiwiZGVyaXZhdGl2ZXMiLCJzdGFuZGFyZCIsIlRvb25BbmltYXRpb25NYXRlcmlhbCIsImRlZmluZXMiLCJQb2ludHNBbmltYXRpb25NYXRlcmlhbCIsInBvaW50cyIsIkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwiLCJkZXB0aFBhY2tpbmciLCJSR0JBRGVwdGhQYWNraW5nIiwiY2xpcHBpbmciLCJkZXB0aCIsIkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJkaXN0YW5jZVJHQkEiLCJQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYiIsImNvdW50IiwicHJlZmFiR2VvbWV0cnkiLCJpc1ByZWZhYkJ1ZmZlckdlb21ldHJ5IiwiaXNCdWZmZXJHZW9tZXRyeSIsInByZWZhYkNvdW50IiwicHJlZmFiVmVydGV4Q291bnQiLCJhdHRyaWJ1dGVzIiwicG9zaXRpb24iLCJ2ZXJ0aWNlcyIsImxlbmd0aCIsImJ1ZmZlckluZGljZXMiLCJidWZmZXJQb3NpdGlvbnMiLCJCdWZmZXJHZW9tZXRyeSIsInByZWZhYkluZGljZXMiLCJwcmVmYWJJbmRleENvdW50IiwiaW5kZXgiLCJhcnJheSIsImkiLCJwdXNoIiwicHJlZmFiRmFjZUNvdW50IiwiZmFjZXMiLCJmYWNlIiwiYSIsImIiLCJjIiwiaW5kZXhCdWZmZXIiLCJVaW50MzJBcnJheSIsInNldEluZGV4IiwiQnVmZmVyQXR0cmlidXRlIiwiayIsInBvc2l0aW9uQnVmZmVyIiwiY3JlYXRlQXR0cmlidXRlIiwicG9zaXRpb25zIiwib2Zmc2V0IiwiaiIsInByZWZhYlZlcnRleCIsIngiLCJ5IiwieiIsImJ1ZmZlclV2cyIsInV2QnVmZmVyIiwidXZzIiwidXYiLCJmYWNlVmVydGV4VXZzIiwiaXRlbVNpemUiLCJmYWN0b3J5IiwiYnVmZmVyIiwiRmxvYXQzMkFycmF5IiwiYXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwiZGF0YSIsInNldFByZWZhYkRhdGEiLCJwcmVmYWJJbmRleCIsIk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJzIiwicmVwZWF0Q291bnQiLCJBcnJheSIsImlzQXJyYXkiLCJwcmVmYWJHZW9tZXRyaWVzIiwicHJlZmFiR2VvbWV0cmllc0NvdW50IiwicHJlZmFiVmVydGV4Q291bnRzIiwibWFwIiwicCIsInJlcGVhdFZlcnRleENvdW50IiwicmVkdWNlIiwiciIsInYiLCJyZXBlYXRJbmRleENvdW50IiwiaW5kaWNlcyIsImdlb21ldHJ5IiwiaW5kZXhPZmZzZXQiLCJwcmVmYWJPZmZzZXQiLCJ2ZXJ0ZXhDb3VudCIsInByZWZhYlBvc2l0aW9ucyIsInByZWZhYlV2cyIsImVycm9yIiwidXZPYmplY3RzIiwicHJlZmFiR2VvbWV0cnlJbmRleCIsInByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQiLCJ3aG9sZSIsIndob2xlT2Zmc2V0IiwicGFydCIsInBhcnRPZmZzZXQiLCJJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeSIsImlzR2VvbWV0cnkiLCJjb3B5IiwibWF4SW5zdGFuY2VkQ291bnQiLCJJbnN0YW5jZWRCdWZmZXJHZW9tZXRyeSIsIkluc3RhbmNlZEJ1ZmZlckF0dHJpYnV0ZSIsIlV0aWxzIiwiaWwiLCJuIiwidmEiLCJ2YiIsInZjIiwiY2xvbmUiLCJWZWN0b3IzIiwiYm94IiwidE1hdGgiLCJyYW5kRmxvYXQiLCJtaW4iLCJtYXgiLCJyYW5kRmxvYXRTcHJlYWQiLCJub3JtYWxpemUiLCJzb3VyY2VNYXRlcmlhbCIsInZlcnRleEZ1bmN0aW9ucyIsInZlcnRleFBhcmFtZXRlcnMiLCJ2ZXJ0ZXhJbml0IiwidmVydGV4UG9zaXRpb24iLCJNb2RlbEJ1ZmZlckdlb21ldHJ5IiwibW9kZWwiLCJvcHRpb25zIiwibW9kZWxHZW9tZXRyeSIsImZhY2VDb3VudCIsImNvbXB1dGVDZW50cm9pZHMiLCJsb2NhbGl6ZUZhY2VzIiwiY2VudHJvaWRzIiwiY29tcHV0ZUNlbnRyb2lkIiwiY2VudHJvaWQiLCJ2ZXJ0ZXgiLCJidWZmZXJTa2lubmluZyIsInNraW5JbmRleEJ1ZmZlciIsInNraW5XZWlnaHRCdWZmZXIiLCJza2luSW5kZXgiLCJza2luSW5kaWNlcyIsInNraW5XZWlnaHQiLCJza2luV2VpZ2h0cyIsInciLCJzZXRGYWNlRGF0YSIsImZhY2VJbmRleCIsIlBvaW50QnVmZmVyR2VvbWV0cnkiLCJwb2ludENvdW50Iiwic2V0UG9pbnREYXRhIiwicG9pbnRJbmRleCIsIlNoYWRlckNodW5rIiwiY2F0bXVsbF9yb21fc3BsaW5lIiwiY3ViaWNfYmV6aWVyIiwiZWFzZV9iYWNrX2luIiwiZWFzZV9iYWNrX2luX291dCIsImVhc2VfYmFja19vdXQiLCJlYXNlX2JlemllciIsImVhc2VfYm91bmNlX2luIiwiZWFzZV9ib3VuY2VfaW5fb3V0IiwiZWFzZV9ib3VuY2Vfb3V0IiwiZWFzZV9jaXJjX2luIiwiZWFzZV9jaXJjX2luX291dCIsImVhc2VfY2lyY19vdXQiLCJlYXNlX2N1YmljX2luIiwiZWFzZV9jdWJpY19pbl9vdXQiLCJlYXNlX2N1YmljX291dCIsImVhc2VfZWxhc3RpY19pbiIsImVhc2VfZWxhc3RpY19pbl9vdXQiLCJlYXNlX2VsYXN0aWNfb3V0IiwiZWFzZV9leHBvX2luIiwiZWFzZV9leHBvX2luX291dCIsImVhc2VfZXhwb19vdXQiLCJlYXNlX3F1YWRfaW4iLCJlYXNlX3F1YWRfaW5fb3V0IiwiZWFzZV9xdWFkX291dCIsImVhc2VfcXVhcnRfaW4iLCJlYXNlX3F1YXJ0X2luX291dCIsImVhc2VfcXVhcnRfb3V0IiwiZWFzZV9xdWludF9pbiIsImVhc2VfcXVpbnRfaW5fb3V0IiwiZWFzZV9xdWludF9vdXQiLCJlYXNlX3NpbmVfaW4iLCJlYXNlX3NpbmVfaW5fb3V0IiwiZWFzZV9zaW5lX291dCIsInF1YWRyYXRpY19iZXppZXIiLCJxdWF0ZXJuaW9uX3JvdGF0aW9uIiwicXVhdGVybmlvbl9zbGVycCIsIlRpbWVsaW5lU2VnbWVudCIsInN0YXJ0IiwiZHVyYXRpb24iLCJ0cmFuc2l0aW9uIiwiY29tcGlsZXIiLCJ0cmFpbCIsImNvbXBpbGUiLCJkZWZpbmVQcm9wZXJ0eSIsIlRpbWVsaW5lIiwidGltZUtleSIsInNlZ21lbnRzIiwiX19rZXkiLCJzZWdtZW50RGVmaW5pdGlvbnMiLCJyZWdpc3RlciIsImRlZmluaXRpb24iLCJhZGQiLCJ0cmFuc2l0aW9ucyIsInBvc2l0aW9uT2Zmc2V0IiwiX2V2YWwiLCJldmFsIiwidW5kZWZpbmVkIiwiTWF0aCIsInByb2Nlc3NUcmFuc2l0aW9uIiwiZnJvbSIsImRlZmF1bHRGcm9tIiwidG8iLCJ0b1N0cmluZyIsImZpbGxHYXBzIiwicyIsInMwIiwiczEiLCJlbmQiLCJnZXRUcmFuc2Zvcm1DYWxscyIsInQiLCJUaW1lbGluZUNodW5rcyIsInRvUHJlY2lzaW9uIiwic2VnbWVudCIsImVhc2UiLCJlYXNlUGFyYW1zIiwic3RhcnRUaW1lIiwiZW5kVGltZSIsIlRyYW5zbGF0aW9uU2VnbWVudCIsImRlbGF5RHVyYXRpb24iLCJ2ZWMzIiwicmVuZGVyQ2hlY2siLCJwcm9ncmVzcyIsIlNjYWxlU2VnbWVudCIsIm9yaWdpbiIsIlJvdGF0aW9uU2VnbWVudCIsImZyb21BeGlzQW5nbGUiLCJWZWN0b3I0IiwiYXhpcyIsImFuZ2xlIiwidG9BeGlzIiwidG9BeGlzQW5nbGUiLCJ2ZWM0Il0sIm1hcHBpbmdz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
