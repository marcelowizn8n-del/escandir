'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Feather, ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Star, StarOff,
  Upload, Loader2, ImageIcon, Volume2, Video, Save, X, Wand2
} from 'lucide-react';

interface Poem {
  id: string;
  title: string;
  text: string;
  audioUrl: string | null;
  audioKey: string | null;
  videoUrl: string | null;
  videoKey: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  published: boolean;
  featured: boolean;
  order: number;
}

export default function AdminPoemasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPoem, setEditingPoem] = useState<Poem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genImage, setGenImage] = useState(false);
  const [genImageError, setGenImageError] = useState('');
  const [imageDirection, setImageDirection] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [form, setForm] = useState({
    title: '', text: '', audioUrl: '' as string | null, audioKey: '' as string | null,
    videoUrl: '' as string | null, videoKey: '' as string | null,
    imageUrl: '' as string | null, imageKey: '' as string | null,
    published: false, featured: false, order: 0,
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && status === 'unauthenticated') router.replace('/admin/login');
    if (mounted && status === 'authenticated' && (session?.user as any)?.role !== 'admin') router.replace('/admin/login');
  }, [status, mounted, session, router]);

  const fetchPoems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/poems');
      const data = await res.json();
      setPoems(Array.isArray(data) ? data : []);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (mounted && status === 'authenticated') fetchPoems();
  }, [mounted, status, fetchPoems]);

  const openNew = () => {
    setEditingPoem(null);
    setForm({ title: '', text: '', audioUrl: null, audioKey: null, videoUrl: null, videoKey: null, imageUrl: null, imageKey: null, published: false, featured: false, order: poems?.length ?? 0 });
    setImageDirection('');
    setGenImageError('');
    setShowForm(true);
  };

  const openEdit = (poem: Poem) => {
    setEditingPoem(poem);
    setForm({
      title: poem?.title ?? '', text: poem?.text ?? '',
      audioUrl: poem?.audioUrl ?? null, audioKey: poem?.audioKey ?? null,
      videoUrl: poem?.videoUrl ?? null, videoKey: poem?.videoKey ?? null,
      imageUrl: poem?.imageUrl ?? null, imageKey: poem?.imageKey ?? null,
      published: poem?.published ?? false, featured: poem?.featured ?? false,
      order: poem?.order ?? 0,
    });
    setImageDirection('');
    setGenImageError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form?.title || !form?.text) return;
    setSaving(true);
    try {
      const method = editingPoem ? 'PUT' : 'POST';
      const body = editingPoem ? { ...form, id: editingPoem?.id } : form;
      await fetch('/api/admin/poems', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setShowForm(false);
      await fetchPoems();
    } catch (e: any) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este poema?')) return;
    try {
      await fetch(`/api/admin/poems?id=${id}`, { method: 'DELETE' });
      await fetchPoems();
    } catch (e: any) { console.error(e); }
  };

  const togglePublished = async (poem: Poem) => {
    try {
      await fetch('/api/admin/poems', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poem?.id, published: !poem?.published }),
      });
      await fetchPoems();
    } catch (e: any) { console.error(e); }
  };

  const toggleFeatured = async (poem: Poem) => {
    try {
      await fetch('/api/admin/poems', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poem?.id, featured: !poem?.featured }),
      });
      await fetchPoems();
    } catch (e: any) { console.error(e); }
  };

  const uploadFile = async (file: File, type: 'audio' | 'video') => {
    if (type === 'audio') setUploadingAudio(true);
    else setUploadingVideo(true);
    try {
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file?.name ?? 'file', contentType: file?.type ?? 'application/octet-stream', isPublic: true }),
      });
      const { uploadUrl, cloud_storage_path } = await presignRes.json();

      const headers: Record<string, string> = { 'Content-Type': file?.type ?? 'application/octet-stream' };
      if (uploadUrl?.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }
      await fetch(uploadUrl, { method: 'PUT', headers, body: file });

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path, isPublic: true }),
      });
      const { url } = await completeRes.json();

      if (type === 'audio') {
        setForm((p: any) => ({ ...(p ?? {}), audioUrl: url, audioKey: cloud_storage_path }));
      } else {
        setForm((p: any) => ({ ...(p ?? {}), videoUrl: url, videoKey: cloud_storage_path }));
      }
    } catch (e: any) { console.error(e); }
    if (type === 'audio') setUploadingAudio(false);
    else setUploadingVideo(false);
  };

  const generateAIImage = async () => {
    if (!form?.text) return;
    setGenImage(true);
    setGenImageError('');
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poemText: form?.text,
          poemTitle: form?.title,
          customDirection: imageDirection || undefined,
        }),
      });
      const data = await res.json();
      if (data?.imageUrl) {
        setForm((p: any) => ({ ...(p ?? {}), imageUrl: data.imageUrl, imageKey: null }));
        setGenImageError('');
      } else {
        setGenImageError(data?.error ?? 'Erro ao gerar imagem. Tente novamente.');
      }
    } catch (e: any) {
      console.error(e);
      setGenImageError('Erro de conexão. Tente novamente.');
    }
    setGenImage(false);
  };

  if (!mounted || status === 'loading') {
    return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }
  if (status !== 'authenticated' || (session?.user as any)?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Feather className="w-5 h-5 text-gold" />
          <span className="font-playfair text-lg">Gerenciar Poemas</span>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-playfair text-2xl text-navy">Poemas ({poems?.length ?? 0})</h1>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-all shadow-md">
            <Plus className="w-4 h-4" /> Novo Poema
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" /></div>
        ) : (poems?.length ?? 0) === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Feather className="w-12 h-12 text-navy/20 mx-auto mb-4" />
            <p className="text-navy/40">Nenhum poema cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {poems?.map((poem: Poem) => (
              <div key={poem?.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                {poem?.imageUrl && (
                  <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image src={poem.imageUrl} alt="" fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy truncate">{poem?.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${poem?.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {poem?.published ? 'Publicado' : 'Rascunho'}
                    </span>
                    {poem?.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold">Destaque</span>}
                    {poem?.audioUrl && <Volume2 className="w-3.5 h-3.5 text-navy/30" />}
                    {poem?.videoUrl && <Video className="w-3.5 h-3.5 text-navy/30" />}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePublished(poem)} className="p-2 rounded-lg hover:bg-navy/5 text-navy/40 hover:text-navy transition-colors" title={poem?.published ? 'Despublicar' : 'Publicar'}>
                    {poem?.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleFeatured(poem)} className="p-2 rounded-lg hover:bg-navy/5 text-navy/40 hover:text-gold transition-colors" title={poem?.featured ? 'Remover destaque' : 'Destacar'}>
                    {poem?.featured ? <Star className="w-4 h-4 text-gold" /> : <StarOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(poem)} className="p-2 rounded-lg hover:bg-navy/5 text-navy/40 hover:text-navy transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(poem?.id)} className="p-2 rounded-lg hover:bg-red-50 text-navy/40 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 my-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-playfair text-xl text-navy">{editingPoem ? 'Editar Poema' : 'Novo Poema'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-navy/5 text-navy/40"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Título *</label>
                  <input value={form?.title ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), title: e?.target?.value ?? '' }))}
                    className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-navy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Texto do Poema *</label>
                  <textarea value={form?.text ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), text: e?.target?.value ?? '' }))}
                    rows={10} className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-navy font-crimson" />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Imagem Ilustrativa</label>
                  {form?.imageUrl && (
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-gray-100">
                      <Image src={form.imageUrl} alt="Preview" fill className="object-cover" />
                      <button onClick={() => setForm((p: any) => ({ ...(p ?? {}), imageUrl: null, imageKey: null }))}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-navy/50 mb-1">Direcionamento (opcional) — descreva o que você quer ver na imagem</label>
                      <input
                        type="text"
                        value={imageDirection}
                        onChange={(e: any) => setImageDirection(e?.target?.value ?? '')}
                        placeholder="Ex: um homem idoso caminhando em um jardim, paisagem do sertão nordestino..."
                        className="w-full px-3 py-2 rounded-lg border border-navy/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none text-sm text-navy"
                      />
                    </div>
                    <button
                      onClick={generateAIImage}
                      disabled={genImage || !form?.text}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 text-sm"
                    >
                      {genImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {genImage ? 'Gerando imagem... (pode levar alguns segundos)' : 'Gerar Imagem com IA'}
                    </button>
                    {genImageError && (
                      <p className="text-sm text-red-500 mt-1">{genImageError}</p>
                    )}
                  </div>
                </div>

                {/* Audio */}
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Áudio (Declamação)</label>
                  {form?.audioUrl && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-cream rounded-lg">
                      <Volume2 className="w-4 h-4 text-gold" />
                      <span className="text-sm text-navy/60 flex-1 truncate">Áudio carregado</span>
                      <button onClick={() => setForm((p: any) => ({ ...(p ?? {}), audioUrl: null, audioKey: null }))} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-navy/5 text-navy rounded-lg hover:bg-navy/10 transition-all cursor-pointer text-sm">
                    {uploadingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingAudio ? 'Enviando...' : 'Upload de \u00c1udio'}
                    <input type="file" accept="audio/*" className="hidden" onChange={(e: any) => { const f = e?.target?.files?.[0]; if (f) uploadFile(f, 'audio'); }} />
                  </label>
                </div>

                {/* Video */}
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Vídeo (Declamação - Opcional)</label>
                  {form?.videoUrl && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-cream rounded-lg">
                      <Video className="w-4 h-4 text-gold" />
                      <span className="text-sm text-navy/60 flex-1 truncate">Vídeo carregado</span>
                      <button onClick={() => setForm((p: any) => ({ ...(p ?? {}), videoUrl: null, videoKey: null }))} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-navy/5 text-navy rounded-lg hover:bg-navy/10 transition-all cursor-pointer text-sm">
                    {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingVideo ? 'Enviando...' : 'Upload de V\u00eddeo'}
                    <input type="file" accept="video/*" className="hidden" onChange={(e: any) => { const f = e?.target?.files?.[0]; if (f) uploadFile(f, 'video'); }} />
                  </label>
                </div>

                {/* Options */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form?.published ?? false} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), published: e?.target?.checked ?? false }))}
                      className="w-4 h-4 text-gold border-navy/20 rounded focus:ring-gold" />
                    <span className="text-sm text-navy">Publicado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form?.featured ?? false} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), featured: e?.target?.checked ?? false }))}
                      className="w-4 h-4 text-gold border-navy/20 rounded focus:ring-gold" />
                    <span className="text-sm text-navy">Destaque</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Ordem</label>
                  <input type="number" value={form?.order ?? 0} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), order: parseInt(e?.target?.value ?? '0') || 0 }))}
                    className="w-24 px-3 py-2 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy text-sm" />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-navy/10">
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-navy/60 hover:text-navy transition-colors">Cancelar</button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form?.title || !form?.text}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy text-white rounded-lg hover:bg-navy-light transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
