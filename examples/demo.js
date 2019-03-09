class SingleEffectorApp extends IKApp {
  setupIK() {
    const ik = new IK.IK();
    const chain = new IK.IKChain();
    for (let i = 0; i < arm.skeleton.bones.length; i++) {
      const bone = arm.skeleton.bones[i];
      const target = (i === arm.skeleton.bones.length - 1) ? gizmo.target : null;
      chain.add(new IK.IKJoint(bone), { target });
    }

    ik.add(chain);

    return ik;
  }

  function createTransformControls(position) {
    const gizmo = new THREE.TransformControls(camera, renderer.domElement);
    const target = new THREE.Object3D();
    gizmo.setSize(0.5);
    gizmo.attach(target);
    gizmo.target = target;
    target.position.copy(position);

    scene.add(gizmo);
    scene.add(target);
    return gizmo;
  }

  function animate() {
    requestAnimationFrame(this.animate);

    gizmo.update();

    if (ik) {
      ik.update();
    }

    renderer.render(scene, camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

window.app = new SingleEffectorApp();
