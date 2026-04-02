'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, ArrowLeft, Loader2, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  shippingCost: number;
  shippingMethod: string;
  subtotal: number;
  total: number;
  status: string;
  createdAt: string;
  items: { id: string; quantity: number; price: number; book: { title: string } }[];
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  paid: CheckCircle,
  shipped: Truck,
  cancelled: XCircle,
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  shipped: 'Enviado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  shipped: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminPedidosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && status === 'unauthenticated') router.replace('/admin/login');
    if (mounted && status === 'authenticated' && (session?.user as any)?.role !== 'admin') router.replace('/admin/login');
  }, [status, mounted, session, router]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { if (mounted && status === 'authenticated') fetchOrders(); }, [mounted, status, fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch('/api/admin/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId, status: newStatus }) });
      await fetchOrders();
    } catch (e: any) { console.error(e); }
  };

  if (!mounted || status === 'loading') return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  if (status !== 'authenticated' || (session?.user as any)?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Package className="w-5 h-5 text-gold" />
          <span className="font-playfair text-lg">Pedidos</span>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-playfair text-2xl text-navy mb-8">Pedidos ({orders?.length ?? 0})</h1>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" /></div> : (orders?.length ?? 0) === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Package className="w-12 h-12 text-navy/20 mx-auto mb-4" />
            <p className="text-navy/40">Nenhum pedido recebido ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders?.map((order: Order) => {
              const StatusIcon = statusIcons[order?.status ?? 'pending'] ?? Clock;
              const isExpanded = expandedId === order?.id;
              return (
                <div key={order?.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <button onClick={() => setExpandedId(isExpanded ? null : order?.id)} className="w-full p-4 flex items-center gap-4 text-left hover:bg-navy/[0.02] transition-colors">
                    <StatusIcon className="w-5 h-5 text-navy/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-navy">{order?.customerName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order?.status ?? 'pending'] ?? 'bg-gray-100 text-gray-500'}`}>
                          {statusLabels[order?.status ?? 'pending'] ?? order?.status}
                        </span>
                      </div>
                      <p className="text-xs text-navy/40 mt-0.5">
                        {new Date(order?.createdAt ?? '').toLocaleDateString('pt-BR')} • R$ {order?.total?.toFixed?.(2) ?? '0.00'}
                      </p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-navy/5 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-navy mb-1">Cliente</p>
                          <p className="text-navy/60">{order?.customerEmail}</p>
                          {order?.customerPhone && <p className="text-navy/60">{order.customerPhone}</p>}
                        </div>
                        <div>
                          <p className="font-medium text-navy mb-1">Endereço</p>
                          <p className="text-navy/60">{order?.addressStreet}, {order?.addressNumber} {order?.addressComplement}</p>
                          <p className="text-navy/60">{order?.addressNeighborhood} - {order?.addressCity}/{order?.addressState}</p>
                          <p className="text-navy/60">CEP: {order?.addressZip}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="font-medium text-navy text-sm mb-2">Itens</p>
                        {order?.items?.map((item: any) => (
                          <div key={item?.id} className="flex justify-between text-sm text-navy/60 py-1">
                            <span>{item?.book?.title ?? 'Livro'} x{item?.quantity ?? 0}</span>
                            <span>R$ {((item?.price ?? 0) * (item?.quantity ?? 0))?.toFixed?.(2) ?? '0.00'}</span>
                          </div>
                        ))}
                        <div className="border-t border-navy/5 mt-2 pt-2 text-sm">
                          <div className="flex justify-between text-navy/60"><span>Frete ({order?.shippingMethod})</span><span>R$ {order?.shippingCost?.toFixed?.(2) ?? '0.00'}</span></div>
                          <div className="flex justify-between font-bold text-navy mt-1"><span>Total</span><span>R$ {order?.total?.toFixed?.(2) ?? '0.00'}</span></div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        {order?.status === 'paid' && (
                          <button onClick={() => updateStatus(order?.id, 'shipped')} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
                            Marcar como Enviado
                          </button>
                        )}
                        {order?.status === 'pending' && (
                          <button onClick={() => updateStatus(order?.id, 'cancelled')} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
