/**
 * This code example is used to provide correctness of example usage in README
 */
    // Set up scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ik = new THREE.IK();

const chain = new THREE.IKChain();
const constraints = [new THREE.IKBallConstraint(90)];
const bones = [];

// Create a target that the IK's effector will reach
// for.
const movingTarget = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
movingTarget.position.z = 2;
const pivot = new THREE.Object3D();
pivot.add(movingTarget);
scene.add(pivot);

// Create a chain of THREE.Bone's, each wrapped as an IKJoint
// and added to the IKChain
for (let i = 0; i < 10; i++) {
  const bone = new THREE.Bone();
  bone.position.y = i === 0 ? 0 : 0.5;

  if (bones[i - 1]) { bones[i - 1].add(bone); }
  bones.push(bone);

  // The last IKJoint must be added with a `target` as an end effector.
  const target = i === 9 ? movingTarget : null;
  chain.add(new THREE.IKJoint(bone, { constraints }), { target });
}

// Add the chain to the IK system
ik.add(chain);

// Ensure the root bone is added somewhere in the scene
scene.add(ik.getRootBone());

// Create a helper and add to the scene so we can visualize
// the bones
const helper = new THREE.IKHelper(ik);
scene.add(helper);

function animate() {
  pivot.rotation.x += 0.01;
  pivot.rotation.y += 0.01;
  pivot.rotation.z += 0.01;

  ik.solve();

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

animate()
