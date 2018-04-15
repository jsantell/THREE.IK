import { Matrix4, Vector3 } from 'three';
import IKJoint from './IKJoint.js';
import { getCentroid } from './utils.js';

/**
 * Class representing an IK chain, comprising multiple IKJoints.
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
      if (joint.isBone) {
        joint = new IKJoint(joint);
      } else {
        throw new Error('Invalid joint in an IKChain. Must be an IKJoint or a THREE.Bone.');
      }
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

      const distance = previousJoint._getWorldDistance(joint);
      if (distance === 0) {
        throw new Error('bone with 0 distance between adjacent bone found');
      };
      joint._setDistance(distance);

      joint._updateWorldPosition();
      const direction = previousJoint._getWorldDirection(joint);
      previousJoint._originalDirection = new Vector3().copy(direction);
      joint._originalDirection = new Vector3().copy(direction);

      this.totalLengths += distance;
    }

    if (target) {
      this.effector = joint;
      this.effectorIndex = joint;
      this.target = target;
    }

    return this;
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

    return this;
  }

  /**
   * Update joint world positions for this chain.
   */
  _updateJointWorldPositions() {
    for (let joint of this.joints) {
      joint._updateWorldPosition();
    }
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
      const direction = prevJoint._getWorldDirection(joint);

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

      const direction = nextJoint._getWorldDirection(joint);
      joint._setDirection(direction);

      // Apply constraints if not an root of an IK system
      if (joint.isSubBase() || joint !== this.base) {
        joint.applyConstraints();
      }
      direction.copy(joint._direction);

      // Now apply the world position to the three.js matrices. We need
      // to do this before the next joint iterates so it can generate rotations
      // in local space from its parent's matrixWorld.
      // If this is a chain sub base, let the parent chain apply the world position
      if (!(this.base === joint && joint.isSubBase())) {
        joint._applyWorldPosition();
      }

      nextJoint._setWorldPosition(direction.multiplyScalar(nextJoint.distance).add(jointWorldPosition));

      // Since we don't iterate over the last joint, handle the applying of
      // the world position. If it's also a non-effector, then we must orient
      // it to its parent rotation since otherwise it has nowhere to point to.
      if (i === this.joints.length - 2) {
        if (nextJoint !== this.effector) {
          nextJoint._setDirection(direction);
        }
        nextJoint._applyWorldPosition();
      }
    }

  }
}

export default IKChain;
