import * as THREE from 'three';

export class EnvironmentManager {
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _renderer!: THREE.WebGLRenderer;

  constructor() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
  }

  public get scene() {
    return this._scene;
  }

  public get camera() {
    return this._camera;
  }
  public get renderer() {
    return this._renderer;
  }

  initScene() {
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.TextureLoader().load('space.jpg');
  }

  initCamera() {
    this._camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this._camera.position.z = 1000;
  }

  initRenderer() {
    this._renderer = new THREE.WebGLRenderer();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setClearColor(0x000000, 1);
    // this._renderer.shadowMap.enabled = true;
    // this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // this._renderer.physicallyCorrectLights = true;
  }

  onWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this.render();
  }

  render() {
    this._renderer.render(this._scene, this._camera);
  }
}
