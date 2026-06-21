'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const resumePlayback = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    video.play().catch(() => {});
    video.addEventListener('pause', resumePlayback);

    return () => {
      video.removeEventListener('pause', resumePlayback);
    };
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-escolar-navy via-escolar-blue to-escolar-green px-4 py-4 text-white sm:px-6 sm:py-6 lg:py-8">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-escolar-yellow/20 blur-3xl sm:h-64 sm:w-64" />
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-escolar-coral/20 blur-3xl sm:h-48 sm:w-48" />

        <div className="container-app relative">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="max-w-2xl">
              <span className="mb-3 inline-block rounded-full bg-escolar-yellow/20 px-3 py-1 text-xs font-semibold text-escolar-yellow sm:mb-4 sm:px-4 sm:py-1.5 sm:text-sm">
                🎒 Regreso a clases simplificado
              </span>
              <h1 className="mb-4 font-display text-2xl font-extrabold leading-tight sm:mb-6 sm:text-4xl lg:text-5xl">
                Pide tu paquete de útiles escolares en minutos
              </h1>
              <p className="text-base leading-relaxed text-escolar-sky sm:text-lg">
                Olvídate de las listas interminables. Elige el paquete según el grado,
                regístrate y nosotros te lo enviamos hasta tu casa, con todo lo que tu hijo necesita para iniciar el nuevo ciclo escolar.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white/30 sm:ring-4">
              <video
                ref={videoRef}
                className="pointer-events-none aspect-video w-full select-none bg-escolar-navy object-cover"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                preload="auto"
                aria-hidden="true"
                onContextMenu={(e) => e.preventDefault()}
              >
                <source src="/videos/promo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      <section className="container-app">
        <h2 className="mb-2 text-center font-display text-2xl font-bold text-escolar-navy sm:text-3xl">
          ¿Cómo funciona?
        </h2>
        <p className="mb-3 text-center text-sm text-gray-600 sm:mb-4 sm:text-base">
          Tres pasos sencillos para tener listos los útiles de tu hijo
        </p>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {[
            {
              step: '1',
              icon: '📝',
              title: 'Regístrate',
              text: 'Crea tu cuenta con tus datos de contacto para hacer la entrega y el seguimiento a tus pedidos.',
              color: 'bg-escolar-coral',
            },
            {
              step: '2',
              icon: '📦',
              title: 'Elige tu paquete',
              text: 'Selecciona el paquete según el grado escolar. Cada uno incluye todo lo necesario.',
              color: 'bg-escolar-yellow',
            },
            {
              step: '3',
              icon: '🚚',
              title: 'Recibe en casa',
              text: 'Confirma los datos del estudiante y la dirección en el mapa. Nosotros preparamos y entregamos.',
              color: 'bg-escolar-green',
            },
          ].map((item) => (
            <div key={item.step} className="card text-center">
              <div
                className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white sm:h-14 sm:w-14 sm:text-2xl ${item.color}`}
              >
                {item.icon}
              </div>
              <span className="mb-2 inline-block rounded-full bg-escolar-sky px-3 py-0.5 text-xs font-bold text-escolar-navy">
                Paso {item.step}
              </span>
              <h3 className="mb-2 font-display text-lg font-bold text-escolar-navy sm:text-xl">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-escolar-mint/40 px-4 pt-4 pb-12 sm:pt-6 sm:pb-16">
        <div className="container-app text-center">
          <h2 className="mb-3 font-display text-2xl font-bold text-escolar-navy sm:mb-4 sm:text-3xl">
            Paquetes para cada etapa escolar
          </h2>
          <p className="mb-3 text-sm text-gray-600 sm:mb-4 sm:text-base">
            Desde preescolar hasta secundaria, tenemos el paquete perfecto
          </p>
          <Link href="/paquetes" className="btn-primary w-full sm:w-auto">
            Explorar paquetes
          </Link>
        </div>
      </section>
    </div>
  );
}
