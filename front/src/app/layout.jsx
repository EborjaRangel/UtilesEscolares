import { Nunito, Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'Útiles Escolares',
  description: 'Pedidos de paquetes de útiles escolares por grado',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${nunito.variable} ${inter.variable}`}>
      <body className="font-body">
        <AuthProvider>
          <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden">
            <Navbar />
            <main className="w-full flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
