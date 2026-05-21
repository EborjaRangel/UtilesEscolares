import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-escolar-yellow bg-escolar-navy text-white">
      <div className="container-app py-8 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-escolar-yellow text-xl">
                🎒
              </span>
              <div>
                <p className="font-display text-lg font-bold">Útiles Escolares</p>
                <p className="text-sm text-escolar-sky">Regreso a clases sin estrés</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-escolar-sky">
              Pedidos de paquetes escolares por grado. Regístrate, elige tu paquete y recíbelo en casa.
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-display font-bold text-escolar-yellow sm:mb-4">Enlaces</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-1">
              <li>
                <Link to="/" className="text-escolar-sky transition hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/paquetes" className="text-escolar-sky transition hover:text-white">
                  Paquetes
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-escolar-sky transition hover:text-white">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/registro" className="text-escolar-sky transition hover:text-white">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-display font-bold text-escolar-yellow sm:mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm text-escolar-sky">
              <li className="flex items-start gap-2 break-all">
                <span className="shrink-0">📧</span>
                contacto@utilesescolares.com
              </li>
              <li className="flex items-center gap-2">
                <span className="shrink-0">📞</span>
                (55) 1234-5678
              </li>
              <li className="flex items-center gap-2">
                <span className="shrink-0">🕐</span>
                Lun – Vie, 9:00 – 18:00
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-escolar-blue/40 pt-6 text-center text-xs text-escolar-sky sm:mt-10 sm:flex-row sm:text-left sm:text-sm">
          <p>© {new Date().getFullYear()} Útiles Escolares. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            <span className="text-escolar-yellow">✏️</span>
            Paquetes por grado escolar
          </p>
        </div>
      </div>
    </footer>
  );
}
