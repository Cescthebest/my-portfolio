const canvas = document.querySelector(".network-background");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("The network background canvas is missing.");
}

const context = canvas.getContext("2d", { alpha: true });

if (!context) {
  throw new Error("The network background could not create a 2D canvas context.");
}

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileViewport = window.matchMedia("(max-width: 640px)");
const linkDistance = 150;
const mouseDistance = 180;
const particles = [];
let width = 0;
let height = 0;
let pixelRatio = 1;
let pointer = null;
let animationFrame = 0;
let lastFrameTime = 0;

function createParticles() {
  particles.length = 0;
  const isMobile = mobileViewport.matches;
  const scale = (width * height) / (1440 * 900);
  const count = Math.round(
    Math.min(isMobile ? 40 : 100, Math.max(isMobile ? 20 : 28, scale * 90)),
  );

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.16 + Math.random() * 0.18;

    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.1 + Math.random() * 0.8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createParticles();
  drawFrame(0, false);
}

function drawConnections() {
  context.lineWidth = 0.8;

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];

    for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
      const other = particles[otherIndex];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.hypot(dx, dy);

      if (distance < linkDistance) {
        const opacity = 0.4 * (1 - distance / linkDistance);
        context.strokeStyle = `rgba(125, 211, 252, ${opacity})`;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
    }

    if (pointer) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);

      if (distance < mouseDistance) {
        const opacity = 0.6 * (1 - distance / mouseDistance);
        context.strokeStyle = `rgba(98, 229, 209, ${opacity})`;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(pointer.x, pointer.y);
        context.stroke();
      }
    }
  }
}

function drawParticles() {
  context.shadowColor = "rgba(98, 229, 209, 0.55)";
  context.shadowBlur = 7;
  context.fillStyle = "#8ae9df";

  for (const particle of particles) {
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  }

  context.shadowBlur = 0;
}

function drawFrame(timestamp, shouldMove) {
  context.clearRect(0, 0, width, height);

  if (shouldMove) {
    const elapsed = lastFrameTime ? Math.min((timestamp - lastFrameTime) / 16.67, 2) : 1;
    lastFrameTime = timestamp;

    for (const particle of particles) {
      particle.x += particle.vx * elapsed;
      particle.y += particle.vy * elapsed;

      if (particle.x < -5) particle.x = width + 5;
      else if (particle.x > width + 5) particle.x = -5;
      if (particle.y < -5) particle.y = height + 5;
      else if (particle.y > height + 5) particle.y = -5;
    }
  }

  drawConnections();
  drawParticles();
}

function animate(timestamp) {
  animationFrame = 0;

  if (document.hidden) return;
  if (timestamp - lastFrameTime < 1000 / 45) {
    animationFrame = window.requestAnimationFrame(animate);
    return;
  }

  drawFrame(timestamp, true);
  animationFrame = window.requestAnimationFrame(animate);
}

function startAnimation() {
  if (animationFrame || document.hidden) return;

  if (motionPreference.matches) {
    lastFrameTime = 0;
    drawFrame(0, false);
    return;
  }

  lastFrameTime = 0;
  animationFrame = window.requestAnimationFrame(animate);
}

function stopAnimation() {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

window.addEventListener("resize", resizeCanvas, { passive: true });
window.addEventListener(
  "pointermove",
  (event) => {
    if (motionPreference.matches || event.pointerType === "touch") return;
    pointer = { x: event.clientX, y: event.clientY };
  },
  { passive: true },
);
window.addEventListener("pointerleave", () => {
  pointer = null;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
});
motionPreference.addEventListener("change", () => {
  pointer = null;
  stopAnimation();
  startAnimation();
});
mobileViewport.addEventListener("change", resizeCanvas);

resizeCanvas();
startAnimation();
