"use client";

import { useEffect, useRef, type RefObject } from "react";

type Props = { scene: number; active: boolean; burst: number; surface: RefObject<HTMLDivElement | null> };

/** Rising soda bubbles respond to touch, pointer movement, and the fizz button. */
export function SceneParticles({ scene, active, burst, surface }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ scene, active, burst });
  useEffect(() => { settings.current = { scene, active, burst }; }, [scene, active, burst]);

  useEffect(() => {
    const element = canvas.current;
    const host = surface.current;
    if (!element || !host) return;
    const context = element.getContext("2d");
    if (!context) return;
    let width = 1, height = 1, frame = 0, visible = true, time = 0, last = 0, pulse = 0, lastBurst = 0;
    let aimX = 0, aimY = 0, mouseX = 0, mouseY = 0;
    const marks = Array.from({ length: matchMedia("(pointer: coarse)").matches ? 32 : 64 }, (_, i) => ({
      x: ((i * 73 + 19) % 101) / 101,
      y: ((i * 47 + 7) % 103) / 103,
      angle: i * 2.399,
      length: 1 + i % 4,
    }));
    const resize = () => {
      width = host.clientWidth; height = host.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      element.width = Math.round(width * dpr); element.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const move = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      aimX = (event.clientX - rect.left) / rect.width - .5;
      aimY = (event.clientY - rect.top) / rect.height - .5;
      if (settings.current.active) {
        host.style.setProperty("--scene-x", `${aimX * 18}px`);
        host.style.setProperty("--scene-y", `${aimY * 14}px`);
        host.style.setProperty("--scene-rotate", `${aimX * 2}deg`);
      }
    };
    const down = () => { if (settings.current.active) pulse = 1; };
    const leave = () => {
      aimX = aimY = 0;
      host.style.setProperty("--scene-x", "0px"); host.style.setProperty("--scene-y", "0px"); host.style.setProperty("--scene-rotate", "0deg");
    };
    function draw() {
      if (!context) return;
      if (settings.current.burst !== lastBurst) { if (settings.current.active) pulse = 1; lastBurst = settings.current.burst; }
      pulse *= .95;
      mouseX += (aimX - mouseX) * .05; mouseY += (aimY - mouseY) * .05;
      context.clearRect(0, 0, width, height);
      marks.forEach((mark, i) => {
        const x = mark.x * width + Math.sin(time * .4 + mark.angle) * 9 + mouseX * (i % 7) * 5 + Math.cos(mark.angle) * pulse * 90;
        const y = ((mark.y * height - time * 19) % height + height) % height + mouseY * (i % 5) * 6 + Math.sin(mark.angle) * pulse * 90;
        context.strokeStyle = `rgba(255,244,203,${.12 + (i % 4) * .07})`;
        context.lineWidth = .7;
        context.beginPath();
        context.arc(x, y, mark.length, 0, Math.PI * 2);
        context.stroke();
      });
    }
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!settings.current.active || !visible || document.hidden) { last = now; return; }
      if (now - last < 40) return;
      time += Math.min((now - last) / 1000, .08); last = now; draw();
    };
    const observer = new ResizeObserver(resize); observer.observe(host);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); intersection.observe(host);
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointerleave", leave);
    resize(); frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
      host.removeEventListener("pointermove", move); host.removeEventListener("pointerdown", down); host.removeEventListener("pointerleave", leave);
    };
  }, [surface]);
  return <canvas ref={canvas} className="scene-particles" aria-hidden="true" />;
}
