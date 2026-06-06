import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ProdukList from '../pages/ProdukList';
import PembelianList from '../pages/PembelianList';
import Pesanan from '../pages/Pesanan';
import Pelanggan from '../pages/Pelanggan';
import Profile from '../pages/Profile';
import POS from '../pages/POS';

function MainRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/pos" element={<POS />} />
      <Route path="/produk" element={<ProdukList />} />
      <Route path="/pembelian" element={<PembelianList />} />
      <Route path="/pesanan" element={<Pesanan />} />
      <Route path="/pelanggan" element={<Pelanggan />} />
      <Route path="/profile" element={<Profile />} />
      
      {/* Nanti kita tambah route lain (order, profile, dll) */}
    </Routes>
  );
}

export default MainRoutes;