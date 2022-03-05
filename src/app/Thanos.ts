import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export class Thanos {
  public isModelLoaded = false;
  public model: THREE.Group = new THREE.Group();

  public animationActions: THREE.AnimationAction[] = [];
  public activeAction!: THREE.AnimationAction;
  public lastAction!: THREE.AnimationAction;
  private fbxLoader: FBXLoader = new FBXLoader();
  private mixer!: THREE.AnimationMixer;

  constructor() {
    this.init();
  }

  private init(): void {
    this.fbxLoader.load(
      'thanos.fbx',
      (object) => {
        this.mixer = new THREE.AnimationMixer(object);

        object.traverse(function (child) {
          if ((child as THREE.Mesh).isMesh) {
            let ob = child as THREE.Mesh;

            if (ob.name.toLowerCase().includes('head')) {
              (ob.material as THREE.MeshPhongMaterial).map =
                new THREE.TextureLoader().load('thanos/T_M_LRG_Jim_Head_d.png');
              (ob.material as THREE.MeshPhongMaterial).shininess = 0;
              (ob.material as THREE.MeshPhongMaterial).reflectivity = 0;
            } else if (ob.name.toLowerCase().includes('gauntlet')) {
              (ob.material as THREE.MeshPhongMaterial).map =
                new THREE.TextureLoader().load(
                  'thanos/T_M_LRG_JIM_Gauntlet_D.png'
                );
              (ob.material as THREE.MeshPhongMaterial).shininess = 0;
              (ob.material as THREE.MeshPhongMaterial).reflectivity = 0;
            } else if (ob.name.toLowerCase().includes('body')) {
              (ob.material as THREE.MeshPhongMaterial).map =
                new THREE.TextureLoader().load('thanos/T_M_LRG_Jim_Body_d.png');
              (ob.material as THREE.MeshPhongMaterial).shininess = 0;
              (ob.material as THREE.MeshPhongMaterial).reflectivity = 0;
            } else if (ob.name.toLowerCase().includes('helmet')) {
              (ob.material as THREE.MeshPhongMaterial).map =
                new THREE.TextureLoader().load(
                  'thanos/T_M_LRG_Jim_Helmet_d.png'
                );
              (ob.material as THREE.MeshPhongMaterial).shininess = 0;
              (ob.material as THREE.MeshPhongMaterial).reflectivity = 0;
            }
          }
        });
        const animationAction = this.mixer.clipAction(
          (object as THREE.Object3D).animations[0]
        );
        this.animationActions.push(animationAction);
        this.activeAction = this.animationActions[0];
        this.lastAction = this.animationActions[0];

        this.model.add(object);
        this.model.scale.set(1.5, 1.5, 1.5);
        this.model.position.set(0, -200, 400);

        this.fbxLoader.load(
          'dance1.fbx',
          (dance) => {
            const animationAction = this.mixer.clipAction(
              (dance as THREE.Object3D).animations[0]
            );
            this.animationActions.push(animationAction);
            this.setAction(this.animationActions[1]);
            this.activeAction = this.animationActions[1];

            this.fbxLoader.load(
              'dance2.fbx',
              (dance2) => {
                const animationAction = this.mixer.clipAction(
                  (dance2 as THREE.Object3D).animations[0]
                );
                this.animationActions.push(animationAction);
                console.log(this.animationActions);
                this.isModelLoaded = true;
              },
              (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
                if (xhr.loaded === xhr.total) {
                  console.log('loaded dance2');
                }
              },
              (error) => {
                console.log(error);
              }
            );
          },
          (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            if (xhr.loaded === xhr.total) {
              console.log('loaded dance1');
            }
          },
          (error) => {
            console.log(error);
          }
        );
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.log(error);
      }
    );
  }

  public setAction(toAction: THREE.AnimationAction) {
    if (toAction != this.activeAction) {
      this.lastAction = this.activeAction;
      this.activeAction = toAction;
      //lastAction.stop()
      this.lastAction.fadeOut(1);
      this.activeAction.reset();
      if (this.activeAction == this.animationActions[0]) {
        this.activeAction.time = 3;
        // activeAction.;
      }
      this.activeAction.fadeIn(1);
      this.activeAction.play();
      this.activeAction.loop = THREE.LoopOnce;
    }
  }

  updateMixer(time: number) {
    this.mixer.update(time);
  }
}
