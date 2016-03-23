 /*
 * HexGL
 * @author Thibaut 'BKcore' Despoulain <http://bkcore.com>
 * @license This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License. 
 *          To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/3.0/.
 */

'use strict';
'v1.0.1';

var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};

bkcore.hexgl.HexGL = function(opts)
{
	var self = this;

	this.document = opts.document || document;

	this.a = window.location.href;

	this.mobile = opts.mobile == undefined ? false : opts.mobile;
	this.active = true;
	this.displayHUD = opts.hud == undefined ? true : opts.hud;
	this.width = opts.width == undefined ? window.innerWidth/2 : opts.width/2;
	this.height = opts.height == undefined ? window.innerHeight : opts.height;

	this.quality = opts.quality == undefined ? 2 : opts.quality;
	this.difficulty = opts.difficulty == undefined ? 0 : opts.difficulty;
	this.player = opts.player == undefined ? "Anonym" : opts.player;

	this.half = opts.half == undefined ? false : opts.half;

	this.track = bkcore.hexgl.tracks[ opts.track == undefined ? 'Cityscape' : opts.track ];

	this.mode = opts.mode == undefined ? 'timeattack' : opts.mode;

	this.controlType = opts.controlType == undefined ? 1 : opts.controlType;

	this.controllerWindow = opts.controllerWindow == undefined ? null : opts.controllerWindow;

	if(this.half)
	{
		this.width /= 2;
		this.height /=2;
	}

	this.settings = null;
	this.renderer = null;
  this.rendererR = null;
	this.manager = null;
  this.managerR = null;
	this.lib = null;
	this.materials = {};
	this.components = {};
	this.extras = {
		vignetteColor: new THREE.Color(0x458ab1),
		bloom: null,
		fxaa: null
	};

	this.containers = {};
	this.containers.main = opts.container == undefined ? document.body : opts.container;
	this.containers.overlay = opts.overlay == undefined ? document.body : opts.overlay;

	this.gameover = opts.gameover == undefined ? null : opts.gameover;

	this.godmode = opts.godmode == undefined ? false : opts.godmode;

	this.hud = null;

	this.gameplay = null;

	this.composers = {
		game: null,
    gameR: null
	};

	this.initRenderer();

	function onKeyPress(event) 
	{
		if(event.keyCode == 27/*escape*/) 
		{
			self.reset();
		}
	}

	this.document.addEventListener('keydown', onKeyPress, false);
}

bkcore.hexgl.HexGL.prototype.start = function()
{

	this.manager.setCurrent("game");
  this.managerR.setCurrent("game");
	var self = this;

	function raf()
	{
		if(self && self.active) requestAnimationFrame( raf );
		self.update();
	}

	//if(this.a[15] == "o")
		raf();

	this.initGameplay();
    bkcore.hexgl.audio.startCountdown();
}

bkcore.hexgl.HexGL.prototype.reset = function()
{
	this.manager.get('game').objects.lowFPS = 0;
	this.gameplay.start();
}

bkcore.hexgl.HexGL.prototype.restart = function()
{
	try{ this.document.getElementById('finish').style.display = 'none'; }
	catch(e){};
	this.reset();
}

bkcore.hexgl.HexGL.prototype.update = function()
{
	if(!this.active) return;

	if(this.gameplay != null)
		this.gameplay.update();

	this.manager.renderCurrent();
  this.managerR.renderCurrent();

    var rate = 1 + this.components.shipControls.getRealSpeedRatio() * 4;
    bkcore.hexgl.audio.powerVehicleEngine(rate);
}

bkcore.hexgl.HexGL.prototype.init = function()
{
	this.initHUD();

	this.track.buildMaterials(this.quality, this.mobile);

	this.track.buildScenes(this, this.quality, this.mobile);

	this.initGameComposer();
}

bkcore.hexgl.HexGL.prototype.load = function(opts)
{
	this.track.load(opts, this.quality, this.mobile);
}

bkcore.hexgl.HexGL.prototype.initGameplay = function()
{
	var self = this;

	this.gameplay = new bkcore.hexgl.Gameplay({
		mode: this.mode,
		hud: this.hud,
		shipControls: this.components.shipControls,
		cameraControls: this.components.cameraChase,
		analyser: this.track.analyser,
		pixelRatio: this.track.pixelRatio,
		track: this.track,
		onFinish: function() {
			self.displayScore(this.finishTime, this.lapTimes);
		}
	});

	this.gameplay.start();
}

bkcore.hexgl.HexGL.prototype.displayScore = function(f, l)
{
	this.active = false;

	var tf = bkcore.Timer.msToTimeString(f);
	var tl = [
		bkcore.Timer.msToTimeString(l[0]),
		bkcore.Timer.msToTimeString(l[1]),
		bkcore.Timer.msToTimeString(l[2])
	];

	if(this.mobile)
	{
		this.gameover.style.display = "block";
		this.gameover.innerHTML = tf.m + "'" + tf.s + "''" + tf.ms;
		this.containers.main.style.display = "none";
		return; 
	}

	var t = this.track;
	var dc = this.document.getElementById("finish");
	var ds = this.document.getElementById("finish-state");
	var dh = this.document.getElementById("finish-hallmsg");
	var dr = this.document.getElementById("finish-msg");
	var dt = this.document.getElementById("finish-result");
	var dl1 = this.document.getElementById("finish-lap1");
	var dl2 = this.document.getElementById("finish-lap2");
	var dl3 = this.document.getElementById("finish-lap3");
	var dd = this.document.getElementById("finish-diff")
	var st = this.document.getElementById("finish-twitter");
	var sf = this.document.getElementById("finish-fb");
	var sl = this.document.getElementById("lowfps-msg");
	var d = this.difficulty == 0 ? 'casual' : 'hard';
	var ts = this.hud.timeSeparators;

	if(this.gameplay.result == this.gameplay.results.FINISH)
	{
		ds != undefined && (ds.innerHTML = "Finished!");
		// local record
		if(typeof(Storage)!=="undefined")
		{
			if(localStorage['score-'+t+'-'+d] == undefined || localStorage['score-'+t+'-'+d] > f)
			{
				dr != undefined && (dr.innerHTML = "New local record!");
				localStorage['score-'+t+'-'+d] = f;

				// Export race data
				localStorage['race-'+t+'-replay'] = JSON.Stringify(this.gameplay.raceData.export());
			}
			else
			{
				dr != undefined && (dr.innerHTML = "Well done!");
			}
		}
		// ladder record
		var p = bkcore.hexgl.Ladder.global[t][d][bkcore.hexgl.Ladder.global[t][d].length-2];
		if(p != undefined && p['score'] > f)
		{
			dh != undefined && (dh.innerHTML = "You made it to the HOF!");
		}
		else
		{
			dh != undefined && (dh.innerHTML = "Hall Of Fame");
		}

		dt != undefined && (dt.innerHTML = tf.m + ts[1] + tf.s + ts[2] + tf.ms);
		dl1 != undefined && (dl1.innerHTML = tl[0]["m"] != undefined ? tl[0].m + ts[1] + tl[0].s + ts[2] + tl[0].ms : "-");
		dl2 != undefined && (dl2.innerHTML = tl[1]["m"] != undefined ? tl[1].m + ts[1] + tl[1].s + ts[2] + tl[1].ms : "-");
		dl3 != undefined && (dl3.innerHTML = tl[2]["m"] != undefined ? tl[2].m + ts[1] + tl[2].s + ts[2] + tl[2].ms : "-");

		// Ladder save
		// Undisclosed
	}
	else
	{
		ds != undefined && (ds.innerHTML = "Destroyed!");
		dr != undefined && (dr.innerHTML = "Maybe next time!");
		dh != undefined && (dh.innerHTML = "Hall Of Fame");
		dt != undefined && (dt.innerHTML = "None");
		dl1 != undefined && (dl1.innerHTML = "None");
		dl2 != undefined && (dl2.innerHTML = "None");
		dl3 != undefined && (dl3.innerHTML = "None");
	}

	dd != undefined && (dd.innerHTML = d);
	st != undefined && (st.href='http://twitter.com/share?text='+encodeURIComponent('I just scored '+dt.innerHTML+' in '+'Cityscape ('+d+') on #HexGL! Come try it and beat my record on '));
	sf != undefined && (sf.href='http://www.facebook.com/sharer.php?s=100'
		+'&p[title]='+encodeURIComponent('I just scored '+dt.innerHTML+' in '+'Cityscape ('+d+') on HexGL!')
		+'&p[summary]='+encodeURIComponent('HexGL is a futuristic racing game built by Thibaut Despoulain (BKcore) using HTML5, Javascript and WebGL. Come challenge your friends on this fast-paced 3D game!')
		+'&p[url]='+encodeURIComponent('http://hexgl.bkcore.com')
		+'&p[images][0]='+encodeURIComponent('http://hexgl.bkcore.com/image.png'));

	bkcore.hexgl.Ladder.displayLadder('finish-ladder', t, d, 8);

	if(this.manager.get('game').objects.lowFPS >= 999)
		sl != undefined && (sl.innerHTML = 'Note: Your framerate was pretty low, you should try a lesser graphic setting!');
	else
		sl != undefined && (sl.innerHTML = '');

	dc.style.display = 'block';
}

bkcore.hexgl.HexGL.prototype.initRenderer = function()
{
	var renderer = new THREE.WebGLRenderer({
		antialias: false,
		clearColor: 0x000000
	});

  var rendererR = new THREE.WebGLRenderer({
    antialias: false,
    clearColor: 0x000000
  });

	if(this.quality > 0 && !this.mobile)
	{
		rendererR.physicallyBasedShading = renderer.physicallyBasedShading = true;
		rendererR.gammaInput = renderer.gammaInput = true;
		rendererR.gammaOutput = renderer.gammaOutput = true;
		rendererR.shadowMapEnabled = renderer.shadowMapEnabled = true;
		rendererR.shadowMapSoft = renderer.shadowMapSoft = true;
	}

	rendererR.autoClear = renderer.autoClear = false;
	rendererR.sortObjects = renderer.sortObjects = false;
	rendererR.setSize(this.width, this.height);
  renderer.setSize( this.width, this.height );
	renderer.domElement.style.position = "relative";
  rendererR.domElement.style.position = "relative";
  rendererR.domElement.style.left = "50%";

	this.containers.main.appendChild( renderer.domElement );
  this.containers.main.appendChild( rendererR.domElement );
	this.canvas = renderer.domElement;
  this.canvasR = rendererR.domElement;
	this.renderer = renderer;
  this.rendererR = rendererR;
	this.manager = new bkcore.threejs.RenderManager(renderer);
  this.managerR = new bkcore.threejs.RenderManager(rendererR);
}

bkcore.hexgl.HexGL.prototype.initHUD = function()
{
	if(!this.displayHUD) return;
	this.hud = new bkcore.hexgl.HUD({
		width: this.width,
		height: this.height,
		font: "BebasNeueRegular",
		bg: this.track.lib.get("images", "hud.bg"),
		speed: this.track.lib.get("images", "hud.speed"),
		shield: this.track.lib.get("images", "hud.shield")
	});	
	this.containers.overlay.appendChild(this.hud.canvas);
}

bkcore.hexgl.HexGL.prototype.initGameComposer = function()
{
	var renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
	var renderTarget = new THREE.WebGLRenderTarget( this.width, this.height, renderTargetParameters );
  var renderTargetR = new THREE.WebGLRenderTarget( this.width, this.height, renderTargetParameters );

	// GAME COMPOSER	
	var renderSky = new THREE.RenderPass( this.manager.get("sky").scene, this.manager.get("sky").camera );
  var renderSkyR = new THREE.RenderPass( this.managerR.get("sky").scene, this.managerR.get("sky").camera );

	var renderModel = new THREE.RenderPass( this.manager.get("game").scene, this.manager.get("game").camera );
  var renderModelR = new THREE.RenderPass( this.managerR.get("game").scene, this.managerR.get("game").camera );
  renderModelR.clear = false;
	renderModel.clear = false;

	this.composers.game = new THREE.EffectComposer( this.renderer, renderTarget );
  this.composers.gameR = new THREE.EffectComposer(this.rendererR, renderTargetR);

	var effectScreen = new THREE.ShaderPass( THREE.ShaderExtras[ "screen" ] );	
	effectScreen.renderToScreen = true;			
	var effectVignette = new THREE.ShaderPass( THREE.ShaderExtras[ "vignette" ] );

	var effectHex = new THREE.ShaderPass( bkcore.threejs.Shaders[ "hexvignette" ] );
	effectHex.uniforms[ 'size' ].value = 512.0 * (this.width/1633);
	effectHex.uniforms[ 'rx' ].value = this.width;
	effectHex.uniforms[ 'ry' ].value = this.height;
	effectHex.uniforms[ 'tHex' ].texture = this.track.lib.get("textures", "hex");
	effectHex.uniforms[ 'color' ].value = this.extras.vignetteColor;

	effectHex.renderToScreen = true;

	this.composers.game.addPass( renderSky );
	this.composers.game.addPass( renderModel );
  this.composers.gameR.addPass( renderSkyR);
  this.composers.gameR.addPass( renderModelR);

	if(this.quality > 0 && !this.mobile)
	{
		var effectFXAA = new THREE.ShaderPass( THREE.ShaderExtras[ "fxaa" ] );
		effectFXAA.uniforms[ 'resolution' ].value.set( 1 / this.width, 1 / this.height );

		this.composers.game.addPass( effectFXAA );

		
		this.extras.fxaa = effectFXAA;
	}
	if(this.quality > 1 && !this.mobile)
	{	
		var effectBloom = new THREE.BloomPass( 0.8, 25, 4 , 256);

		this.composers.game.addPass( effectBloom );

    this.composers.gameR.addPass(effectBloom);

		this.extras.bloom = effectBloom;
	}

	if(!this.mobile || this.quality > 0) {
		this.composers.game.addPass( effectHex );
    this.composers.gameR.addPass( effectHex);}
	else {
		this.composers.game.addPass( effectScreen );
    this.composers.gameR.addPass( effectScreen );
  }

	
}

bkcore.hexgl.HexGL.prototype.createMesh = function(parent, geometry, x, y, z, mat) 
{
	geometry.computeTangents();

	var mesh = new THREE.Mesh( geometry, mat );
	mesh.position.set( x, y, z );
	parent.add(mesh);

	if(this.quality > 0 && !this.mobile)
	{
		mesh.castShadow = true;
		mesh.receiveShadow = true;
	}

	return mesh;
}

bkcore.hexgl.HexGL.prototype.tweakShipControls = function()
{
	var c = this.components.shipControls;
  var d = this.components.shipControlsR;
	if(this.difficulty == 1)
	{
		d.airResist = c.airResist = 0.035;
		d.airDrift = c.airDrift = 0.07;
		d.thrust = c.thrust = 0.035;
		d.airBrake = c.airBrake = 0.04;
		d.maxSpeed = c.maxSpeed = 9.6;
		d.boosterSpeed = c.boosterSpeed = c.maxSpeed * 0.35;
		d.boosterDecay = c.boosterDecay = 0.007;
		d.angularSpeed = c.angularSpeed = 0.0140;
		d.airAngularSpeed = c.airAngularSpeed = 0.0165;
		d.rollAngle = c.rollAngle = 0.6;
		d.shieldDamage = c.shieldDamage = 0.03;
		d.collisionSpeedDecrease = c.collisionSpeedDecrease = 0.8;
		d.collisionSpeedDecreaseCoef = c.collisionSpeedDecreaseCoef = 0.5;
		d.rollLerp = c.rollLerp = 0.1;
		d.driftLerp = c.driftLerp = 0.4;
		d.angularLerp = c.angularLerp = 0.4;
	}
	else if(this.difficulty == 0)
	{
		d.airResist = c.airResist = 0.02;
		d.airDrift = c.airDrift = 0.06;
		d.thrust = c.thrust = 0.02;
		d.airBrake = c.airBrake = 0.025;
		d.maxSpeed = c.maxSpeed = 7.0;
		d.boosterSpeed = c.boosterSpeed = c.maxSpeed * 0.5;
		d.boosterDecay = c.boosterDecay = 0.007;
		d.angularSpeed = c.angularSpeed = 0.0125;
		d.airAngularSpeed = c.airAngularSpeed = 0.0135;
		d.rollAngle = c.rollAngle = 0.6;
		d.shieldDamage = c.shieldDamage = 0.06;
		d.collistionSpeedDecrease = c.collisionSpeedDecrease = 0.8;
		d.collisionSpeedDecreaseCoef = c.collisionSpeedDecreaseCoef = 0.5;
		d.rollLerp = c.rollLerp = 0.07;
		d.driftLerp = c.driftLerp = 0.3;
		d.angularLerp = c.angularLerp = 0.4;
	}

	if(this.godmode)
		d.shieldDamage = c.shieldDamage = 0.0;
}
