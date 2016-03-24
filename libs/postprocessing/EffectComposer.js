/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.EffectComposer = function ( renderer, renderTarget, renderTarget3, width, height ) {

	this.renderer = renderer;

	this.renderTarget1 = renderTarget;
 this.renderTarget3 = renderTarget3; 
  this._width = width;

  this._height = height;

	if ( this.renderTarget1 === undefined ) {

		var width = window.innerWidth || 1;
		var height = window.innerHeight || 1;

		this.renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
		this.renderTarget1 = new THREE.WebGLRenderTarget( width, height, this.renderTargetParameters );

	}

	this.renderTarget2 = this.renderTarget1.clone();
  this.renderTarget4 = this.renderTarget3.clone();
	this.writeBuffer = this.renderTarget1;
	this.readBuffer = this.renderTarget2;
  this.writeBuffer2 = this.renderTarget3;
  this.readBuffer2 = this.renderTarget4;

	this.passes = [];

	this.copyPass = new THREE.ShaderPass( THREE.ShaderExtras[ "screen" ] );

};

THREE.EffectComposer.prototype = {

	swapBuffers: function() {

		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
    tmp = this.readBuffer2;
    this.readBuffer2 = this.writeBuffer2;
    this.writeBuffer2 = tmp;

	},

	addPass: function ( pass ) {

		this.passes.push( pass );

	},

	render: function ( delta) {

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;
    this.writeBuffer2 = this.renderBuffer3;
    this.readBuffer2 = this.renderBuffer4;

		var maskActive = false;

		var pass, i, il = this.passes.length;

		for ( i = 0; i < il; i ++ ) {

			pass = this.passes[ i ];

			if ( !pass.enabled ) continue;

			pass.render( this.renderer, this.writeBuffer, this.readBuffer, this.writeBuffer2, this.readBuffer2, delta, maskActive, this._width, this._height );

			if ( pass.needsSwap ) {

				if ( maskActive ) {

					var context = this.renderer.context;

					context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

					context.stencilFunc( context.EQUAL, 1, 0xffffffff );

				}

				this.swapBuffers();

			}

			if ( pass instanceof THREE.MaskPass ) {

				maskActive = true;

			} else if ( pass instanceof THREE.ClearMaskPass ) {

				maskActive = false;

			}

		}

	},

	reset: function ( renderTarget ) {

		this.renderTarget1 = renderTarget;

		if ( this.renderTarget1 === undefined ) {

			this.renderTarget1 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, this.renderTargetParameters );

		}

		this.renderTarget2 = this.renderTarget1.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		THREE.EffectComposer.quad.scale.set( window.innerWidth, window.innerHeight, 1 );

		THREE.EffectComposer.camera.left = window.innerWidth / - 2;
		THREE.EffectComposer.camera.right = window.innerWidth / 2;
		THREE.EffectComposer.camera.top = window.innerHeight / 2;
		THREE.EffectComposer.camera.bottom = window.innerHeight / - 2;

		THREE.EffectComposer.camera.updateProjectionMatrix();
		
    THREE.EffectComposer.cameraL.left = window.innerWidth / - 2;
		THREE.EffectComposer.cameraL.right = window.innerWidth / 2;
		THREE.EffectComposer.cameraL.top = window.innerHeight / 2;
		THREE.EffectComposer.cameraL.bottom = window.innerHeight / - 2;

		THREE.EffectComposer.cameraL.updateProjectionMatrix();
		
    THREE.EffectComposer.cameraR.left = window.innerWidth / - 2;
		THREE.EffectComposer.cameraR.right = window.innerWidth / 2;
		THREE.EffectComposer.cameraR.top = window.innerHeight / 2;
		THREE.EffectComposer.cameraR.bottom = window.innerHeight / - 2;

		THREE.EffectComposer.cameraR.updateProjectionMatrix();

	}

};

// shared ortho camera

THREE.EffectComposer.initWidth = window.innerWidth || 1;
THREE.EffectComposer.initHeight = window.innerHeight || 1;

THREE.EffectComposer.camera = new THREE.PerspectiveCamera( 90 ,THREE.EffectComposer.initWidth / THREE.EffectComposer.initHeight, 0.001, 700) ;
THREE.EffectComposer.camera.position.z = 350;
THREE.EffectComposer.cameraL = new THREE.PerspectiveCamera( 75 ,THREE.EffectComposer.initWidth / THREE.EffectComposer.initHeight, 1, 10000) ;
THREE.EffectComposer.cameraL.position.z = 450;
THREE.EffectComposer.cameraR = new THREE.PerspectiveCamera( 75 ,THREE.EffectComposer.initWidth / THREE.EffectComposer.initHeight, 1, 10000) ;
THREE.EffectComposer.cameraR.position.z = 450;

//THREE.EffectComposer.camera = new THREE.OrthographicCamera( THREE.EffectComposer.initWidth / - 2, THREE.EffectComposer.initWidth / 2, THREE.EffectComposer.initHeight / 2, THREE.EffectComposer.initHeight / - 2, -10000, 10000 );
//THREE.EffectComposer.cameraL = new THREE.OrthographicCamera( THREE.EffectComposer.initWidth / - 2, THREE.EffectComposer.initWidth / 2, THREE.EffectComposer.initHeight / 2, THREE.EffectComposer.initHeight / - 2, -10000, 10000 );
//THREE.EffectComposer.cameraR = new THREE.OrthographicCamera( THREE.EffectComposer.initWidth / - 2, THREE.EffectComposer.initWidth / 2, THREE.EffectComposer.initHeight / 2, THREE.EffectComposer.initHeight / - 2, -10000, 10000 );
// shared fullscreen quad scene

THREE.EffectComposer.geometry = new THREE.PlaneGeometry( 1, 1 );
THREE.EffectComposer.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

THREE.EffectComposer.quad = new THREE.Mesh( THREE.EffectComposer.geometry, null );
THREE.EffectComposer.quad.position.z = -100;
THREE.EffectComposer.quad.scale.set( THREE.EffectComposer.initWidth, THREE.EffectComposer.initHeight, 1 );

THREE.EffectComposer.scene = new THREE.Scene();
THREE.EffectComposer.scene.add( THREE.EffectComposer.quad );
THREE.EffectComposer.scene.add( THREE.EffectComposer.camera );
//THREE.EffectComposer.scene.add( THREE.EffectComposer.cameraL );
//THREE.EffectComposer.scene.add( THREE.EffectComposer.cameraR );
//THREE.EffectComposer.scene.add( THREE.EffectComposer.camera2 );
