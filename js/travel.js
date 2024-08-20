import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getStarfield from "./travel2.js";
import { getFresnelMat } from "./travel1.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 1.8;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const earthGroup = new THREE.Group();
scene.add(earthGroup);

earthGroup.rotation.y = Math.PI / 3; // Rotation de 90 degrés (un quart de tour) vers la gauche

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 1.2;
controls.minDistance = 0.5;
controls.maxDistance = 10;
controls.target.set(0, 0, 0);

const detail = 12;
const geometry = new THREE.IcosahedronGeometry(1, detail);

const loader = new THREE.TextureLoader();
const material = new THREE.MeshPhongMaterial({
  map: loader.load("./images/travel/earth.jpg"),
  shininess: 30,
});
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const fresnelMat = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, fresnelMat);
glowMesh.scale.setScalar(1.01);
earthGroup.add(glowMesh);

const stars = getStarfield({ numStars: 2000 });
scene.add(stars);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

function generateSurfacePoints(radius, numPoints) {
  const points = [];
  const phiStep = Math.PI / numPoints;
  const thetaStep = 2 * Math.PI / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const phi = i * phiStep;
    for (let j = 0; j <= numPoints; j++) {
      const theta = j * thetaStep;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      points.push(x, y, z);
    }
  }

  return new Float32Array(points);
}

const surfacePoints = generateSurfacePoints(1, 316);

const geometryWithPoints = new THREE.BufferGeometry();
geometryWithPoints.setAttribute('position', new THREE.BufferAttribute(surfacePoints, 3));

const pointMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.01, opacity: 0, transparent: true });
const pointsMesh = new THREE.Points(geometryWithPoints, pointMaterial);
earthGroup.add(pointsMesh);

const imageGallery = document.createElement('div');
imageGallery.id = 'imageGallery';
imageGallery.style.position = 'fixed';
imageGallery.style.top = '50%';
imageGallery.style.left = '50%';
imageGallery.style.transform = 'translate(-50%, -50%)';
imageGallery.style.zIndex = '1000';
imageGallery.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
imageGallery.style.padding = '20px';
imageGallery.style.borderRadius = '10px';
imageGallery.style.overflow = 'hidden';
imageGallery.style.width = '40vh';
imageGallery.style.display = 'none';

document.body.appendChild(imageGallery);

const imageContainer = document.createElement('div');
imageContainer.style.display = 'flex';
imageContainer.style.justifyContent = 'center';
imageContainer.style.alignItems = 'center';

const closeButton = document.createElement('div');
closeButton.innerText = 'X';
closeButton.style.position = 'absolute';
closeButton.style.top = '10px';
closeButton.style.right = '10px';
closeButton.style.fontSize = '24px';
closeButton.style.cursor = 'pointer';
closeButton.addEventListener('click', () => {
  imageGallery.style.display = 'none';
});
imageGallery.appendChild(closeButton);

const title = document.createElement('h2');
title.style.textAlign = 'center';
imageGallery.appendChild(title);

const leftArrow = document.createElement('div');
leftArrow.innerText = '<';
leftArrow.style.fontSize = '24px';
leftArrow.style.cursor = 'pointer';
leftArrow.style.marginRight = '20px';
leftArrow.addEventListener('click', () => {
  currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
  mainImage.src = images[currentImageIndex];
});
imageContainer.appendChild(leftArrow);

const mainImage = document.createElement('img');
mainImage.style.width = '70%';
mainImage.style.cursor = 'pointer';
mainImage.addEventListener('click', () => {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  mainImage.src = images[currentImageIndex];
});
imageContainer.appendChild(mainImage);

const rightArrow = document.createElement('div');
rightArrow.innerText = '>';
rightArrow.style.fontSize = '24px';
rightArrow.style.cursor = 'pointer';
rightArrow.style.marginLeft = '20px';
rightArrow.addEventListener('click', () => {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  mainImage.src = images[currentImageIndex];
});
imageContainer.appendChild(rightArrow);

imageGallery.appendChild(imageContainer);

let currentImageIndex = 0;
let images = [];

// Function to add points
function addPoint(x, y, z, color, title, imagesSrc) {
  const pointGeometry = new THREE.SphereGeometry(0.02, 32, 32);
  const pointMaterial = new THREE.MeshBasicMaterial({ color: color });
  const point = new THREE.Mesh(pointGeometry, pointMaterial);

  // Adjust point position
  const pointPosition = new THREE.Vector3(x, y, z).normalize().multiplyScalar(1);

  point.position.copy(pointPosition);
  point.userData.title = title;
  point.userData.images = imagesSrc;

  point.addEventListener('click', () => {
    displayImageGallery(point.userData.images, point.userData.title);
  });

  earthGroup.add(point);

  return point;
}

// Add points
const Genève = addPoint(-0.70, 0.74, 0.07, 0xff0000, 'Genève', ['./images/travel/Genève/1.jpg', './images/travel/Genève/2.jpg', './images/travel/Genève/3.jpg', './images/travel/Genève/4.jpg', './images/travel/Genève/5.jpg', './images/travel/Genève/6.jpg', './images/travel/Genève/7.jpg', './images/travel/Genève/8.jpg', './images/travel/Genève/9.jpg']); 
const Lièges = addPoint(-0.73, 0.82, 0.05, 0xff0000, 'Lièges', ['./images/travel/Lièges/1.jpg', './images/travel/Lièges/2.jpg', './images/travel/Lièges/3.jpg', './images/travel/Lièges/4.jpg', './images/travel/Lièges/5.jpg', './images/travel/Lièges/6.jpg', './images/travel/Lièges/7.jpg', './images/travel/Lièges/8.jpg', './images/travel/Lièges/9.jpg', './images/travel/Lièges/10.jpg']);
const Narbonne = addPoint(-0.74, 0.70, 0.04, 0xff0000, 'Narbonne', ['./images/travel/Narbonne/1.jpg', './images/travel/Narbonne/2.jpg', './images/travel/Narbonne/3.jpg', './images/travel/Narbonne/4.jpg', './images/travel/Narbonne/5.jpg', './images/travel/Narbonne/6.jpg', './images/travel/Narbonne/7.jpg', './images/travel/Narbonne/8.jpg', './images/travel/Narbonne/9.jpg', './images/travel/Narbonne/10.jpg']); 
const Angers = addPoint(-0.68, 0.75, -0.00, 0xff0000, 'Angers', ['./images/travel/Angers/1.jpg', './images/travel/Angers/2.jpg', './images/travel/Angers/3.jpg', './images/travel/Angers/4.jpg', './images/travel/Angers/5.jpg', './images/travel/Angers/6.jpg', './images/travel/Angers/7.jpg', './images/travel/Angers/8.jpg', './images/travel/Angers/9.jpg', './images/travel/Angers/10.jpg']); 
const Porto = addPoint(-0.75, 0.67, -0.11, 0xff0000, 'Porto', ['./images/travel/Porto/1.jpg', './images/travel/Porto/2.jpg', './images/travel/Porto/3.jpg', './images/travel/Porto/4.jpg', './images/travel/Porto/5.jpg', './images/travel/Porto/6.jpg', './images/travel/Porto/7.jpg', './images/travel/Porto/8.jpg', './images/travel/Porto/9.jpg']); 

const pointsToAnimate = [Genève, Lièges, Narbonne, Angers, Porto];

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function animate() {
  requestAnimationFrame(animate);

  earthGroup.rotation.y += 0.0015;
  glowMesh.rotation.y += 0.002;
  stars.rotation.y -= 0.0002;

  // Animate points
  pointsToAnimate.forEach(point => {
    const scale = 1 + 0.5 * Math.sin(Date.now() * 0.005);
    point.scale.setScalar(scale);
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleWindowResize, false);

let touchStart = { x: 0, y: 0 };

renderer.domElement.addEventListener('touchstart', (event) => {
  touchStart.x = event.touches[0].clientX;
  touchStart.y = event.touches[0].clientY;
});

renderer.domElement.addEventListener('touchmove', (event) => {
  const touchEndX = event.touches[0].clientX;
  const touchEndY = event.touches[0].clientY;
  const deltaX = touchEndX - touchStart.x;
  const deltaY = touchEndY - touchStart.y;

  controls.rotateLeft && controls.rotateLeft(-2 * deltaX / window.innerWidth);

  touchStart.x = touchEndX;
  touchStart.y = touchEndY;
});

function displayImageGallery(imagesSrc, titleText) {
  images = imagesSrc;
  currentImageIndex = 0;
  mainImage.src = images[currentImageIndex];
  title.innerText = titleText;
  imageGallery.style.display = 'block';
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    mainImage.src = images[currentImageIndex];
  } else if (event.key === 'ArrowRight') {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    mainImage.src = images[currentImageIndex];
  }
});

document.addEventListener('click', (event) => {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([Genève, Lièges, Narbonne, Angers, Porto]);

  if (intersects.length > 0) {
    displayImageGallery(intersects[0].object.userData.images, intersects[0].object.userData.title);
  }
});

/* Comment ajouter un point

  ajouter cette ligne dans le "// Add points" ligne 179 :
      const Rome = addPoint(x, y, z, couleur, 'Rome du XX/XX/XX au XX/XX/XX', ['photo1', 'photo2', 'photo3', ...]); 
  ajouter le nom du point à la liste "pointsToAnimate" :
    const pointsToAnimate = [..., ...];
  et dans la liste "intersects" :
    const intersects = raycaster.intersectObjects([..., ...]);
  
  Pour les couleurs :
    - Rouge --> 0xff0000
    - Blanc --> 0xffffff
    - Bleu --> 0x0000ff
    - Noir --> 0x000000
*/