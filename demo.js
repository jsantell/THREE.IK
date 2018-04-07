let container, camera, scene, renderer, light;
let gizmo, ik;
let arm, skeletonHelper;

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const BONES = 4;
const HEIGHT = 0.5;

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
    this.mesh = new THREE.SkinnedMesh(this.geometry, new THREE.MeshBasicMaterial({ skinning: true, color: 0x0000ff }));
    this.mesh.material.side = THREE.DoubleSide;
    this.mesh.add(bones[0]);
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
      for (let i = 0; i < points; i++) {
        const theta = Math.PI * 2 * i / points;
        vertices.push(new THREE.Vector3(Math.sin(theta) * radius, j*heightPerRing, Math.cos(theta) * radius));
        skinIndices.push(new THREE.Vector4(j, j-1, j-2, j-3));
        skinWeights.push(new THREE.Vector4(0.45, 0.25, 0.2, 0.1));
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

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 500);
  camera.position.set(0, 0, 3);
  controls = new THREE.OrbitControls(camera);
  controls.update();

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xeeeeee );

  light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
  light.position.set( 0, 200, 0 );
  scene.add( light );

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 0, 200, 100 );
  light.castShadow = true;
  light.shadow.camera.top = 180;
  light.shadow.camera.bottom = -100;
  light.shadow.camera.left = -120;
  light.shadow.camera.right = 120;
  scene.add( light );

  // ground
  var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x555555 } ) );
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add( mesh );

  var grid = new THREE.GridHelper( 20, 20, 0x000000, 0x000000 );
  grid.position.y = 0.001;
  grid.material.opacity = 0.5;
  scene.add( grid );

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  container.appendChild( renderer.domElement );

  arm = new Arm(4, 0.5, 10, 0.5);
  skeletonHelper = new THREE.SkeletonHelper(arm);
  skeletonHelper.material.linewidth = 10;
  scene.add(arm);
  scene.add(skeletonHelper);

  gizmo = createTransformControls(new THREE.Vector3(2.0, 4.0, 0));
  ik = new IK(scene, arm.skeleton.bones, gizmo.target);
  window.addEventListener('resize', onWindowResize, false );
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

