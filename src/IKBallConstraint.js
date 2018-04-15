import { Quaternion, Matrix4, Vector3, Math as ThreeMath } from 'three';
import { transformPoint, getCentroid, getWorldPosition, setQuaternionFromDirection } from './utils.js';

const Z_AXIS = new Vector3(0, 0, 1);
const { DEG2RAD, RAD2DEG } = ThreeMath;

/**
 * A class for a joint.
 */
export default class IKBallConstraint {
  /**
   * @param {THREE.Bone} bone
   */
  constructor(angle) {
    this.angle = angle;
  }

  apply(joint) {

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
    }
  }
}
