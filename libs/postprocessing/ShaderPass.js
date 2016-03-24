/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.ShaderPass = function ( shader, width, height, textureID ) {

	this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";

	this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );
  this.width = width;
  this.height = height;
	this.material = new THREE.ShaderMaterial( {

		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	} );

	this.renderToScreen = false;

	this.enabled = true;
	this.needsSwap = true;
	this.clear = false;

  //StereoEffect
  this.separation = 3;

  /*
   * Distance to the non-parallax or projection plane
   */
  this.focalLength = 15;

  //Support function
  this.radToDeg = function() {
    var degreeToRadiansFactor = Math.PI / 180;
    return function(degrees) {
      return degrees * degreeToRadiansFactor;
    }
  }();

  this.degToRad = function() {
    var radianToDegreesFactor = 180 / Math.PI;

    return function (radians) {
      return radians * radianToDegreesFactor;
    }
  }();

};

THREE.ShaderPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer,writeBuffer2, readBuffer2, delta ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].texture = readBuffer;

		}
    
    var _position = new THREE.Vector3();
    var _quaternion = new THREE.Quaternion();
    var _scale = new THREE.Vector3();

    var _cameraL = new THREE.PerspectiveCamera();
    var _cameraR = new THREE.PerspectiveCamera();
    var _fov;
    var _outer, _inner, _top, _bottom;
    var _ndfl, _halfFocalWidth, _halfFocalHeight;
    var _innerFactor, _outerFactor;
    
    THREE.EffectComposer.camera.matrixWorld.decompose( _position, _quaternion, _scale );

    _fov = -this.radToDeg(2 * Math.atan(Math.tan(this.degToRad(THREE.EffectComposer.camera.fov) * 0.5)));

    _ndfl = THREE.EffectComposer.camera.near / this.focalLength;
    _halfFocalHeight = Math.tan(this.degToRad(_fov) * 0.5) * this.focalLength;
    _halfFocalWidth = _halfFocalHeight * 0.5 * THREE.EffectComposer.camera.aspect;

    _top = _halfFocalHeight * _ndfl;
    _bottom = -_top;
    _innerFactor = (_halfFocalWidth + this.separation / 2.0) / (_halfFocalWidth * 2.0);
    _outerFactor = 1.0 - _innerFactor;

    _outer = _halfFocalWidth * 2.0 * _ndfl * _outerFactor;
    _inner = _halfFocalWidth * 2.0 * _ndfl * _innerFactor;
    
    //left
    _cameraL.projectionMatrix.makeFrustum(
      -_outer,
      _inner,
      _bottom,
      _top,
      THREE.EffectComposer.camera.near,
      THREE.EffectComposer.camera.far
    );
    _cameraL.position.copy( _position );
    _cameraL.quaternion.copy( _quaternion );
    _cameraL.translateX ( -this.separation / 2.0 );
    _cameraL.position.z = 0;
    //_cameraL.rotation.x = this.degToRad(0);

    //right
    _cameraR.projectionMatrix.makeFrustum(
      -_inner,
      _outer,
      _bottom,
      _top,
      THREE.EffectComposer.camera.near,
      THREE.EffectComposer.camera.far
    );

    _cameraR.position.copy( _position );
    _cameraR.quaternion.copy( _quaternion );
    _cameraR.translateX( this.separation / 2.0 );
    _cameraR.position.z = 0;
    
    THREE.EffectComposer.scene.add(_cameraL);
    THREE.EffectComposer.scene.add(_cameraR);

		THREE.EffectComposer.quad.material = this.material;
		if ( this.renderToScreen ) {

      renderer.setViewport(0, 0, this.width/2 ,this.height);
			renderer.render( THREE.EffectComposer.scene, _cameraL );
			//renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera );
      renderer.setViewport(this.width/2, 0, this.width/2, this.height);
      //renderer.setViewport(0, 0, this.width/2, this.height);
      renderer.render( THREE.EffectComposer.scene, _cameraR);
			//renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera );

		} else {

      renderer.setViewport(0, 0, this.width/2 ,this.height);
			renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera, writeBuffer, this.clear );
      renderer.setViewport(this.width/2, 0, this.width, this.height);
			renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera, writeBuffer2, this.clear );
		}

	}

};
