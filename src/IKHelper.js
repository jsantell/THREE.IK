import { Object3D, Matrix4, AxesHelper, ArrowHelper, Mesh, ConeBufferGeometry, MeshBasicMaterial, Vector3 } from 'three';

class Arrow extends Object3D {
  constructor(height) {
    super();
    const geo = new ConeBufferGeometry(0.05, height, 4);
    geo.applyMatrix(new Matrix4().makeRotationAxis(new Vector3(1, 0, 0), Math.PI/2));
    const mesh = new Mesh(geo, new MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true }));
    mesh.position.z = height / 2;
    this.add(mesh);
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
  constructor(ik) {
    if (!ik.isIK) {
      throw new Error('IKHelper must receive an IK instance.');
    }

    super();

    this.ik = ik;

    for (let chain of this.ik.chains) {
      for (let i = 0; i < chain.joints.length; i++) {
        const joint = chain.joints[i];
        const nextJoint = chain.joints[i+1];
        if (nextJoint) {
          joint.bone.add(new Arrow(nextJoint.distance));
        }
        joint.bone.add(new AxesHelper(0.2));
      }
    }
  }

  updateMatrixWorld() {
    super.updateMatrixWorld();
  }
}
