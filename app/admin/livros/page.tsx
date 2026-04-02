'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowLeft, Plus, Edit, Trash2, Loader2, Save, X, Upload } from 'lucide-react';

interface Book {
  id: string; title: string; description: string; price: number;
  imageUrl: string | null; imageKey: string | null; stock: number; weight: number; active: boolean;
}

export default function AdminLivrosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: 0, imageUrl: null as string | null, imageKey: null as string | null, stock: 0, weight: 300, active: true });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && status === 'unauthenticated') router.replace('/admin/login');
    if (mounted && status === 'authenticated' && (session?.user as any)?.role !== 'admin') router.replace('/admin/login');
  }, [status, mounted, session, router]);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/books');
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { if (mounted && status === 'authenticated') fetchBooks(); }, [mounted, status, fetchBooks]);

  const openNew = () => {
    setEditingBook(null);
    setForm({ title: '', description: '', price: 0, imageUrl: null, imageKey: null, stock: 0, weight: 300, active: true });
    setShowForm(true);
  };

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setForm({ title: book?.title ?? '', description: book?.description ?? '', price: book?.price ?? 0, imageUrl: book?.imageUrl ?? null, imageKey: book?.imageKey ?? null, stock: book?.stock ?? 0, weight: book?.weight ?? 300, active: book?.active ?? true });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingBook ? 'PUT' : 'POST';
      const body = editingBook ? { ...form, id: editingBook?.id } : form;
      await fetch('/api/admin/books', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setShowForm(false);
      await fetchBooks();
    } catch (e: any) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este livro?')) return;
    try { await fetch(`/api/admin/books?id=${id}`, { method: 'DELETE' }); await fetchBooks(); } catch (e: any) { console.error(e); }
  };

  const uploadImage = async (file: File) => {
    setUploadingImg(true);
    try {
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file?.name ?? 'image', contentType: file?.type ?? 'image/jpeg', isPublic: true }),
      });
      const { uploadUrl, cloud_storage_path } = await presignRes.json();
      const headers: Record<string, string> = { 'Content-Type': file?.type ?? 'image/jpeg' };
      if (uploadUrl?.includes('content-disposition')) headers['Content-Disposition'] = 'attachment';
      await fetch(uploadUrl, { method: 'PUT', headers, body: file });
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path, isPublic: true }),
      });
      const { url } = await completeRes.json();
      setForm((p: any) => ({ ...(p ?? {}), imageUrl: url, imageKey: cloud_storage_path }));
    } catch (e: any) { console.error(e); }
    setUploadingImg(false);
  };

  if (!mounted || status === 'loading') return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  if (status !== 'authenticated' || (session?.user as any)?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <BookOpen className="w-5 h-5 text-gold" />
          <span className="font-playfair text-lg">Gerenciar Livros</span>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-playfair text-2xl text-navy">Livros ({books?.length ?? 0})</h1>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-all shadow-md">
            <Plus className="w-4 h-4" /> Novo Livro
          </button>
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {books?.map((book: Book) => (
              <div key={book?.id} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                {book?.imageUrl && (
                  <div className="relative w-24 aspect-[2/3] rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image src={book.imageUrl} alt="" fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-navy">{book?.title}</h3>
                  <p className="text-sm text-navy/50 line-clamp-2">{book?.description}</p>
                  <p className="text-gold font-bold mt-1">R$ {book?.price?.toFixed?.(2) ?? '0.00'}</p>
                  <p className="text-xs text-navy/40">Estoque: {book?.stock ?? 0} | Peso: {book?.weight ?? 300}g</p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => openEdit(book)} className="p-1.5 rounded hover:bg-navy/5 text-navy/40"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(book?.id)} className="p-1.5 rounded hover:bg-red-50 text-navy/40 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 my-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-playfair text-xl text-navy">{editingBook ? 'Editar Livro' : 'Novo Livro'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-navy/5"><X className="w-5 h-5 text-navy/40" /></button>
              </div>
              <div className="space-y-4">
                <input placeholder="Título" value={form?.title ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), title: e?.target?.value ?? '' }))}
                  className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy" />
                <textarea placeholder="Descrição" value={form?.description ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), description: e?.target?.value ?? '' }))}
                  rows={4} className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-navy/60 mb-1">Preço (R$)</label>
                    <input type="number" step="0.01" value={form?.price ?? 0} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), price: parseFloat(e?.target?.value ?? '0') || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-navy/60 mb-1">Estoque</label>
                    <input type="number" value={form?.stock ?? 0} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), stock: parseInt(e?.target?.value ?? '0') || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-navy/60 mb-1">Peso (g)</label>
                    <input type="number" value={form?.weight ?? 300} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), weight: parseInt(e?.target?.value ?? '300') || 300 }))}
                      className="w-full px-3 py-2 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy text-sm" />
                  </div>
                </div>
                {form?.imageUrl && (
                  <div className="relative aspect-[2/3] max-w-[200px] rounded overflow-hidden bg-gray-100">
                    <Image src={form.imageUrl} alt="Capa" fill className="object-cover" />
                    <button onClick={() => setForm((p: any) => ({ ...(p ?? {}), imageUrl: null, imageKey: null }))} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2.5 bg-navy/5 text-navy rounded-lg hover:bg-navy/10 cursor-pointer text-sm">
                  {uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingImg ? 'Enviando...' : 'Upload de Capa'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e: any) => { const f = e?.target?.files?.[0]; if (f) uploadImage(f); }} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form?.active ?? true} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), active: e?.target?.checked ?? true }))}
                    className="w-4 h-4 text-gold border-navy/20 rounded" />
                  <span className="text-sm text-navy">Ativo na loja</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-navy/10">
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-navy/60">Cancelar</button>
                <button onClick={handleSave} disabled={saving || !form?.title}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy text-white rounded-lg hover:bg-navy-light disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
