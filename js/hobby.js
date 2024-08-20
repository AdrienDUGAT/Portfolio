// Récupération des éléments DOM nécessaires
const counterDOM = document.getElementById('counter');  
const endDOM = document.getElementById('end');  

// Création d'une scène Three.js
const scene = new THREE.Scene();

// Définition de la distance de la caméra par rapport à la scène
const distance = 500;

// Création d'une caméra orthographique avec les dimensions de la fenêtre
const camera = new THREE.OrthographicCamera( window.innerWidth/-2, window.innerWidth/2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 10000 );

// Rotation de la caméra selon les angles spécifiés en radians
camera.rotation.x = 50*Math.PI/180;
camera.rotation.y = 20*Math.PI/180;
camera.rotation.z = 10*Math.PI/180;

// Calcul de la position initiale de la caméra selon ses rotations
const initialCameraPositionY = -Math.tan(camera.rotation.x)*distance;
const initialCameraPositionX = Math.tan(camera.rotation.y)*Math.sqrt(distance**2 + initialCameraPositionY**2);

// Positionnement de la caméra
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

// Facteur de zoom pour la caméra
const zoom = 2;

// Taille du poulet
const chickenSize = 10;

// Largeur d'une position sur le plateau de jeu et nombre de colonnes sur le plateau
const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;

// Temps nécessaire pour qu'un poulet effectue un pas en avant, en arrière, à gauche ou à droite (en millisecondes)
const stepTime = 200;

// Variables pour suivre l'état du jeu et les mouvements du poulet
let lanes; // Les voies sur lesquelles le poulet peut se déplacer
let currentLane; // La voie actuelle du poulet
let currentColumn; // La colonne actuelle du poulet
let previousTimestamp; // Le timestamp de l'itération de boucle précédente
let startMoving; // Indique si le poulet doit commencer à se déplacer
let moves; // Le nombre total de mouvements effectués par le poulet
let stepStartTimestamp; // Le timestamp auquel le poulet a commencé à effectuer son dernier pas

// Textures pour les différentes parties des voitures
const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110, 40, [{ x: 10, y: 0, w: 50, h: 30 }, { x: 70, y: 0, w: 30, h: 30 }]);
const carLeftSideTexture = new Texture(110, 40, [{ x: 10, y: 10, w: 50, h: 30 }, { x: 70, y: 10, w: 30, h: 30 }]);

// Textures pour les différentes parties des camions
const truckFrontTexture = new Texture(30,30,[{x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25,30,[{x: 0, y: 15, w: 10, h: 10 }]);
const truckLeftSideTexture = new Texture(25,30,[{x: 0, y: 5, w: 10, h: 10 }]);

// Fonction pour générer les voies
const generateLanes = () => [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => {

    // Création d'une nouvelle voie avec l'index spécifié
    const lane = new Lane(index);
    
    // Positionnement de la voie sur l'axe y en fonction de son index et des dimensions de la position et du zoom
    lane.mesh.position.y = index * positionWidth * zoom;
    
    // Ajout de la voie à la scène
    scene.add(lane.mesh);
    
    return lane;
}).filter((lane) => lane.index >= 0); // Filtrage pour ne garder que les voies dont l'index est positif
  
// Fonction pour ajouter une nouvelle voie
const addLane = () => {
    
    // Calcul de l'index de la nouvelle voie en fonction du nombre de voies existantes
    const index = lanes.length;
    
    // Création d'une nouvelle voie avec l'index calculé
    const lane = new Lane(index);
    
    // Positionnement de la nouvelle voie sur l'axe y en fonction de son index et des dimensions de la position et du zoom
    lane.mesh.position.y = index * positionWidth * zoom;
    
    // Ajout de la nouvelle voie à la scène et à la liste des voies
    scene.add(lane.mesh);
    lanes.push(lane);
}
  
// Création d'un objet poulet et ajout à la scène
const chicken = new Chicken();
scene.add(chicken);

// Création d'une lumière hémisphérique et ajout à la scène
hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);  

// Positions initiales de la lumière directionnelle
const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;

// Création d'une lumière directionnelle avec une couleur et une intensité spécifiées
dirLight = new THREE.DirectionalLight(0xffffff, 0.6);

// Positionnement de la lumière directionnelle
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);

// Activation de l'ombre pour la lumière directionnelle
dirLight.castShadow = true;

// Définition de la cible de la lumière directionnelle (le poulet)
dirLight.target = chicken;

// Ajout de la lumière directionnelle à la scène
scene.add(dirLight);

// Configuration de la taille de la map d'ombres de la lumière directionnelle
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// Définition des dimensions de la caméra d'ombre de la lumière directionnelle
var d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

// Création d'un helper pour visualiser la caméra de l'ombre (décommenter selon besoin)
// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// scene.add(helper)

// Création d'une lumière directionnelle arrière avec une couleur et une intensité spécifiées
backLight = new THREE.DirectionalLight(0x000000, .4);

// Positionnement de la lumière directionnelle arrière
backLight.position.set(200, 200, 50);

// Activation de l'ombre pour la lumière directionnelle arrière
backLight.castShadow = true;

// Ajout de la lumière directionnelle arrière à la scène
scene.add(backLight);

// Types de voies disponibles 
const laneTypes = ['car', 'truck', 'forest'];

// Vitesses associées aux types de voies
const laneSpeeds = [2, 2.5, 3];

// Couleurs des véhicules par type
const vechicleColors = [0xa52523, 0xbdb638, 0x78b14b];

// Hauteurs associées aux types de voies
const threeHeights = [20,45,60];

// Fonction pour initialiser les valeurs du jeu
const initaliseValues = () => {

    // Génération des voies
    lanes = generateLanes()

    // Initialisation de la voie actuelle et de la colonne actuelle du poulet
    currentLane = 0;
    currentColumn = Math.floor(columns/2);

    // Réinitialisation du timestamp précédent
    previousTimestamp = null;

    // Réinitialisation de l'indicateur de démarrage du mouvement et de la liste des mouvements
    startMoving = false;
    moves = [];
    let stepStartTimestamp; // Correction de la variable, ajouter "let" pour la déclaration
    
    // Réinitialisation de la position du poulet
    chicken.position.x = 0;
    chicken.position.y = 0;

    // Réinitialisation de la position de la caméra
    camera.position.y = initialCameraPositionY;
    camera.position.x = initialCameraPositionX;

    // Réinitialisation de la position de la lumière directionnelle
    dirLight.position.x = initialDirLightPositionX;
    dirLight.position.y = initialDirLightPositionY;
}

// Initialisation des valeurs du jeu
initaliseValues();

// Création du renderer WebGL avec des options pour l'alpha et l'antialiasing
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});

// Activation des ombres dans le renderer
renderer.shadowMap.enabled = true;

// Type d'ombres utilisé par le renderer
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Définition de la taille du renderer pour qu'il remplisse la fenêtre
renderer.setSize(window.innerWidth, window.innerHeight);

// Ajout du renderer à l'élément DOM du document
document.body.appendChild(renderer.domElement);

// Fonction pour créer une texture
function Texture(width, height, rects) {

    // Création d'un canvas avec les dimensions spécifiées
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    
    // Obtention du contexte 2D du canvas
    const context = canvas.getContext("2d");
    
    // Remplissage du canvas avec une couleur blanche
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    
    // Remplissage des rectangles spécifiés avec une couleur semi-transparente
    context.fillStyle = "rgba(0,0,0,0.6)";
    rects.forEach(rect => {
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
    });
    
    // Création et retour d'une texture Three.js à partir du canvas
    return new THREE.CanvasTexture(canvas);
}
  
// Fonction pour créer une roue
function Wheel() {

    // Création d'un mesh de type boîte pour représenter la roue
    const wheel = new THREE.Mesh(
      new THREE.BoxBufferGeometry(12 * zoom, 33 * zoom, 12 * zoom),
      new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
    );
    
    // Positionnement de la roue sur l'axe z
    wheel.position.z = 6 * zoom;
    
    return wheel; // Retour du mesh représentant la roue
}  

// Fonction pour créer une voiture
function Car() {

    // Création d'un groupe Three.js pour regrouper les différentes parties de la voiture
    const car = new THREE.Group();

    // Sélection aléatoire d'une couleur de véhicule parmi les couleurs disponibles
    const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

    // Création de la partie principale de la voiture (le corps)
    const main = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 60*zoom, 30*zoom, 15*zoom ), 
        new THREE.MeshPhongMaterial( { color, flatShading: true } )
      );
      main.position.z = 12*zoom;
      main.castShadow = true;
      main.receiveShadow = true;
      car.add(main);

    // Création de la cabine de la voiture avec différentes textures pour chaque face
    const cabin = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 33*zoom, 24*zoom, 12*zoom ), 
        [
          new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carBackTexture } ),
          new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carFrontTexture } ),
          new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carRightSideTexture } ),
          new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true, map: carLeftSideTexture } ),
          new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true } ), // top
          new THREE.MeshPhongMaterial( { color: 0xcccccc, flatShading: true } ) // bottom
        ]
      );
      cabin.position.x = 6*zoom;
      cabin.position.z = 25.5*zoom;
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      car.add( cabin );
    
    // Création des roues avant et arrière de la voiture      
    const frontWheel = new Wheel();
    frontWheel.position.x = -18*zoom;
    car.add( frontWheel );

    const backWheel = new Wheel();
    backWheel.position.x = 18*zoom;
    car.add( backWheel );
    
    // Activation des ombres pour la voiture
    car.castShadow = true;
    car.receiveShadow = false;
    
    // Retour du groupe représentant la voiture
    return car;  
}

// Fonction pour créer un camion
function Truck() {
    
    // Création d'un groupe Three.js pour regrouper les différentes parties du camion
    const truck = new THREE.Group();

    // Sélection aléatoire d'une couleur de véhicule parmi les couleurs disponibles
    const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

    // Création de la base du camion
    const base = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 100*zoom, 25*zoom, 5*zoom ), 
        new THREE.MeshLambertMaterial( { color: 0xb4c6fc, flatShading: true } )
      );
      base.position.z = 10*zoom;
      truck.add(base);

    // Création du chargement du camion
    const cargo = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 75*zoom, 35*zoom, 40*zoom ), 
        new THREE.MeshPhongMaterial( { color: 0xb4c6fc, flatShading: true } )
      );
      cargo.position.x = 15*zoom;
      cargo.position.z = 30*zoom;
      cargo.castShadow = true;
      cargo.receiveShadow = true;
      truck.add(cargo);

    // Création de la cabine du camion avec différentes textures pour chaque face
    const cabin = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 25*zoom, 30*zoom, 30*zoom ), 
        [
          new THREE.MeshPhongMaterial( { color, flatShading: true } ), // back
          new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckFrontTexture } ),
          new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckRightSideTexture } ),
          new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckLeftSideTexture } ),
          new THREE.MeshPhongMaterial( { color, flatShading: true } ), // top
          new THREE.MeshPhongMaterial( { color, flatShading: true } ) // bottom
        ]
      );
      cabin.position.x = -40*zoom;
      cabin.position.z = 20*zoom;
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      truck.add( cabin );

    // Création des roues avant, du milieu et arrière du camion
    const frontWheel = new Wheel();
    frontWheel.position.x = -38*zoom;
    truck.add( frontWheel );

    const middleWheel = new Wheel();
    middleWheel.position.x = -10*zoom;
    truck.add( middleWheel );

    const backWheel = new Wheel();
    backWheel.position.x = 30*zoom;
    truck.add( backWheel );

    // Retour du groupe représentant le camion
    return truck;  
}

// Fonction pour créer un arbre
function Three() {

    // Création d'un groupe Three.js pour regrouper les différentes parties de l'arbre
    const three = new THREE.Group();

    // Création du tronc de l'arbre
    const trunk = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 15*zoom, 15*zoom, 20*zoom ), 
        new THREE.MeshPhongMaterial( { color: 0x4d2926, flatShading: true } )
      );
      trunk.position.z = 10*zoom;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      three.add(trunk);

    // Sélection aléatoire d'une hauteur pour le feuillage de l'arbre parmi les hauteurs disponibles
    height = threeHeights[Math.floor(Math.random()*threeHeights.length)];

    // Création du feuillage de l'arbre avec une couleur verte
    const crown = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 30*zoom, 30*zoom, height*zoom ), 
        new THREE.MeshLambertMaterial( { color: 0x7aa21d, flatShading: true } )
      );
      crown.position.z = (height/2+20)*zoom;
      crown.castShadow = true;
      crown.receiveShadow = false;
      three.add(crown);

    return three; // Retour du groupe représentant l'arbre
}

// Fonction pour créer un poulet
function Chicken() {
    // Création d'un groupe Three.js pour regrouper les différentes parties du poulet
    const chicken = new THREE.Group();
  
    // Création du corps du poulet
    const body = new THREE.Mesh(
      new THREE.BoxBufferGeometry(chickenSize * zoom, chickenSize * zoom, 20 * zoom),
      new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true })
    );
    body.position.z = 10 * zoom;
    body.castShadow = true;
    body.receiveShadow = true;
    chicken.add(body);
  
    // Création de la crête du poulet
    const rowel = new THREE.Mesh(
      new THREE.BoxBufferGeometry(2 * zoom, 4 * zoom, 2 * zoom),
      new THREE.MeshLambertMaterial({ color: 0xF0619A, flatShading: true })
    );
    rowel.position.z = 21 * zoom;
    rowel.castShadow = true;
    rowel.receiveShadow = false;
    chicken.add(rowel);
  
    return chicken; // Retour du groupe représentant le poulet
}

// Fonction pour créer une route
function Road() {
    // Création d'un groupe Three.js pour regrouper les différentes sections de la route
    const road = new THREE.Group();
  
    // Fonction pour créer une section de la route avec une couleur spécifiée
    const createSection = color => new THREE.Mesh(
      new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom),
      new THREE.MeshPhongMaterial({ color })
    );
  
    // Création de la section centrale de la route
    const middle = createSection(0x454A59);
    middle.receiveShadow = true;
    road.add(middle);
  
    // Création de la section gauche de la route
    const left = createSection(0x393D49);
    left.position.x = -boardWidth * zoom;
    road.add(left);
  
    // Création de la section droite de la route
    const right = createSection(0x393D49);
    right.position.x = boardWidth * zoom;
    road.add(right);
  
    return road; // Retour du groupe représentant la route
}

// Fonction pour créer de l'herbe
function Grass() {
    // Création d'un groupe Three.js pour regrouper les différentes sections d'herbe
    const grass = new THREE.Group();
  
    // Fonction pour créer une section d'herbe avec une couleur spécifiée
    const createSection = color => new THREE.Mesh(
      new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom),
      new THREE.MeshPhongMaterial({ color })
    );
  
    // Création de la section centrale d'herbe
    const middle = createSection(0xbaf455);
    middle.receiveShadow = true;
    grass.add(middle);
  
    // Création de la section gauche d'herbe
    const left = createSection(0x99C846);
    left.position.x = -boardWidth * zoom;
    grass.add(left);
  
    // Création de la section droite d'herbe
    const right = createSection(0x99C846);
    right.position.x = boardWidth * zoom;
    grass.add(right);
  
    // Positionnement de l'ensemble de l'herbe légèrement au-dessus de la route
    grass.position.z = 1.5 * zoom;
  
    return grass; // Retour du groupe représentant l'herbe
}

// Fonction constructeur pour créer une voie
function Lane(index) {
    this.index = index;
    this.type = index <= 0 ? 'field' : laneTypes[Math.floor(Math.random()*laneTypes.length)];
  
    switch(this.type) {
      case 'field': {
        this.type = 'field';
        this.mesh = new Grass();
        break;
      }
      case 'forest': {
        this.mesh = new Grass();

    // Création d'un ensemble pour garder une trace des positions occupées par les arbres dans la forêt
    this.occupiedPositions = new Set();

    // Création d'un tableau d'arbres
    this.threes = [1,2,3,4].map(() => {
        const three = new Three();
        let position;
        do {
          position = Math.floor(Math.random()*columns);
        }while(this.occupiedPositions.has(position))
          this.occupiedPositions.add(position);
        three.position.x = (position*positionWidth+positionWidth/2)*zoom-boardWidth*zoom/2;
        this.mesh.add( three );
        return three;
      })
      break;
    }
    case 'car' : {
      this.mesh = new Road();

    // Direction aléatoire pour le mouvement des véhicules dans la voie
    this.direction = Math.random() >= 0.5;

    // Création d'un ensemble pour garder une trace des positions occupées par les véhicules dans la voie
    const occupiedPositions = new Set();
    
    // Création d'un tableau de voitures
    this.vechicles = [1,2,3].map(() => {
        const vechicle = new Car();
        let position;
        do {
          position = Math.floor(Math.random()*columns/2);
        }while(occupiedPositions.has(position))
          occupiedPositions.add(position);
        vechicle.position.x = (position*positionWidth*2+positionWidth/2)*zoom-boardWidth*zoom/2;
        if(!this.direction) vechicle.rotation.z = Math.PI;
        this.mesh.add( vechicle );
        return vechicle;
      })
    
    // Vitesse de la voie (vitesse des véhicules)
    this.speed = laneSpeeds[Math.floor(Math.random()*laneSpeeds.length)];
      break;
    }
    case 'truck' : {
      this.mesh = new Road();

    // Direction aléatoire pour le mouvement des véhicules dans la voie
    this.direction = Math.random() >= 0.5;

    // Création d'un ensemble pour garder une trace des positions occupées par les véhicules dans la voie
    const occupiedPositions = new Set();

    // Création d'un tableau de camions
    this.vechicles = [1,2].map(() => {
        const vechicle = new Truck();
        let position;
        do {
          position = Math.floor(Math.random()*columns/3);
        }while(occupiedPositions.has(position))
          occupiedPositions.add(position);
        vechicle.position.x = (position*positionWidth*3+positionWidth/2)*zoom-boardWidth*zoom/2;
        if(!this.direction) vechicle.rotation.z = Math.PI;
        this.mesh.add( vechicle );
        return vechicle;
      })

        // Vitesse de la voie (vitesse des véhicules)
        this.speed = laneSpeeds[Math.floor(Math.random()*laneSpeeds.length)];
        break;
    }
    }
}

// Ajout d'un gestionnaire d'événement au bouton "retry" pour recommencer le jeu
document.querySelector("#retry").addEventListener("click", () => {
    // Suppression de toutes les voies de la scène
    lanes.forEach(lane => scene.remove(lane.mesh));
    // Réinitialisation des valeurs du jeu
    initaliseValues();
    // Masquage du message de fin de jeu
    endDOM.style.visibility = 'hidden';
  });
  
  // Ajout de gestionnaires d'événements pour les boutons de déplacement
  document.getElementById('forward').addEventListener("click", () => move('forward'));
  document.getElementById('backward').addEventListener("click", () => move('backward'));
  document.getElementById('left').addEventListener("click", () => move('left'));
  document.getElementById('right').addEventListener("click", () => move('right'));
  
  // Ajout d'un gestionnaire d'événement pour les touches de direction du clavier
  window.addEventListener("keydown", event => {
    if (event.keyCode == '38') {
      // Touche haut
      move('forward');
    }
    else if (event.keyCode == '40') {
      // Touche bas
      move('backward');
    }
    else if (event.keyCode == '37') {
      // Touche gauche
      move('left');
    }
    else if (event.keyCode == '39') {
      // Touche droite
      move('right');
    }
  });  

// Fonction pour déplacer le personnage dans le jeu
function move(direction) {
    // Calcul des positions finales en fonction des mouvements effectués
    const finalPositions = moves.reduce((position, move) => {
      if (move === 'forward') return { lane: position.lane + 1, column: position.column };
      if (move === 'backward') return { lane: position.lane - 1, column: position.column };
      if (move === 'left') return { lane: position.lane, column: position.column - 1 };
      if (move === 'right') return { lane: position.lane, column: position.column + 1 };
    }, { lane: currentLane, column: currentColumn });
  
    // Vérification des mouvements et des obstacles
    if (direction === 'forward') {
      // Empêche le déplacement en avant s'il y a une forêt dans la voie suivante et que la position est occupée
      if (lanes[finalPositions.lane + 1].type === 'forest' && lanes[finalPositions.lane + 1].occupiedPositions.has(finalPositions.column)) return;
      // Démarre le mouvement si ce n'est pas déjà fait
      if (!stepStartTimestamp) startMoving = true;
      // Ajoute une nouvelle voie
      addLane();
    } else if (direction === 'backward') {
      // Empêche le déplacement en arrière s'il est à la première voie
      if (finalPositions.lane === 0) return;
      // Empêche le déplacement en arrière s'il y a une forêt dans la voie précédente et que la position est occupée
      if (lanes[finalPositions.lane - 1].type === 'forest' && lanes[finalPositions.lane - 1].occupiedPositions.has(finalPositions.column)) return;
      // Démarre le mouvement si ce n'est pas déjà fait
      if (!stepStartTimestamp) startMoving = true;
    } else if (direction === 'left') {
      // Empêche le déplacement à gauche s'il est déjà à la première colonne
      if (finalPositions.column === 0) return;
      // Empêche le déplacement à gauche s'il y a une forêt dans la voie actuelle et que la position précédente est occupée
      if (lanes[finalPositions.lane].type === 'forest' && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column - 1)) return;
      // Démarre le mouvement si ce n'est pas déjà fait
      if (!stepStartTimestamp) startMoving = true;
    } else if (direction === 'right') {
      // Empêche le déplacement à droite s'il est déjà à la dernière colonne
      if (finalPositions.column === columns - 1) return;
      // Empêche le déplacement à droite s'il y a une forêt dans la voie actuelle et que la position suivante est occupée
      if (lanes[finalPositions.lane].type === 'forest' && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column + 1)) return;
      // Démarre le mouvement si ce n'est pas déjà fait
      if (!stepStartTimestamp) startMoving = true;
    }
    // Ajoute la direction au tableau des mouvements
    moves.push(direction);
}  

// Fonction d'animation pour mettre à jour la scène à chaque trame
function animate(timestamp) {
    requestAnimationFrame(animate);
    
    // Calcul du delta entre les trames pour une animation fluide
    if (!previousTimestamp) previousTimestamp = timestamp;
    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
  
    // Animation des voitures et des camions se déplaçant sur la voie
    lanes.forEach(lane => {
      if (lane.type === 'car' || lane.type === 'truck') {
        const aBitBeforeTheBeginingOfLane = -boardWidth * zoom / 2 - positionWidth * 2 * zoom;
        const aBitAfterTheEndOFLane = boardWidth * zoom / 2 + positionWidth * 2 * zoom;
        lane.vechicles.forEach(vechicle => {
          if (lane.direction) {
            vechicle.position.x = vechicle.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : vechicle.position.x -= lane.speed / 16 * delta;
          } else {
            vechicle.position.x = vechicle.position.x > aBitAfterTheEndOFLane ? aBitBeforeTheBeginingOfLane : vechicle.position.x += lane.speed / 16 * delta;
          }
        });
      }
    });
  
    // Démarrage du mouvement si nécessaire
    if (startMoving) {
      stepStartTimestamp = timestamp;
      startMoving = false;
    }
  
    // Animation du mouvement du personnage
    if (stepStartTimestamp) {
      const moveDeltaTime = timestamp - stepStartTimestamp;
      const moveDeltaDistance = Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
      const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;
      switch (moves[0]) {
        case 'forward': {
          const positionY = currentLane * positionWidth * zoom + moveDeltaDistance;
          camera.position.y = initialCameraPositionY + positionY;
          dirLight.position.y = initialDirLightPositionY + positionY;
          chicken.position.y = positionY; 
  
          chicken.position.z = jumpDeltaDistance;
          break;
        }
        case 'backward': {
          positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
          camera.position.y = initialCameraPositionY + positionY;
          dirLight.position.y = initialDirLightPositionY + positionY;
          chicken.position.y = positionY;
  
          chicken.position.z = jumpDeltaDistance;
          break;
        }
        case 'left': {
          const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - boardWidth * zoom / 2 - moveDeltaDistance;
          camera.position.x = initialCameraPositionX + positionX;     
          dirLight.position.x = initialDirLightPositionX + positionX; 
          chicken.position.x = positionX; 
  
          chicken.position.z = jumpDeltaDistance;
          break;
        }
        case 'right': {
          const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - boardWidth * zoom / 2 + moveDeltaDistance;
          camera.position.x = initialCameraPositionX + positionX;       
          dirLight.position.x = initialDirLightPositionX + positionX;
          chicken.position.x = positionX; 
  
          chicken.position.z = jumpDeltaDistance;
          break;
        }
      }
      // Une fois qu'un pas est terminé
      if (moveDeltaTime > stepTime) {
        switch (moves[0]) {
          case 'forward': {
            currentLane++;
            counterDOM.innerHTML = currentLane;    
            break;
          }
          case 'backward': {
            currentLane--;
            counterDOM.innerHTML = currentLane;    
            break;
          }
          case 'left': {
            currentColumn--;
            break;
          }
          case 'right': {
            currentColumn++;
            break;
          }
        }
        moves.shift();
        // Si d'autres étapes doivent être prises, redémarrer le compteur, sinon arrêter le mouvement
        stepStartTimestamp = moves.length === 0 ? null : timestamp;
      }
    }
  
    // Test de collision
    if (lanes[currentLane].type === 'car' || lanes[currentLane].type === 'truck') {
      const chickenMinX = chicken.position.x - chickenSize * zoom / 2;
      const chickenMaxX = chicken.position.x + chickenSize * zoom / 2;
      const vechicleLength = { car: 60, truck: 105 }[lanes[currentLane].type]; 
      lanes[currentLane].vechicles.forEach(vechicle => {
        const carMinX = vechicle.position.x - vechicleLength * zoom / 2;
        const carMaxX = vechicle.position.x + vechicleLength * zoom / 2;
        if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
          endDOM.style.visibility = 'visible';
        }
      });
    }
    // Rendu de la scène
    renderer.render(scene, camera);  
}  

// Cela permet une animation fluide de la scène
requestAnimationFrame( animate );

// Ajoutez ici le code pour démarrer le jeu

// Définir la valeur de x pour déclencher l'événement
var x1 = 5;
var x2 = 18;
var x3 = 25;
var x4 = 32;
var x5 = 45;
var x6 = 60;
var x7 = 777;
var x1Triggered = false; // Variable pour vérifier si x1 a déjà été déclenché
var x2Triggered = false; // Variable pour vérifier si x2 a déjà été déclenché
var x3Triggered = false; // Variable pour vérifier si x3 a déjà été déclenché
var x4Triggered = false; // Variable pour vérifier si x4 a déjà été déclenché
var x5Triggered = false; // Variable pour vérifier si x5 a déjà été déclenché
var x6Triggered = false; // Variable pour vérifier si x6 a déjà été déclenché
var x7Triggered = false; // Variable pour vérifier si x7 a déjà été déclenché

// Fonction pour vérifier la valeur de x et déclencher les événements correspondants
function checkCounterValue() {
    var counter = document.getElementById('counter');
    var counterValue = parseInt(counter.textContent);

    // Si la valeur de x est atteinte et n'a pas été déclenchée, déclencher l'événement
    if (counterValue === x1 && !x1Triggered) {
        x1Triggered = true;
        pauseGame();
        showOverlay();
        animateTextAndBar("Des choses simples comme manger ou dormir");
    }
    if (counterValue === x2 && !x2Triggered) {
        x2Triggered = true;
        pauseGame();
        showOverlay();
        animateTextAndBar("Organiser des choses avec ma famille et/ou mes amis");
    }
    if (counterValue === x3 && !x3Triggered) {
        x3Triggered = true;
        pauseGame();
        showOverlay();
        animateTextAndBar("Faire du sport: escalade, randonnée, vélo...");
    }
    if (counterValue === x4 && !x4Triggered) {
        x4Triggered = true;
        pauseGame();
        showOverlay();
        animateTextAndBar("Sortir de ma zone de confort");
    }
    if (counterValue === x5 && !x5Triggered) {
        x5Triggered = true;
        pauseGame();
        showOverlay();
        animateTextAndBar("Curieux de tout");
    }
    if (counterValue === x6 && !x6Triggered) {
        x6Triggered = true;
        pauseGame();
        showOverlay();
        animateTextAndBar("J'essaie d'avoir une culture films/séries/musiques très larges");
    }
    if (counterValue === x7 && !x7Triggered) {
        x7Triggered = true;
        pauseGame();
        showOverlay();
        animateTextAndBar("Le palier signifie tout ... 🫣");
    }
}

// Fonction pour mettre le jeu en pause
function pauseGame() {
    // Ajoutez ici le code pour mettre le jeu en pause
}

// Fonction pour afficher l'overlay
function showOverlay() {
    var overlay = document.querySelector('.overlay');
    overlay.style.display = 'block';
}

// Fonction pour animer le texte et la barre
function animateTextAndBar(textContent) {
    var overlayContent = document.querySelector('.overlay-content');
    var whiteBar = document.createElement('div');
    whiteBar.classList.add('white-bar');
    overlayContent.appendChild(whiteBar);

    var text = document.createElement('div');
    text.textContent = textContent;
    text.classList.add('slide-text');
    overlayContent.appendChild(text);

    // Animer le texte de gauche à droite
    var animationDuration = 3500; // Durée de l'animation en millisecondes (plus rapide)
    text.animate([
        { transform: 'translateX(-100%)' },
        { transform: 'translateX(100%)' }
    ], {
        duration: animationDuration,
        iterations: 1,
        fill: 'forwards'
    });

    // Disparition de l'overlay après la fin de l'animation
    setTimeout(function () {
        var overlay = document.querySelector('.overlay');
        overlay.style.display = 'none';
        // Supprimer les éléments créés
        overlayContent.removeChild(whiteBar);
        overlayContent.removeChild(text);
    }, animationDuration);
}

// Vérifier la valeur de x périodiquement
setInterval(checkCounterValue, 100); // Vérifier toutes les 100 millisecondes (10 fois plus rapide)