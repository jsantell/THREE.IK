import { Matrix4, Vector3, Quaternion } from 'three';
import IKChain from './IKChain.js';

/**
 * Class representing IK
 */
class IK {

  /**
   * Create a chain.
   *
   */
  constructor() {
    this.chains = [];
  }

  add(chain) {
    if (!chain.isIKChain) {
      throw new Error('Argument is not an IKChain.');
    }

    this.chains.push(chain);
  }

  update() {
    this.chains.forEach(c => c.update(scene));
  }
}

export default IK;
