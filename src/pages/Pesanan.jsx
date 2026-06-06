import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

function Pesanan() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const respUser = await api.get('/user');
      setUser(respUser.data);

      const resp = await api.get('/orders');
      let data = resp.data;
      if (data && data.data) data = data.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Sesi habis, silakan login lagi');
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      await fetchOrders();
    };
    init();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const code = (order.kode_order || order.kode || order.order_code || order.id || '').toString().toLowerCase();
      const customer = (order.customer_name || order.pelanggan || order.customer || '').toString().toLowerCase();
      const status = (order.status || 'Menunggu').toString().toLowerCase();
      const phone = (order.customer_phone || order.no_hp || '').toString().toLowerCase();
      const matchesSearch = !query || code.includes(query) || customer.includes(query) || phone.includes(query);
      const matchesStatus = statusFilter === 'Semua Status' || status === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🧾 Riwayat Pesanan</h1>
          <div className="flex items-center gap-6">
            <span className="text-gray-600">Halo, <span className="font-semibold">{user?.name}</span></span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Riwayat Pesanan</h2>
              <p className="text-sm text-gray-500">Cari kode order, nama, atau nomor HP pelanggan.</p>
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center justify-center rounded-full border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode order, nama atau no HP pelanggan..."
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option>Semua Status</option>
              <option>Menunggu</option>
              <option>Selesai</option>
              <option>Dibayar</option>
              <option>Batal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-3xl shadow overflow-hidden">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Kode Order</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">No. HP</th>
                <th className="px-6 py-4">Kasir</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Diskon</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                    Tidak ada pesanan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const code = order.kode_order || order.kode || order.order_code || order.id;
                  const customer = order.customer_name || order.pelanggan || order.customer || '—';
                  const phone = order.customer_phone || order.no_hp || order.phone || '—';
                  const cashier = order.kasir_name || order.kasir || order.user?.name || '—';
                  const total = order.total || order.grand_total || order.amount || 0;
                  const discount = order.discount || order.diskon || order.discount_amount || 0;
                  const status = order.status || 'Menunggu';
                  const date = order.created_at || order.tanggal || order.date;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{code}</td>
                      <td className="px-6 py-4">{customer}</td>
                      <td className="px-6 py-4">{phone}</td>
                      <td className="px-6 py-4">{cashier}</td>
                      <td className="px-6 py-4">{formatRupiah(total)}</td>
                      <td className="px-6 py-4 text-green-600">{discount ? `${discount}%` : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.toLowerCase() === 'selesai' || status.toLowerCase() === 'dibayar' ? 'bg-green-100 text-green-700' : status.toLowerCase() === 'batal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatDate(date)}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-full border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold">Detail Pesanan</h3>
                <p className="text-sm text-gray-500">{selectedOrder.customer_name || selectedOrder.pelanggan || '—'}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-900 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Kode</p>
                  <p className="mt-2 font-semibold text-gray-900">{selectedOrder.kode_order || selectedOrder.kode || selectedOrder.order_code || selectedOrder.id}</p>
                </div>
                <div className="rounded-3xl border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Kasir</p>
                  <p className="mt-2 font-semibold text-gray-900">{selectedOrder.kasir_name || selectedOrder.kasir || selectedOrder.user?.name || '—'}</p>
                </div>
                <div className="rounded-3xl border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">No. HP</p>
                  <p className="mt-2 font-semibold text-gray-900">{selectedOrder.customer_phone || selectedOrder.no_hp || selectedOrder.phone || '—'}</p>
                </div>
                <div className="rounded-3xl border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status</p>
                  <p className="mt-2 font-semibold text-gray-900">{selectedOrder.status || 'Menunggu'}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(selectedOrder.total || selectedOrder.grand_total || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                  <span>Diskon</span>
                  <span>{selectedOrder.discount || selectedOrder.diskon || 0}%</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold text-blue-700 mt-4">
                  <span>Total Bayar</span>
                  <span>{formatRupiah(selectedOrder.total || selectedOrder.grand_total || 0)}</span>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Item Pesanan</h4>
                <div className="space-y-3">
                  {(selectedOrder.items || selectedOrder.order_items || []).length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">Tidak ada detail item.</div>
                  ) : (
                    (selectedOrder.items || selectedOrder.order_items || []).map((item, index) => (
                      <div key={index} className="flex items-center justify-between rounded-3xl border border-gray-200 p-4">
                        <div>
                          <p className="font-semibold text-gray-900">{item.nama_barang || item.name || item.produk?.nama_barang || 'Produk'}</p>
                          <p className="text-sm text-gray-500">Qty {item.quantity || item.qty || 1}</p>
                        </div>
                        <span className="font-semibold text-gray-900">{formatRupiah((item.harga || item.price || 0) * (item.quantity || item.qty || 1))}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pesanan;
