let container, camera, scene, renderer, light;
let ik, rootBone;
let skeletonHelper;
let gizmos = [];
let boneContainer;

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const BONES = 4;
const HEIGHT = 0.5;

class Arrow extends THREE.Mesh {
  constructor(color) {
    const geo = new THREE.ConeBufferGeometry(0.1, 0.4, 10);
    geo.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI/2));
    super(geo, new THREE.MeshBasicMaterial({ color })); 
  }
}

init();
animate();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xeeeeee );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 500);
  camera.position.set(10, 5, 6);
  camera.lookAt(scene.position);
  controls = new THREE.OrbitControls(camera);
  controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 1));
  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 10, 10, 0 );
  light.castShadow = true;
  scene.add( light );

  // ground
  var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x555555 } ) );
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add( mesh );

  var grid = new THREE.GridHelper( 20, 20, 0x000000, 0x000000 );
  grid.position.y = 0.001;
  grid.material.opacity = 1;
  scene.add( grid );

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild( renderer.domElement );

  boneContainer = new THREE.Object3D();
  scene.add(boneContainer);
  createIK();

  skeletonHelper = new THREE.SkeletonHelper(rootBone);
  scene.add(skeletonHelper);

  window.addEventListener('resize', onWindowResize, false );
}

function createIK() {
  ik = new IK.IK();
  const baseChain = new IK.IKChain();

  let prevBone = null;
  let baseChainEffector = null;
  for (let i = 0; i < 25; i++) {
    const bone = new THREE.Bone();
    bone.position.set(0, i === 0 ? 0 : 0.2, 0);

    bone.add(new Arrow(new THREE.Color(`hsl(${(i/25)*360}, 100%, 80%)`)));

    if (prevBone) {
      prevBone.add(bone);
    }

    const joint = new IK.IKJoint(bone);
    baseChain.add(joint);

    prevBone = bone;

    if (i === 0) {
      rootBone = bone;
      boneContainer.add(rootBone);
    }
    if (i === 24) {
      baseChainEffector = joint;
    }
  }


  // Connect 3 more chains to the end of base chain
  let gizmo;
  for (let i = 0; i < 3; i++) {
    const chain = new IK.IKChain();
    gizmo = createTransformControls(new THREE.Vector3(Math.sin(Math.PI * (i + 1) / 3), 1.0, Math.cos(Math.PI * (i + 1) / 3)));
    gizmos.push(gizmo);

    // Add the joint from the base chain
    chain.add(baseChainEffector);

    for (let j = 0; j < 10; j++) {
      const bone = new THREE.Bone();
      bone.add(new Arrow(new THREE.Color(`hsl(${((j/10)*20) + (120 * i)}, 100%, 80%)`)));
      bone.position.set(0, 0.2, 0);

      if (j === 0) {
        baseChainEffector.bone.add(bone);
      } else if (prevBone) {
        prevBone.add(bone);
      }
      prevBone = bone;

      const target = j === 9 ? gizmo.target : null;
      chain.add(new IK.IKJoint(bone), { target });
    }
    baseChain.connect(chain);
  }

  ik.add(baseChain);

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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  requestAnimationFrame( animate );

  for (let gizmo of gizmos) {
    gizmo.update();
  }

  if (ik) {
    ik.update();
  }

  renderer.render(scene, camera);
}

