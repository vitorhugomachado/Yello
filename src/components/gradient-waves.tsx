"use client";
import { useEffect, useRef } from "react";

/* Fundo vivo em WebGL: um plano raymarchado com ondas de gradiente, adaptado
   do Login13 (frontend-joe/react-components) para a paleta da Yello. A `ogl`
   é importada só no cliente; o desenho para quando o painel sai da tela ou a
   aba é escondida e, com movimento reduzido — ou sem WebGL —, fica um degradê
   estático com as mesmas cores. O elemento raiz ocupa 100% do pai. */

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`;

type Detail = "low" | "medium" | "high";
type Uniforms = Record<string, { value: number | boolean | Float32Array }>;

const stepsFor = (detail: Detail) =>
  detail === "low" ? 40 : detail === "high" ? 110 : 70;

const hexToRgb = (hex: string): [number, number, number] => {
  const found = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!found) return [1, 1, 1];
  return [
    parseInt(found[1], 16) / 255,
    parseInt(found[2], 16) / 255,
    parseInt(found[3], 16) / 255,
  ];
};

export type GradientWavesProps = {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  speed?: number;
  amplitude?: number;
  waveScale?: number;
  waveRatio?: number;
  swell?: number;
  turbulence?: number;
  tilt?: number;
  zoom?: number;
  height?: number;
  fogDepth?: number;
  detail?: Detail;
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  parallaxStrength?: number;
  grain?: boolean;
  grainIntensity?: number;
  /** Teto de densidade de pixels; painéis pequenos não precisam de 2x. */
  maxDpr?: number;
};

/* O degradê de reserva também é o estado final de quem não tem fôlego para o
   desenho: as ondas ficam por cima dele e o devolvem quando desistem. */
function gradientOf(horizon: string, wave: string, crest: string) {
  return `linear-gradient(180deg, ${horizon} 0%, ${wave} 62%, ${crest} 100%)`;
}

export default function GradientWaves({
  horizonColor = "#5227ff",
  waveColor = "#ff9ffc",
  crestColor = "#ffffff",
  speed = 0.4,
  amplitude = 2.5,
  waveScale = 0.6,
  waveRatio = 0.9,
  swell = 35,
  turbulence = 20,
  tilt = 1.11,
  zoom = 1,
  height = 5.5,
  fogDepth = 15,
  detail = "medium",
  brightness = 1,
  opacity = 1,
  mouseInteraction = true,
  parallaxStrength = 0.5,
  grain = true,
  grainIntensity = 0.05,
  maxDpr = 1.5,
}: GradientWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const applyRef = useRef<(() => void) | null>(null);
  const props = {
    horizonColor,
    waveColor,
    crestColor,
    speed,
    amplitude,
    waveScale,
    waveRatio,
    swell,
    turbulence,
    tilt,
    zoom,
    height,
    fogDepth,
    detail,
    brightness,
    opacity,
    mouseInteraction,
    parallaxStrength,
    grain,
    grainIntensity,
    maxDpr,
  };
  const propsRef = useRef(props);
  /* Mudanças de prop mexem só nas uniforms; o contexto fica de pé. */
  useEffect(() => {
    propsRef.current = props;
    applyRef.current?.();
  });
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;
    void (async () => {
      try {
        const { Renderer, Program, Mesh, Triangle } = await import("ogl");
        if (disposed) return;
        const p = propsRef.current;
        const renderer = new Renderer({
          webgl: 2,
          alpha: true,
          premultipliedAlpha: true,
          antialias: false,
          dpr: Math.min(window.devicePixelRatio || 1, p.maxDpr),
        });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        const canvas = gl.canvas as HTMLCanvasElement;
        canvas.style.cssText = "width:100%;height:100%;display:block";
        container.appendChild(canvas);
        /* Com o desenho no ar, o degradê estático sai de cena. */
        container.style.background = "transparent";
        const geometry = new Triangle(gl);
        const program = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            iTime: { value: 0 },
            iResolution: { value: new Float32Array([1, 1]) },
            uSpeed: { value: 0.4 },
            uAmplitude: { value: 2.5 },
            uWaveScale: { value: 0.6 },
            uWaveRatio: { value: 0.9 },
            uSwell: { value: 35 },
            uTurbulence: { value: 20 },
            uTilt: { value: 1.11 },
            uZoom: { value: 1 },
            uHeight: { value: 5.5 },
            uFogDepth: { value: 15 },
            uSteps: { value: 70 },
            uBrightness: { value: 1 },
            uOpacity: { value: 1 },
            uGrain: { value: 1 },
            uGrainIntensity: { value: 0.05 },
            uMouse: { value: new Float32Array([0.5, 0.5]) },
            uParallax: { value: 0.5 },
            uEnableMouse: { value: true },
            uHorizonColor: { value: new Float32Array([1, 1, 1]) },
            uWaveColor: { value: new Float32Array([1, 1, 1]) },
            uCrestColor: { value: new Float32Array([1, 1, 1]) },
          },
        });
        const mesh = new Mesh(gl, { geometry, program });
        const u = program.uniforms as unknown as Uniforms;
        const apply = () => {
          const q = propsRef.current;
          const set3 = (name: string, hex: string) => {
            const [r, g, b] = hexToRgb(hex);
            const value = u[name].value as Float32Array;
            value[0] = r;
            value[1] = g;
            value[2] = b;
          };
          u.uSpeed.value = q.speed;
          u.uAmplitude.value = q.amplitude;
          u.uWaveScale.value = q.waveScale;
          u.uWaveRatio.value = q.waveRatio;
          u.uSwell.value = q.swell;
          u.uTurbulence.value = q.turbulence;
          u.uTilt.value = q.tilt;
          u.uZoom.value = q.zoom;
          u.uHeight.value = q.height;
          u.uFogDepth.value = q.fogDepth;
          u.uSteps.value = stepsFor(q.detail);
          u.uBrightness.value = q.brightness;
          u.uOpacity.value = q.opacity;
          u.uGrain.value = q.grain ? 1 : 0;
          u.uGrainIntensity.value = q.grainIntensity;
          u.uParallax.value = q.parallaxStrength;
          u.uEnableMouse.value = q.mouseInteraction;
          set3("uHorizonColor", q.horizonColor);
          set3("uWaveColor", q.waveColor);
          set3("uCrestColor", q.crestColor);
        };
        applyRef.current = apply;
        apply();
        const setSize = () => {
          const rect = container.getBoundingClientRect();
          const width = Math.max(1, Math.floor(rect.width));
          const height = Math.max(1, Math.floor(rect.height));
          renderer.setSize(width, height);
          const resolution = u.iResolution.value as Float32Array;
          resolution[0] = gl.drawingBufferWidth;
          resolution[1] = gl.drawingBufferHeight;
          renderer.render({ scene: mesh });
        };
        const observer = new ResizeObserver(setSize);
        observer.observe(container);
        setSize();
        const current = [0.5, 0.5];
        const target = [0.5, 0.5];
        const onPointerMove = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          target[0] = (event.clientX - rect.left) / rect.width;
          target[1] = 1 - (event.clientY - rect.top) / rect.height;
        };
        const onPointerLeave = () => {
          target[0] = 0.5;
          target[1] = 0.5;
        };
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerleave", onPointerLeave);
        let raf = 0;
        let ultimo = 0;
        let contagem = 0;
        let inicio = 0;
        let desistiu = false;
        /* 40fps bastam para um fundo lento e poupam a thread principal. */
        const intervalo = 1000 / 40;
        const start = performance.now();
        const desistir = () => {
          const q = propsRef.current;
          desistiu = true;
          cleanup?.();
          container.style.background = gradientOf(
            q.horizonColor,
            q.waveColor,
            q.crestColor,
          );
        };
        const loop = (time: number) => {
          raf = requestAnimationFrame(loop);
          if (time - ultimo < intervalo) return;
          ultimo = time;
          if (inicio === 0) inicio = time;
          contagem += 1;
          /* Menos de cinco quadros por segundo nos primeiros 2,5s: o desenho
             é caro demais para este aparelho e o degradê estático volta. */
          if (time - inicio > 2500 && contagem < 12) {
            desistir();
            return;
          }
          (u.iTime as { value: number }).value = (time - start) * 0.001;
          const tx = propsRef.current.mouseInteraction ? target[0] : 0.5;
          const ty = propsRef.current.mouseInteraction ? target[1] : 0.5;
          current[0] += 0.05 * (tx - current[0]);
          current[1] += 0.05 * (ty - current[1]);
          const mouse = u.uMouse.value as Float32Array;
          mouse[0] = current[0];
          mouse[1] = current[1];
          renderer.render({ scene: mesh });
        };
        let visible = true;
        let pageVisible = !document.hidden;
        const tryStart = () => {
          if (!desistiu && visible && pageVisible && raf === 0) {
            raf = requestAnimationFrame(loop);
          }
        };
        const tryStop = () => {
          if (raf !== 0) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        };
        const io = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (visible) tryStart();
            else tryStop();
          },
          { threshold: 0 },
        );
        io.observe(container);
        const onVisibility = () => {
          pageVisible = !document.hidden;
          if (pageVisible) tryStart();
          else tryStop();
        };
        document.addEventListener("visibilitychange", onVisibility);
        tryStart();
        cleanup = () => {
          applyRef.current = null;
          tryStop();
          observer.disconnect();
          io.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
          canvas.removeEventListener("pointermove", onPointerMove);
          canvas.removeEventListener("pointerleave", onPointerLeave);
          canvas.remove();
          program.remove();
          geometry.remove();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
      } catch (error) {
        /* Sem WebGL fica o degradê estático — o cartão continua bonito. */
        if (process.env.NODE_ENV !== "production") {
          console.warn("gradient-waves: desenho desligado", error);
        }
      }
    })();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  return (
    <div
      ref={containerRef}
      className="gradient-waves"
      style={{ background: gradientOf(horizonColor, waveColor, crestColor) }}
    />
  );
}
