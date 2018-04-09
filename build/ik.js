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
    this._isSubBase = false;
    this._subBasePositions = null;
    this.isIKJoint = true;
  }
  createClass(IKJoint, [{
    key: 'isSubBase',
    value: function isSubBase() {
      return this._isSubBase;
    }
  }, {
    key: '_setIsSubBase',
    value: function _setIsSubBase() {
      this._isSubBase = true;
      this._subBasePositions = [];
    }
  }, {
    key: '_applySubBasePositions',
    value: function _applySubBasePositions() {
      getCentroid(this._subBasePositions, this._worldPosition);
      this._subBasePositions.length = 0;
    }
  }, {
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
        throw new Error('Invalid joint in an IKChain. Must be an IKJoint.');
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
          var distance = this.joints[this.joints.length - 2]._getWorldDistance(joint);
          if (distance === 0) {
            throw new Error('bone with 0 distance between adjacent bone found');
          }
          this.joints[this.joints.length - 2]._setDistance(distance);
          this.totalLengths += distance;
        }
      if (target) {
        this.effector = joint;
        this.effectorIndex = joint;
        this.target = target;
      }
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
    }
  }, {
    key: 'update',
    value: function update() {
      if (!this.base) {
        throw new Error('IKChain must have at least one joint.');
      }
      if (!this.target) {
        throw new Error('IKChain must have a target.');
      }
      this.target.updateMatrixWorld();
      this._solveInRange();
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
    key: '_applyJointWorldPositions',
    value: function _applyJointWorldPositions() {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;
      try {
        for (var _iterator2 = this.joints[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var joint = _step2.value;
          joint._applyWorldPosition();
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
  }, {
    key: '_solveInRange',
    value: function _solveInRange() {
      this._backward();
      this._forward();
    }
  }, {
    key: '_backward',
    value: function _backward() {
      this.origin.copy(this.base._getWorldPosition());
      if (this.target) {
        this._targetPosition.setFromMatrixPosition(this.target.matrixWorld);
        this.effector._setWorldPosition(this._targetPosition);
      } else if (!this.joints[this.joints.length - 1].isSubBase()) {
        return;
      }
      for (var i = 1; i < this.joints.length; i++) {
        var joint = this.joints[i];
        if (joint.isSubBase()) {
          joint._applySubBasePositions();
        }
      }
      for (var _i = this.joints.length - 1; _i > 0; _i--) {
        var _joint = this.joints[_i];
        var prevJoint = this.joints[_i - 1];
        var direction = new three.Vector3().subVectors(prevJoint._getWorldPosition(), _joint._getWorldPosition()).normalize();
        var worldPosition = direction.multiplyScalar(_joint.distance).add(_joint._getWorldPosition());
        if (prevJoint === this.base && this.base.isSubBase()) {
          this.base._subBasePositions.push(worldPosition);
        } else {
          prevJoint._setWorldPosition(worldPosition);
        }
      }
    }
  }, {
    key: '_forward',
    value: function _forward() {
      if (!this.base.isSubBase()) {
        this.base._setWorldPosition(this.origin);
      }
      for (var i = 0; i < this.joints.length - 1; i++) {
        var joint = this.joints[i];
        var nextJoint = this.joints[i + 1];
        var jointWorldPosition = joint._getWorldPosition();
        if (nextJoint.isSubBase()) {
          getCentroid(nextJoint._subBaseValues, jointWorldPosition);
        } else {
          jointWorldPosition.copy(joint._getWorldPosition());
        }
        var direction = new three.Vector3().subVectors(nextJoint._getWorldPosition(), jointWorldPosition).normalize();
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
    this._needsRecalculated = true;
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
    key: 'update',
    value: function update() {
      if (!this._orderedChains) {
        this.recalculate();
      }
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;
      try {
        for (var _iterator4 = this._orderedChains[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var subChains = _step4.value;
          for (var i = subChains.length - 1; i >= 0; i--) {
            subChains[i]._updateJointWorldPositions();
          }
          for (var _i = subChains.length - 1; _i >= 0; _i--) {
            subChains[_i]._backward();
          }
          for (var _i2 = 0; _i2 < subChains.length; _i2++) {
            subChains[_i2]._forward();
          }
          for (var _i3 = 0; _i3 < subChains.length; _i3++) {
            subChains[_i3]._applyJointWorldPositions();
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
  }]);
  return IK;
}();

var index = {
  IK: IK, IKChain: IKChain, IKJoint: IKJoint
};

return index;

})));
