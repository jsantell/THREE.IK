import { Matrix4, Vector3 } from 'three';
import IKJoint from './IKJoint.js';

class IKChainConnection {
  constructor(chain, index) {
    this.chain = chain;
    this.index = index;
  }
}


/**
 * Class representing IK
 */
class IKChain {
  /**
   * Create a chain.
   */
  constructor() {
    this.isIKChain = true;
    this.totalLengths = 0;
    this.base = null;
    this.effector = null;
    this.effectorIndex = null;
    this.chains = new Map();

    /* THREE.Vector3 world position of base node */
    this.origin = null;

    this.iterations = 100;
    this.tolerance = 0.01;

    this._depth = -1;
    this._targetPosition = new Vector3();
  }

  /**
   * Add an IKJoint to the end of this chain.
   *
   * @param {Object} config
   * @param {THREE.Object3D} [config.target]
   */

  add(joint, { target } = {}) {
    if (this.effector) {
      throw new Error('Cannot add additional joints to a chain with an end effector.');
    }

    if (!joint.isIKJoint) {
      throw new Error('Invalid joint in an IKChain. Must be an IKJoint.');
    }

    this.joints = this.joints || [];
    this.joints.push(joint);

    // If this is the first joint, set as base.
    if (this.joints.length === 1) {
      this.base = this.joints[0];
      this.origin = new Vector3().copy(this.base._getWorldPosition());
    }
    // Otherwise, calculate the distance for the previous joint,
    // and update the total length.
    else {
      const previousJoint = this.joints[this.joints.length - 2];
      previousJoint._updateMatrixWorld();
      previousJoint._updateWorldPosition();
      joint._updateWorldPosition();

      const distance = this.joints[this.joints.length - 2]._getWorldDistance(joint);
      if (distance === 0) {
        throw new Error('bone with 0 distance between adjacent bone found');
      };
      this.joints[this.joints.length - 2]._setDistance(distance);
      this.totalLengths += distance;
    }

    if (target) {
      this.effector = joint;
      this.effectorIndex = joint;
      this.target = target;
    }
  }

  connect(chain) {
    if (!chain.isIKChain) {
      throw new Error('Invalid connection in an IKChain. Must be an IKChain.');
    }

    if (!chain.base.isIKJoint) {
      throw new Error('Connecting chain does not have a base joint.');
    }

    const index = this.joints.indexOf(chain.base);

    // If we're connecting to the last joint in the chain, ensure we don't
    // already have an effector.
    if (this.target && index === this.joints.length - 1) {
      throw new Error('Cannot append a chain to an end joint in a chain with a target.');
    }

    if (index === -1) {
      throw new Error('Cannot connect chain that does not have a base joint in parent chain.');
    }

    this.joints[index]._setIsSubBase();

    let chains = this.chains.get(index);
    if (!chains) {
      chains = [];
      this.chains.set(index, chains);
    }
    chains.push(chain);
  }

  update() {
    if (!this.base) {
      throw new Error('IKChain must have at least one joint.');
    }

    if (!this.target) {
      throw new Error('IKChain must have a target.');
    }

    this.target.updateMatrixWorld();

    // Generate up to date world positions

    this._solveInRange();
  }

  /**
   * Update joint world positions for this chain.
   */
  _updateJointWorldPositions() {
    for (let joint of this.joints) {
      joint._updateWorldPosition();
    }
  }

  /**
   * Apply joint world positions for this chain.
   */
  _applyJointWorldPositions() {
    for (let joint of this.joints) {
      joint._applyWorldPosition();
    }
  }

  /**
   */
  _solveInRange() {
    this._backward();
    this._forward();
   /* let iteration = 1;
    let difference = this.effector._getWorldDistance(this.target);
    while (difference > this.tolerance) {

      difference = this.effector._getWorldDistance(this.target);

      iteration++;
      if (iteration > this.iterations) {
        break;
      }
    }
    */
  }

  _backward() {
    // Copy the origin so the forward step can use before `_backward()`
    // modifies it.
    this.origin.copy(this.base._getWorldPosition());

    // Set the effector's position to the target's position.

    if (this.target) {
      this._targetPosition.setFromMatrixPosition(this.target.matrixWorld);
      this.effector._setWorldPosition(this._targetPosition);
    }
    else if (!this.joints[this.joints.length - 1].isSubBase()) {
      // If this chain doesn't have additional chains or a target,
      // not much to do here.
      return;
    }
   
    // Apply sub base positions for all joints except the base,
    // as we want to possibly write to the base's sub base positions,
    // not read from it.
    for (let i = 1; i < this.joints.length; i++) {
      const joint = this.joints[i];
      if (joint.isSubBase()) {
        joint._applySubBasePositions();
      }
    }

    for (let i = this.joints.length - 1; i > 0; i--) {
      const joint = this.joints[i];
      const prevJoint = this.joints[i - 1];
      const direction = new Vector3().subVectors(prevJoint._getWorldPosition(), joint._getWorldPosition()).normalize();

      const worldPosition = direction.multiplyScalar(joint.distance).add(joint._getWorldPosition());

      // If this chain's base is a sub base, set it's position in
      // `_subBaseValues` so that the forward step of the parent chain
      // can calculate the centroid and clear the values.
      // @TODO Could this have an issue if a subchain `x`'s base
      // also had its own subchain `y`, rather than subchain `x`'s
      // parent also being subchain `y`'s parent?
      if (prevJoint === this.base && this.base.isSubBase()) {
        this.base._subBasePositions.push(worldPosition);
      } else {
        prevJoint._setWorldPosition(worldPosition);
      }
    }
  }

  _forward() {
    // If base joint is a sub base, don't reset it's position back
    // to the origin, but leave it where the parent chain left it.
    if (!this.base.isSubBase()) {
      this.base._setWorldPosition(this.origin);
    }

    for (let i = 0; i < this.joints.length - 1; i++) {
      const joint = this.joints[i];
      const nextJoint = this.joints[i + 1];
      const jointWorldPosition = joint._getWorldPosition();

      // If joint is a sub base, use the `_subBaseValues` calculated from its
      // children in the `backward` step and place this joint.
      if (nextJoint.isSubBase()) {
        getCentroid(nextJoint._subBaseValues, jointWorldPosition);
      } else {
        jointWorldPosition.copy(joint._getWorldPosition());
      }

      const direction = new Vector3().subVectors(nextJoint._getWorldPosition(), jointWorldPosition).normalize();
      nextJoint._setWorldPosition(direction.multiplyScalar(nextJoint.distance).add(joint._getWorldPosition()));
    }
  }
}

export default IKChain;
