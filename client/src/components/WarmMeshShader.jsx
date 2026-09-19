import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * WarmMeshShader - Custom GLSL ambient shader background
 * Crafted using threejs-shaders guidelines:
 * - High performance, low overdraw
 * - Warm bronze/amber/stone color palette (NO neon purple or cheesy glow)
 * - Subtle organic fluid motion matching modern B2B SaaS aesthetic (Linear/Stripe)
 */
export function WarmMeshShader() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) }
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Warm organic gradient shader with subtle noise
    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 vUv;

      // Classic simplex-style pseudo noise
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec2 uv = vUv;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = uv;
        p.x *= aspect;

        float t = u_time * 0.12;

        // Layered subtle waves
        float n1 = noise(p * 2.0 + vec2(t * 0.4, -t * 0.2));
        float n2 = noise(p * 3.5 - vec2(t * 0.3, t * 0.15) + n1 * 0.6);
        float wave = sin(p.y * 3.0 + n2 * 2.5 + t * 0.5) * 0.5 + 0.5;

        // Executive Warm Palette (Deep Obsidian, Warm Stone, Subtle Amber Gold, Charcoal)
        vec3 colorBase = vec3(0.05, 0.048, 0.045);     // Deep Warm Obsidian (#0d0c0b)
        vec3 colorStone = vec3(0.12, 0.11, 0.10);    // Warm Stone (#1f1c19)
        vec3 colorAmber = vec3(0.35, 0.22, 0.10);    // Warm Amber Bronze
        vec3 colorAccent = vec3(0.55, 0.32, 0.12);   // Muted Gold/Copper highlight

        // Smooth subtle blending
        vec3 col = mix(colorBase, colorStone, smoothstep(0.0, 1.0, uv.y));
        col = mix(col, colorAmber, wave * 0.22);
        
        // Gentle top-right atmospheric warmth
        float cornerLight = smoothstep(1.4, 0.1, distance(uv, vec2(0.85, 1.0)));
        col = mix(col, colorAccent, cornerLight * 0.14);

        // Very fine subtle film grain to prevent banding
        float grain = (hash(uv * u_time) - 0.5) * 0.015;
        col += grain;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId;
    const clock = new THREE.Clock();

    const render = () => {
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      renderer.setSize(newWidth, newHeight);
      uniforms.u_resolution.value.set(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      uniforms.u_mouse.value.set(e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    />
  );
}
