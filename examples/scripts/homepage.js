const { Bone, Color, Scene, WebGLRenderer, PerspectiveCamera, MeshBasicMaterial, Object3D } = THREE;
const { IK, IKChain, IKJoint, IKHelper, IKBallConstraint } = window.IK;

const ARM_COUNT = 15;
const SEGMENT_COUNT = 15;
const SEGMENT_DISTANCE = 0.09;
const ARMS_RADIUS = 0.7;
const BONE_SIZE = 0.03;
const AUTO_TARGET_RADIUS = 1;
const DEMO_MODE = /demo/.test(window.location.search);

if (DEMO_MODE) {
  document.querySelector('#info').style.display = 'none';
}

class App {
  constructor() {
    // DAT.GUI
    this.gui = new dat.GUI({ autoPlace: !DEMO_MODE && !isMobile() });
    this.config = {
      rotationSpeed: -4.5,
      showTarget: isMobile() || DEMO_MODE,
      followMouse: !isMobile() && !DEMO_MODE,
      constraintAngle: 75,
    };

    this.gui.add(this.config, 'rotationSpeed').min(-10).max(10).step(0.5);
    this.gui.add(this.config, 'followMouse');
    this.gui.add(this.config, 'showTarget');
    this.gui.add(this.config, 'constraintAngle').min(0).max(360).step(1);

    this.lastTick = 0;
    this.mousePosition = new THREE.Vector3(0, 0, 0.4);
    this._mouseVector = new THREE.Vector3();

    this.renderer = new WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xefefef);
    this.renderer.autoClear = true;
    document.body.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3);
    this.camera.position.set(0, 0, 2);
    this.scene = new Scene();

    this.target = new Object3D();
    this.targetVisual = new THREE.Mesh(new THREE.CircleBufferGeometry(0.05, 32), new THREE.MeshBasicMaterial({
      color: 0xffffff,
    }));
    this.target.add(this.targetVisual);
    this.scene.add(this.target);

    //this.controls = new THREE.OrbitControls(this.camera);

    this.helpers = new Object3D();
    this.scene.add(this.helpers);

    this.iks = [];
    const constraints = [new IKBallConstraint(this.config.constraintAngle)];

    for (let i = 0; i < ARM_COUNT; i++) {
      const chain = new IKChain();

      let lastBone = null;
      for (let j = 0; j < SEGMENT_COUNT; j++) {
        const bone = new Bone();
        bone.position.y = j === 0 ? 0 : SEGMENT_DISTANCE;

        if (lastBone) {
          lastBone.add(bone);
        }

        const target = j === SEGMENT_COUNT - 1 ? this.target: null;
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
      const helper = new IKHelper(ik, { boneSize: BONE_SIZE, showAxes: false });
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
      this.helpers.add(helper);
    }

    this.partyMode = /party-mode/.test(document.location.search);

    this.onPartyModeToggle = this.onPartyModeToggle.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', this.onWindowResize);
    document.querySelector('#party-mode').addEventListener('click', this.onPartyModeToggle);
    document.querySelector('#party-mode').innerText = `party mode ${this.partyMode ? 'on' : 'off'}`;

    this.renderer.setAnimationLoop(() => this.render());
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

    this.mousePosition.set((event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1,
                    0.4);
  }

  onPartyModeToggle(e) {
    this.partyMode = !this.partyMode;
    e.target.innerText = `party mode ${this.partyMode ? 'on' : 'off'}`;
    e.preventDefault();
  }

  moveTargetToMouse() {
    this.target.position.copy(this.mousePosition)
    this.target.position.unproject(this.camera);
  }

  render() {
    const t = performance.now();
    const delta = performance.now() - this.lastTick;
    this.lastTick = t;

    this.camera.rotation.z += delta * 0.0001 * this.config.rotationSpeed;
    this.targetVisual.visible = this.config.showTarget;

    if (this.iks[0].chains[0].joints[0].constraints[0].angle !== this.config.constraintAngle) {
      this.iks[0].chains[0].joints.forEach(j => j.constraints[0].angle = this.config.constraintAngle);
    }

    if (this.config.followMouse) {
      this.moveTargetToMouse();
    } else {
      const theta = t * 0.002;
      const size = AUTO_TARGET_RADIUS;
      this.target.position.set(Math.sin(theta) * size, Math.cos(theta) * size, 0.2);
    }

    for (let ik of this.iks) {
      ik.solve();
    }

    if (this.partyMode) {
      const temp = {};
      for (let helper of this.helpers.children) {
        for (let [joint, mesh] of helper._meshes) {
          mesh.boneMesh.material.color.getHSL(temp);
          mesh.boneMesh.material.color.setHSL((temp.h + 0.005) % 360, temp.s, temp.l);
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

window.app = new App();

// http://detectmobilebrowsers.com/
function isMobile() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
