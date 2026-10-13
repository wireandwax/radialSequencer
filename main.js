import {
  scale,
  playBeat,
  playDetectionSound,
  lastBeat

} from "./audio.js";

/* =========================
   STYLING - COLOURS
========================= */

const mainBGcolour = "#06070a";
const centreDotColour ="#34d399";
const angleText ="rgba(148, 163, 184, 0.7)";
const concentricCircles = "rgba(52, 211, 153, 0.10)";
const pitchLabelColour = "rgba(52, 211, 153, 0.15)";
const dotLineColour = "rgba(52, 211, 153, 0.18)";
const sweepLineColour = "rgba(52, 211, 153, 0.75)";

const zoneColours = [

  "#28004d", // C4
  "#4b0082", // D4
  "#9400d3", // E4
  "#ff00cc", // F4
  "#c000ff", // G4
  "#004cff", // A4
  "#00cfff", // B4
  "#d0f5ff"  // C5

];


const zoneColoursBelow = [

  "#240000", // C4
  "#660000", // D4
  "#cc0000", // E4
  "#ff1a00", // F4
  "#ff6600", // G4
  "#ff9900", // A4
  "#ffcc00", // B4
  "#ffffcc"  // C5

];

  const pitchLabels = [

    "C",
    "D",
    "E",
    "F",
    "G",
    "A",
    "B",
    "C"
    
  ];
    
/* =========================
   CANVAS ELEMENTS
========================= */

const canvas = document.getElementById("radarCanvas");
const ctx = canvas.getContext("2d");
const speedControl = document.getElementById("speedControl");
const metronome = document.getElementById("metronome");
const speedValue = document.getElementById("speedValue");
const targetDisplay = document.getElementById("targetDisplay");
const fpsDisplay = document.getElementById("fpsDisplay");


/* =========================
   BASIC STATE
========================= */

let width = 0;
let height = 0;

let centreX = 0;
let centreY = 0;

let radius = 0;
let sweepAngle = 0;
let targets = [];

//Central Rotating Line starts static
let sweepEnabled = false;

let frameCount = 0;
let fpsTime = performance.now();

let newLastBeat = lastBeat;

/* =========================
   KEYBOARD CONTROLS
========================= */

let zHeld = false;
let xHeld = false;
let cHeld = false;
let vHeld = false;

const dotsMultiplierA = 4;
const dotsMultiplierB = 8;
const dotsMultiplierC = 16;
const dotsMultiplierD = 32;

/* =========================
   MOUSE INTERACTION
========================= */

let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let draggingDot = false;
let selectedTarget = null;

/* =========================
   CAM SETUP etc
========================= */

let autoRotate = true;
let cameraVelocityX = 0;
let cameraVelocityY = 0;

let cameraYaw = 0.65;
let cameraPitch = -0.65;
let cameraDistance = 700;
//let cameraHeight = 500;

const focalLength = 650;




/* =========================
   GET ZONE
========================= */

function getZone(distance) {

  const distanceRatio =
    Math.min( distance / radius,0.9999 );

  return Math.floor( distanceRatio * scale.length);
}



/* =========================
   RESIZE
========================= */

function resize() {

  const dpr = window.devicePixelRatio || 1;

  width = canvas.clientWidth;

  height = canvas.clientHeight;

  canvas.width = width * dpr;

  canvas.height = height * dpr;

  ctx.setTransform(dpr,0,0,dpr,0,0);

  centreX = width / 2;

  centreY = height / 2;

  radius = Math.min(width,height) * 0.38;
}


window.addEventListener("resize",resize);


/* =========================
   CONTROLS
========================= */

speedControl.addEventListener("input",() => {

    speedValue.textContent =
      speedControl.value;
  }
);



/* =========================
   CAMERA BASIS
========================= */

function getCamera() {

  const horizontalDistance = cameraDistance * Math.cos(cameraPitch);

  const cameraX = Math.sin(cameraYaw) * horizontalDistance;

  const cameraY = Math.sin(cameraPitch) * cameraDistance;

  const cameraZ = Math.cos(cameraYaw) * horizontalDistance;

  // Camera looks toward the origin

  let forwardX =  -cameraX;

  let forwardY = -cameraY;

  let forwardZ =  -cameraZ;

  const forwardLength =
    Math.sqrt(
      forwardX * forwardX +
      forwardY * forwardY +
      forwardZ * forwardZ
    );

  forwardX /=  forwardLength;

  forwardY /=  forwardLength;

  forwardZ /=   forwardLength;


  // Camera right vector

  let rightX = forwardZ;

  let rightY = 0;

  let rightZ = -forwardX;

  const rightLength =
    Math.sqrt(
      rightX * rightX +
      rightZ * rightZ
    );

  rightX /= rightLength;

  rightZ /= rightLength;


  // Camera up vector

  const upX =rightY * forwardZ -rightZ * forwardY;

  const upY =rightZ * forwardX -rightX * forwardZ;

  const upZ =rightX * forwardY -rightY * forwardX;


  return {

    cameraX,
    cameraY,
    cameraZ,

    forwardX,
    forwardY,
    forwardZ,

    rightX,
    rightY,
    rightZ,

    upX,
    upY,
    upZ
  };
}


/* =========================
   3D PROJECTION
========================= */

function projectPoint(x,y,z) {

  const camera = getCamera();

  const dx = x - camera.cameraX;

  const dy = y - camera.cameraY;

  const dz = z - camera.cameraZ;


  
  //  Convert world coordinates into camera coordinates


  const cameraX =
    dx * camera.rightX +
    dy * camera.rightY +
    dz * camera.rightZ;

  const cameraY =
    dx * camera.upX +
    dy * camera.upY +
    dz * camera.upZ;

  const depth =
    dx * camera.forwardX +
    dy * camera.forwardY +
    dz * camera.forwardZ;



 //   Perspective projection


  if (depth <= 1) {

    return {
      x: -99999,
      y: -99999,
      scale: 0,
      depth: depth
    };
  }

  //const focalLength =650;

  const scale = focalLength / depth;


  return {

    x: centreX + cameraX * scale,

    y: centreY - cameraY * scale,

    scale: scale,

    depth: depth
  };
}


// Y AXIS MOVER


function moveTargetY(target, screenY) {
  const camera = getCamera();
//  const focalLength = 650;

  const k = (centreY - screenY) / focalLength;

  const dx = target.x - camera.cameraX;
  const dz = target.z - camera.cameraZ;

  const upAtZero =
    dx * camera.upX -
    camera.cameraY * camera.upY +
    dz * camera.upZ;

  const depthAtZero =
    dx * camera.forwardX -
    camera.cameraY * camera.forwardY +
    dz * camera.forwardZ;

  const denominator = camera.upY - k * camera.forwardY;

  if (Math.abs(denominator) < 0.0001) {
    return;
  }

  target.y =(k * depthAtZero - upAtZero) / denominator;

  const maxHeight = radius / 2;

  target.volume = Math.round(
    Math.min(Math.abs(target.y) / maxHeight, 1) * 127
  );
}

/* =========================
   MOUSE → 3D RAY
========================= */

function screenToGround(mouseX,mouseY) {

  const camera = getCamera();

  const cameraRayX =(mouseX - centreX) /focalLength;

  const cameraRayY = -(mouseY - centreY) /focalLength;

  const cameraRayZ = 1;

  let rayX =
    camera.rightX *
    cameraRayX +
    camera.upX *
    cameraRayY +
    camera.forwardX *
    cameraRayZ;


  let rayY =
    camera.rightY *
    cameraRayX +
    camera.upY *
    cameraRayY +
    camera.forwardY *
    cameraRayZ;


  let rayZ =
    camera.rightZ *
    cameraRayX +
    camera.upZ *
    cameraRayY +
    camera.forwardZ *
    cameraRayZ;


  const rayLength =
    Math.sqrt(
      rayX * rayX +
      rayY * rayY +
      rayZ * rayZ
    );


  rayX /= rayLength;

  rayY /= rayLength;

  rayZ /= rayLength;


  /*
    Ground plane is Y = 0.
  */

  if (Math.abs(rayY) < 0.0001) {

    return null;
  }


  const t =-camera.cameraY / rayY;


  if (t <= 0) {

    return null;
  }


  return {

    x:
      camera.cameraX +
      rayX * t,

    y: 0,

    z:
      camera.cameraZ +
      rayZ * t
  };
}


/* =========================
   ADD POINT ! CLICK HANDLER
========================= 
*/


canvas.addEventListener(
  "click",
  (event) => {

  //Only clicks on canvas please  
  if (event.target !== canvas) return;
  if (event.shiftKey) return;

  if (event.metaKey && event.altKey) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const groundPoint = screenToGround(mouseX, mouseY);

    if (groundPoint) {
      const distance = Math.sqrt(
        groundPoint.x * groundPoint.x +
        groundPoint.z * groundPoint.z
      );

      if (distance <= radius) {
        const zone = getZone(distance);

        for (let i = targets.length - 1; i >= 0; i--) {
          if (getZone(targets[i].distance) === zone) {
            targets.splice(i, 1);
          }
        }

        targetDisplay.textContent = targets.length;
      }
    }

    return;
  }


    if (event.metaKey) {

      const rect =
        canvas.getBoundingClientRect();

      const mouseX =
        event.clientX -
        rect.left;

      const mouseY =
        event.clientY -
        rect.top;

      let closestTarget = -1;
      let closestDistance = 20;

      targets.forEach(
        (target, index) => {

          const point =
            projectPoint(
              target.x,
              target.y,
              target.z
            );

          const dx =
            mouseX - point.x;

          const dy =
            mouseY - point.y;

          const distance =
            Math.sqrt(
              dx * dx +
              dy * dy
            );

          if (
            distance < closestDistance
          ) {

            closestDistance =
              distance;

            closestTarget =
              index;
          }
        }
      );

      if (
        closestTarget !== -1
      ) {

        targets.splice(
          closestTarget,
          1
        );

        targetDisplay.textContent =
          targets.length;
      }

      return;
    }


    const rect = canvas.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;

    const mouseY =event.clientY - rect.top;



    // Letter + left click creates dots around the zone.
  

  if (zHeld || xHeld || cHeld || vHeld) {
    createZoneDots(mouseX, mouseY);
    return;
  }


    /*
      Normal single target.
    */

    const groundPoint =
      screenToGround(mouseX,mouseY);


    if (!groundPoint) {
      return;
    }


    /*
      Distance from radar centre.
    */

    const distance =
      Math.sqrt(
        groundPoint.x *
        groundPoint.x +

        groundPoint.z *
        groundPoint.z
      );


    /*
      Don't place targets
      outside the radar.
    */

    if (distance > radius) {
      return;
    }


    /*
      Radar angle.
    */

    let angle =
      Math.atan2(
        groundPoint.z,
        groundPoint.x
      );


    if (angle < 0) {

        angle +=
        Math.PI * 2;
    }


  
    //  Camera orientation
  

    const camera =
      getCamera();

    const targetY =
      camera.cameraY < 0
        ? -Math.random() * 160
        : Math.random() * 160;
    

    
    // Note Volume 
    const maxHeight = radius / 2;
    const noteVolume = Math.round(
     Math.min(Math.abs(targetY) / maxHeight, 1) * 127);


    /*
      Create target objects
    */

    targets.push({

      x: groundPoint.x,
      y: targetY,
      z: groundPoint.z,
      angle: angle,
      distance: distance,
      zone: -1,
      size: 2.5,
      intensity: 1,
      detected: false,
      glow: 0,
      layer: "top",     
      volume: noteVolume

    });


    targetDisplay.textContent =
      targets.length;
  }
);


/* =========================
   RIGHT MOUSE CAMERA
========================= */



canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0 && event.shiftKey) {
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let closestTarget = null;
    let closestDistance = 20;

    targets.forEach((target) => {
      const point = projectPoint(target.x, target.y, target.z);

      if (point.scale <= 0) return;

      const dx = mouseX - point.x;
      const dy = mouseY - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    });

    selectedTarget = closestTarget;
    draggingDot = closestTarget !== null;
    return;
  }

  if (event.button !== 2) return;

  event.preventDefault();
  dragging = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
});


window.addEventListener("mousemove", (event) => {
  if (draggingDot && selectedTarget) {
    const rect = canvas.getBoundingClientRect();

    moveTargetY(
      selectedTarget,
      event.clientY - rect.top
    );

    return;
  }

  if (!dragging) {
    return;
  }

    const dx = event.clientX - lastMouseX;

    const dy = event.clientY - lastMouseY;

    cameraVelocityX += dx * 0.0005;

    cameraVelocityY += dy * 0.0005;


    cameraPitch =
      Math.max(
        -1.56,
        Math.min(
          1.56,
          cameraPitch
        )
      );


    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
);


window.addEventListener(
  "mouseup",
  (event) => {

    if (event.button === 0) {
      draggingDot = false;
      selectedTarget = null;
    }

    if (event.button === 2) {
      dragging = false;
    }
  }
);


/*
  Disable browser
  right-click menu.
*/

canvas.addEventListener(
  "contextmenu",
  (event) => {

    event.preventDefault();
  }
);


/* =========================
   ZOOM
========================= */

canvas.addEventListener(
  "wheel",
  (event) => {

    event.preventDefault();

    cameraDistance +=
      event.deltaY * 0.5;

    cameraDistance =
      Math.max(
        300,
        Math.min(
          1200,
          cameraDistance
        )
      );
  }
);


/* =========================
   SPACE BAR
========================= */

window.addEventListener(
  "keydown",
  (event) => {

    if (
      event.code === "Space"
    ) {

      event.preventDefault();

      sweepEnabled =
        !sweepEnabled;
    }
  }
);


/* =========================
   Z + LEFT CLICK
========================= */

window.addEventListener(
  "keydown",
  (event) => {

    if (
      event.code === "KeyZ"
    ) {

      zHeld = true;
    }
  }
);


window.addEventListener(
  "keyup",
  (event) => {

    if (
      event.code === "KeyZ"
    ) {

      zHeld = false;
    }
  }
);


/* =========================
   X + LEFT CLICK
========================= */

window.addEventListener(
  "keydown",
  (event) => {

    if (
      event.code === "KeyX"
    ) {

      xHeld = true;
    }
  }
);


window.addEventListener(
  "keyup",
  (event) => {

    if (
      event.code === "KeyX"
    ) {

      xHeld = false;
    }
  }
);


/* =========================
   C + LEFT CLICK
========================= */

window.addEventListener(
  "keydown",
  (event) => {

    if (
      event.code === "KeyC"
    ) {

      cHeld = true;
    }
  }
);


window.addEventListener(
  "keyup",
  (event) => {

    if (
      event.code === "KeyC"
    ) {

      cHeld = false;
    }
  }
);


/* =========================
   V + LEFT CLICK
========================= */

window.addEventListener(
  "keydown",
  (event) => {

    if (
      event.code === "KeyV"
    ) {

      vHeld = true;
    }
  }
);


window.addEventListener(
  "keyup",
  (event) => {

    if (
      event.code === "KeyV"
    ) {

      vHeld = false;
    }
  }
);


/* =========================
   METRONOME EVENTS
========================= */

metronome.addEventListener(
  "change",
  () => {

    if (metronome.checked) {
      console.log("Metronome ON");
    } else {
      console.log("Metronome OFF");
    }
  }
);


/* =========================
   RESET
========================= */

window.addEventListener(
  "keydown",
  (event) => {

    if (
      event.code === "Enter"
    ) {

      resetAll();
    }
  }
);


/* =========================
   DRAW GRID
========================= */

function drawGrid() {

  ctx.strokeStyle = concentricCircles;

  ctx.lineWidth = 1;

  const zoneCount = scale.length;

  for (let i = 1; i < zoneCount + 1; i++) {

    const r =
      i / zoneCount;

    ctx.beginPath();

    let started =
      false;


  for (let a = 0; a <= Math.PI * 2 + 0.05;a += 0.05) {

      const x =
        Math.cos(a) *
        radius *
        r;

      const z =
        Math.sin(a) *
        radius *
        r;

      const point =
        projectPoint(
          x,
          0,
          z
        );


      if (
        point.scale <= 0
      ) {

        continue;
      }


      if (!started) {

        ctx.moveTo(
          point.x,
          point.y
        );

        started =
          true;

      } else {

        ctx.lineTo( point.x, point.y );
      }
    }


    ctx.stroke();
  }


  /*
    Radial lines.
  */

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {


    /*
      Pitch labels.
    */


    const labelAngle = 0;

    ctx.fillStyle = pitchLabelColour;

    ctx.font ="5px Arial";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";


    for (let i = 0; i < pitchLabels.length; i++ ) {

      const r =(i + 0.5) / pitchLabels.length;

      const x = Math.cos(labelAngle) * radius *r;

      const z = Math.sin(labelAngle) *radius *r;

      const point = projectPoint( x, 0, z);


      if ( point.scale <= 0 ) {

        continue;
      }

      ctx.fillText( pitchLabels[i],point.x, point.y );
    }
  }
}


/* =========================
   DRAW RADAR
========================= */

function drawRadar() {

  ctx.fillStyle = mainBGcolour;
  
  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  drawGrid();


  /*
    Sort targets by depth.
  */

  const sortedTargets =
    [...targets].sort(
      (a, b) => {

        const pa =
          projectPoint(
            a.x,
            a.y,
            a.z
          );

        const pb =
          projectPoint(
            b.x,
            b.y,
            b.z
          );

        return (
          pb.depth -
          pa.depth
        );
      }
    );




  const beat =
    Math.floor(
      sweepAngle /
      (Math.PI * 2 / 4)
    );

  if (!sweepEnabled) {
    newLastBeat = beat;
  } else if (
    metronome.checked &&
    beat !== newLastBeat
  ) {
    playBeat();
    newLastBeat = beat;
  } else if (!metronome.checked) {
    newLastBeat = beat;
  }


  sortedTargets.forEach(
    (target) => {

      let difference =
        sweepAngle -
        target.angle;


      if (
        difference < 0
      ) {

        difference +=
          Math.PI * 2;
      }


      /*
        Detect target.
      */

      if (
        difference < 0.2
      ) {

        if (
          !target.detected
        ) {

          target.glow = 1;
          playDetectionSound(target, getZone(target.distance));

        }

        target.detected = true;

      } else {

        target.detected = false;
      }


      const point =
        projectPoint(
          target.x,
          target.y,
          target.z
        );


      if (point.scale <= 0 ) {
        return;
      }


      const dotSize =
        (
          target.detected
            ? target.size * 2
            : target.size
        ) *
        point.scale;


      const zonePos =getZone(target.distance);


      /*
        GLOW
      */

      if ( target.glow > 0 ) {

        ctx.beginPath();

        ctx.arc(
          point.x,
          point.y,
          12 * point.scale,
          0,
          Math.PI * 2
        );

        ctx.globalAlpha = target.glow * 0.4;

        ctx.fillStyle = zoneColours[zonePos];

        ctx.fill();

        ctx.globalAlpha = 1;

        target.glow *= 0.2;
      }


/*
  CIRCLE COLOURS
*/

ctx.fillStyle =
  target.detected
    ? "rgb(255, 255, 255)"
    : target.y < 0
      ? zoneColoursBelow[zonePos]
      : zoneColours[zonePos];


      ctx.beginPath();


      ctx.arc(
        point.x,
        point.y,
        Math.max(
          1,
          dotSize
        ),
        0,
        Math.PI * 2
      );


      ctx.fill();


      /*
        Height indicator.
      */

      if ( Math.abs(target.y) > 5) {

        const groundPoint =
          projectPoint(
            target.x,
            0,
            target.z
          );


        if (groundPoint.scale > 0 ) {

          ctx.strokeStyle = dotLineColour;

          ctx.lineWidth =0.5;

          ctx.beginPath();

          ctx.moveTo(groundPoint.x,groundPoint.y);

          ctx.lineTo( point.x,point.y);

          ctx.stroke();
        }
      }
    }
  );


  /*
    Sweeping - Rotating Central Line ---------------------
  */

  const sweepX =  Math.cos(sweepAngle) * radius * 1.05;

  const sweepZ =  Math.sin(sweepAngle) * radius * 1.05;


  const centrePoint = projectPoint(0,0,0);


  const sweepPoint = projectPoint(sweepX,0, sweepZ);

  if (centrePoint.scale > 0 && sweepPoint.scale > 0) {

    ctx.strokeStyle = sweepLineColour;

    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.moveTo(centrePoint.x,centrePoint.y);

    ctx.lineTo(sweepPoint.x,sweepPoint.y);

    ctx.stroke();
  }


  /*
    Centre point.
  */

  if (
    centrePoint.scale > 0
  ) {

    ctx.fillStyle = centreDotColour;

    ctx.beginPath();

    ctx.arc(
      centrePoint.x,
      centrePoint.y,
      2,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  /*
    Advance sweep
  */

  const speed =  parseFloat(speedControl.value);

  /*
    Rotate world
  */

  if (autoRotate) {

    cameraYaw +=
      0.0008;
  }

cameraYaw += cameraVelocityX;

cameraPitch = Math.max(
  -1.56,
  Math.min(
    1.56,
    cameraPitch + cameraVelocityY
  )
);

cameraVelocityX *= 0.96;
cameraVelocityY *= 0.96;


  if (sweepEnabled) {

    sweepAngle =
      (
        sweepAngle +
        speed
      ) %
      (Math.PI * 2);
  }


 
  // Angle readout.


  ctx.fillStyle = angleText;

  ctx.font =  "11px Arial";

  const degrees = ( sweepAngle * 180 / Math.PI ).toFixed(0);

  ctx.fillText("ANGLE " + degrees + "°", 16, height - 18 );

}


/* =========================
   RESET
========================= */

function resetAll() {

  targets.length = 0;

  targetDisplay.textContent = targets.length;
}


/* =========================
   CREATE ZONE DOTS
========================= */
  
// Use the click position to determine which radial zone 
  
function createZoneDots(mouseX,mouseY) {

  const groundPoint =
    screenToGround(mouseX,mouseY);


  if (!groundPoint) {
    return;
  }


  const distance =
    Math.sqrt(
      groundPoint.x *
      groundPoint.x +
      groundPoint.z *
      groundPoint.z
    );


  /*
    Don't create dots if the click
    is outside the radar.
  */

  if ( distance > radius) {
    return;
  }



  //  Find the musical zone.
  const zone =  getZone(distance);

  //  Find inner and outer radius.
  const innerRadius =zone /scale.length * radius;
  const outerRadius =(zone + 1) / scale.length * radius;

  //  Put dots halfway through the zone.
  const zoneRadius = ( innerRadius + outerRadius) / 2;


  //  Put them above or below the grid depending on  camera orientation.


  const camera = getCamera();

  const targetY =
    camera.cameraY < 0
      ? -80
      : 80;

  const maxHeight = radius / 2;
  const noteVolume = Math.round(
    Math.min(Math.abs(targetY) / maxHeight, 1) * 127
  );

  //  Create equally spaced dots.
 

  let dotCount = 0;

  if (zHeld) {
  dotCount = dotsMultiplierA;
  }

  if (xHeld) {
    dotCount = dotsMultiplierB;
  }

  if (cHeld) {
    dotCount = dotsMultiplierC;
  }

  if (vHeld) {
    dotCount = dotsMultiplierD;
  }


  for (let i = 0; i < dotCount;i++) {

    const angle = ( i / dotCount ) *Math.PI * 2;

    const x = Math.cos(angle) * zoneRadius;
    const z = Math.sin(angle) * zoneRadius;


    targets.push({

      x: x,

      y: targetY,

      z: z,

      angle: angle,

      distance: zoneRadius,

      group: zHeld ? "z" : xHeld ? "x" : cHeld ? "c" : vHeld ? "v" : null,

      zone: zone,

      size: 2.5,

      intensity: 1,

      detected: false,

      glow: 0,
      
      volume: noteVolume

    });
  }


  targetDisplay.textContent = targets.length;
}


/* =========================
   ANIMATION
========================= */

function animate(timestamp) {

  drawRadar();

  frameCount++;


  if (frameCount % 10 === 0 ) {

    const elapsed = timestamp - fpsTime;

    const fps = Math.round(10000 /elapsed);

    fpsDisplay.textContent =fps;

    fpsTime = timestamp;
  }


  requestAnimationFrame(animate);
}


/* =========================
   START
========================= */

resize();

requestAnimationFrame(
  animate
);