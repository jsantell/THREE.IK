import { Mesh, BoxBufferGeometry, MeshBasicMaterial, Bone, Object3D } from 'three';
import ThreeApp from '@jsantell/three-app';
import OrbitControls from '@jsantell/three-orbit-controls';
import { IK, IKChain, IKJoint, IKHelper } from '../';

const ARM_COUNT = 10;
const SEGMENT_COUNT = 15;
const SEGMENT_DISTANCE = 0.3;
const ARMS_RADIUS = 3;

class App extends ThreeApp {
  init() {
    this.mouseTarget = new Object3D();
    this.scene.add(this.mouseTarget);

    this.controls = new OrbitControls(this.camera);

    this.iks = [];
    for (let i = 0; i < ARM_COUNT; i++) {
      const chain = new IKChain();

      let lastBone = null;
      for (let j = 0; j < SEGMENT_COUNT; j++) {
        const bone = new Bone();
        bone.position.y = j === 0 ? 0 : SEGMENT_DISTANCE;

        if (lastBone) {
          lastBone.add(bone);
        }

        const target = j === SEGMENT_COUNT - 1 ? this.mouseTarget: null;
        chain.add(new IKJoint(bone), { target });
        lastBone = bone;
      }

      const ik = new IK();
      ik.add(chain);
      
      const rootBone = ik.getRootBone();
      const base = new Object3D();
      base.rotation.x = -Math.PI / 2;
      base.position.x = Math.sin(Math.PI * 2 * (i / ARM_COUNT)) * ARMS_RADIUS;
      base.position.y = Math.cos(Math.PI * 2 * (i / ARM_COUNT)) * ARMS_RADIUS;
      base.add(rootBone);
      this.scene.add(base);
      this.iks.push(ik);
    }

    this.scene.add(new THREE.AmbientLight(0xffffff));

    for (let ik of this.iks) {
      this.scene.add(new IKHelper(ik));
    }

    this.camera.position.z = 3;

    this.onMouseMove = this.onMouseMove.bind(this);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  onMouseMove(event) {
    const vector = new THREE.Vector3();
    vector.set((event.clientX / window.innerWidth) * 2 - 1,
              -(event.clientY / window.innerHeight) * 2 + 1,
              0.5);
    vector.unproject(this.camera);

    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
    this.mouseTarget.position.copy(pos);
  }

  update(t, delta) {

    for (let ik of this.iks) {
      ik.solve();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.app = new App();
