import * as THREE from 'three';
import { EnvironmentManager } from './EnvironmentManager';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { Thanos } from './Thanos';
import { SoundPlayer } from './SoundPlayer';

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

let thanos = new Thanos();

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
  opacity: 0.5,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x += Math.PI / 2;
plane.position.y = -600;

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
let glitched = false;
const glitchButton = document.getElementById('glitches');

let storm: SoundPlayer = new SoundPlayer('sound/thunder.mp3', listener);
let musics: SoundPlayer[] = [];
for (let i = 1; i <= 3; i++) {
  let music: SoundPlayer = new SoundPlayer('sound/drop' + i + '.mp3', listener);
  musics.push(music);
}
let controlsUpdate = false;
let firstTime = true;
let finalLoop = false;
const intervals = [6, 10, 14, 18];
let theta = 0;
let time = Date.now();

function animate() {
  let timeDelta = clock.getDelta();
  uniforms.u_time.value += timeDelta;
  let diff = Date.now() - time;
  if (scene.getObjectById(thanos.model.id)) {
    thanos.updateMixer(timeDelta);
    if (!thanos.activeAction.isRunning()) {
      thanos.setAction(thanos.lastAction);
      thanos.model.position.y = thanos.model.position.y === -500 ? -300 : -500;
    }
  }
  if (!finalLoop && diff < intervals[0] * 1000) {
    if (diff > 3000 && firstTime) {
      controls.enabled = false;
      if (storm) storm.stop();
      musics[2].play();
      scene.add(thanos.model);
      thanos.model.visible = false;
      firstTime = false;
    }
  } else if (!finalLoop && diff < intervals[1] * 1000) {
    if (!firstTime) {
      thanos.model.visible = true;
      scene.add(cityScene);
      firstTime = true;
    }
  } else if (!finalLoop && diff < intervals[2] * 1000) {
    if (firstTime) {
      scene.remove(portalParticles);
      firstTime = false;
      controls.enabled = true;
      controlsUpdate = true;
      thanos.model.position.z = 0;
    }
  } else if (!finalLoop && diff < intervals[3] * 1000) {
    if (!firstTime) {
      scene.remove(cityScene);
      scene.add(gtaScene);
      firstTime = true;
    }
    gtaScene.position.y += Math.sin(theta);
  } else {
    finalLoop = true;

    if (Date.now() - time > 5000) {
      if (scene.getObjectById(gtaScene.id)) {
        scene.remove(gtaScene);
        scene.add(gtaScene2);
        musics[1].play();
        musics[2].pause();
      } else if (scene.getObjectById(gtaScene2.id)) {
        scene.remove(gtaScene2);
        scene.add(cityScene);
        musics[0].play();
        musics[1].pause();
      } else if (scene.getObjectById(cityScene.id)) {
        scene.remove(cityScene);
        scene.add(gtaScene);
        musics[2].play();
        musics[0].pause();
      }

      time = Date.now();
    }

    camera.position.x += Math.sin(theta) / 2;

    cityScene.rotation.y += Math.cos(theta) / 5;
    gtaScene.rotation.y += Math.sin(theta) / 5;
    gtaScene2.rotation.y += Math.cos(theta) / 5;
  }
  if (scene.getObjectById(portalParticles.id)) {
    portalParticles.children.forEach((p) => {
      p.rotation.z -= timeDelta * 1.5;
    });
  }

  if (Math.random() > 0.9) {
    lightPortal.power = 350 + Math.random() * 500;
  }
  theta += 0.01;
  lightPortal.position.z += Math.sin(theta);
  if (Date.now() - stopTimer < 65000) {
    requestAnimationFrame(animate);
    // envManager.render();
    composer.render();

    if (controlsUpdate) {
      controls.update();
    }
  } else {
    document.getElementById('glitches')?.classList.add('hide');
    musics.forEach((item) => item.stop());
    const doc = document.createElement('div');
    doc.classList.add('loading');
    doc.id = 'loading';
    doc.innerHTML = `<div>Thanks for watching, follow me <a href="https://twitter.com/shravankumarui" target="_blank">@shravankumarui</a> on twitter;</div>
      <div>Credits
      <ul><li>Music from uppbeat.io 
        <ul>
            <li><a href="https://uppbeat.io/t/exekat/cyberpunk-city">exekat/cyberpunkcity</a></li>
            <li><a href="https://uppbeat.io/t/exekat/bang">exekat/bang</a></li>
            <li><a href="https://uppbeat.io/t/infraction/drop-it">infraction/drop it<a>infraction/drop it</a></li>
        </ul>
      </li>
      <li>Threejs javascript library, WebGL Shaders, Typescript :) </li>
      <li>Kirll Gorskikh's Free <a href="https://sketchfab.com/Kirill.Gorskikh"> Thanos 3D model</a> on sketchfab</li>
      <li>Images from Unsplash</li>
      </ul>
      </div>`;
    document.body.appendChild(doc);
    document.querySelector('canvas')?.remove();
  }
}
let oldValue = glitchButton?.innerHTML;
glitchButton?.addEventListener('click', () => {
  if (glitched) {
    composer.removePass(glitchPass);
    glitched = false;
    glitchButton.innerHTML = `` + oldValue;
  } else {
    composer.addPass(glitchPass);
    glitched = true;
    glitchButton.innerHTML = `Remove glitch`;
  }
});
function startRendering() {
  let interval = setInterval(() => {
    if (
      thanos.isModelLoaded() &&
      musics.filter((item) => item.isSoundLoaded).length == 3
    ) {
      time = Date.now();
      animate();
      document.getElementById('glitches')?.classList.remove('hide');
      clearInterval(interval);
    }
  }, 40);
}
document.getElementById('animatePage')?.addEventListener('click', () => {
  storm.play();
  startRendering();
  document.getElementById('loading')?.remove();
});
