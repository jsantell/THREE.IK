import { Bone, Color, MeshBasicMaterial, Object3D } from 'three';
import ThreeApp from '@jsantell/three-app';
import OrbitControls from '@jsantell/three-orbit-controls';
import { IK, IKChain, IKJoint, IKHelper, IKBallConstraint } from '../';

const ARM_COUNT = 15;
const SEGMENT_COUNT = 15;
const SEGMENT_DISTANCE = 0.4;
const ARMS_RADIUS = 3;

class App extends ThreeApp {
  init() {
    this.renderer.setClearColor(0xefefef);
    this.renderer.autoClear = true;

    this.mouseTarget = new Object3D();
    this.scene.add(this.mouseTarget);

    this.controls = new OrbitControls(this.camera);

    this.helpers = [];
    this.iks = [];
    //const constraints = [new IKBallConstraint(180)];
    const constraints = [];

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
        chain.add(new IKJoint(bone, { constraints }), { target });
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
      const helper = new IKHelper(ik);
      let counter = 0;
      for (let [joint, mesh] of helper._meshes) {
        const color = new Color(`hsl(${(counter/SEGMENT_COUNT)*360}, 80%, 80%)`);
        mesh.boneMesh.material = new MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.9,
        });

        counter++;
      }
      this.helpers.push(helper);
      this.scene.add(helper);

    }

    this.camera.position.z = 4;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseUp() {
    this.mouseDown = false;
  }

  onMouseDown() {
    this.mouseDown = true;
  }

  onMouseMove(event) {
    if (this.mouseDown) {
      return;
    }

    this._vector = this._vector || new THREE.Vector3();
    this._vector.set((event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1,
                    0.5);
    this._vector.unproject(this.camera);

    const dir = this._vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
    this.mouseTarget.position.copy(pos);
  }

  update(t, delta) {
    this.camera.rotation.z += delta * 0.0001;
    for (let ik of this.iks) {
      ik.solve();
    } 
    const temp = {};
    for (let helper of this.helpers) {
      for (let [joint, mesh] of helper._meshes) {
        mesh.boneMesh.material.color.getHSL(temp);
        mesh.boneMesh.material.color.setHSL((temp.h + 0.005) % 360, temp.s, temp.l);
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.app = new App();
