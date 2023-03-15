import { Vector3, MathUtils as ThreeMath } from 'three';
import { transformPoint, getCentroid, getWorldPosition, setQuaternionFromDirection } from './utils.js';

const Z_AXIS = new Vector3(0, 0, 1);
const { DEG2RAD, RAD2DEG } = ThreeMath;

/**
 * A class for a constraint.
 */
class IKBallConstraint {
  /**
   * Pass in an angle value in degrees.
   *
   * @param {number} angle
   */
  constructor(angle) {
    this.angle = angle;
  }

  /**
   * Applies a constraint to passed in IKJoint, updating
   * its direction if necessary. Returns a boolean indicating
   * if the constraint was applied or not.
   *
   * @param {IKJoint} joint
   * @private
   * @return {boolean}
   */
  _apply(joint) {

    // Get direction of joint and parent in world space
    const direction = new Vector3().copy(joint._getDirection());
    const parentDirection = joint._localToWorldDirection(new Vector3().copy(Z_AXIS)).normalize();

    // Find the current angle between them
    const currentAngle = direction.angleTo(parentDirection) * RAD2DEG;

    if ((this.angle / 2) < currentAngle) {
      direction.normalize();
      // Find the correction axis and rotate around that point to the
      // largest allowed angle
      const correctionAxis = new Vector3().crossVectors(parentDirection, direction).normalize();

      parentDirection.applyAxisAngle(correctionAxis, this.angle * DEG2RAD * 0.5);
      joint._setDirection(parentDirection);
      return true;
    }

    return false;
  }
}

export default IKBallConstraint;
