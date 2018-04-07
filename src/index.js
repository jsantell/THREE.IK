import { Matrix4, Vector3, Quaternion } from 'three';
import { getWorldDistance, getWorldPosition } from './utils.js';

class IKJoint {
  /**
   * @param {THREE.Bone}
   * @param {IKJoint}
   */
  constructor(bone, parent) {
    this.bone = bone;
    this.parent = parent;
    this.updateWorldPosition();

    this.distance = parent ? this.getWorldDistance(parent) : 0;

    this.isIKJoint = true;
  }

  updateMatrixWorld() {
    this.bone.updateMatrixWorld(true);
  }

  getWorldPosition() {
    return this._worldPosition;
  }

  updateWorldPosition() {
    this._worldPosition = getWorldPosition(this.bone, new Vector3());
  }

  setWorldPosition(position) {
    if ([position.x,position.y,position.z].some(n => Number.isNaN(n))) {
      debugger; throw new Error();
    }
    this._worldPosition.copy(position);
  }

  applyWorldPosition() {

    this.bone.position.copy(this.getWorldPosition());
    this.bone.updateMatrix();
    
    if (!this.parent) {
      return;
    }
    this.bone.applyMatrix(new Matrix4().getInverse(this.parent.bone.matrixWorld));
  }

  getWorldDistance(joint) {
    return this._worldPosition.distanceTo(joint.isIKJoint ? joint.getWorldPosition() : getWorldPosition(joint, new Vector3()));
  }
}

export default class IK {
  constructor(scene, bones, target) {
    bones[0].updateMatrixWorld(true);

    this.joints = [];

    for (let i = 0; i < bones.length; i++) {
      this.joints.push(new IKJoint(bones[i], this.joints[i - 1]));
    }

    this.totalLengths = this.joints.reduce((sum, joint) => joint.distance + sum, 0);

    this.root = this.joints[0];
    this.origin = new Vector3().copy(this.root.getWorldPosition());

    this.tolerance = 0.1;
    this.target = target;
  }

  update() {
    this.root.updateMatrixWorld();

    // this.joints.map(j => console.log(new Vector3().setFromMatrixPosition(j.bone.matrixWorld)));

    // If target is out of reach
    if (this.totalLengths < this.root.getWorldDistance(this.target)) {
      //this._solveOutOfRange();
    } else {
      this._solveInRange();
    }
  }

  /*
   * local bcount = 0;
   * local dif = (self.joints[self.n] - self.target).magnitude;
   * while dif > self.tolerance do -- check if within error margin
   *   self:backward();
   *   self:forward();
   *   dif = (self.joints[self.n] - self.target).magnitude;
   *   -- break if it's taking too long so the game doesn't freeze
   *   bcount = bcount + 1;
   *   if bcount > 10 then break; end;
   *   end;*/
  _solveInRange() {
    const targetPosition = new Vector3().setFromMatrixPosition(this.target.matrixWorld);

    // Update world position for all joints
    this.joints.forEach(joint => joint.updateWorldPosition());

    let iteration = 1;
    let difference = this.joints[this.joints.length - 1].getWorldDistance(this.target);
    while (difference > this.tolerance) {

      difference = this.joints[this.joints.length - 1].getWorldDistance(this.target);

      /* backwards */
      /*
       * self.joints[self.n] = self.target;
        for i = self.n - 1, 1, -1 do
              local r = (self.joints[i+1] - self.joints[i]);
            local l = self.lengths[i] / r.magnitude;
                -- find new joint position
                      local pos = (1 - l) * self.joints[i+1] + l * self.joints[i];
                    self.joints[i] = pos;
                      end;
      */
      this.joints[this.joints.length - 1].setWorldPosition(targetPosition);
      for (let i = this.joints.length - 2; i >= 0; i--) {
        let joint = this.joints[i];
        let r = joint.getWorldDistance(this.joints[i+1]);
        let l = joint.distance / r;
        
        //(1 - l) * self.joints[i] + l * self.target;
        let pos = new Vector3().copy(this.joints[i + 1].getWorldPosition());
        pos.multiplyScalar(1 - l);
        let t = new Vector3().copy(joint.getWorldPosition()).multiplyScalar(l);
        pos.add(t);

        joint.setWorldPosition(pos);
      }
      
      this.root.setWorldPosition(this.origin);
      for (let i = 0; i < this.joints.length - 2; i++) {
        let joint = this.joints[i];
        let r = joint.getWorldDistance(this.joints[i+1]);
        let l = joint.distance / r;
        
        //(1 - l) * self.joints[i] + l * self.target;
        let pos = new Vector3().copy(joint.getWorldPosition());
        pos.multiplyScalar(1 - l);
        let t = new Vector3().copy(this.joints[i + 1].getWorldPosition()).multiplyScalar(l);
        pos.add(t);

        this.joints[i + 1].setWorldPosition(pos);
      }

      iteration++;
      if (iteration > this.iterations) {
        break;
      }
    }

    this.joints.forEach(joint => joint.applyWorldPosition());
      //debugger;
  }

  _solveOutOfRange() {
    const targetPosition = new Vector3().setFromMatrixPosition(this.target.matrixWorld);
      return;
      for (let i = 0; i < this.joints.length - 1; i++) {
        const joint = this.joints[i];
        const nextJoint = this.joints[i + 1];
        let r = new Vector3().subVectors(targetPosition, joint.getWorldPosition()).length();
        let l = joint.length / r;

        //(1 - l) * self.joints[i] + l * self.target;
        let pos = new Vector3().setFromMatrixPosition(joint.bone.matrixWorld);
        pos.multiplyScalar(1 - l);

        let t = new Vector3().copy(targetPosition).multiplyScalar(l);
        pos.add(t);

        let worldSpace = new Matrix4().makeTranslation(pos.x, pos.y, pos.z);
        let worldInverse = new Matrix4().getInverse(joint.bone.matrixWorld);

        let localSpace = worldSpace.multiplyMatrices(worldSpace, worldInverse);
        //this.joints[i + 1].bone.position.set(localSpace.elements[12],localSpace.elements[13], localSpace.elements[14]);
        this.joints[i + 1].bone.applyMatrix(localSpace);
        this.joints[i + 1].bone.updateMatrixWorld();
        console.log(r, l, localSpace.elements[13], joint.getWorldPosition());
      }
      this.joints.map(j => console.log(new Vector3().setFromMatrixPosition(j.bone.matrixWorld)));
  }
}
