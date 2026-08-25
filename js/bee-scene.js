import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';

const sceneLayer = document.querySelector('.scene-layer');
const canvas = document.getElementById('bee-canvas');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
const BASE_CAM = { x: 1, y: 3, z: 2.7 };
camera.position.set(BASE_CAM.x, BASE_CAM.y, BASE_CAM.z);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.domElement.style.display = 'none';

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(3, 10, 4);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-3, 2, -4);
scene.add(fillLight);

const effect = new AsciiEffect(renderer, ' .:-+*=%@#', { invert: false, resolution: 0.17 });
effect.setSize(window.innerWidth, window.innerHeight);
effect.domElement.style.color = 'rgb(160, 155, 145)';
effect.domElement.style.backgroundColor = 'transparent';
effect.domElement.style.position = 'absolute';
effect.domElement.style.top = '0';
effect.domElement.style.left = '0';
effect.domElement.style.width = '100%';
effect.domElement.style.height = '100%';
effect.domElement.style.pointerEvents = 'none';
effect.domElement.style.zIndex = '2';
sceneLayer.appendChild(effect.domElement);

effect.domElement.style.willChange = 'filter, mask-image, -webkit-mask-image';

let mixer;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('assets/models/bee.glb', (gltf) => {
  const model = gltf.scene;
  model.rotation.y = Math.PI / 2;
  model.scale.set(1.6, 1.6, 1.6);
  model.position.set(0, -0.4, 0);
  scene.add(model);

  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(gltf.animations[0]);
    mixer.timeScale = 0.05;
    console.log('mixer.timeScale:', mixer.timeScale);
    action.play();
    mixer.timeScale = 0.05;
    console.log('mixer.timeScale after play():', mixer.timeScale);
  }

  if (window.__hideLoadingScreen) window.__hideLoadingScreen();
}, undefined, () => {
  if (window.__hideLoadingScreen) window.__hideLoadingScreen();
});

const clock = new THREE.Clock();

let camCurrent = { x: BASE_CAM.x, y: BASE_CAM.y, z: BASE_CAM.z };
let camTarget = { x: BASE_CAM.x, y: BASE_CAM.y, z: BASE_CAM.z };
let mouseNX = 0, mouseNY = 0;
let mousePX = -9999, mousePY = -9999;

window.addEventListener('mousemove', (e) => {
  mousePX = e.clientX;
  mousePY = e.clientY;
  mouseNX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNY = (e.clientY / window.innerHeight) * 2 - 1;
});

window.addEventListener('mouseout', (e) => {
  if (!e.relatedTarget) {
    mouseNX = 0;
    mouseNY = 0;
    mousePX = -9999;
    mousePY = -9999;
  }
});

var maskDiv = effect.domElement;
var maskRadius = 80;

function animate() {
  camTarget.x = BASE_CAM.x + mouseNX * 0.5;
  camTarget.y = BASE_CAM.y - mouseNY * 0.2;
  camCurrent.x += (camTarget.x - camCurrent.x) * 0.05;
  camCurrent.y += (camTarget.y - camCurrent.y) * 0.05;

  const scrollP = window.__beeScrollProgress || 0;
  camera.position.set(
    camCurrent.x,
    camCurrent.y - scrollP * 3.5,
    BASE_CAM.z + scrollP * 1.8
  );
  camera.lookAt(0, 0, 0);

  if (mousePX >= 0 && mousePY >= 0) {
    var gradient =
      'radial-gradient(circle ' + maskRadius + 'px at ' +
      mousePX + 'px ' + mousePY + 'px, ' +
      'rgba(0,0,0,1) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.85) 100%)';
    maskDiv.style.filter = 'brightness(1.15)';
    maskDiv.style.webkitMaskImage = gradient;
    maskDiv.style.maskImage = gradient;
  } else {
    maskDiv.style.webkitMaskImage = 'none';
    maskDiv.style.maskImage = 'none';
    maskDiv.style.filter = '';
  }

  if (mixer) {
    mixer.update(clock.getDelta());
  }
  effect.render(scene, camera);
}

renderer.setAnimationLoop(animate);

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  effect.setSize(w, h);
}

window.addEventListener('resize', onResize);
