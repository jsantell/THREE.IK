import IKChain from './IKChain.js';

/**
 * Class representing IK structure.
 */
class IK {

  /**
   * Create an IK structure.
   *
   */
  constructor() {
    this.chains = [];
    this._needsRecalculated = true;

    this.isIK = true;

    // this.iterations = 1;
    // this.tolerance = 0.05;

    /**
     * An array of root chains for this IK system, each containing
     * an array of all subchains, including the root chain, for that
     * root chain, in descending-depth order.
     * @private
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
   * @private
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
            if (chainsToSave.indexOf(subChain) !== -1) {
              throw new Error('Recursive chain structure detected.');
            }
            chainsToSave.push(subChain);
          }
        }
      }
    }
  }

  /**
   * Performs the IK solution and updates bones.
   */
  solve() {
    // If we don't have a depth-sorted array of chains, generate it.
    // This is from the first `update()` call after creating.
    if (!this._orderedChains) {
      this.recalculate();
    }

    for (let subChains of this._orderedChains) {
      // Hardcode to one for now
      let iterations = 1; // this.iterations;

      while (iterations > 0) {
        for (let i = subChains.length - 1; i >= 0; i--) {
          subChains[i]._updateJointWorldPositions();
        }

        // Run the chain's forward step starting with the deepest chains.
        for (let i = subChains.length - 1; i >= 0; i--) {
          subChains[i]._forward();
        }

        // Run the chain's backward step starting with the root chain.
        let withinTolerance = true;
        for (let i = 0; i < subChains.length; i++) {
          const distanceFromTarget = subChains[i]._backward();
          if (distanceFromTarget > this.tolerance) {
            withinTolerance = false;
          }
        }

        if (withinTolerance) {
          break;
        }

        iterations--;

        // Get the root chain's base and randomize the rotation, maybe
        // we'll get a better change at reaching our goal
        // @TODO
        if (iterations > 0) {
          // subChains[subChains.length - 1]._randomizeRootRotation();
        }
      }
    }
  }

  /**
   * Returns the root bone of this structure. Currently
   * only returns the first root chain's bone.
   *
   * @return {THREE.Bone}
   */
  getRootBone() {
    return this.chains[0].base.bone;
  }
}

export default IK;
