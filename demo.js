let container, camera, scene, renderer, light;
let gizmo, ik;
let arm, skeletonHelper;

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const BONES = 4;
const HEIGHT = 0.5;

class Arrow extends THREE.Mesh {
  constructor() {
    const geo = new THREE.ConeBufferGeometry(0.05, 0.1, 10);
    geo.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI/2));
    super(geo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  }
}

class Arm extends THREE.Object3D {
  constructor(points, radius, rings, heightPerRing) {
    super();

    this.points = points;
    this.radius = radius;
    this.rings = rings;
    this.heightPerRing = heightPerRing;
    const indices = [];
    //const indices = new Float32Array((rings - 1) * points * 2);
    const vertices = new Float32Array(rings * points * 3);
    this.geometry = new THREE.Geometry();
    const bones = [];
    this._generateVertices(this.geometry.vertices,
                           this.geometry.faces,
                           this.geometry.skinIndices,
                           this.geometry.skinWeights,
                           bones);
    this.skeleton = new THREE.Skeleton(bones);
    this.mesh = new THREE.SkinnedMesh(this.geometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, skinning: true, color: 0x0000ff }));
    this.mesh.material.side = THREE.DoubleSide;
    this.mesh.add(bones[0]);
    this.mesh.castShadow = true;
    this.mesh.bind(this.skeleton);
    this.mesh.frustumCulled = false;
    this.add(this.mesh);
  }

  _generateVertices(vertices, faces, skinIndices, skinWeights, bones) {
    const points = this.points;
    const radius = this.radius;
    const heightPerRing = this.heightPerRing;

    for (let j = 0; j < this.rings; j++) {
      const bone = new THREE.Bone();
      bone.position.set(0, j === 0 ? 0 : heightPerRing,0);
      bones.push(bone);
      bone.add(new Arrow());
      for (let i = 0; i < points; i++) {
        const theta = Math.PI * 2 * i / points;
        vertices.push(new THREE.Vector3(Math.sin(theta) * radius, j*heightPerRing, Math.cos(theta) * radius));
        skinIndices.push(new THREE.Vector4(j));
        skinWeights.push(new THREE.Vector4(1, 0, 0, 0));
      }
      if (j !== 0) {
        for (let i = 0; i < points; i++) {
          const thisPoint = j * points + i;
          const nextPoint = (i === points - 1) ?
                            (j * points) :
                            (j * points + i + 1);
          const belowPoint = (j - 1) * points + i;
          const nextBelowPoint = (j - 1) * points + i + 1;
          faces.push(new THREE.Face3(belowPoint, thisPoint, nextPoint));
          faces.push(new THREE.Face3(belowPoint, nextBelowPoint, nextPoint));
        }
      }
    }
    for (let i = 0; i < bones.length - 1; i++) {
      bones[i].add(bones[i + 1]);
    }
    console.log(bones, vertices);
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

  arm = new Arm(8, 0.1, 20, 0.2);
  skeletonHelper = new THREE.SkeletonHelper(arm);
  skeletonHelper.material.linewidth = 10;
  scene.add(arm);
  scene.add(skeletonHelper);

  gizmo = createTransformControls(new THREE.Vector3(0.0, 3.5, 0));
  ik = createIK();
  window.addEventListener('resize', onWindowResize, false );
}

function createIK() {
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  requestAnimationFrame( animate );

  gizmo.update();

  if (ik) {
    ik.update();
  }

  renderer.render(scene, camera);
}

