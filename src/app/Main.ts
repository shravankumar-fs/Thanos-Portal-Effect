import * as THREE from 'three';
import { EnvironmentManager } from './EnvironmentManager';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { Thanos } from './Thanos';
import { SoundPlayer } from './SoundPlayer';
import { DoubleSide, LoadingManager, Wrapping } from 'three';

let envManager = new EnvironmentManager();
let scene = envManager.scene;
let renderer = envManager.renderer;
let camera = envManager.camera;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => envManager.onWindowResize(), false);
function mainLightAdd(pos: THREE.Vector3) {
  let light = new THREE.DirectionalLight(0xffffff);
  light.position.add(pos);
  scene.add(light);
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.enabled = false;
controls.maxDistance = 1000;
controls.minDistance = 600;
controls.maxPolarAngle = Math.PI / 2.2;
controls.minPolarAngle = Math.PI / 2.8;
mainLightAdd(new THREE.Vector3(0, 0, 500));

let lightPortal = new THREE.PointLight(0x062d89, 30, 600, 1.7);
lightPortal.power = 10000;
lightPortal.position.set(0, 0, 250);
scene.add(lightPortal);
let portalParticles: THREE.Group = new THREE.Group();
function setUpPortalParticles() {
  let texture = new THREE.TextureLoader().load('smoke.png');
  let portalGeo = new THREE.PlaneBufferGeometry(350, 350);
  let portalMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
  });
  for (let p = 880; p > 100; p--) {
    let particle = new THREE.Mesh(portalGeo, portalMaterial);
    particle.position.set(
      0.5 * p * Math.cos((4 * p * Math.PI) / 180),
      0.5 * p * Math.sin((4 * p * Math.PI) / 180),
      0.1 * p
    );
    particle.rotation.z = Math.random() * 360;
    portalParticles.add(particle);
  }
}
setUpPortalParticles();
let clock: THREE.Clock;
scene.add(portalParticles);

clock = new THREE.Clock();
let cityScene: THREE.Mesh;
let gtaScene: THREE.Mesh;
let gtaScene2: THREE.Mesh;
function setCityScene() {
  let urls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
  let materialArray = urls.map((url) => {
    return new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('background1/' + url),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
  });
  let boxgeo = new THREE.BoxBufferGeometry(3000, 3000, 3000);
  cityScene = new THREE.Mesh(boxgeo, materialArray);
  cityScene.rotation.y -= Math.PI / 4;
  cityScene.position.y = 800;
}
function setGTAScene() {
  let urls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
  let materialArray = urls.map((url) => {
    return new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('background2/' + url),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
  });
  let boxgeo = new THREE.BoxBufferGeometry(3000, 3000, 3000);
  gtaScene = new THREE.Mesh(boxgeo, materialArray);
  gtaScene.position.y = 800;
}

function setGTAScene2() {
  let urls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
  let materialArray = urls.map((url) => {
    return new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('background3/' + url),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
  });
  let boxgeo = new THREE.BoxBufferGeometry(3000, 3000, 3000);
  gtaScene2 = new THREE.Mesh(boxgeo, materialArray);
  gtaScene2.rotation.y += Math.PI;
  gtaScene2.position.y = 800;
}

setCityScene();
setGTAScene();
setGTAScene2();

const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
// const mainMusic = new SoundPlayer('sound/kehendi.mp3', sound);
let storm: SoundPlayer | undefined;

let thanos = new Thanos();

let theta = 0;
let time = Date.now();

const intervals = [
  {
    duration: 6,
    map: undefined,
    portal: true,
  },
  {
    duration: 14,
    map: cityScene!,
    portal: true,
  },
  {
    duration: 20,
    map: cityScene!,
    portal: false,
  },
  {
    duration: 30,
    map: gtaScene!,
    portal: false,
  },
];
let mainMusic: SoundPlayer | undefined;
let firstTime = true;
let finalLoop = false;

const vshader = `
varying vec2 vUv;
void main() {	
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fshader = `
#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_duration;
uniform sampler2D u_tex;

varying vec2 vUv;

void main (void)
{
  vec2 p = vUv*2.0 - 1.0;
  float len = length(p);
  vec2 ripple = vUv + p/len*0.03*cos(len*12.0-u_time*4.0);
  float delta = (((sin(u_time)+1.0)/2.0)* u_duration)/u_duration;
  vec2 uv = mix(ripple, vUv, delta);
  vec3 color = texture2D(u_tex, uv).rgb;
  gl_FragColor = vec4(color, 1.0); 
}
`;

const geometry = new THREE.PlaneBufferGeometry(5000, 5000, 1000, 1000);
const texture = new THREE.TextureLoader().load('grid.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(20, 20);
const uniforms = {
  u_tex: {
    value: new THREE.TextureLoader().load('grid.png'),
  },
  u_duration: { value: 2.0 },
  u_time: { value: 0.0 },
  u_mouse: { value: { x: 0.0, y: 0.0 } },
  u_resolution: { value: { x: 0, y: 0 } },
};

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader,
  transparent: true,
  opacity: 0.6,
  side: DoubleSide,
});
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x += Math.PI / 2;
plane.position.y = -800;

scene.add(plane);
let stopTimer = Date.now();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,
  0.4,
  0.85
);
bloomPass.renderToScreen = true;
composer.addPass(bloomPass);

let glitchPass = new GlitchPass();
composer.addPass(glitchPass);
let glitched = true;

function animate() {
  let timeDelta = clock.getDelta();
  uniforms.u_time.value += timeDelta;
  let diff = Date.now() - time;
  if (thanos.isModelLoaded && scene.getObjectById(thanos.model.id)) {
    thanos.updateMixer(timeDelta);
    if (!thanos.activeAction.isRunning()) {
      thanos.setAction(thanos.lastAction);
      thanos.model.position.y = thanos.model.position.y === -500 ? -300 : -500;
    }
  }
  if (!finalLoop && diff < intervals[0].duration * 1000) {
    if (diff > 3000 && firstTime) {
      controls.enabled = false;
      if (storm) storm.stop();
      mainMusic = new SoundPlayer('sound/kehendi.mp3', sound);
      scene.add(thanos.model);
      thanos.model.visible = false;
      firstTime = false;
    }
  } else if (!finalLoop && diff < intervals[1].duration * 1000) {
    if (!firstTime) {
      thanos.model.visible = true;
      scene.add(cityScene);
      firstTime = true;
    }
  } else if (!finalLoop && diff < intervals[2].duration * 1000) {
    if (firstTime) {
      scene.remove(portalParticles);
      firstTime = false;
      controls.enabled = true;
    }
  } else if (!finalLoop && diff < intervals[3].duration * 1000) {
    if (!firstTime) {
      scene.remove(cityScene);
      scene.add(gtaScene);
      firstTime = true;
    }
    gtaScene.position.y += Math.sin(theta);
  } else {
    finalLoop = true;

    if (Date.now() - time > 4000) {
      if (scene.getObjectById(gtaScene.id)) {
        scene.remove(gtaScene);
        scene.add(gtaScene2);
      } else if (scene.getObjectById(gtaScene2.id)) {
        scene.remove(gtaScene2);
        scene.add(cityScene);
      } else if (scene.getObjectById(cityScene.id)) {
        scene.remove(cityScene);
        scene.add(gtaScene);
      }

      time = Date.now();
    }
    if (Math.random() > 0) {
      camera.position.x += Math.sin(theta);
    }
    cityScene.rotation.y += Math.cos(theta) / 2;
    gtaScene.rotation.y += Math.sin(theta) / 2;
    gtaScene2.rotation.y += Math.cos(theta) / 2;
  }

  portalParticles.children.forEach((p) => {
    p.rotation.z -= timeDelta * 1.5;
  });

  if (Math.random() > 0.9) {
    lightPortal.power = 350 + Math.random() * 500;
  }
  theta += 0.01;
  lightPortal.position.z += Math.sin(theta);
  if (Date.now() - stopTimer < 157000) {
    if (Math.random() > 0.5) {
      if (glitched) {
        composer.removePass(glitchPass);
        glitched = false;
      } else {
        composer.addPass(glitchPass);
        glitched = true;
      }
    }
    requestAnimationFrame(animate);
    // envManager.render();
    composer.render();
  } else {
    mainMusic?.stop();
    const doc = document.createElement('div');
    doc.classList.add('loading');
    doc.id = 'loading';
    doc.innerHTML = `<div>Thanks for watching, follow me <a href="https://twitter.com/shravankumarui" target="_blank">@shravankumarui</a> on twitter;</div>
      <div>Credits
      <ul><li>Ap Dhillon, Gurinder gill - Excuses (for audio)</li>
      <li>Threejs javascript library, WebGL Shaders, Typescript :) </li>
      <li>Kirll Gorskikh's Free Thanos 3D model <a href="https://sketchfab.com/Kirill.Gorskikh">link</a></li>
      <li>Images from Unsplash</li>
      </ul>
      </div>`;
    document.body.appendChild(doc);
    document.querySelector('canvas')?.remove();
  }
}

document.getElementById('animatePage')?.addEventListener('click', () => {
  storm = new SoundPlayer('sound/thunder.mp3', sound);
  animate();
  document.getElementById('loading')?.remove();
});
