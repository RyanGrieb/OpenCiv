import { Game } from "../Game";

export interface CameraOptions {
  wasd_controls: boolean;
  mouse_controls: boolean;
  arrow_controls: boolean;
  initial_position?: [number, number];
}

export class Camera {
  //TODO: Implement zoom: https://stackoverflow.com/questions/5189968/zoom-canvas-to-mouse-cursor/5526721#5526721

  private keysHeld: string[];

  private x: number;
  private y: number;
  private targetX: number;
  private targetY: number;

  private xVelAmount: number;
  private yVelAmount: number;
  private zoomAmount: number;
  private targetZoomAmount: number;

  private lastMouseX: number;
  private lastMouseY: number;
  private mouseHeld: boolean;
  private locked: boolean;
  private wasdControls: boolean;
  private mouseControls: boolean;
  private arrowControls: boolean;

  public static fromCamera(camera: Camera) {
    const newCamera = new Camera({
      wasd_controls: camera.hasWASDControls(),
      mouse_controls: camera.hasMouseControls(),
      arrow_controls: camera.hasArrowControls()
    });

    newCamera.setPosition(camera.getX(), camera.getY());
    newCamera.setZoom(camera.getZoomAmount());
    return newCamera;
  }

  // Lerp helper
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }


  constructor(options: CameraOptions) {
    this.keysHeld = [];
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    this.wasdControls = options.wasd_controls;
    this.mouseControls = options.mouse_controls;
    this.arrowControls = options.arrow_controls;
    this.xVelAmount = 0;
    this.yVelAmount = 0;
    this.zoomAmount = 1;
    this.targetZoomAmount = 1;

    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.locked = false;

    const scene = Game.getInstance().getCurrentScene();
    scene.on("keydown", (options) => {
      if (this.keysHeld.includes(options.key) || this.locked) {
        return;
      }

      this.keysHeld.push(options.key);

      if (this.wasdControls) {
        if (options.key == "a" || options.key == "A") {
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
      }

      if (this.arrowControls) {
        if (options.key == "ArrowLeft") {
          scene.getCamera().addVel(5, 0);
        }
        if (options.key == "ArrowRight") {
          scene.getCamera().addVel(-5, 0);
        }

        if (options.key == "ArrowUp") {
          scene.getCamera().addVel(0, 5);
        }
        if (options.key == "ArrowDown") {
          scene.getCamera().addVel(0, -5);
        }
      }

      if (options.key == "=") {
        scene.getCamera().zoom(Game.getInstance().getWidth() / 2, Game.getInstance().getHeight() / 2, 1.2);
      }
      if (options.key == "-") {
        scene.getCamera().zoom(Game.getInstance().getWidth() / 2, Game.getInstance().getHeight() / 2, 0.8);
      }
    });

    scene.on("keyup", (options) => {
      if (this.wasdControls) {
        this.keysHeld = this.keysHeld.filter((element) => element !== options.key); // Remove key from held lits

        if (options.key == "a" || options.key == "A") {
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
      }

      if (this.arrowControls) {
        this.keysHeld = this.keysHeld.filter((element) => element !== options.key); // Remove key from held lits

        if (options.key == "ArrowLeft") {
          scene.getCamera().addVel(-5, 0);
        }
        if (options.key == "ArrowRight") {
          scene.getCamera().addVel(5, 0);
        }

        if (options.key == "ArrowUp") {
          scene.getCamera().addVel(0, -5);
        }
        if (options.key == "ArrowDown") {
          scene.getCamera().addVel(0, 5);
        }
      }
    });

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
          scene.getCamera().setTargetPosition(options.x - this.lastMouseX, options.y - this.lastMouseY);
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
          scene.getCamera().zoom(options.x, options.y, 0.8);
        }
        if (options.deltaY < 0) {
          scene.getCamera().zoom(options.x, options.y, 1.2);
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

  public hasWASDControls() {
    return this.wasdControls;
  }

  public hasMouseControls() {
    return this.mouseControls;
  }

  public hasArrowControls() {
    return this.arrowControls;
  }

  public setZoom(amount: number) {
    this.zoomAmount = amount;
  }

  /**
   * Smoothly zooms the camera to a specific world location and centers it in the viewport.
   *
   * Unlike {@link zoom}, which may only adjust the zoom level or perform a generic zoom operation,
   * this method sets both the target zoom amount and the camera's target position so that the given
   * world coordinates (`x`, `y`) are centered on the screen after zooming. This is useful for focusing
   * on a particular point of interest in the game world, ensuring it remains centered as the zoom occurs.
   *
   * @param x - The world x-coordinate to center on after zooming.
   * @param y - The world y-coordinate to center on after zooming.
   * @param zoomAmount - The target zoom level to apply.
   */
  public zoomToLocation(x: number, y: number, zoomAmount: number) {
    const game = Game.getInstance();
    const width = game.getWidth() / game.getDPR();
    const height = game.getHeight() / game.getDPR();

    // Set the new zoom target
    this.targetZoomAmount = zoomAmount;

    // Calculate the new camera position so that (x, y) is centered after zoom
    this.targetX = -x * zoomAmount + width / 2;
    this.targetY = -y * zoomAmount + height / 2;
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

  public setTargetPosition(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Updates x & y position of camera based on assigned xVel and yVel. To be called every render frame.
   */
  public updateOffset() {
    if (this.xVelAmount) {
      this.targetX += this.xVelAmount * Math.max(1, this.zoomAmount);
    }

    if (this.yVelAmount) {
      this.targetY += this.yVelAmount * Math.max(1, this.zoomAmount);
    }

    // Easing factor (0.1 = slow, 1 = instant)
    const easing = 0.40;
    this.x = this.lerp(this.x, this.targetX, easing);
    this.y = this.lerp(this.y, this.targetY, easing);

    // Lerp zoomAmount for smooth zoom
    this.zoomAmount = this.lerp(this.zoomAmount, this.targetZoomAmount, easing);
  }

  /**
   * Adjusts the camera's zoom level centered at the specified (atX, atY) coordinates.
   * Updates the camera's target position to maintain the zoom focus at the given point,
   * and sets the target zoom amount. This function is intended to be called when the user
   * performs a zoom action (e.g., mouse wheel or pinch gesture) at a specific location.
   * 
   * @param atX - The x-coordinate around which to zoom.
   * @param atY - The y-coordinate around which to zoom.
   * @param amount - The zoom factor to apply (e.g., 1.1 to zoom in, 0.9 to zoom out).
   * @param incrementZoom - If true, multiplies the current zoom by `amount`; if false, sets zoom directly to `amount`.
   */
  public zoom(atX: number, atY: number, amount: number, incrementZoom = true) {
    // Calculate the new position of the camera
    const newX = atX - (atX - this.x) * amount;
    const newY = atY - (atY - this.y) * amount;

    this.targetX = newX;
    this.targetY = newY;

    if (incrementZoom) {
      this.targetZoomAmount = this.zoomAmount * amount;
    } else {
      this.targetZoomAmount = amount;
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
