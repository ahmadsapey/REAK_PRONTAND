import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

function Pelanggan() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('tambah');
  const [formCustomer, setFormCustomer] = useState({ nama: '', no_hp: '', alamat: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const normalizeCustomer = (customer) => ({
    ...customer,
    alamat: customer.alamact ?? customer.alamat ?? customer.address ?? '',
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const respUser = await api.get('/user');
      setUser(respUser.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Sesi habis, silakan login lagi');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      toast.error('Gagal memuat data admin. Silakan coba lagi.');
      setLoading(false);
      return;
    }

    try {
      const resp = await api.get('/pelanggan');
      let data = resp.data;
      if (data && data.data) data = data.data;
      setCustomers(Array.isArray(data) ? data.map(normalizeCustomer) : []);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data pelanggan. Periksa koneksi atau endpoint backend.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const initialize = async () => {
      await fetchCustomers();
    };
    initialize();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const name = (customer.nama || customer.name || customer.full_name || '').toString().toLowerCase();
      const phone = (customer.no_hp || customer.phone || '').toString().toLowerCase();
      const address = (customer.alamat || customer.address || '').toString().toLowerCase();
      return !query || name.includes(query) || phone.includes(query) || address.includes(query);
    });
  }, [customers, search]);

  const openAddForm = () => {
    setFormMode('tambah');
    setFormCustomer({ nama: '', no_hp: '', alamat: '' });
    setShowForm(true);
  };

  const openEditForm = (customer) => {
    setFormMode('edit');
    setFormCustomer({
      id: customer.id,
      nama: customer.nama || customer.name || customer.full_name || '',
      no_hp: customer.no_hp || customer.phone || '',
      alamat: customer.alamat || customer.address || '',
    });
    setShowForm(true);
  };

  const fetchCustomerOrders = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerOrders([]);
    try {
      const resp = await api.get(`/orders?customer_id=${customer.id}`);
      let data = resp.data;
      if (data && data.data) data = data.data;
      setCustomerOrders(Array.isArray(data) ? data : []);
    } catch {
      setCustomerOrders([]);
    }
  };

  const handleSave = async () => {
    if (!formCustomer.nama || !formCustomer.no_hp) {
      toast.error('Nama dan No. HP wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      if (formMode === 'tambah') {
        await api.post('/pelanggan', {
          nama: formCustomer.nama,
          no_hp: formCustomer.no_hp,
          alamact: formCustomer.alamat,
        });
        toast.success('Pelanggan berhasil ditambahkan.');
      } else {
        await api.put(`/pelanggan/${formCustomer.id}`, {
          nama: formCustomer.nama,
          no_hp: formCustomer.no_hp,
          alamact: formCustomer.alamat,
        });
        toast.success('Data pelanggan berhasil diperbarui.');
      }
      setShowForm(false);
      fetchCustomers();
    } catch (error) {
      console.error(error);
      const responseData = error.response?.data;
      const message = responseData?.message || responseData?.error || 'Gagal menyimpan data pelanggan.';
      const validation = responseData?.errors ? Object.values(responseData.errors).flat().join(' ') : '';
      toast.error(`${message} ${validation}`.trim());
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Hapus pelanggan ${customer.nama || customer.name || ''}?`)) return;
    try {
      await api.delete(`/pelanggan/${customer.id}`);
      toast.success('Pelanggan berhasil dihapus.');
      if (selectedCustomer?.id === customer.id) setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus pelanggan.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">👥 Data Pelanggan</h1>
          <div className="flex items-center gap-6">
            <span className="text-gray-600">Halo, <span className="font-semibold">{user?.name}</span></span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Data Pelanggan</h2>
              <p className="text-sm text-gray-500">Cari nama, no. HP, atau alamat pelanggan.</p>
            </div>
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Tambah Pelanggan
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, no. HP, atau alamat..."
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={fetchCustomers}
              className="w-full rounded-2xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-700">
                <thead className="border-b border-gray-200 text-xs uppercase tracking-[0.3em] text-gray-500">
                  <tr>
                    <th className="px-4 py-4">No</th>
                    <th className="px-4 py-4">Nama</th>
                    <th className="px-4 py-4">No. HP</th>
                    <th className="px-4 py-4">Alamat</th>
                    <th className="px-4 py-4">Terdaftar</th>
                    <th className="px-4 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                        Tidak ada pelanggan yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer, index) => {
                      const name = customer.nama || customer.name || customer.full_name || '—';
                      const phone = customer.no_hp || customer.phone || '—';
                      const address = customer.alamat || customer.address || '—';
                      const registered = formatDate(customer.created_at || customer.terdaftar || customer.createdAt);

                      return (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 font-medium text-gray-900">{index + 1}</td>
                          <td className="px-4 py-4">{name}</td>
                          <td className="px-4 py-4">{phone}</td>
                          <td className="px-4 py-4">{address}</td>
                          <td className="px-4 py-4">{registered}</td>
                          <td className="px-4 py-4 space-x-2">
                            <button
                              type="button"
                              onClick={() => fetchCustomerOrders(customer)}
                              className="rounded-full border border-blue-600 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              Riwayat
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditForm(customer)}
                              className="rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(customer)}
                              className="rounded-full border border-red-600 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              Hapus
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

          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-lg font-bold mb-4">Detail Pelanggan</h2>
            {!selectedCustomer ? (
              <div className="rounded-3xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                Pilih pelanggan untuk melihat riwayat transaksi.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500">Nama</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">{selectedCustomer.nama || selectedCustomer.name || selectedCustomer.full_name}</p>
                  <p className="mt-1 text-sm text-gray-500">{selectedCustomer.no_hp || selectedCustomer.phone}</p>
                  {selectedCustomer.alamat && <p className="mt-2 text-sm text-gray-600">{selectedCustomer.alamat}</p>}
                </div>

                <div className="rounded-3xl border border-gray-200 p-5 bg-gray-50">
                  <p className="text-sm text-gray-500">Total Transaksi</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{customerOrders.length}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Riwayat Transaksi</h3>
                  {customerOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">Belum ada transaksi untuk pelanggan ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((order) => (
                        <div key={order.id} className="rounded-3xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{order.kode_order || order.kode || order.id}</span>
                            <span>{formatDate(order.created_at || order.tanggal)}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-base font-semibold text-gray-900">
                            <span>{order.status || 'Menunggu'}</span>
                            <span>{formatRupiah(order.total || order.grand_total || 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{formMode === 'tambah' ? 'Tambah Pelanggan' : 'Edit Pelanggan'}</h3>
                <p className="text-sm text-gray-500">Lengkapi informasi pelanggan di bawah ini.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-900 text-2xl leading-none">×</button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input
                  type="text"
                  value={formCustomer.nama}
                  onChange={(e) => setFormCustomer((prev) => ({ ...prev, nama: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">No. HP</label>
                <input
                  type="tel"
                  value={formCustomer.no_hp}
                  onChange={(e) => setFormCustomer((prev) => ({ ...prev, no_hp: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Alamat</label>
                <input
                  type="text"
                  value={formCustomer.alamat}
                  onChange={(e) => setFormCustomer((prev) => ({ ...prev, alamat: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);
}

export default Pelanggan;
