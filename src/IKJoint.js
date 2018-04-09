import { Matrix4, Vector3 } from 'three';
import { getCentroid, getWorldPosition } from './utils.js';

/**
 * A class for a joint.
 */
class IKJoint {
  /**
   * @param {THREE.Bone} bone
   */
  constructor(bone) {
    this.bone = bone;

    this._updateWorldPosition();

    this.distance = 0;

    this._isSubBase = false;
    this._subBasePositions = null;
    this.isIKJoint = true;
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
    getCentroid(this._subBasePositions, this._worldPosition);
    this._subBasePositions.length = 0;
  }
  /**
   * Set the distance.
   * @private
   * @param {THREE.Vector3}
   */
  _setDistance(distance) {
    this.distance = distance;
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

  _updateWorldPosition() {
    this._worldPosition = getWorldPosition(this.bone, new Vector3());
  }

  _setWorldPosition(position) {
    if ([position.x,position.y,position.z].some(n => Number.isNaN(n))) {
      debugger; throw new Error();
    }
    this._worldPosition.copy(position);
  }

  _applyWorldPosition() {
    this.bone.position.copy(this._getWorldPosition());
    this.bone.updateMatrix();

    if (!this.bone.parent) {
      return;
    }
    this.bone.applyMatrix(new Matrix4().getInverse(this.bone.parent.matrixWorld));

    // Update the world matrix so the next joint can properly transform
    // with this world matrix
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
