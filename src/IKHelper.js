import { Object3D, Matrix4, AxesHelper, ArrowHelper, Mesh, ConeBufferGeometry, MeshBasicMaterial, Vector3 } from 'three';

class BoneHelper extends Object3D {
  /**
   * @param {number} height
   * @param {number?} boneSize
   * @param {number?} axesSize
   */
  constructor(height, boneSize, axesSize) {
    super();

    // If our bone has 0 height (like an end effector),
    // use a dummy Object3D instead, otherwise the ConeBufferGeometry
    // will fall back to its default and not use 0 height.
    if (height !== 0) {
      const geo = new ConeBufferGeometry(boneSize, height, 4);
      geo.applyMatrix(new Matrix4().makeRotationAxis(new Vector3(1, 0, 0), Math.PI/2));
      this.boneMesh = new Mesh(geo, new MeshBasicMaterial({ color: 0xff0000, wireframe: true }));
    } else {
      this.boneMesh = new Object3D();
    }

    // Offset the bone so that its rotation point is at the base of the bone
    this.boneMesh.position.z = height / 2;
    this.add(this.boneMesh);

    this.axesHelper = new AxesHelper(axesSize);
    this.add(this.axesHelper);
  }
}

/**
 * Class for visualizing an IK system.
 */
export default class IKHelper extends Object3D {

  /**
   * Create a chain.
   *
   */
  constructor(ik, { showBones, boneSize, showAxes, axesSize, wireframe } = {}) {
    super();

    boneSize = boneSize || 0.1;
    axesSize = axesSize || 0.2;

    if (!ik.isIK) {
      throw new Error('IKHelper must receive an IK instance.');
    }

    this.ik = ik;

    this._meshes = new Map();

    for (let chain of this.ik.chains) {
      for (let i = 0; i < chain.joints.length; i++) {
        const joint = chain.joints[i];
        const nextJoint = chain.joints[i+1];
        const distance = nextJoint ? nextJoint.distance : 0;

        const mesh = new BoneHelper(distance, boneSize, axesSize);
        mesh.matrixAutoUpdate = false;
        this._meshes.set(joint, mesh);
        this.add(mesh);
      }
    }

    this.showBones = showBones !== undefined ? showBones : true;
    this.showAxes = showAxes !== undefined ? showAxes : true;
    this.wireframe = wireframe !== undefined ? wireframe : true;
  }

  get showBones() { return this._showBones; }
  set showBones(showBones) {
    for (let [joint, mesh] of this._meshes) {
      if (showBones) {
        mesh.add(mesh.boneMesh);
      } else {
        mesh.remove(mesh.boneMesh);
      }
    }
    this._showBones = showBones;
  }

  get showAxes() { return this._showAxes; }
  set showAxes(showAxes) {
    for (let [joint, mesh] of this._meshes) {
      if (showAxes) {
        mesh.add(mesh.axesHelper);
      } else {
        mesh.remove(mesh.axesHelper);
      }
    }
    this._showAxes = showAxes;
  }
  
  get wireframe() { return this._wireframe; }
  set wireframe(wireframe) {
    for (let [joint, mesh] of this._meshes) {
      if (mesh.boneMesh.material) {
        console.log(mesh.boneMesh.material);
        window.mat = mesh.boneMesh.material;
        mesh.boneMesh.material.wireframe = wireframe;
      }
    }
    this._wireframe = wireframe;
  }

  updateMatrixWorld(force) {
    for (let [joint, mesh] of this._meshes) {
      mesh.matrix.copy(joint.bone.matrixWorld);
    }
    super.updateMatrixWorld(force);
  }
}
