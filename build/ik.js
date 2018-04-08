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
  function IKJoint(bone) {
    classCallCheck(this, IKJoint);
    this.bone = bone;
    this._updateWorldPosition();
    this.distance = 0;
    this.isIKJoint = true;
  }
  createClass(IKJoint, [{
    key: '_setDistance',
    value: function _setDistance(distance) {
      this.distance = distance;
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
    key: '_updateWorldPosition',
    value: function _updateWorldPosition() {
      this._worldPosition = getWorldPosition(this.bone, new three.Vector3());
    }
  }, {
    key: '_setWorldPosition',
    value: function _setWorldPosition(position) {
      if ([position.x, position.y, position.z].some(function (n) {
        return Number.isNaN(n);
      })) {
        debugger;throw new Error();
      }
      this._worldPosition.copy(position);
    }
  }, {
    key: '_applyWorldPosition',
    value: function _applyWorldPosition() {
      this.bone.position.copy(this._getWorldPosition());
      this.bone.updateMatrix();
      if (!this.bone.parent) {
        return;
      }
      this.bone.applyMatrix(new three.Matrix4().getInverse(this.bone.parent.matrixWorld));
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
    this.root = null;
    this.effector = null;
    this.origin = null;
    this.iterations = 100;
    this.tolerance = 0.01;
  }
  createClass(IKChain, [{
    key: 'add',
    value: function add(connection) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          target = _ref.target;
      if (!connection.isIKJoint && !connection.isIKChain) {
        throw new Error('Invalid connection in an IKChain. Must be an IKJoint or an IKChain.');
      }
      this.joints = this.joints || [];
      this.joints.push(connection);
      if (this.joints.length === 1) {
        this.root = this.joints[0];
        this.origin = new three.Vector3().copy(this.root._getWorldPosition());
      }
      else {
          var distance = this.joints[this.joints.length - 2]._getWorldDistance(connection);
          if (distance === 0) {
            throw new Error('bone with 0 distance between adjacent bone found');
          }
          this.joints[this.joints.length - 2]._setDistance(distance);
          this.totalLengths += distance;
        }
      if (target) {
        this.effector = connection;
        this.target = target;
      }
    }
  }, {
    key: 'update',
    value: function update() {
      if (!this.root || !this.target) {
        throw new Error('IKChain must have both a base and an IKJoint with a target to solve');
      }
      this.root._updateMatrixWorld();
      this.target.updateMatrixWorld();
      this._targetPosition = new three.Vector3().setFromMatrixPosition(this.target.matrixWorld);
      this.joints.forEach(function (joint) {
        return joint._updateWorldPosition();
      });
      if (this.totalLengths < this.root._getWorldDistance(this.target)) {
        this._solveOutOfRange();
      } else {
        this._solveInRange();
      }
      this.joints.forEach(function (joint) {
        return joint._applyWorldPosition();
      });
    }
  }, {
    key: '_solveInRange',
    value: function _solveInRange() {
      var iteration = 1;
      var difference = this.effector._getWorldDistance(this.target);
      while (difference > this.tolerance) {
        difference = this.effector._getWorldDistance(this.target);
        this._backward();
        this._forward();
        iteration++;
        if (iteration > this.iterations) {
          break;
        }
      }
    }
  }, {
    key: '_solveOutOfRange',
    value: function _solveOutOfRange() {
      for (var i = 0; i < this.joints.length - 1; i++) {
        var joint = this.joints[i];
        var nextJoint = this.joints[i + 1];
        var r = joint._getWorldPosition().distanceTo(this._targetPosition);
        var lambda = joint.distance / r;
        var pos = new three.Vector3().copy(joint._getWorldPosition());
        var targetPos = new three.Vector3().copy(this._targetPosition);
        pos.multiplyScalar(1 - lambda).add(targetPos.multiplyScalar(lambda));
        nextJoint._setWorldPosition(pos);
      }
    }
  }, {
    key: '_backward',
    value: function _backward() {
      this.effector._setWorldPosition(this._targetPosition);
      for (var i = this.joints.length - 1; i > 0; i--) {
        var joint = this.joints[i];
        var prevJoint = this.joints[i - 1];
        var direction = new three.Vector3().subVectors(prevJoint._getWorldPosition(), joint._getWorldPosition()).normalize();
        prevJoint._setWorldPosition(direction.multiplyScalar(joint.distance).add(joint._getWorldPosition()));
      }
    }
  }, {
    key: '_forward',
    value: function _forward() {
      this.root._setWorldPosition(this.origin);
      for (var i = 0; i < this.joints.length - 1; i++) {
        var joint = this.joints[i];
        var nextJoint = this.joints[i + 1];
        var direction = new three.Vector3().subVectors(nextJoint._getWorldPosition(), joint._getWorldPosition()).normalize();
        nextJoint._setWorldPosition(direction.multiplyScalar(nextJoint.distance).add(joint._getWorldPosition()));
      }
    }
  }]);
  return IKChain;
}();

var IK = function () {
  function IK() {
    classCallCheck(this, IK);
    this.chains = [];
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
    key: 'update',
    value: function update() {
      this.chains.forEach(function (c) {
        return c.update(scene);
      });
    }
  }]);
  return IK;
}();

var index = {
  IK: IK, IKChain: IKChain, IKJoint: IKJoint
};

return index;

})));
