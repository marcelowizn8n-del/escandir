'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShoppingBag, Plus, Minus, Trash2, Truck, CreditCard, Package, Loader2, X } from 'lucide-react';
import { useState } from 'react';

interface Book {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  weight: number;
}

interface CartItem {
  book: Book;
  quantity: number;
}

export default function LojaClient({ books }: { books: Book[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cep, setCep] = useState('');
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });
  const [error, setError] = useState('');

  const addToCart = (book: Book) => {
    setCart((prev: CartItem[]) => {
      const exists = prev?.find((i: CartItem) => i?.book?.id === book?.id);
      if (exists) {
        return prev?.map((i: CartItem) =>
          i?.book?.id === book?.id ? { ...i, quantity: Math.min((i?.quantity ?? 0) + 1, book?.stock ?? 99) } : i
        ) ?? [];
      }
      return [...(prev ?? []), { book, quantity: 1 }];
    });
  };

  const updateQty = (bookId: string, delta: number) => {
    setCart((prev: CartItem[]) =>
      prev?.map((i: CartItem) => {
        if (i?.book?.id !== bookId) return i;
        const newQty = (i?.quantity ?? 0) + delta;
        if (newQty <= 0) return i;
        if (newQty > (i?.book?.stock ?? 99)) return i;
        return { ...i, quantity: newQty };
      })?.filter((i: CartItem) => (i?.quantity ?? 0) > 0) ?? []
    );
  };

  const removeFromCart = (bookId: string) => {
    setCart((prev: CartItem[]) => prev?.filter((i: CartItem) => i?.book?.id !== bookId) ?? []);
  };

  const subtotal = cart?.reduce((acc: number, i: CartItem) => acc + (i?.book?.price ?? 0) * (i?.quantity ?? 0), 0) ?? 0;
  const cartCount = cart?.reduce((acc: number, i: CartItem) => acc + (i?.quantity ?? 0), 0) ?? 0;

  const calcShipping = async () => {
    if ((cep ?? '').replace(/\D/g, '').length !== 8) {
      setError('CEP inválido. Digite 8 dígitos.');
      return;
    }
    setLoadingShipping(true);
    setError('');
    try {
      const totalWeight = cart?.reduce((acc: number, i: CartItem) => acc + (i?.book?.weight ?? 300) * (i?.quantity ?? 0), 0) ?? 300;
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cep?.replace(/\D/g, '') ?? '', weight: totalWeight }),
      });
      const data = await res.json();
      if (data?.error) { setError(data.error); setShippingOptions([]); }
      else { setShippingOptions(data?.options ?? []); }
    } catch (e: any) {
      console.error(e);
      setError('Erro ao calcular frete.');
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleCheckout = async () => {
    if (!form?.name || !form?.email || !form?.street || !form?.number || !form?.neighborhood || !form?.city || !form?.state) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!selectedShipping) {
      setError('Selecione uma opção de frete.');
      return;
    }
    setLoadingPayment(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart?.map((i: CartItem) => ({ bookId: i?.book?.id, quantity: i?.quantity })),
          customer: form,
          addressZip: cep?.replace(/\D/g, '') ?? '',
          shipping: selectedShipping,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error ?? 'Erro ao processar pagamento.');
      }
    } catch (e: any) {
      console.error(e);
      setError('Erro ao processar pagamento.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const formatInput = (field: string, value: string) => {
    setForm((p: any) => ({ ...(p ?? {}), [field]: value }));
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <ShoppingBag className="w-10 h-10 text-gold mx-auto mb-4" />
          <h1 className="font-playfair text-3xl sm:text-4xl text-navy mb-3">Livros</h1>
          <p className="font-crimson text-navy/60 text-lg">Adquira os livros e tenha a poesia em mãos</p>
        </motion.div>

        {(books?.length ?? 0) === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-navy/20 mx-auto mb-4" />
            <p className="font-crimson text-navy/40 text-lg">Em breve, os livros estarão disponíveis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Books */}
            <div className="lg:col-span-2 space-y-8">
              {books?.map((book: Book, i: number) => (
                <motion.div
                  key={book?.id ?? i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-white rounded-lg shadow-sm p-6 flex flex-col sm:flex-row gap-6"
                >
                  {book?.imageUrl && (
                    <div className="relative w-full sm:w-48 aspect-[2/3] rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={book.imageUrl} alt={book?.title ?? 'Livro'} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-playfair text-2xl text-navy mb-3">{book?.title}</h3>
                    <p className="font-crimson text-navy/60 mb-4 leading-relaxed">{book?.description}</p>
                    <p className="text-2xl font-bold text-gold mb-2">R$ {book?.price?.toFixed?.(2) ?? '0.00'}</p>
                    <p className="text-sm text-navy/40 mb-4">
                      {(book?.stock ?? 0) > 0 ? `${book?.stock} em estoque` : 'Indisponível'}
                    </p>
                    <button
                      onClick={() => addToCart(book)}
                      disabled={(book?.stock ?? 0) <= 0}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Adicionar ao Carrinho
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Cart */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h3 className="font-playfair text-xl text-navy mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gold" />
                  Carrinho ({cartCount})
                </h3>

                {(cart?.length ?? 0) === 0 ? (
                  <p className="text-navy/40 text-sm py-4">Carrinho vazio</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {cart?.map((item: CartItem) => (
                        <div key={item?.book?.id} className="flex items-center justify-between p-3 bg-cream rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy truncate">{item?.book?.title}</p>
                            <p className="text-xs text-navy/50">R$ {item?.book?.price?.toFixed?.(2) ?? '0.00'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item?.book?.id, -1)} className="p-1 rounded bg-navy/5 hover:bg-navy/10 text-navy">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center text-navy">{item?.quantity}</span>
                            <button onClick={() => updateQty(item?.book?.id, 1)} className="p-1 rounded bg-navy/5 hover:bg-navy/10 text-navy">
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeFromCart(item?.book?.id)} className="p-1 rounded text-red-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-navy/10 pt-4 mb-4">
                      <div className="flex justify-between text-sm text-navy/60">
                        <span>Subtotal</span>
                        <span className="font-semibold text-navy">R$ {subtotal?.toFixed?.(2) ?? '0.00'}</span>
                      </div>
                      {selectedShipping && (
                        <div className="flex justify-between text-sm text-navy/60 mt-1">
                          <span>Frete ({selectedShipping?.name ?? ''})</span>
                          <span className="font-semibold text-navy">R$ {Number(selectedShipping?.price ?? 0)?.toFixed?.(2) ?? '0.00'}</span>
                        </div>
                      )}
                      {selectedShipping && (
                        <div className="flex justify-between text-base text-navy font-bold mt-2 pt-2 border-t border-navy/10">
                          <span>Total</span>
                          <span>R$ {(subtotal + Number(selectedShipping?.price ?? 0))?.toFixed?.(2) ?? '0.00'}</span>
                        </div>
                      )}
                    </div>

                    {!showCheckout ? (
                      <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-all shadow-md"
                      >
                        Finalizar Compra
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <button onClick={() => setShowCheckout(false)} className="text-sm text-navy/50 hover:text-navy flex items-center gap-1">
                          <X className="w-3 h-3" /> Voltar
                        </button>

                        <div className="space-y-3">
                          <input placeholder="Nome completo *" value={form?.name ?? ''} onChange={(e: any) => formatInput('name', e?.target?.value ?? '')}
                            className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                          <input placeholder="Email *" type="email" value={form?.email ?? ''} onChange={(e: any) => formatInput('email', e?.target?.value ?? '')}
                            className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                          <input placeholder="Telefone" value={form?.phone ?? ''} onChange={(e: any) => formatInput('phone', e?.target?.value ?? '')}
                            className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />

                          <div className="pt-2">
                            <p className="text-xs font-medium text-navy/60 mb-2 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Endereço de Entrega</p>
                          </div>
                          <div className="flex gap-2">
                            <input placeholder="CEP *" value={cep} onChange={(e: any) => setCep(e?.target?.value ?? '')}
                              className="flex-1 px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                            <button onClick={calcShipping} disabled={loadingShipping}
                              className="px-4 py-2.5 bg-navy text-white text-sm rounded-lg hover:bg-navy-light transition-all disabled:opacity-50">
                              {loadingShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calcular'}
                            </button>
                          </div>
                          <input placeholder="Rua *" value={form?.street ?? ''} onChange={(e: any) => formatInput('street', e?.target?.value ?? '')}
                            className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Número *" value={form?.number ?? ''} onChange={(e: any) => formatInput('number', e?.target?.value ?? '')}
                              className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                            <input placeholder="Complemento" value={form?.complement ?? ''} onChange={(e: any) => formatInput('complement', e?.target?.value ?? '')}
                              className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                          </div>
                          <input placeholder="Bairro *" value={form?.neighborhood ?? ''} onChange={(e: any) => formatInput('neighborhood', e?.target?.value ?? '')}
                            className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Cidade *" value={form?.city ?? ''} onChange={(e: any) => formatInput('city', e?.target?.value ?? '')}
                              className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                            <input placeholder="Estado *" value={form?.state ?? ''} onChange={(e: any) => formatInput('state', e?.target?.value ?? '')}
                              className="w-full px-3 py-2.5 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm text-navy" />
                          </div>
                        </div>

                        {/* Shipping Options */}
                        {(shippingOptions?.length ?? 0) > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-navy/60">Opções de Frete:</p>
                            {shippingOptions?.map((opt: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedShipping(opt)}
                                className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                                  selectedShipping?.name === opt?.name
                                    ? 'border-gold bg-gold/5 text-navy'
                                    : 'border-navy/10 hover:border-navy/20 text-navy/70'
                                }`}
                              >
                                <div className="flex justify-between">
                                  <span className="font-medium">{opt?.name ?? 'Frete'}</span>
                                  <span className="font-semibold">R$ {Number(opt?.price ?? 0)?.toFixed?.(2) ?? '0.00'}</span>
                                </div>
                                <p className="text-xs text-navy/40 mt-1">{opt?.deadline ?? ''}</p>
                              </button>
                            ))}
                          </div>
                        )}

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <button
                          onClick={handleCheckout}
                          disabled={loadingPayment || !selectedShipping}
                          className="w-full py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loadingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                          Pagar com Mercado Pago
                        </button>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
