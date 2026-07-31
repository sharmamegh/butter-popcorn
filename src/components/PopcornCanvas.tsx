"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type KernelState = "raw" | "popping" | "popped";

type Kernel = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  size: number;
  state: KernelState;
  life: number;
  hue: number;
  shape: number;
};

type Burst = {
  x: number;
  y: number;
  life: number;
};

type PopcornCanvasProps = {
  onPop?: (count: number) => void;
  active?: boolean;
};

function random(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createRawKernel(w: number, h: number, id: number): Kernel {
  return {
    id,
    x: random(w * 0.12, w * 0.88),
    y: random(h * 0.55, h * 0.92),
    vx: 0,
    vy: 0,
    rot: random(0, Math.PI * 2),
    spin: 0,
    size: random(5, 9),
    state: "raw",
    life: 1,
    hue: random(-8, 8),
    shape: Math.random(),
  };
}

function spawnPopped(
  x: number,
  y: number,
  id: number,
  boost = 1,
): Kernel {
  const angle = random(-Math.PI * 0.95, -Math.PI * 0.05);
  const speed = random(4.5, 11) * boost;
  return {
    id,
    x,
    y,
    vx: Math.cos(angle) * speed + random(-1.5, 1.5),
    vy: Math.sin(angle) * speed,
    rot: random(0, Math.PI * 2),
    spin: random(-0.25, 0.25),
    size: random(10, 18),
    state: "popped",
    life: 1,
    hue: random(-12, 18),
    shape: Math.random(),
  };
}

function drawRaw(
  ctx: CanvasRenderingContext2D,
  k: Kernel,
) {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.rot);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, k.size);
  g.addColorStop(0, `hsl(32 ${55 + k.hue}% ${32 + k.hue * 0.2}%)`);
  g.addColorStop(1, `hsl(24 ${48 + k.hue}% ${16}%)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, k.size * 0.55, k.size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPopped(
  ctx: CanvasRenderingContext2D,
  k: Kernel,
) {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.rot);
  ctx.globalAlpha = Math.max(0, k.life);

  const lobes = 3 + Math.floor(k.shape * 2);
  const cream = `hsl(${42 + k.hue} 88% ${78 + k.hue * 0.15}%)`;
  const butter = `hsl(${38 + k.hue} 92% ${62}%)`;
  const edge = `hsl(${28 + k.hue} 70% ${48}%)`;

  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + k.shape;
    const lx = Math.cos(a) * k.size * 0.35;
    const ly = Math.sin(a) * k.size * 0.32;
    const r = k.size * (0.45 + (i % 2) * 0.12);
    const g = ctx.createRadialGradient(lx - r * 0.2, ly - r * 0.25, 0, lx, ly, r);
    g.addColorStop(0, cream);
    g.addColorStop(0.65, butter);
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(lx, ly, r * 0.9, r, a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.arc(0, 0, k.size * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function PopcornCanvas({ onPop, active = true }: PopcornCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kernelsRef = useRef<Kernel[]>([]);
  const burstsRef = useRef<Burst[]>([]);
  const idRef = useRef(0);
  const poppedTotal = useRef(0);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const onPopRef = useRef(onPop);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPopRef.current = onPop;
  }, [onPop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (kernelsRef.current.length === 0) {
        const count = Math.min(48, Math.floor((w * h) / 18000));
        kernelsRef.current = Array.from({ length: count }, () =>
          createRawKernel(w, h, idRef.current++),
        );
        setReady(true);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(32, now - last) / 16.67;
      last = now;
      const { w, h } = sizeRef.current;

      ctx.clearRect(0, 0, w, h);

      // soft heat haze near the bottom
      const heat = ctx.createRadialGradient(
        w * 0.5,
        h * 1.05,
        0,
        w * 0.5,
        h * 0.7,
        h * 0.75,
      );
      heat.addColorStop(0, "rgba(180, 83, 9, 0.22)");
      heat.addColorStop(0.45, "rgba(240, 196, 58, 0.06)");
      heat.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = heat;
      ctx.fillRect(0, 0, w, h);

      burstsRef.current = burstsRef.current.filter((b) => b.life > 0);
      for (const b of burstsRef.current) {
        b.life -= 0.04 * dt;
        const r = (1 - b.life) * 70;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 214, 102, ${b.life * 0.45})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const next: Kernel[] = [];
      for (const k of kernelsRef.current) {
        if (k.state === "raw") {
          k.y += Math.sin(now / 700 + k.id) * 0.12 * dt;
          k.rot += 0.004 * dt;
          drawRaw(ctx, k);
          next.push(k);
          continue;
        }

        k.vy += 0.28 * dt;
        k.vx *= 0.995;
        k.x += k.vx * dt;
        k.y += k.vy * dt;
        k.rot += k.spin * dt;
        k.spin *= 0.995;

        if (k.y > h + 40 || k.x < -40 || k.x > w + 40) {
          // recycle a raw kernel near the heat bed
          next.push(createRawKernel(w, h, idRef.current++));
          continue;
        }

        if (k.y > h * 0.93 && Math.abs(k.vy) > 1) {
          k.vy *= -0.35;
          k.y = h * 0.93;
          k.spin *= 0.6;
        }

        k.life -= k.y > h * 0.85 ? 0.004 * dt : 0.0008 * dt;
        drawPopped(ctx, k);
        if (k.life > 0.05) next.push(k);
        else next.push(createRawKernel(w, h, idRef.current++));
      }
      kernelsRef.current = next;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  const popAt = (clientX: number, clientY: number) => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { w, h } = sizeRef.current;

    burstsRef.current.push({ x, y, life: 1 });

    // pop nearby raw kernels
    let popped = 0;
    kernelsRef.current = kernelsRef.current.flatMap((k) => {
      if (k.state !== "raw") return [k];
      const dx = k.x - x;
      const dy = k.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < 110) {
        popped += 1;
        return [spawnPopped(k.x, k.y, idRef.current++, 1.1)];
      }
      return [k];
    });

    // always burst a handful at the click point
    const burstCount = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < burstCount; i++) {
      kernelsRef.current.push(
        spawnPopped(
          x + random(-18, 18),
          y + random(-10, 10),
          idRef.current++,
          random(0.85, 1.25),
        ),
      );
    }
    popped += burstCount;
    poppedTotal.current += popped;
    onPopRef.current?.(poppedTotal.current);

    // keep a steady bed of raw kernels
    const rawCount = kernelsRef.current.filter((k) => k.state === "raw").length;
    const target = Math.min(42, Math.floor((w * h) / 20000));
    for (let i = rawCount; i < target; i++) {
      kernelsRef.current.push(createRawKernel(w, h, idRef.current++));
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    popAt(e.clientX, e.clientY);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full touch-none cursor-crosshair transition-opacity duration-700 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
      onPointerDown={onPointerDown}
      aria-label="Interactive popcorn popping canvas. Click or tap to pop kernels."
      role="img"
    />
  );
}
