import { Quaternion, Matrix4, Vector3 } from 'three';
import { transformPoint, getCentroid, getWorldPosition, setQuaternionFromDirection } from './utils.js';

const Y_AXIS = new Vector3(0, 1, 0);

/**
 * A class for a joint.
 */
class IKJoint {
  /**
   * @param {THREE.Bone} bone
   */
  constructor(bone, { constraints } = {}) {
    this.constraints = constraints;

    this.constraints = [
      { axis: new Vector3(0, 1, 0), angle: 0 }
    ];

    this.bone = bone;

    this.distance = 0;

    this._originalDirection = new Vector3();
    this._direction = new Vector3();
    this._worldPosition = new Vector3();
    this._isSubBase = false;
    this._subBasePositions = null;
    this.isIKJoint = true;

    this._updateWorldPosition();
  }

  isSubBase() {
    return this._isSubBase;
  }

  _setIsSubBase() {
    this._isSubBase = true;
    this._subBasePositions = [];
  }

  /**
   * Consumes the stored sub base positions and apply it as this
   * joint's world position, clearing the sub base positions.
   */
  _applySubBasePositions() {
    if (this._subBasePositions.length === 0) {
      return;
    }
    getCentroid(this._subBasePositions, this._worldPosition);
    this._subBasePositions.length = 0;
  }

  applyConstraints() {
    if (!this.constraints) {
      return;
    }

    // Cast our world direction into local space.
    const direction = new Vector3().copy(this._direction);
    this._worldToLocalDirection(direction);

    for (let constraint of this.constraints) {
      const axis = constraint.axis;
      const angle = constraint.angle;
      const direction = new Vector3().copy(this._direction);
      const theta = Math.abs(angle / (57.2958 * direction.angleTo(axis)));
      if (theta < 1) {
        this._setDirection(direction.lerp(axis, theta));
      } else {
        this._setDirection(axis);
      }
    }
  }

  /**
   * Set the distance.
   * @private
   * @param {number} distance
   */
  _setDistance(distance) {
    this.distance = distance;
  }

  _setDirection(direction) {
    this._direction.copy(direction);
  }

  /**
   * Gets the distance.
   * @return {THREE.Vector3}
   */
  _getDistance() {
    return this.distance;
  }

  _updateMatrixWorld() {
    this.bone.updateMatrixWorld(true);
  }

  /**
   * @return {THREE.Vector3}
   */
  _getWorldPosition() {
    return this._worldPosition;
  }

  _getWorldDirection(joint) {
    return new Vector3().subVectors(this._getWorldPosition(), joint._getWorldPosition()).normalize();
  }

  _updateWorldPosition() {
    getWorldPosition(this.bone, this._worldPosition);
  }

  _setWorldPosition(position) {
    this._worldPosition.copy(position);
  }

  _worldToLocalDirection(direction) {
    if (this.bone.parent) {
      const inverseParent = new Matrix4().getInverse(this.bone.parent.matrixWorld);
      direction.transformDirection(inverseParent);
    }
  }

  _applyWorldPosition() {
    let direction = new Vector3().copy(this._direction);
    let position = new Vector3().copy(this._getWorldPosition());

    const parent = this.bone.parent;

    if (parent) {
      this._updateMatrixWorld();
      let inverseParent = new Matrix4().getInverse(this.bone.parent.matrixWorld);
      transformPoint(position, inverseParent, position);
      this.bone.position.copy(position);

      this._updateMatrixWorld();

      this._worldToLocalDirection(direction);
      setQuaternionFromDirection(direction, Y_AXIS, this.bone.quaternion);

    } else {
      this.bone.position.copy(position);
    }

    // Update the world matrix so the next joint can properly transform
    // with this world matrix
    this.bone.updateMatrix();
    this._updateMatrixWorld();
  }

  /**
   * @param {IKJoint|THREE.Vector3}
   * @return {THREE.Vector3}
   */
  _getWorldDistance(joint) {
    return this._worldPosition.distanceTo(joint.isIKJoint ? joint._getWorldPosition() : getWorldPosition(joint, new Vector3()));
  }
}

export default IKJoint;
