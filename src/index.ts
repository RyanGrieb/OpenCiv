//TODO: Preload all images into textures
//TODO: Handle spritesheet into textures
//TODO: Preload all sounds

import { assetList } from "./assets";

//Problem, we need to wait for the individual image to load, then iterate to the next one.
/*const img = new Image();   // Create new img element
img.addEventListener('load', () => {
  // execute drawImage statements here
}, false);
img.src = 'myImage.png'; // Set source path
*/

let images = [];
let imagesLoaded: number = 0;
const loadAssetPromise = () => {
  const resultPromise = new Promise((resolve, reject) => {
    for (let index in assetList) {
      let image = new Image();
      image.onload = () => {
        imagesLoaded++;
        console.log("Loaded: " + assetList[index]);
        if (imagesLoaded == assetList.length) {
          // We loaded all images, resolve the promise
          resolve(0);
        }
      };
      image.src = assetList[index];
      images.push(image);
    }
  });

  return resultPromise;
};

let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

let promise = loadAssetPromise();

promise.then((res) => {
  console.log("Asset promise succeeded, images loaded: " + imagesLoaded);

  //Update HTML & show canvas
  document.getElementById("loading_element").setAttribute("hidden", "true");
  document.getElementById("canvas").removeAttribute("hidden");

  ctx.drawImage(images[2], 64, 64);
});
