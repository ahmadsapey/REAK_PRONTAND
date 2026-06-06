import { useMemo, useState } from 'react';
import api from '../../services/api';

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);

export default function PaymentModal({ total, cart, onCancel, onSubmit, loading = false }) {
  const [phoneInput, setPhoneInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [pelanggan, setPelanggan] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [skipCustomer, setSkipCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ nama: '', no_hp: '', alamat: '' });
  const paymentMethod = 'cash';
  const [amountPaid, setAmountPaid] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const isMember = pelanggan && !isNewCustomer;
  const discountAmount = isMember ? Math.round(total * 0.05) : 0;
  const totalAfterDiscount = total - discountAmount;
  const nominalBayar = parseInt(amountPaid.replace(/\D/g, ''), 10) || 0;
  const change = nominalBayar - totalAfterDiscount;

  const quickAmounts = useMemo(() => {
    const base = totalAfterDiscount || total;
    return [100000, 500000, 1000000].map((step) => Math.ceil(base / step) * step).filter((value, index, self) => self.indexOf(value) === index);
  }, [totalAfterDiscount, total]);

  const handlePhoneLookup = async () => {
    if (!phoneInput.trim()) return;
    setLookingUp(true);
    setErrorMsg('');
    setInfoMsg('');
    setPelanggan(null);
    setIsNewCustomer(false);

    try {
      let response = await api.get(`/pelanggan/phone/${phoneInput.trim()}`);
      if (!response.data?.data && response.data?.message) {
        throw new Error('Tidak ditemukan');
      }
      const customerFound = response.data?.data || response.data;
      if (customerFound) {
        setPelanggan(customerFound);
        setInfoMsg('Member ditemukan. Diskon 5% aktif.');
      } else {
        throw new Error('Tidak ditemukan');
      }
    } catch {
      setIsNewCustomer(true);
      setPelanggan(null);
      setNewCustomer({ nama: '', no_hp: phoneInput.trim(), alamat: '' });
      setInfoMsg('Pelanggan belum terdaftar. Isi data di bawah.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (cart.length === 0) {
      setErrorMsg('Keranjang masih kosong.');
      return;
    }

    if (!amountPaid || nominalBayar < totalAfterDiscount) {
      setErrorMsg('Nominal pembayaran kurang.');
      return;
    }

    if (!skipCustomer && !pelanggan && !isNewCustomer) {
      setErrorMsg('Silakan cek nomor HP pelanggan atau lewati tanpa member.');
      return;
    }

    if (isNewCustomer && !newCustomer.nama) {
      setErrorMsg('Nama pelanggan diperlukan untuk data baru.');
      return;
    }

    await onSubmit({
      paymentMethod,
      amountPaid: nominalBayar,
      change,
      discountAmount,
      totalAfterDiscount,
      customer: skipCustomer ? null : pelanggan || newCustomer,
      isNewCustomer,
      skipCustomer,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Proses Pembayaran</h2>
            <p className="text-sm text-gray-500">Lengkapi data pelanggan dan nominal pembayaran.</p>
          </div>
          <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-900 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="rounded-3xl border border-gray-200 p-4 mb-5 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="text-lg font-semibold text-gray-900">{formatRupiah(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Bayar</p>
              <p className="text-xl font-bold text-blue-600">{formatRupiah(totalAfterDiscount)}</p>
            </div>
          </div>
          {isMember && (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              Diskon Member 5% aktif. Anda hemat {formatRupiah(discountAmount)}.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span>Data Pelanggan</span>
            </div>
            {!skipCustomer && (
              <button
                type="button"
                onClick={() => {
                  setSkipCustomer(true);
                  setPelanggan(null);
                  setIsNewCustomer(false);
                  setInfoMsg('Transaksi tanpa member.');
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Lewati (tanpa member)
              </button>
            )}
            {skipCustomer && (
              <button
                type="button"
                onClick={() => {
                  setSkipCustomer(false);
                  setPhoneInput('');
                  setInfoMsg('');
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Ubah
              </button>
            )}
          </div>

          {skipCustomer ? (
            <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-300 p-3 text-sm text-gray-600 text-center">
              Transaksi tanpa data pelanggan.
            </div>
          ) : pelanggan ? (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{pelanggan.nama}</p>
                  <p className="text-sm text-gray-600">{pelanggan.no_hp}</p>
                  {pelanggan.alamat && <p className="text-sm text-gray-600">{pelanggan.alamat}</p>}
                </div>
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">Diskon 5%</span>
              </div>
            </div>
          ) : isNewCustomer ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-xs text-gray-500">Nama</label>
                <input
                  type="text"
                  value={newCustomer.nama}
                  onChange={(e) => setNewCustomer({ ...newCustomer, nama: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Nama lengkap pelanggan"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-gray-500">No. HP</label>
                <input
                  type="tel"
                  value={newCustomer.no_hp}
                  onChange={(e) => setNewCustomer({ ...newCustomer, no_hp: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-gray-500">Alamat</label>
                <input
                  type="text"
                  value={newCustomer.alamat}
                  onChange={(e) => setNewCustomer({ ...newCustomer, alamat: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Alamat pelanggan (opsional)"
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Masukkan no. HP pelanggan..."
                className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={handlePhoneLookup}
                disabled={lookingUp || !phoneInput.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lookingUp ? 'Memeriksa...' : 'Cek'}
              </button>
            </div>
          )}
          {infoMsg && <p className="mt-3 text-sm text-gray-500">{infoMsg}</p>}
        </div>

        <div className="rounded-3xl border border-gray-200 p-4 mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">Nominal Bayar</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Masukkan nominal..."
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {quickAmounts.map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => setAmountPaid(String(amount))}
                className="rounded-2xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:bg-blue-50"
              >
                {formatRupiah(amount)}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-4">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 rounded-2xl text-sm font-medium hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !amountPaid}
            className="flex-1 py-3 bg-green-600 text-white rounded-2xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
          >
            {loading ? 'Memproses...' : 'Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
