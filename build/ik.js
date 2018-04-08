(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('three')) :
	typeof define === 'function' && define.amd ? define(['three'], factory) :
	(global.IK = factory(global.THREE));
}(this, (function (three) { 'use strict';

var getWorldPosition = function getWorldPosition(object, target) {
  return target.setFromMatrixPosition(object.matrixWorld);
};
var getWorldDistance = function () {
  var a = new three.Vector3();
  var b = new three.Vector3();
  return function (obj1, obj2) {
    getWorldPosition(obj1, a);
    getWorldPosition(obj2, b);
    return a.distanceTo(b);
  };
}();

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

var IKJoint = function () {
  function IKJoint(bone, parent) {
    classCallCheck(this, IKJoint);
    this.bone = bone;
    this.parent = parent;
    this.updateWorldPosition();
    this.distance = 0;
    this.isIKJoint = true;
  }
  createClass(IKJoint, [{
    key: 'setDistance',
    value: function setDistance(distance) {
      this.distance = distance;
    }
  }, {
    key: 'updateMatrixWorld',
    value: function updateMatrixWorld() {
      this.bone.updateMatrixWorld(true);
    }
  }, {
    key: 'getWorldPosition',
    value: function getWorldPosition$$1() {
      return this._worldPosition;
    }
  }, {
    key: 'updateWorldPosition',
    value: function updateWorldPosition() {
      this._worldPosition = getWorldPosition(this.bone, new three.Vector3());
    }
  }, {
    key: 'setWorldPosition',
    value: function setWorldPosition(position) {
      if ([position.x, position.y, position.z].some(function (n) {
        return Number.isNaN(n);
      })) {
        debugger;throw new Error();
      }
      this._worldPosition.copy(position);
    }
  }, {
    key: 'applyWorldPosition',
    value: function applyWorldPosition() {
      this.bone.position.copy(this.getWorldPosition());
      this.bone.updateMatrix();
      if (!this.parent) {
        return;
      }
      this.bone.applyMatrix(new three.Matrix4().getInverse(this.parent.bone.matrixWorld));
      this.bone.updateMatrixWorld();
    }
  }, {
    key: 'getWorldDistance',
    value: function getWorldDistance$$1(joint) {
      return this._worldPosition.distanceTo(joint.isIKJoint ? joint.getWorldPosition() : getWorldPosition(joint, new three.Vector3()));
    }
  }]);
  return IKJoint;
}();
var IK = function () {
  function IK(scene, bones, target) {
    classCallCheck(this, IK);
    bones[0].updateMatrixWorld(true);
    this.joints = [];
    for (var i = 0; i < bones.length; i++) {
      this.joints.push(new IKJoint(bones[i], this.joints[i - 1]));
    }
    for (var _i = 0; _i < this.joints.length - 1; _i++) {
      var distance = this.joints[_i].getWorldDistance(this.joints[_i + 1]);
      if (distance === 0) {
        throw new Error('bone with 0 distance between adjacent bone found');
      }
      this.joints[_i].setDistance(distance);
    }
    this.totalLengths = this.joints.reduce(function (sum, joint) {
      return joint.distance + sum;
    }, 0);
    this.root = this.joints[0];
    this.effector = this.joints[this.joints.length - 1];
    this.origin = new three.Vector3().copy(this.root.getWorldPosition());
    this.iterations = 100;
    this.tolerance = 0.01;
    this.target = target;
  }
  createClass(IK, [{
    key: 'update',
    value: function update() {
      this.root.updateMatrixWorld();
      this.target.updateMatrixWorld();
      this.joints.forEach(function (joint) {
        return joint.updateWorldPosition();
      });
      if (this.totalLengths < this.root.getWorldDistance(this.target)) {
        this._solveOutOfRange();
      } else {
        this._solveInRange();
      }
      this.joints.forEach(function (joint) {
        return joint.applyWorldPosition();
      });
    }
  }, {
    key: '_solveInRange',
    value: function _solveInRange() {
      var targetPosition = new three.Vector3().setFromMatrixPosition(this.target.matrixWorld);
      var iteration = 1;
      var difference = this.effector.getWorldDistance(this.target);
      while (difference > this.tolerance) {
        difference = this.effector.getWorldDistance(this.target);
        this.effector.setWorldPosition(targetPosition);
        for (var i = this.joints.length - 1; i > 0; i--) {
          var joint = this.joints[i];
          var prevJoint = this.joints[i - 1];
          var direction = new three.Vector3().subVectors(prevJoint.getWorldPosition(), joint.getWorldPosition()).normalize();
          prevJoint.setWorldPosition(direction.multiplyScalar(joint.distance).add(joint.getWorldPosition()));
        }
        this.root.setWorldPosition(this.origin);
        for (var _i2 = 0; _i2 < this.joints.length - 1; _i2++) {
          var _joint = this.joints[_i2];
          var nextJoint = this.joints[_i2 + 1];
          var _direction = new three.Vector3().subVectors(nextJoint.getWorldPosition(), _joint.getWorldPosition()).normalize();
          nextJoint.setWorldPosition(_direction.multiplyScalar(nextJoint.distance).add(_joint.getWorldPosition()));
        }
        iteration++;
        if (iteration > this.iterations) {
          break;
        }
      }
    }
  }, {
    key: '_solveOutOfRange',
    value: function _solveOutOfRange() {
      var targetPosition = new three.Vector3().setFromMatrixPosition(this.target.matrixWorld);
      for (var i = 0; i < this.joints.length - 1; i++) {
        var joint = this.joints[i];
        var nextJoint = this.joints[i + 1];
        var r = joint.getWorldPosition().distanceTo(targetPosition);
        var lambda = joint.distance / r;
        var pos = new three.Vector3().copy(joint.getWorldPosition());
        var targetPos = new three.Vector3().copy(targetPosition);
        pos.multiplyScalar(1 - lambda).add(targetPos.multiplyScalar(lambda));
        nextJoint.setWorldPosition(pos);
      }
    }
  }]);
  return IK;
}();

return IK;

})));
