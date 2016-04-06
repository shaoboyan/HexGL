/* globals THREE */
/**
 * DeviceOrientationControls - applies device orientation on object rotation
 *
 * @param {Object} object - instance of THREE.Object3D
 * @constructor
 *
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 * @author jonobr1 / http://jonobr1.com
 * @author arodic / http://aleksandarrodic.com
 * @author doug / http://github.com/doug
 *
 * W3C Device Orientation control
 * (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

(function() {

  var deviceOrientation = {};
  var screenOrientation = window.orientation || 0;

  function onDeviceOrientationChangeEvent(evt) {
    deviceOrientation = evt;
    console.log("aaaaaaaaaaa");
  }
  window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
  console.log("bbbbbbbbbbbb");

  function getOrientation() {
    switch (window.screen.orientation || window.screen.mozOrientation) {
      case 'landscape-primary':
        return 90;
      case 'landscape-secondary':
        return -90;
      case 'portrait-secondary':
        return 180;
      case 'portrait-primary':
        return 0;
    }
    // this returns 90 if width is greater then height
    // and window orientation is undefined OR 0
    // if (!window.orientation && window.innerWidth > window.innerHeight)
    //   return 90;
    return window.orientation || 0;
  }

  function onScreenOrientationChangeEvent() {
    screenOrientation = getOrientation();
  }
  window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);

function setFromQuaternion(origin_rotation, origin_euler, q, order) {
  var m = new THREE.Matrix4();
  m.setRotationFromQuaternion(q);

}

THREE.DeviceOrientationControls = function(object) {

  this.object = object;

  //this.object.rotation.reorder('YXZ');
  var euler = this.object.rotation;
  var q = new THREE.Quaternion();
  q.setFromEuler(this.object.rotation, this.object.eulerOrder);
  
  var m = new THREE.Matrix4();
  m.setRotationFromQuaternion(q);

  var clamp = THREE.Math.clamp;
  //assumes the upper 3x3 of m is a pure rotation matrix
  var te = m.elements;
  var m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
  var m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
  var m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

  this.object.eulerOrder = 'YXZ';
  // if (order === 'YXZ')
  this.object.rotation.x = Math.asin(-clamp(m23, -1, 1) );
  if (Math.abs(m23) < 0.99999) {
    this.object.rotation.y = Math.atan2(m13, m33);
    this.object.rotation.z = Math.atan2(m21, m22);
  } else {
    this.object.rotation.y = Math.atan2(-m31, m11);
    this.object.rotation.z = 0;
  }

  this.freeze = true;

  this.movementSpeed = 1.0;
  this.rollSpeed = 0.005;
  this.autoAlign = true;
  this.autoForward = false;

  this.alpha = 0;
  this.beta = 0;
  this.gamma = 0;
  this.orient = 0;

  this.alignQuaternion = new THREE.Quaternion();
  this.orientationQuaternion = new THREE.Quaternion();

  var quaternion = new THREE.Quaternion();
  var quaternionLerp = new THREE.Quaternion();

  var tempVector3 = new THREE.Vector3();
  var tempMatrix4 = new THREE.Matrix4();
  //var tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  var tempRotation = new THREE.Vector3(0, 0, 0);
  var tempEuler = 'YXZ';
  var tempQuaternion = new THREE.Quaternion();

  var zee = new THREE.Vector3(0, 0, 1);
  var up = new THREE.Vector3(0, 1, 0);
  var v0 = new THREE.Vector3(0, 0, 0);
  //var euler = new THREE.Euler();
  var e_rotation = new THREE.Vector3();
  var e_euler = 'XYZ';
  var q0 = new THREE.Quaternion(); // - PI/2 around the x-axis
  var q1 = new THREE.Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

  this.degToRad = function() {
    var radianToDegreesFactor = 180 / Math.PI;

    return function (radians) {
      return radians * radianToDegreesFactor;
    }
  }();

  this.radToDeg = function() {
    var degreeToRadiansFactor = Math.PI / 180;
    
    return function(degrees) {
      return degrees * degreeToRadiansFactor;
    }
  }();
  this.update = (function(delta) {

    return function(delta) {

      if (this.freeze) return;

      // should not need this
      //var orientation = getOrientation();
      //if (orientation !== this.screenOrientation) {
        //this.screenOrientation = orientation;
        //this.autoAlign = true;
      //}

      this.alpha = deviceOrientation.gamma ?
        this.degToRad(deviceOrientation.alpha) : 0; // Z
      this.beta = deviceOrientation.beta ?
        this.degToRad(deviceOrientation.beta) : 0; // X'
      this.gamma = deviceOrientation.gamma ?
        this.degToRad(deviceOrientation.gamma) : 0; // Y''
      this.orient = screenOrientation ?
        this.degToRad(screenOrientation) : 0; // O

      // The angles alpha, beta and gamma
      // form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

      // 'ZXY' for the device, but 'YXZ' for us
      //euler.set(this.beta, this.alpha, - this.gamma, 'YXZ');
      e_rotation.x = this.beta;
      e_rotation.y = this.alpha;
      e_rotation.z = -this.gamma;
      e_euler = 'YXZ';
      //quaternion.setFromEuler(euler);
      var c1 = Math.cos(e_rotation.x / 2);
      var c2 = Math.cos(e_rotation.y / 2);
      var c3 = Math.cos(e_rotation.z / 2);
      var s1 = Math.sin(e_rotation.x / 2);
      var s2 = Math.sin(e_rotation.y / 2);
      var s3 = Math.sin(e_rotation.z / 2);
      quaternion.x = s1 * c2 * c3 + c1 * s2 * s3;
      quaternion.y = c1 * s2 * c3 - s1 * c2 * s3;
      quaternion.z = c1 * c2 * s3 - s1 * s2 * c3;
      quaternion.w = c1 * c2 * c3 + s1 * s2 * s3;
      var temp = new THREE.Quaternion();
      quaternionLerp.slerpSelf(quaternion, 0.5); // interpolate

      // orient the device
      if (this.autoAlign) this.orientationQuaternion.copy(quaternion); // interpolation breaks the auto alignment
      else this.orientationQuaternion.copy(quaternionLerp);

      // camera looks out the back of the device, not the top
      this.orientationQuaternion.multiplySelf(q1);

      // adjust for screen orientation
      this.orientationQuaternion.multiplySelf(q0.setFromAxisAngle(zee, - this.orient));

      this.object.quaternion.copy(this.alignQuaternion);
      this.object.quaternion.multiplySelf(this.orientationQuaternion);

      if (this.autoForward) {

        tempVector3.set(0, 0, -1);
        var x = tempVector3.x; var y = tempVector3.y; var z = tempVector3.z;
        var q = this.object.quaternion;
        var qx = q.x;
        var qy = q.y;
        var qz = q.z;
        var qw = q.w;
        var ix = qw * x + qy * z - qz * y;
        var iy = qw * y + qz * x - qx * z;
        var iz = qw * z + qx * y - qy * x;
        var iw = -qx * x - qy * y - qz * z;
        tempVector3.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        tempVector3.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        tempVector3.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        tempVector3.setLength(this.movementSpeed / 50);
         // .setLength(this.movementSpeed / 50); // TODO: why 50 :S

        this.object.position.addSelf(tempVector3);

      }

      if (this.autoAlign && this.alpha !== 0) {

        this.autoAlign = false;

        this.align();

      }

    };

  })();

  // //debug
  // window.addEventListener('click', (function(){
  //   this.align();
  // }).bind(this));

  this.align = function() {

    tempVector3.set(0, 0, -1);
    var x = tempVector3.x; var y = tempVector3.y; var z = tempVector3.z;
    var q = tempQuaternion.copy(this.orientationQuaternion).inverse();
    var qx = q.x;
    var qy = q.y;
    var qz = q.z;
    var qw = q.w;
    var ix = qw * x + qy * z - qz * y;
    var iy = qw * y + qz * x - qx * z;
    var iz = qw * z + qx * y - qy * x;
    var iw = -qx * x - qy * y - qz * z;

    tempVector3.x = ix * qw + iw * -qx + iy * -qz -iz * -qy;
    tempVector3.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    tempVector3.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    
    var m = new THREE.Matrix4();
    m.setRotationFromQuaternion(tempQuaternion.setFromRotationMatrix(
                                  tempMatrix4.lookAt(tempVector3, v0, up)));
    var clamp = THREE.Math.clamp;
    var te = m.elements;
    var m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
    var m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
    var m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];
    // tempEuler = 'YXZ'
    tempRotation.x = Math.asin(-clamp(m23, -1, 1) );
    if (Math.abs (m23) < 0.99999 ) {
      tempRotation.y = Math.atan2(m13, m33);
      tempRotation.z = Math.atan2(m21, m22);
    } else {
      tempRotation.y = Math.atan2(-m31, m11 );
      tempRotation.z = 0;
    }

    /*tempEuler.setFromQuaternion(
      tempQuaternion.setFromRotationMatrix(
        tempMatrix4.lookAt(tempVector3, v0, up)
     )
   );*/
    tempRotation.x = 0;
    tempRotation.z = 0;
    
    //tempEuler.set(0, tempEuler.y, 0);
    //this.alignQuaternion.setFromEuler(tempEuler);
    var c1 = Math.cos(tempRotation.x / 2);
    var c2 = Math.cos(tempRotation.y / 2);
    var c3 = Math.cos(tempRotation.z / 2);
    var s1 = Math.sin(tempRotation.x / 2);
    var s2 = Math.sin(tempRotation.y / 2);
    var s3 = Math.sin(tempRotation.z / 2);

    //tempEuler = 'YXZ'
    this.alignQuaternion.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.alignQuaternion.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.alignQuaternion.z = c1 * c2 * s3 - s1 * s2 * c3;
    this.alignQuaternion.w = c1 * c2 * c3 + s1 * s2 * s3;

  };

  this.connect = function() {
    this.freeze = false;
  };

  this.disconnect = function() {
    this.freze = true;
  };

};

})();

