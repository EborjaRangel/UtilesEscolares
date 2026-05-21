import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Paquetes from './pages/Paquetes';
import Pedido from './pages/Pedido';
import MisPedidos from './pages/MisPedidos';
import ConsultarPedido from './pages/ConsultarPedido';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Register />} />
            <Route path="paquetes" element={<Paquetes />} />
            <Route path="consultar-pedido/:codigo" element={<ConsultarPedido />} />
            <Route
              path="pedido/:id"
              element={
                <ProtectedRoute>
                  <Pedido />
                </ProtectedRoute>
              }
            />
            <Route
              path="mis-pedidos"
              element={
                <ProtectedRoute>
                  <MisPedidos />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
