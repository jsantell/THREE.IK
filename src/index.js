import { Matrix4, Vector3, Quaternion } from 'three';
import IK from './IK.js';
import IKChain from './IKChain.js';
import IKJoint from './IKJoint.js';
import IKBallConstraint from './IKBallConstraint.js';
import IKHingeConstraint from './IKHingeConstraint.js';
import IKHelper from './IKHelper.js';

// If this is being included via script tag and using THREE
// globals, attach our exports to THREE.
if (typeof window !== 'undefined' && typeof window.THREE === 'object') {
  window.THREE.IK = IK;
  window.THREE.IKChain = IKChain;
  window.THREE.IKJoint = IKJoint;
  window.THREE.IKBallConstraint = IKBallConstraint;
  window.THREE.IKHingeConstraint = IKHingeConstraint;
  window.THREE.IKHelper = IKHelper;
}

export {
  IK, IKChain, IKJoint, IKBallConstraint, IKHingeConstraint, IKHelper
};
