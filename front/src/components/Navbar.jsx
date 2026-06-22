'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/');
  };

  const linkClass = (href) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return `block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
      isActive
        ? 'bg-escolar-yellow/30 text-escolar-navy'
        : 'text-escolar-navy/80 hover:bg-escolar-sky hover:text-escolar-navy'
    }`;
  };

  const navLinks = (
    <>
      <Link href="/" className={linkClass('/')} onClick={() => setMenuOpen(false)}>
        Inicio
      </Link>
      <Link href="/paquetes" className={linkClass('/paquetes')} onClick={() => setMenuOpen(false)}>
        Paquetes
      </Link>
      {isAuthenticated && (
        <Link
          href="/mis-pedidos"
          className={linkClass('/mis-pedidos')}
          onClick={() => setMenuOpen(false)}
        >
          Mis pedidos
        </Link>
      )}
      {user?.rol === 'admin' && (
        <Link
          href="/admin/caja"
          className={linkClass('/admin/caja')}
          onClick={() => setMenuOpen(false)}
        >
          Caja
        </Link>
      )}
    </>
  );

  const displayName = user ? [user.nombre, user.apellido].filter(Boolean).join(' ') : '';

  return (
    <header className="sticky top-0 z-50 border-b border-escolar-blue/10 bg-escolar-sky/90 shadow-sm backdrop-blur-md">
      <div className="container-app">
        <div className="flex items-center justify-between gap-2 py-3 sm:py-4">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 sm:flex-none"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-escolar-navy to-escolar-blue text-lg text-white shadow-md sm:h-11 sm:w-11 sm:text-xl">
              📚
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight text-escolar-navy sm:text-lg">
                Útiles Escolares
              </p>
              <p className="truncate text-xs font-medium text-escolar-blue">
                Regreso a clases sin estrés
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">{navLinks}</nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                <span className="hidden whitespace-nowrap text-sm font-medium text-escolar-navy lg:inline">
                  Hola, {displayName}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-secondary hidden py-2 text-sm lg:inline-flex"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary hidden py-2 text-sm lg:inline-flex">
                  Iniciar sesión
                </Link>
                <Link href="/registro" className="btn-accent hidden py-2 text-sm xl:inline-flex">
                  Registrarse
                </Link>
              </>
            )}

            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-escolar-navy hover:bg-escolar-sky lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-[57px] z-40 bg-escolar-navy/20 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-50 border-t border-escolar-sky/60 pb-4 pt-3 lg:hidden">
              <nav className="flex flex-col gap-1">{navLinks}</nav>
              <div className="mt-3 flex flex-col gap-2 border-t border-escolar-sky/40 pt-3">
                {isAuthenticated ? (
                  <>
                    <p className="px-3 text-sm font-medium text-escolar-navy">
                      Hola, {displayName}
                    </p>
                    <button type="button" onClick={handleLogout} className="btn-secondary w-full py-2 text-sm">
                      Salir
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="btn-secondary w-full py-2 text-center text-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/registro"
                      className="btn-accent w-full py-2 text-center text-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
