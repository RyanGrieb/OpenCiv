import { Game } from "../Game";

export interface CameraOptions {
  wasd_controls: boolean;
  mouse_controls: boolean;
  initial_position?: [number, number];
}

export class Camera {
  //TODO: Implement zoom: https://stackoverflow.com/questions/5189968/zoom-canvas-to-mouse-cursor/5526721#5526721

  private keysHeld: string[];

  private x: number;
  private y: number;

  private xVelAmount: number;
  private yVelAmount: number;
  private zoomAmount: number;

  private lastMouseX: number;
  private lastMouseY: number;
  private mouseHeld: boolean;
  private locked: boolean;

  constructor(options: CameraOptions) {
    this.keysHeld = [];
    this.x = 0;
    this.y = 0;

    this.xVelAmount = 0;
    this.yVelAmount = 0;
    this.zoomAmount = 1;

    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.locked = false;

    const scene = Game.getCurrentScene();
    if (options.wasd_controls) {
      scene.on("keydown", (options) => {
        if (this.keysHeld.includes(options.key) || this.locked) {
          return;
        }

        this.keysHeld.push(options.key);

        if (options.key == "a" || options.key == "A") {
          console.log("a");
          scene.getCamera().addVel(5, 0);
        }
        if (options.key == "d" || options.key == "D") {
          scene.getCamera().addVel(-5, 0);
        }
        if (options.key == "w" || options.key == "W") {
          scene.getCamera().addVel(0, 5);
        }
        if (options.key == "s" || options.key == "S") {
          scene.getCamera().addVel(0, -5);
        }
        if (options.key == "=") {
          scene
            .getCamera()
            .zoom(Game.getWidth() / 2, Game.getHeight() / 2, 1.2);
        }
        if (options.key == "-") {
          scene
            .getCamera()
            .zoom(Game.getWidth() / 2, Game.getHeight() / 2, 0.8);
        }
      });

      scene.on("keyup", (options) => {
        this.keysHeld = this.keysHeld.filter(
          (element) => element !== options.key
        ); // Remove key from held lits

        if (options.key == "a" || options.key == "A") {
          console.log("no a ");
          scene.getCamera().addVel(-5, 0);
        }
        if (options.key == "d" || options.key == "D") {
          scene.getCamera().addVel(5, 0);
        }

        if (options.key == "w" || options.key == "W") {
          scene.getCamera().addVel(0, -5);
        }
        if (options.key == "s" || options.key == "S") {
          scene.getCamera().addVel(0, 5);
        }
      });
    }

    if (options.mouse_controls) {
      scene.on("mousedown", (options) => {
        if (options.button !== 0 || this.locked) {
          return;
        }

        this.lastMouseX = options.x - scene.getCamera().getX();
        this.lastMouseY = options.y - scene.getCamera().getY();
        this.mouseHeld = true;
      });

      scene.on("mousemove", (options) => {
        if (this.mouseHeld) {
          scene
            .getCamera()
            .setPosition(
              options.x - this.lastMouseX,
              options.y - this.lastMouseY
            );
        }
      });

      scene.on("mouseup", (options) => {
        this.lastMouseX = options.x - scene.getCamera().getX();
        this.lastMouseY = options.y - scene.getCamera().getY();
        this.mouseHeld = false;
      });

      scene.on("wheel", (options) => {
        if (this.locked) {
          return;
        }

        if (options.deltaY > 0) {
          scene.getCamera().zoom(options.x, options.y, 1 / 1.1);
        }
        if (options.deltaY < 0) {
          scene.getCamera().zoom(options.x, options.y, 1.1);
        }

        this.lastMouseX = options.x - scene.getCamera().getX();
        this.lastMouseY = options.y - scene.getCamera().getY();
      });

      scene.on("mouseleave", (options) => {
        this.lastMouseX = options.x - scene.getCamera().getX();
        this.lastMouseY = options.y - scene.getCamera().getY();
        this.mouseHeld = false;
      });
    }
  }

  public zoomToLocation(x: number, y: number, zoomAmount: number) {
    this.setPosition(-x + Game.getWidth() / 2, -y + Game.getHeight() / 2);
    this.zoom(Game.getWidth() / 2, Game.getHeight() / 2, zoomAmount, false);
  }

  public addVel(x: number, y: number) {
    this.xVelAmount += x;
    this.yVelAmount += y;
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Updates x & y position of camera based on assigned xVel and yVel. To be called every render frame.
   */
  public updateOffset() {
    if (this.xVelAmount) {
      this.x += this.xVelAmount * Math.max(1, this.zoomAmount);
    }

    if (this.yVelAmount) {
      this.y += this.yVelAmount * Math.max(1, this.zoomAmount);
    }
  }

  public zoom(atX: number, atY: number, amount: number, incrementZoom = true) {
    // Calculate the new position of the camera
    //https://stackoverflow.com/questions/5189968/zoom-canvas-to-mouse-cursor/5526721#5526721
    this.x = atX - (atX - this.x) * amount;
    this.y = atY - (atY - this.y) * amount;
    if (incrementZoom) {
      this.zoomAmount *= amount;
    } else {
      this.zoomAmount = amount;
    }
  }

  public getZoomAmount() {
    return this.zoomAmount;
  }

  public lock(value: boolean) {
    this.locked = value;
  }

  public isLocked() {
    return this.locked;
  }
}
