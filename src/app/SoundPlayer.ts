import * as THREE from 'three';

export class SoundPlayer {
  audioLoader = new THREE.AudioLoader();
  isSoundLoaded = false;

  constructor(path: string, private sound: THREE.Audio) {
    this.init(path);
  }
  private init(path: string) {
    this.audioLoader.load(
      path,
      (buffer) => {
        this.sound.setBuffer(buffer);
        this.sound.setLoop(false);
        this.sound.setVolume(1);
        this.sound.play();
        this.isSoundLoaded = true;
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        if (xhr.loaded === xhr.total) {
          console.log('loaded sound');
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  play() {
    this.sound.play();
  }
  pause() {
    this.sound.pause();
  }
  stop() {
    this.sound.stop();
  }
}
