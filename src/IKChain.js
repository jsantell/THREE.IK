import { Matrix4, Vector3, Quaternion } from 'three';
import IKJoint from './IKJoint.js';

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
    this.root = null;
    this.effector = null;

    /* THREE.Vector3 world position of root node */
    this.origin = null;

    this.iterations = 100;
    this.tolerance = 0.01;
  }

  /**
   * Add an IKJoint to the end of this chain.
   *
   * @param {Object} config
   * @param {THREE.Object3D} [config.target]
   */

  add(connection, { target, index } = {}) {
    if (!connection.isIKJoint && !connection.isIKChain) {
      throw new Error('Invalid connection in an IKChain. Must be an IKJoint or an IKChain.');
    }
 
    this.joints = this.joints || [];
    this.joints.push(connection);

    // If this is the first connection, set as root.
    if (this.joints.length === 1) {
      this.root = this.joints[0];
      this.origin = new Vector3().copy(this.root._getWorldPosition());
    }
    // Otherwise, calculate the distance for the previous connection,
    // and update the total length.
    else {
      const distance = this.joints[this.joints.length - 2]._getWorldDistance(connection);
      if (distance === 0) {
        throw new Error('bone with 0 distance between adjacent bone found');
      };
      this.joints[this.joints.length - 2]._setDistance(distance);
      this.totalLengths += distance;
    }

    if (target) {
      this.effector = connection;
      this.target = target;
    }
  }

  update() {
    if (!this.root || !this.target) {
      throw new Error('IKChain must have both a base and an IKJoint with a target to solve');
    }

    this.root._updateMatrixWorld();
    this.target.updateMatrixWorld();
    this._targetPosition = new Vector3().setFromMatrixPosition(this.target.matrixWorld);

    // Generate up to date world positions
    this.joints.forEach(joint => joint._updateWorldPosition());

    // If target is out of reach
    if (this.totalLengths < this.root._getWorldDistance(this.target)) {
      this._solveOutOfRange();
    } else {
      this._solveInRange();
    }

    // Apply the mutated world positions into local space
    this.joints.forEach(joint => joint._applyWorldPosition());
  }

  /**
   */
  _solveInRange() {
    let iteration = 1;
    let difference = this.effector._getWorldDistance(this.target);
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

  _solveOutOfRange() {
    for (let i = 0; i < this.joints.length - 1; i++) {
      const joint = this.joints[i];
      const nextJoint = this.joints[i + 1];
      const r = joint._getWorldPosition().distanceTo(this._targetPosition);
      const lambda = joint.distance / r;

      const pos = new Vector3().copy(joint._getWorldPosition());
      const targetPos = new Vector3().copy(this._targetPosition);
      pos.multiplyScalar(1 - lambda).add(targetPos.multiplyScalar(lambda));
      nextJoint._setWorldPosition(pos);
    }
  }

  _backward() {
    this.effector._setWorldPosition(this._targetPosition);
    for (let i = this.joints.length - 1; i > 0; i--) {
      const joint = this.joints[i];
      const prevJoint = this.joints[i - 1];
      const direction = new Vector3().subVectors(prevJoint._getWorldPosition(), joint._getWorldPosition()).normalize();
      prevJoint._setWorldPosition(direction.multiplyScalar(joint.distance).add(joint._getWorldPosition()));
    }
  }

  _forward() {
    this.root._setWorldPosition(this.origin);
    for (let i = 0; i < this.joints.length - 1; i++) {
      const joint = this.joints[i];
      const nextJoint = this.joints[i + 1];
      const direction = new Vector3().subVectors(nextJoint._getWorldPosition(), joint._getWorldPosition()).normalize();
      nextJoint._setWorldPosition(direction.multiplyScalar(nextJoint.distance).add(joint._getWorldPosition()));
    }
  }
}

export default IKChain;
