(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('three')) :
	typeof define === 'function' && define.amd ? define(['three'], factory) :
	(factory(global.THREE));
}(this, (function (three) { 'use strict';

class App$1 {
  constructor() {
    this.renderer = new three.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;
    document.body.appendChild(this.renderer.domElement);
    this.scene = new three.Scene();
    this.camera = new three.PerspectiveCamera(60, this.getAspect(), 0.1, 1000);
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    this.init();
    this.lastTick = 0;
    this.onTick = this.onTick.bind(this);
    requestAnimationFrame(this.onTick);
  }
  onTick() {
    const t = performance.now();
    const delta = performance.now() - this.lastTick;
    if (this.update) {
      this.update(t, delta);
    }
    if (this.render) {
      this.render(t, delta);
    }
    this.lastTick = t;
    requestAnimationFrame(this.onTick);
  }
  getAspect() {
    return window.innerWidth / window.innerHeight;
  }
  onResize() {
    this.camera.aspect = this.getAspect();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

var OrbitControls = function ( object, domElement ) {
	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	this.enabled = true;
	this.target = new three.Vector3();
	this.minDistance = 0;
	this.maxDistance = Infinity;
	this.minZoom = 0;
	this.maxZoom = Infinity;
	this.minPolarAngle = 0;
	this.maxPolarAngle = Math.PI;
	this.minAzimuthAngle = - Infinity;
	this.maxAzimuthAngle = Infinity;
	this.enableDamping = false;
	this.dampingFactor = 0.25;
	this.enableZoom = true;
	this.zoomSpeed = 1.0;
	this.enableRotate = true;
	this.rotateSpeed = 1.0;
	this.enablePan = true;
	this.panSpeed = 1.0;
	this.screenSpacePanning = false;
	this.keyPanSpeed = 7.0;
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0;
	this.enableKeys = true;
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
	this.mouseButtons = { ORBIT: three.MOUSE.LEFT, ZOOM: three.MOUSE.MIDDLE, PAN: three.MOUSE.RIGHT };
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;
	this.getPolarAngle = function () {
		return spherical.phi;
	};
	this.getAzimuthalAngle = function () {
		return spherical.theta;
	};
	this.saveState = function () {
		scope.target0.copy( scope.target );
		scope.position0.copy( scope.object.position );
		scope.zoom0 = scope.object.zoom;
	};
	this.reset = function () {
		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;
		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );
		scope.update();
		state = STATE.NONE;
	};
	this.update = function () {
		var offset = new three.Vector3();
		var quat = new three.Quaternion().setFromUnitVectors( object.up, new three.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();
		var lastPosition = new three.Vector3();
		var lastQuaternion = new three.Quaternion();
		return function update() {
			var position = scope.object.position;
			offset.copy( position ).sub( scope.target );
			offset.applyQuaternion( quat );
			spherical.setFromVector3( offset );
			if ( scope.autoRotate && state === STATE.NONE ) {
				rotateLeft( getAutoRotationAngle() );
			}
			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );
			spherical.makeSafe();
			spherical.radius *= scale;
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );
			scope.target.add( panOffset );
			offset.setFromSpherical( spherical );
			offset.applyQuaternion( quatInverse );
			position.copy( scope.target ).add( offset );
			scope.object.lookAt( scope.target );
			if ( scope.enableDamping === true ) {
				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );
				panOffset.multiplyScalar( 1 - scope.dampingFactor );
			} else {
				sphericalDelta.set( 0, 0, 0 );
				panOffset.set( 0, 0, 0 );
			}
			scale = 1;
			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {
				scope.dispatchEvent( changeEvent );
				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;
				return true;
			}
			return false;
		};
	}();
	this.dispose = function () {
		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );
		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );
		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		window.removeEventListener( 'keydown', onKeyDown, false );
	};
	var scope = this;
	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };
	var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4 };
	var state = STATE.NONE;
	var EPS = 0.000001;
	var spherical = new three.Spherical();
	var sphericalDelta = new three.Spherical();
	var scale = 1;
	var panOffset = new three.Vector3();
	var zoomChanged = false;
	var rotateStart = new three.Vector2();
	var rotateEnd = new three.Vector2();
	var rotateDelta = new three.Vector2();
	var panStart = new three.Vector2();
	var panEnd = new three.Vector2();
	var panDelta = new three.Vector2();
	var dollyStart = new three.Vector2();
	var dollyEnd = new three.Vector2();
	var dollyDelta = new three.Vector2();
	function getAutoRotationAngle() {
		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
	}
	function getZoomScale() {
		return Math.pow( 0.95, scope.zoomSpeed );
	}
	function rotateLeft( angle ) {
		sphericalDelta.theta -= angle;
	}
	function rotateUp( angle ) {
		sphericalDelta.phi -= angle;
	}
	var panLeft = function () {
		var v = new three.Vector3();
		return function panLeft( distance, objectMatrix ) {
			v.setFromMatrixColumn( objectMatrix, 0 );
			v.multiplyScalar( - distance );
			panOffset.add( v );
		};
	}();
	var panUp = function () {
		var v = new three.Vector3();
		return function panUp( distance, objectMatrix ) {
			if ( scope.screenSpacePanning === true ) {
				v.setFromMatrixColumn( objectMatrix, 1 );
			} else {
				v.setFromMatrixColumn( objectMatrix, 0 );
				v.crossVectors( scope.object.up, v );
			}
			v.multiplyScalar( distance );
			panOffset.add( v );
		};
	}();
	var pan = function () {
		var offset = new three.Vector3();
		return function pan( deltaX, deltaY ) {
			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
			if ( scope.object.isPerspectiveCamera ) {
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );
			} else if ( scope.object.isOrthographicCamera ) {
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );
			} else {
				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
				scope.enablePan = false;
			}
		};
	}();
	function dollyIn( dollyScale ) {
		if ( scope.object.isPerspectiveCamera ) {
			scale /= dollyScale;
		} else if ( scope.object.isOrthographicCamera ) {
			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;
		} else {
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;
		}
	}
	function dollyOut( dollyScale ) {
		if ( scope.object.isPerspectiveCamera ) {
			scale *= dollyScale;
		} else if ( scope.object.isOrthographicCamera ) {
			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;
		} else {
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;
		}
	}
	function handleMouseDownRotate( event ) {
		rotateStart.set( event.clientX, event.clientY );
	}
	function handleMouseDownDolly( event ) {
		dollyStart.set( event.clientX, event.clientY );
	}
	function handleMouseDownPan( event ) {
		panStart.set( event.clientX, event.clientY );
	}
	function handleMouseMoveRotate( event ) {
		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );
		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth );
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );
		rotateStart.copy( rotateEnd );
		scope.update();
	}
	function handleMouseMoveDolly( event ) {
		dollyEnd.set( event.clientX, event.clientY );
		dollyDelta.subVectors( dollyEnd, dollyStart );
		if ( dollyDelta.y > 0 ) {
			dollyIn( getZoomScale() );
		} else if ( dollyDelta.y < 0 ) {
			dollyOut( getZoomScale() );
		}
		dollyStart.copy( dollyEnd );
		scope.update();
	}
	function handleMouseMovePan( event ) {
		panEnd.set( event.clientX, event.clientY );
		panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
		pan( panDelta.x, panDelta.y );
		panStart.copy( panEnd );
		scope.update();
	}
	function handleMouseWheel( event ) {
		if ( event.deltaY < 0 ) {
			dollyOut( getZoomScale() );
		} else if ( event.deltaY > 0 ) {
			dollyIn( getZoomScale() );
		}
		scope.update();
	}
	function handleKeyDown( event ) {
		switch ( event.keyCode ) {
			case scope.keys.UP:
				pan( 0, scope.keyPanSpeed );
				scope.update();
				break;
			case scope.keys.BOTTOM:
				pan( 0, - scope.keyPanSpeed );
				scope.update();
				break;
			case scope.keys.LEFT:
				pan( scope.keyPanSpeed, 0 );
				scope.update();
				break;
			case scope.keys.RIGHT:
				pan( - scope.keyPanSpeed, 0 );
				scope.update();
				break;
		}
	}
	function handleTouchStartRotate( event ) {
		rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
	}
	function handleTouchStartDollyPan( event ) {
		if ( scope.enableZoom ) {
			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			var distance = Math.sqrt( dx * dx + dy * dy );
			dollyStart.set( 0, distance );
		}
		if ( scope.enablePan ) {
			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );
			panStart.set( x, y );
		}
	}
	function handleTouchMoveRotate( event ) {
		rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );
		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth );
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );
		rotateStart.copy( rotateEnd );
		scope.update();
	}
	function handleTouchMoveDollyPan( event ) {
		if ( scope.enableZoom ) {
			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			var distance = Math.sqrt( dx * dx + dy * dy );
			dollyEnd.set( 0, distance );
			dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );
			dollyIn( dollyDelta.y );
			dollyStart.copy( dollyEnd );
		}
		if ( scope.enablePan ) {
			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );
			panEnd.set( x, y );
			panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
			pan( panDelta.x, panDelta.y );
			panStart.copy( panEnd );
		}
		scope.update();
	}
	function onMouseDown( event ) {
		if ( scope.enabled === false ) return;
		event.preventDefault();
		switch ( event.button ) {
			case scope.mouseButtons.ORBIT:
				if ( scope.enableRotate === false ) return;
				handleMouseDownRotate( event );
				state = STATE.ROTATE;
				break;
			case scope.mouseButtons.ZOOM:
				if ( scope.enableZoom === false ) return;
				handleMouseDownDolly( event );
				state = STATE.DOLLY;
				break;
			case scope.mouseButtons.PAN:
				if ( scope.enablePan === false ) return;
				handleMouseDownPan( event );
				state = STATE.PAN;
				break;
		}
		if ( state !== STATE.NONE ) {
			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );
			scope.dispatchEvent( startEvent );
		}
	}
	function onMouseMove( event ) {
		if ( scope.enabled === false ) return;
		event.preventDefault();
		switch ( state ) {
			case STATE.ROTATE:
				if ( scope.enableRotate === false ) return;
				handleMouseMoveRotate( event );
				break;
			case STATE.DOLLY:
				if ( scope.enableZoom === false ) return;
				handleMouseMoveDolly( event );
				break;
			case STATE.PAN:
				if ( scope.enablePan === false ) return;
				handleMouseMovePan( event );
				break;
		}
	}
	function onMouseUp( event ) {
		if ( scope.enabled === false ) return;
		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( endEvent );
		state = STATE.NONE;
	}
	function onMouseWheel( event ) {
		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;
		event.preventDefault();
		event.stopPropagation();
		scope.dispatchEvent( startEvent );
		handleMouseWheel( event );
		scope.dispatchEvent( endEvent );
	}
	function onKeyDown( event ) {
		if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;
		handleKeyDown( event );
	}
	function onTouchStart( event ) {
		if ( scope.enabled === false ) return;
		event.preventDefault();
		switch ( event.touches.length ) {
			case 1:
				if ( scope.enableRotate === false ) return;
				handleTouchStartRotate( event );
				state = STATE.TOUCH_ROTATE;
				break;
			case 2:
				if ( scope.enableZoom === false && scope.enablePan === false ) return;
				handleTouchStartDollyPan( event );
				state = STATE.TOUCH_DOLLY_PAN;
				break;
			default:
				state = STATE.NONE;
		}
		if ( state !== STATE.NONE ) {
			scope.dispatchEvent( startEvent );
		}
	}
	function onTouchMove( event ) {
		if ( scope.enabled === false ) return;
		event.preventDefault();
		event.stopPropagation();
		switch ( event.touches.length ) {
			case 1:
				if ( scope.enableRotate === false ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return;
				handleTouchMoveRotate( event );
				break;
			case 2:
				if ( scope.enableZoom === false && scope.enablePan === false ) return;
				if ( state !== STATE.TOUCH_DOLLY_PAN ) return;
				handleTouchMoveDollyPan( event );
				break;
			default:
				state = STATE.NONE;
		}
	}
	function onTouchEnd( event ) {
		if ( scope.enabled === false ) return;
		scope.dispatchEvent( endEvent );
		state = STATE.NONE;
	}
	function onContextMenu( event ) {
		if ( scope.enabled === false ) return;
		event.preventDefault();
	}
	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );
	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );
	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );
	window.addEventListener( 'keydown', onKeyDown, false );
	this.update();
};
OrbitControls.prototype = Object.create( three.EventDispatcher.prototype );
OrbitControls.prototype.constructor = OrbitControls;
Object.defineProperties( OrbitControls.prototype, {
	center: {
		get: function () {
			console.warn( 'OrbitControls: .center has been renamed to .target' );
			return this.target;
		}
	},
	noZoom: {
		get: function () {
			console.warn( 'OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			return ! this.enableZoom;
		},
		set: function ( value ) {
			console.warn( 'OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			this.enableZoom = ! value;
		}
	},
	noRotate: {
		get: function () {
			console.warn( 'OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			return ! this.enableRotate;
		},
		set: function ( value ) {
			console.warn( 'OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			this.enableRotate = ! value;
		}
	},
	noPan: {
		get: function () {
			console.warn( 'OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			return ! this.enablePan;
		},
		set: function ( value ) {
			console.warn( 'OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			this.enablePan = ! value;
		}
	},
	noKeys: {
		get: function () {
			console.warn( 'OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			return ! this.enableKeys;
		},
		set: function ( value ) {
			console.warn( 'OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			this.enableKeys = ! value;
		}
	},
	staticMoving: {
		get: function () {
			console.warn( 'OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			return ! this.enableDamping;
		},
		set: function ( value ) {
			console.warn( 'OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			this.enableDamping = ! value;
		}
	},
	dynamicDampingFactor: {
		get: function () {
			console.warn( 'OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			return this.dampingFactor;
		},
		set: function ( value ) {
			console.warn( 'OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			this.dampingFactor = value;
		}
	}
} );

var t1 = new three.Vector3();
var t2 = new three.Vector3();
var t3 = new three.Vector3();
var m1 = new three.Matrix4();
function getWorldPosition(object, target) {
  return target.setFromMatrixPosition(object.matrixWorld);
}
function getCentroid(positions, target) {
  target.set(0, 0, 0);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;
  try {
    for (var _iterator = positions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var position = _step.value;
      target.add(position);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
  target.divideScalar(positions.length);
  return target;
}
function setQuaternionFromDirection(direction, up, target) {
  var x = t1;
  var y = t2;
  var z = t3;
  var m = m1;
  var el = m1.elements;
  z.copy(direction);
  x.crossVectors(up, z);
  if (x.lengthSq() === 0) {
    if (Math.abs(up.z) === 1) {
      z.x += 0.0001;
    } else {
      z.z += 0.0001;
    }
    z.normalize();
    x.crossVectors(up, z);
  }
  x.normalize();
  y.crossVectors(z, x);
  el[0] = x.x;el[4] = y.x;el[8] = z.x;
  el[1] = x.y;el[5] = y.y;el[9] = z.y;
  el[2] = x.z;el[6] = y.z;el[10] = z.z;
  target.setFromRotationMatrix(m);
}
function transformPoint(vector, matrix, target) {
  var e = matrix.elements;
  var x = vector.x * e[0] + vector.y * e[4] + vector.z * e[8] + e[12];
  var y = vector.x * e[1] + vector.y * e[5] + vector.z * e[9] + e[13];
  var z = vector.x * e[2] + vector.y * e[6] + vector.z * e[10] + e[14];
  var w = vector.x * e[3] + vector.y * e[7] + vector.z * e[11] + e[15];
  target.set(x / w, y / w, z / w);
}
var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }
  function AsyncGenerator(gen) {
    var front, back;
    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };
        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }
    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;
        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }
    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;
        case "throw":
          front.reject(value);
          break;
        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }
      front = front.next;
      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }
    this._invoke = send;
    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }
  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }
  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };
  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };
  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };
  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();
var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);
  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);
    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;
    if (getter === undefined) {
      return undefined;
    }
    return getter.call(receiver);
  }
};
var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};
var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};
var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;
    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();
var Z_AXIS = new three.Vector3(0, 0, 1);
var DEG2RAD = three.Math.DEG2RAD;
var RAD2DEG = three.Math.RAD2DEG;
var IKBallConstraint = function () {
  function IKBallConstraint(angle) {
    classCallCheck(this, IKBallConstraint);
    this.angle = angle;
  }
  createClass(IKBallConstraint, [{
    key: '_apply',
    value: function _apply(joint) {
      var direction = new three.Vector3().copy(joint._getDirection());
      var parentDirection = joint._localToWorldDirection(new three.Vector3().copy(Z_AXIS)).normalize();
      var currentAngle = direction.angleTo(parentDirection) * RAD2DEG;
      if (this.angle / 2 < currentAngle) {
        direction.normalize();
        var correctionAxis = new three.Vector3().crossVectors(parentDirection, direction).normalize();
        parentDirection.applyAxisAngle(correctionAxis, this.angle * DEG2RAD * 0.5);
        joint._setDirection(parentDirection);
        return true;
      }
      return false;
    }
  }]);
  return IKBallConstraint;
}();
var Y_AXIS = new three.Vector3(0, 1, 0);
var IKJoint = function () {
  function IKJoint(bone) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        constraints = _ref.constraints;
    classCallCheck(this, IKJoint);
    this.constraints = constraints || [];
    this.bone = bone;
    this.distance = 0;
    this._originalDirection = new three.Vector3();
    this._direction = new three.Vector3();
    this._worldPosition = new three.Vector3();
    this._isSubBase = false;
    this._subBasePositions = null;
    this.isIKJoint = true;
    this._updateWorldPosition();
  }
  createClass(IKJoint, [{
    key: '_setIsSubBase',
    value: function _setIsSubBase() {
      this._isSubBase = true;
      this._subBasePositions = [];
    }
  }, {
    key: '_applySubBasePositions',
    value: function _applySubBasePositions() {
      if (this._subBasePositions.length === 0) {
        return;
      }
      getCentroid(this._subBasePositions, this._worldPosition);
      this._subBasePositions.length = 0;
    }
  }, {
    key: '_applyConstraints',
    value: function _applyConstraints() {
      if (!this.constraints) {
        return;
      }
      var constraintApplied = false;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;
      try {
        for (var _iterator = this.constraints[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var constraint = _step.value;
          if (constraint && constraint._apply) {
            var applied = constraint._apply(this);
            constraintApplied = constraintApplied || applied;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
      return constraintApplied;
    }
  }, {
    key: '_setDistance',
    value: function _setDistance(distance) {
      this.distance = distance;
    }
  }, {
    key: '_getDirection',
    value: function _getDirection() {
      return this._direction;
    }
  }, {
    key: '_setDirection',
    value: function _setDirection(direction) {
      this._direction.copy(direction);
    }
  }, {
    key: '_getDistance',
    value: function _getDistance() {
      return this.distance;
    }
  }, {
    key: '_updateMatrixWorld',
    value: function _updateMatrixWorld() {
      this.bone.updateMatrixWorld(true);
    }
  }, {
    key: '_getWorldPosition',
    value: function _getWorldPosition() {
      return this._worldPosition;
    }
  }, {
    key: '_getWorldDirection',
    value: function _getWorldDirection(joint) {
      return new three.Vector3().subVectors(this._getWorldPosition(), joint._getWorldPosition()).normalize();
    }
  }, {
    key: '_updateWorldPosition',
    value: function _updateWorldPosition() {
      getWorldPosition(this.bone, this._worldPosition);
    }
  }, {
    key: '_setWorldPosition',
    value: function _setWorldPosition(position) {
      this._worldPosition.copy(position);
    }
  }, {
    key: '_localToWorldDirection',
    value: function _localToWorldDirection(direction) {
      if (this.bone.parent) {
        var parent = this.bone.parent.matrixWorld;
        direction.transformDirection(parent);
      }
      return direction;
    }
  }, {
    key: '_worldToLocalDirection',
    value: function _worldToLocalDirection(direction) {
      if (this.bone.parent) {
        var inverseParent = new three.Matrix4().getInverse(this.bone.parent.matrixWorld);
        direction.transformDirection(inverseParent);
      }
      return direction;
    }
  }, {
    key: '_applyWorldPosition',
    value: function _applyWorldPosition() {
      var direction = new three.Vector3().copy(this._direction);
      var position = new three.Vector3().copy(this._getWorldPosition());
      var parent = this.bone.parent;
      if (parent) {
        this._updateMatrixWorld();
        var inverseParent = new three.Matrix4().getInverse(this.bone.parent.matrixWorld);
        transformPoint(position, inverseParent, position);
        this.bone.position.copy(position);
        this._updateMatrixWorld();
        this._worldToLocalDirection(direction);
        setQuaternionFromDirection(direction, Y_AXIS, this.bone.quaternion);
      } else {
        this.bone.position.copy(position);
      }
      this.bone.updateMatrix();
      this._updateMatrixWorld();
    }
  }, {
    key: '_getWorldDistance',
    value: function _getWorldDistance(joint) {
      return this._worldPosition.distanceTo(joint.isIKJoint ? joint._getWorldPosition() : getWorldPosition(joint, new three.Vector3()));
    }
  }]);
  return IKJoint;
}();
var IKChain = function () {
  function IKChain() {
    classCallCheck(this, IKChain);
    this.isIKChain = true;
    this.totalLengths = 0;
    this.base = null;
    this.effector = null;
    this.effectorIndex = null;
    this.chains = new Map();
    this.origin = null;
    this.iterations = 100;
    this.tolerance = 0.01;
    this._depth = -1;
    this._targetPosition = new three.Vector3();
  }
  createClass(IKChain, [{
    key: 'add',
    value: function add(joint) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          target = _ref.target;
      if (this.effector) {
        throw new Error('Cannot add additional joints to a chain with an end effector.');
      }
      if (!joint.isIKJoint) {
        if (joint.isBone) {
          joint = new IKJoint(joint);
        } else {
          throw new Error('Invalid joint in an IKChain. Must be an IKJoint or a THREE.Bone.');
        }
      }
      this.joints = this.joints || [];
      this.joints.push(joint);
      if (this.joints.length === 1) {
        this.base = this.joints[0];
        this.origin = new three.Vector3().copy(this.base._getWorldPosition());
      }
      else {
          var previousJoint = this.joints[this.joints.length - 2];
          previousJoint._updateMatrixWorld();
          previousJoint._updateWorldPosition();
          joint._updateWorldPosition();
          var distance = previousJoint._getWorldDistance(joint);
          if (distance === 0) {
            throw new Error('bone with 0 distance between adjacent bone found');
          }
          joint._setDistance(distance);
          joint._updateWorldPosition();
          var direction = previousJoint._getWorldDirection(joint);
          previousJoint._originalDirection = new three.Vector3().copy(direction);
          joint._originalDirection = new three.Vector3().copy(direction);
          this.totalLengths += distance;
        }
      if (target) {
        this.effector = joint;
        this.effectorIndex = joint;
        this.target = target;
      }
      return this;
    }
  }, {
    key: '_hasEffector',
    value: function _hasEffector() {
      return !!this.effector;
    }
  }, {
    key: '_getDistanceFromTarget',
    value: function _getDistanceFromTarget() {
      return this._hasEffector() ? this.effector._getWorldDistance(this.target) : -1;
    }
  }, {
    key: 'connect',
    value: function connect(chain) {
      if (!chain.isIKChain) {
        throw new Error('Invalid connection in an IKChain. Must be an IKChain.');
      }
      if (!chain.base.isIKJoint) {
        throw new Error('Connecting chain does not have a base joint.');
      }
      var index = this.joints.indexOf(chain.base);
      if (this.target && index === this.joints.length - 1) {
        throw new Error('Cannot append a chain to an end joint in a chain with a target.');
      }
      if (index === -1) {
        throw new Error('Cannot connect chain that does not have a base joint in parent chain.');
      }
      this.joints[index]._setIsSubBase();
      var chains = this.chains.get(index);
      if (!chains) {
        chains = [];
        this.chains.set(index, chains);
      }
      chains.push(chain);
      return this;
    }
  }, {
    key: '_updateJointWorldPositions',
    value: function _updateJointWorldPositions() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;
      try {
        for (var _iterator = this.joints[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var joint = _step.value;
          joint._updateWorldPosition();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: '_forward',
    value: function _forward() {
      this.origin.copy(this.base._getWorldPosition());
      if (this.target) {
        this._targetPosition.setFromMatrixPosition(this.target.matrixWorld);
        this.effector._setWorldPosition(this._targetPosition);
      } else if (!this.joints[this.joints.length - 1]._isSubBase) {
        return;
      }
      for (var i = 1; i < this.joints.length; i++) {
        var joint = this.joints[i];
        if (joint._isSubBase) {
          joint._applySubBasePositions();
        }
      }
      for (var _i = this.joints.length - 1; _i > 0; _i--) {
        var _joint = this.joints[_i];
        var prevJoint = this.joints[_i - 1];
        var direction = prevJoint._getWorldDirection(_joint);
        var worldPosition = direction.multiplyScalar(_joint.distance).add(_joint._getWorldPosition());
        if (prevJoint === this.base && this.base._isSubBase) {
          this.base._subBasePositions.push(worldPosition);
        } else {
          prevJoint._setWorldPosition(worldPosition);
        }
      }
    }
  }, {
    key: '_backward',
    value: function _backward() {
      if (!this.base._isSubBase) {
        this.base._setWorldPosition(this.origin);
      }
      for (var i = 0; i < this.joints.length - 1; i++) {
        var joint = this.joints[i];
        var nextJoint = this.joints[i + 1];
        var jointWorldPosition = joint._getWorldPosition();
        var direction = nextJoint._getWorldDirection(joint);
        joint._setDirection(direction);
        joint._applyConstraints();
        direction.copy(joint._direction);
        if (!(this.base === joint && joint._isSubBase)) {
          joint._applyWorldPosition();
        }
        nextJoint._setWorldPosition(direction.multiplyScalar(nextJoint.distance).add(jointWorldPosition));
        if (i === this.joints.length - 2) {
          if (nextJoint !== this.effector) {
            nextJoint._setDirection(direction);
          }
          nextJoint._applyWorldPosition();
        }
      }
      return this._getDistanceFromTarget();
    }
  }]);
  return IKChain;
}();
var IK = function () {
  function IK() {
    classCallCheck(this, IK);
    this.chains = [];
    this._needsRecalculated = true;
    this.isIK = true;
    this._orderedChains = null;
  }
  createClass(IK, [{
    key: 'add',
    value: function add(chain) {
      if (!chain.isIKChain) {
        throw new Error('Argument is not an IKChain.');
      }
      this.chains.push(chain);
    }
  }, {
    key: 'recalculate',
    value: function recalculate() {
      this._orderedChains = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;
      try {
        for (var _iterator = this.chains[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var rootChain = _step.value;
          var orderedChains = [];
          this._orderedChains.push(orderedChains);
          var chainsToSave = [rootChain];
          while (chainsToSave.length) {
            var chain = chainsToSave.shift();
            orderedChains.push(chain);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;
            try {
              for (var _iterator2 = chain.chains.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var subChains = _step2.value;
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;
                try {
                  for (var _iterator3 = subChains[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var subChain = _step3.value;
                    if (chainsToSave.indexOf(subChain) !== -1) {
                      throw new Error('Recursive chain structure detected.');
                    }
                    chainsToSave.push(subChain);
                  }
                } catch (err) {
                  _didIteratorError3 = true;
                  _iteratorError3 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                      _iterator3.return();
                    }
                  } finally {
                    if (_didIteratorError3) {
                      throw _iteratorError3;
                    }
                  }
                }
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'solve',
    value: function solve() {
      if (!this._orderedChains) {
        this.recalculate();
      }
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;
      try {
        for (var _iterator4 = this._orderedChains[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var subChains = _step4.value;
          var iterations = 1;
          while (iterations > 0) {
            for (var i = subChains.length - 1; i >= 0; i--) {
              subChains[i]._updateJointWorldPositions();
            }
            for (var _i = subChains.length - 1; _i >= 0; _i--) {
              subChains[_i]._forward();
            }
            var withinTolerance = true;
            for (var _i2 = 0; _i2 < subChains.length; _i2++) {
              var distanceFromTarget = subChains[_i2]._backward();
              if (distanceFromTarget > this.tolerance) {
                withinTolerance = false;
              }
            }
            if (withinTolerance) {
              break;
            }
            iterations--;
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: 'getRootBone',
    value: function getRootBone() {
      return this.chains[0].base.bone;
    }
  }]);
  return IK;
}();
var BoneHelper = function (_Object3D) {
  inherits(BoneHelper, _Object3D);
  function BoneHelper(height, boneSize, axesSize) {
    classCallCheck(this, BoneHelper);
    var _this = possibleConstructorReturn(this, (BoneHelper.__proto__ || Object.getPrototypeOf(BoneHelper)).call(this));
    if (height !== 0) {
      var geo = new three.ConeBufferGeometry(boneSize, height, 4);
      geo.applyMatrix(new three.Matrix4().makeRotationAxis(new three.Vector3(1, 0, 0), Math.PI / 2));
      _this.boneMesh = new three.Mesh(geo, new three.MeshLambertMaterial({
        color: 0xff0000,
        wireframe: true,
        depthTest: false,
        depthWrite: false
      }));
    } else {
      _this.boneMesh = new three.Object3D();
    }
    _this.boneMesh.position.z = height / 2;
    _this.add(_this.boneMesh);
    _this.axesHelper = new three.AxesHelper(axesSize);
    _this.add(_this.axesHelper);
    return _this;
  }
  return BoneHelper;
}(three.Object3D);
var IKHelper = function (_Object3D2) {
  inherits(IKHelper, _Object3D2);
  function IKHelper(ik) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        color = _ref.color,
        showBones = _ref.showBones,
        boneSize = _ref.boneSize,
        showAxes = _ref.showAxes,
        axesSize = _ref.axesSize,
        wireframe = _ref.wireframe;
    classCallCheck(this, IKHelper);
    var _this2 = possibleConstructorReturn(this, (IKHelper.__proto__ || Object.getPrototypeOf(IKHelper)).call(this));
    boneSize = boneSize || 0.1;
    axesSize = axesSize || 0.2;
    if (!ik.isIK) {
      throw new Error('IKHelper must receive an IK instance.');
    }
    _this2.ik = ik;
    _this2._meshes = new Map();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;
    try {
      for (var _iterator = _this2.ik.chains[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var rootChain = _step.value;
        var chainsToMeshify = [rootChain];
        while (chainsToMeshify.length) {
          var chain = chainsToMeshify.shift();
          for (var i = 0; i < chain.joints.length; i++) {
            var joint = chain.joints[i];
            var nextJoint = chain.joints[i + 1];
            var distance = nextJoint ? nextJoint.distance : 0;
            if (chain.base === joint && chain !== rootChain) {
              continue;
            }
            var mesh = new BoneHelper(distance, boneSize, axesSize);
            mesh.matrixAutoUpdate = false;
            _this2._meshes.set(joint, mesh);
            _this2.add(mesh);
          }
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;
          try {
            for (var _iterator2 = chain.chains.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var subChains = _step2.value;
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;
              try {
                for (var _iterator3 = subChains[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var subChain = _step3.value;
                  chainsToMeshify.push(subChain);
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
    _this2.showBones = showBones !== undefined ? showBones : true;
    _this2.showAxes = showAxes !== undefined ? showAxes : true;
    _this2.wireframe = wireframe !== undefined ? wireframe : true;
    _this2.color = color || new three.Color(0xff0077);
    return _this2;
  }
  createClass(IKHelper, [{
    key: 'updateMatrixWorld',
    value: function updateMatrixWorld(force) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;
      try {
        for (var _iterator4 = this._meshes[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _ref2 = _step4.value;
          var _ref3 = slicedToArray(_ref2, 2);
          var joint = _ref3[0];
          var mesh = _ref3[1];
          mesh.matrix.copy(joint.bone.matrixWorld);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
      get(IKHelper.prototype.__proto__ || Object.getPrototypeOf(IKHelper.prototype), 'updateMatrixWorld', this).call(this, force);
    }
  }, {
    key: 'showBones',
    get: function get$$1() {
      return this._showBones;
    },
    set: function set$$1(showBones) {
      if (showBones === this._showBones) {
        return;
      }
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;
      try {
        for (var _iterator5 = this._meshes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var _ref4 = _step5.value;
          var _ref5 = slicedToArray(_ref4, 2);
          var mesh = _ref5[1];
          if (showBones) {
            mesh.add(mesh.boneMesh);
          } else {
            mesh.remove(mesh.boneMesh);
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
      this._showBones = showBones;
    }
  }, {
    key: 'showAxes',
    get: function get$$1() {
      return this._showAxes;
    },
    set: function set$$1(showAxes) {
      if (showAxes === this._showAxes) {
        return;
      }
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;
      try {
        for (var _iterator6 = this._meshes[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var _ref6 = _step6.value;
          var _ref7 = slicedToArray(_ref6, 2);
          var mesh = _ref7[1];
          if (showAxes) {
            mesh.add(mesh.axesHelper);
          } else {
            mesh.remove(mesh.axesHelper);
          }
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
      this._showAxes = showAxes;
    }
  }, {
    key: 'wireframe',
    get: function get$$1() {
      return this._wireframe;
    },
    set: function set$$1(wireframe) {
      if (wireframe === this._wireframe) {
        return;
      }
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;
      try {
        for (var _iterator7 = this._meshes[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var _ref8 = _step7.value;
          var _ref9 = slicedToArray(_ref8, 2);
          var mesh = _ref9[1];
          if (mesh.boneMesh.material) {
            mesh.boneMesh.material.wireframe = wireframe;
          }
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
      this._wireframe = wireframe;
    }
  }, {
    key: 'color',
    get: function get$$1() {
      return this._color;
    },
    set: function set$$1(color) {
      if (this._color && this._color.equals(color)) {
        return;
      }
      color = color && color.isColor ? color : new three.Color(color);
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;
      try {
        for (var _iterator8 = this._meshes[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _ref10 = _step8.value;
          var _ref11 = slicedToArray(_ref10, 2);
          var mesh = _ref11[1];
          if (mesh.boneMesh.material) {
            mesh.boneMesh.material.color = color;
          }
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }
      this._color = color;
    }
  }]);
  return IKHelper;
}(three.Object3D);

const ARM_COUNT = 15;
const SEGMENT_COUNT = 15;
const SEGMENT_DISTANCE = 0.4;
const ARMS_RADIUS = 3;
class App extends App$1 {
  init() {
    this.renderer.setClearColor(0xefefef);
    this.renderer.autoClear = true;
    this.mouseTarget = new three.Object3D();
    this.scene.add(this.mouseTarget);
    this.controls = new OrbitControls(this.camera);
    this.helpers = [];
    this.iks = [];
    const constraints = [];
    for (let i = 0; i < ARM_COUNT; i++) {
      const chain = new IKChain();
      let lastBone = null;
      for (let j = 0; j < SEGMENT_COUNT; j++) {
        const bone = new three.Bone();
        bone.position.y = j === 0 ? 0 : SEGMENT_DISTANCE;
        if (lastBone) {
          lastBone.add(bone);
        }
        const target = j === SEGMENT_COUNT - 1 ? this.mouseTarget: null;
        chain.add(new IKJoint(bone, { constraints }), { target });
        lastBone = bone;
      }
      const ik = new IK();
      ik.add(chain);
      const rootBone = ik.getRootBone();
      const base = new three.Object3D();
      base.rotation.x = -Math.PI / 2;
      base.position.x = Math.sin(Math.PI * 2 * (i / ARM_COUNT)) * ARMS_RADIUS;
      base.position.y = Math.cos(Math.PI * 2 * (i / ARM_COUNT)) * ARMS_RADIUS;
      base.add(rootBone);
      this.scene.add(base);
      this.iks.push(ik);
    }
    this.scene.add(new THREE.AmbientLight(0xffffff));
    for (let ik of this.iks) {
      const helper = new IKHelper(ik);
      let counter = 0;
      for (let [joint, mesh] of helper._meshes) {
        const color = new three.Color(`hsl(${(counter/SEGMENT_COUNT)*360}, 80%, 80%)`);
        mesh.boneMesh.material = new three.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.9,
        });
        counter++;
      }
      this.helpers.push(helper);
      this.scene.add(helper);
    }
    this.camera.position.z = 4;
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }
  onMouseUp() {
    this.mouseDown = false;
  }
  onMouseDown() {
    this.mouseDown = true;
  }
  onMouseMove(event) {
    if (this.mouseDown) {
      return;
    }
    this._vector = this._vector || new THREE.Vector3();
    this._vector.set((event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1,
                    0.5);
    this._vector.unproject(this.camera);
    const dir = this._vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
    this.mouseTarget.position.copy(pos);
  }
  update(t, delta) {
    this.camera.rotation.z += delta * 0.0001;
    for (let ik of this.iks) {
      ik.solve();
    }
    const temp = {};
    for (let helper of this.helpers) {
      for (let [joint, mesh] of helper._meshes) {
        mesh.boneMesh.material.color.getHSL(temp);
        mesh.boneMesh.material.color.setHSL((temp.h + 0.005) % 360, temp.s, temp.l);
      }
    }
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
window.app = new App();

})));
