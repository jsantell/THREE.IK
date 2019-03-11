import { Quaternion, Matrix4, Vector3, Plane, Math as ThreeMath } from 'three';
import { transformPoint, getCentroid, getWorldPosition, setQuaternionFromDirection } from './utils.js';

const Z_AXIS = new Vector3(0, 0, -1);
const X_AXIS = new Vector3(1, 0, 0);

const t1 = new Vector3();
const t2 = new Vector3();
const t3 = new Vector3();
const t4 = new Vector3();

const { DEG2RAD, RAD2DEG } = ThreeMath;

/**
 * A class for a constraint.
 */
class IKHingeConstraint {
  /**
   * Pass in an angle value in degrees, and axis of rotation.
   * Axis of rotation must be in local coordinates.
   *
   * @param {number} angle
   * @param {Vector3} axis
   */
  constructor(angle, axis) {
    this.axis = axis;
    this.angle = angle;
    this.type = "hinge"
    this.rotationPlane = new Plane(this.axis);
  }

  /**
   * Applies a hinge constraint to passed in IKJoint. The direction will always be updated
   * with this constraint, because it will always be projected onto the rotation plane.
   * Additionally, an angle constraint will be applied if necessary.
   *
   * @param {IKJoint} joint
   * @private
   */
  _apply(joint) {
    // Get direction of joint and parent in world space
    const direction = new Vector3().copy(joint._getDirection());
    const parentDirection = joint._localToWorldDirection(t1.copy(Z_AXIS)).normalize();
    const rotationPlaneNormal = joint._localToWorldDirection(t2.copy(this.axis)).normalize();
    this.rotationPlane.normal = rotationPlaneNormal;
    var projectedDir = this.rotationPlane.projectPoint(direction, new Vector3())

    var parentDirectionProjected = this.rotationPlane.projectPoint(parentDirection, t3)
    var currentAngle = projectedDir.angleTo(parentDirectionProjected) * RAD2DEG;

    //apply adjustment to angle if it is "negative"
    var cross = t4.crossVectors(projectedDir, parentDirectionProjected);
    if(cross.dot(rotationPlaneNormal) > 0){
      currentAngle += 180;
    }

    if(currentAngle > this.angle){
      parentDirectionProjected.applyAxisAngle(rotationPlaneNormal, this.angle/RAD2DEG);
      joint._setDirection(parentDirectionProjected);
    } else {
      joint._setDirection(projectedDir);
    }
  }
}

export default IKHingeConstraint;
