const Y_AXIS = new THREE.Vector3(0, 1, 0);
const BONES = 4;
const HEIGHT = 0.5;


class IKApp {
  constructor() {
    this.animate = this.animate.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    this.gui = new dat.GUI();
    this.config = {
      showAxes: true,
      showBones: true,
      wireframe: true,
      color: '#ff0077',
    };

    if (this.setupGUI) {
      this.setupGUI();
    }

    const helperGUI = this.gui.addFolder('helper');
    helperGUI.add(this.config, 'showAxes').onChange(this.onChange);
    helperGUI.add(this.config, 'showBones').onChange(this.onChange);
    helperGUI.add(this.config, 'wireframe').onChange(this.onChange);
    helperGUI.addColor(this.config, 'color').onChange(this.onChange);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
    this.camera.position.set(10, 5, 6);
    this.camera.lookAt(this.scene.position);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    this.light = new THREE.DirectionalLight( 0xffffff );
    this.light.position.set(10, 10, 0);
    //this.light.castShadow = true;
    this.scene.add(this.light);

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    this.mesh.rotation.x = - Math.PI / 2;
    //this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.grid = new THREE.GridHelper( 20, 20, 0x000000, 0x000000 );
    this.grid.position.y = 0.001;
    this.grid.material.opacity = 1;
    this.scene.add(this.grid);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    //this.renderer.shadowMap.enabled = true;
    //this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();

    this.gizmos = [];

    this.iks = [];
    this.helpers = [];

    this.setupIK();

    for (let ik of this.iks) {
      const helper = new IK.IKHelper(ik);
      this.helpers.push(helper);
      this.scene.add(helper);
    }

    window.addEventListener('resize', this.onWindowResize, false);

    // Fire on change event so we can wire up any defaults
    this.onChange();

    this.animate();
  }

  createTarget(position) {
    const gizmo = new THREE.TransformControls(this.camera, this.renderer.domElement);
    const target = new THREE.Object3D();
    gizmo.setSize(0.5);
    gizmo.attach(target);
    gizmo.target = target;
    target.position.copy(position);

    this.scene.add(gizmo);
    this.scene.add(target);
    this.gizmos.push(gizmo);

    return target;
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.update) {
      this.update();
    }

    for (let gizmo of this.gizmos) {
      gizmo.update();
    }

    for (let ik of this.iks) {
      ik.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onChange() {
    for (let helper of this.helpers) {
      helper.showAxes = this.config.showAxes;
      helper.showBones = this.config.showBones;
      helper.wireframe = this.config.wireframe;
      helper.color = this.config.color;
    }
  }
};
