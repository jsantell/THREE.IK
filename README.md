<img src="https://jsantell.github.io/THREE.IK/assets/three-ik-graphic-with-text.png" width="400" />

[![Build Status](http://img.shields.io/npm/v/three-ik.svg?style=flat-square)](https://www.npmjs.org/package/three-ik)

# THREE.IK

Inverse kinematics for [three.js].

A work in progress, THREE.IK supports multiple chains with multiple effectors, solved via [FABRIK] iterative solver, and a ball-joint constraint. Best way to see how this works for now is to check out the [demo], [examples], and the [docs].

:warning: **work in progress/request for feedback** :warning:

There are many [open issues] regarding axis alignment, new constraints, alternative solvers, and an API overhaul. Discussion and solutions are welcome! There will be **breaking changes** between versions as an API is settled on.

## Installation

`$ npm install --save three three-ik`

or include the build at [build/three-ik.js](build/three-ik.js):

```html
<script src="build/three-ik.js"></script>
```

## Usage

You can use ES6 importing like so:

```js
import { IK, IKChain, IKJoint, IKBallConstraint, IKHelper } from 'three-ik';
```

And here's a full example if included via script tag, with THREE.IK classes
defined on `THREE`.

```js
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
```

## Documentation

Full API documentation can be found at https://jsantell.github.io/THREE.IK/docs.

## Build

`$ npm run build`

## Logo

The logo and artwork was created by [Caitlyn Crites](http://www.caitlyncrites.com).

<img src="https://jsantell.github.io/THREE.IK/assets/three-ik-graphic.png" width="100" />

## IK Resources

* [FABRIK: a fast, iterative solver for the inverse kinematics problem](http://www.andreasaristidou.com/FABRIK.html)
* [Roblox Inverse Kinematics FABRIK](http://wiki.roblox.com/index.php?title=Inverse_kinematics#FABRIK)
* [Create your own IK in Unity - Luis Bermudez](https://medium.com/unity3danimation/create-your-own-ik-in-unity3d-989debd86770)
* [CCD Algorithm](https://sites.google.com/site/auraliusproject/ccd-algorithm)
* [Inverse Kinematics with Quaternion Joint Limits - Jonathan Blow](http://number-none.com/product/IK%20with%20Quaternion%20Joint%20Limits/index.html)
* [fullik: JS port of Caliko, Java implementation of FABRIK](https://github.com/lo-th/fullik)
* [webIK: JS port of VRIK](https://github.com/etiennepinchon/webIK)
* [fabrik-2d: JS 2D FABRIK](https://github.com/RGBboy/fabrik-2d)
* [fabrik: Unity component](https://github.com/Tannz0rz/FABRIK)

## License

MIT License, Copyright © 2018 Jordan Santell

[three.js]: https://threejs.org
[FABRIK]: http://www.andreasaristidou.com/FABRIK.html
[open issues]: https://github.com/jsantell/THREE.IK/issues
[demo]: https://jsantell.github.io/THREE.IK
[examples]: https://jsantell.github.io/THREE.IK/examples
[docs]: https://jsantell.github.io/THREE.IK/docs
