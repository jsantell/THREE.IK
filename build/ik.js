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
    this.distance = parent ? this.getWorldDistance(parent) : 0;
    this.isIKJoint = true;
  }
  createClass(IKJoint, [{
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
    this.totalLengths = this.joints.reduce(function (sum, joint) {
      return joint.distance + sum;
    }, 0);
    this.root = this.joints[0];
    this.origin = new three.Vector3().copy(this.root.getWorldPosition());
    this.tolerance = 0.1;
    this.target = target;
  }
  createClass(IK, [{
    key: 'update',
    value: function update() {
      this.root.updateMatrixWorld();
      if (this.totalLengths < this.root.getWorldDistance(this.target)) {
      } else {
        this._solveInRange();
      }
    }
  }, {
    key: '_solveInRange',
    value: function _solveInRange() {
      var targetPosition = new three.Vector3().setFromMatrixPosition(this.target.matrixWorld);
      this.joints.forEach(function (joint) {
        return joint.updateWorldPosition();
      });
      var iteration = 1;
      var difference = this.joints[this.joints.length - 1].getWorldDistance(this.target);
      while (difference > this.tolerance) {
        difference = this.joints[this.joints.length - 1].getWorldDistance(this.target);
        this.joints[this.joints.length - 1].setWorldPosition(targetPosition);
        for (var i = this.joints.length - 2; i >= 0; i--) {
          var joint = this.joints[i];
          var r = joint.getWorldDistance(this.joints[i + 1]);
          var l = joint.distance / r;
          var pos = new three.Vector3().copy(this.joints[i + 1].getWorldPosition());
          pos.multiplyScalar(1 - l);
          var t = new three.Vector3().copy(joint.getWorldPosition()).multiplyScalar(l);
          pos.add(t);
          joint.setWorldPosition(pos);
        }
        this.root.setWorldPosition(this.origin);
        for (var _i = 0; _i < this.joints.length - 2; _i++) {
          var _joint = this.joints[_i];
          var _r = _joint.getWorldDistance(this.joints[_i + 1]);
          var _l = _joint.distance / _r;
          var _pos = new three.Vector3().copy(_joint.getWorldPosition());
          _pos.multiplyScalar(1 - _l);
          var _t = new three.Vector3().copy(this.joints[_i + 1].getWorldPosition()).multiplyScalar(_l);
          _pos.add(_t);
          this.joints[_i + 1].setWorldPosition(_pos);
        }
        iteration++;
        if (iteration > this.iterations) {
          break;
        }
      }
      this.joints.forEach(function (joint) {
        return joint.applyWorldPosition();
      });
    }
  }, {
    key: '_solveOutOfRange',
    value: function _solveOutOfRange() {
      var targetPosition = new three.Vector3().setFromMatrixPosition(this.target.matrixWorld);
      return;
      for (var i = 0; i < this.joints.length - 1; i++) {
        var joint = this.joints[i];
        var r = new three.Vector3().subVectors(targetPosition, joint.getWorldPosition()).length();
        var l = joint.length / r;
        var pos = new three.Vector3().setFromMatrixPosition(joint.bone.matrixWorld);
        pos.multiplyScalar(1 - l);
        var t = new three.Vector3().copy(targetPosition).multiplyScalar(l);
        pos.add(t);
        var worldSpace = new three.Matrix4().makeTranslation(pos.x, pos.y, pos.z);
        var worldInverse = new three.Matrix4().getInverse(joint.bone.matrixWorld);
        var localSpace = worldSpace.multiplyMatrices(worldSpace, worldInverse);
        this.joints[i + 1].bone.applyMatrix(localSpace);
        this.joints[i + 1].bone.updateMatrixWorld();
        console.log(r, l, localSpace.elements[13], joint.getWorldPosition());
      }
      this.joints.map(function (j) {
        return console.log(new three.Vector3().setFromMatrixPosition(j.bone.matrixWorld));
      });
    }
  }]);
  return IK;
}();

return IK;

})));
