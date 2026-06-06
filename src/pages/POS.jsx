import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import PaymentModal from '../components/pos/paymentModal';

function POS() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const respUser = await api.get('/user');
        setUser(respUser.data);

        const resp = await api.get('/produks');
        let data = resp.data;
        if (data && data.data) data = data.data;
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Sesi habis, silakan login lagi');
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.nama_barang} ditambahkan ke keranjang`);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const calculateTotal = () => cart.reduce((totalValue, item) => totalValue + item.harga * item.quantity, 0);

  const handleCheckout = async ({
    paymentMethod,
    amountPaid,
    change,
    discountAmount,
    totalAfterDiscount,
    customer,
    isNewCustomer,
    skipCustomer,
  }) => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong!');
      return;
    }

    setPaymentLoading(true);
    try {
      let pelangganId = null;
      if (!skipCustomer && customer) {
        if (customer.id) {
          pelangganId = customer.id;
        } else if (isNewCustomer) {
          const createResp = await api.post('/pelanggan', {
            nama: customer.nama,
            no_hp: customer.no_hp,
            alamact: customer.alamat || 'Kasir POS',
          });
          pelangganId = createResp.data?.data?.id || createResp.data?.id || null;
        }
      }

      const payload = {
        user_id: user?.id,
        items: cart.map((item) => ({
          produk_id: item.id,
          product_id: item.id,
          quantity: item.quantity,
          harga: item.harga,
          price: item.harga,
          subtotal: item.harga * item.quantity,
        })),
        total: total,
        total_before_discount: total,
        grand_total: totalAfterDiscount,
        discount: !skipCustomer && !isNewCustomer ? 5 : 0,
        discount_amount: discountAmount,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        change,
        pelanggan_id: pelangganId,
        customer_id: pelangganId,
        customer_name: customer?.nama || null,
        customer_phone: customer?.no_hp || null,
        customer_address: customer?.alamat || 'Kasir POS',
        shipping_address: customer?.alamat || 'Kasir POS',
      };

      await api.post('/orders', payload);
      toast.success('Transaksi berhasil!');
      setCart([]);
      setShowPaymentModal(false);
    } catch (error) {
      const responseData = error.response?.data;
      console.error('Error:', responseData || error);
      let message = responseData?.message || responseData?.error || 'Gagal membuat pesanan';
      if (responseData?.errors) {
        const validationMessages = Object.values(responseData.errors).flat().join(' ');
        message = `${message}: ${validationMessages}`;
      }
      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🛒 POS</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Halo, <span className="font-semibold">{user?.name}</span></span>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
            >
              Kembali
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DAFTAR PRODUK */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Produk</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {products.map((product) => {
                const stock = product.stok ?? product.quantity ?? 0;
                return (
                  <div key={product.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
                    <div className="h-32 bg-gray-200 rounded mb-3 flex items-center justify-center text-4xl">
                      {product.gambar ? (
                        <img src={product.gambar} alt={product.nama_barang} className="w-full h-full object-cover rounded" />
                      ) : (
                        '📦'
                      )}
                    </div>
                    <div className="font-mono text-xs text-gray-500 mb-1">{product.kode_barang}</div>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.nama_barang}</h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        Rp {parseInt(product.harga).toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        Stok: {stock}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={stock <= 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Tambah
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RINGKASAN KERANJANG */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow sticky top-24">
              <h2 className="text-xl font-bold mb-4">Keranjang</h2>
              
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto border-b pb-4">
                {cart.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">Keranjang kosong</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{item.nama_barang}</p>
                        <p className="text-gray-600">Rp {parseInt(item.harga).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-10 text-center border rounded py-1"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💳 Checkout
              </button>
              <button
                onClick={() => setCart([])}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition mt-2"
              >
                Bersihkan
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          total={total}
          cart={cart}
          onCancel={() => setShowPaymentModal(false)}
          onSubmit={handleCheckout}
          loading={paymentLoading}
        />
      )}
    </div>
  );
}

export default POS;
