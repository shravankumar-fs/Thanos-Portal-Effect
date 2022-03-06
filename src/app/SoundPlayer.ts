import * as THREE from 'three';

export class SoundPlayer {
  audioLoader = new THREE.AudioLoader();
  soundLoaded = false;
  soundUpdateLoaded = false;
  sound: THREE.Audio;

  constructor(path: string, private listener: THREE.AudioListener) {
    this.sound = new THREE.Audio(listener);
    this.init(path);
  }
  private init(path: string) {
    this.audioLoader.load(
      path,
      (buffer) => {
        this.sound.setBuffer(buffer);
        this.sound.setLoop(true);
        this.sound.setVolume(1);
        this.sound.play();
        this.sound.pause();
        this.soundLoaded = true;
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        if (xhr.loaded === xhr.total) {
          console.log('loaded : ' + path);
          this.soundUpdateLoaded = true;
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

  isSoundLoaded() {
    return this.soundLoaded && this.soundUpdateLoaded;
  }
}
