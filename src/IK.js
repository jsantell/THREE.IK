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
    this._needsRecalculated = true;

    this.isIK = true;

    /**
     * An array of root chains for this IK system, each containing
     * an array of all subchains, including the root chain, for that
     * root chain, in descending-depth order.
     */
    this._orderedChains = null;
  }

  /**
   * Adds an IKChain to the IK system.
   *
   * @param {IKChain} chain
   */
  add(chain) {
    if (!chain.isIKChain) {
      throw new Error('Argument is not an IKChain.');
    }

    this.chains.push(chain);
  }

  /**
   * Called if there's been any changes to an IK structure.
   * Called internally. Not sure if this should be supported externally.
   */
  recalculate() {
    this._orderedChains = [];

    for (let rootChain of this.chains) {
      const orderedChains = [];
      this._orderedChains.push(orderedChains);

      const chainsToSave = [rootChain];
      while (chainsToSave.length) {
        const chain = chainsToSave.shift();
        orderedChains.push(chain);
        for (let subChains of chain.chains.values()) {
          for (let subChain of subChains) {
            chainsToSave.push(subChain);
          }
        }
      }
    }
  }

  solve() {
    return this.update.call(this);
  }

  /**
   * Performs the IK solution and updates bones.
   */
  update() {
    // If we don't have a depth-sorted array of chains, generate it.
    // This is from the first `update()` call after creating.
    if (!this._orderedChains) {
      this.recalculate();
    }

    for (let subChains of this._orderedChains) {
      for (let i = subChains.length - 1; i >= 0; i--) {
        subChains[i]._updateJointWorldPositions();
      }

      // Run the chain's backward step starting with the deepest chains.
      for (let i = subChains.length - 1; i >= 0; i--) {
        subChains[i]._backward();
      }

      // Run the chain's forward step starting with the root chain.
      for (let i = 0; i < subChains.length; i++) {
        subChains[i]._forward();
      }
    }
  }
}

export default IK;
