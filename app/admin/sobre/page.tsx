'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, ArrowLeft, Loader2, Save, Upload, X, Feather } from 'lucide-react';

export default function AdminSobrePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ biography: '', photoUrls: [] as string[], photoKeys: [] as string[], poemTitle: '', poemText: '' });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && status === 'unauthenticated') router.replace('/admin/login');
    if (mounted && status === 'authenticated' && (session?.user as any)?.role !== 'admin') router.replace('/admin/login');
  }, [status, mounted, session, router]);

  const fetchAbout = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/about');
      const data = await res.json();
      if (data && !data?.error) {
        setForm({
          biography: data?.biography ?? '',
          photoUrls: data?.photoUrls ?? [],
          photoKeys: data?.photoKeys ?? [],
          poemTitle: data?.poemTitle ?? '',
          poemText: data?.poemText ?? '',
        });
      }
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { if (mounted && status === 'authenticated') fetchAbout(); }, [mounted, status, fetchAbout]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } catch (e: any) { console.error(e); }
    setSaving(false);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file?.name ?? 'photo', contentType: file?.type ?? 'image/jpeg', isPublic: true }),
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
      setForm((p: any) => ({
        ...(p ?? {}),
        photoUrls: [...(p?.photoUrls ?? []), url],
        photoKeys: [...(p?.photoKeys ?? []), cloud_storage_path],
      }));
    } catch (e: any) { console.error(e); }
    setUploading(false);
  };

  const removePhoto = (idx: number) => {
    setForm((p: any) => ({
      ...(p ?? {}),
      photoUrls: (p?.photoUrls ?? []).filter((_: any, i: number) => i !== idx),
      photoKeys: (p?.photoKeys ?? []).filter((_: any, i: number) => i !== idx),
    }));
  };

  if (!mounted || status === 'loading') return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  if (status !== 'authenticated' || (session?.user as any)?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-white/70 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <User className="w-5 h-5 text-gold" />
          <span className="font-playfair text-lg">Página Sobre</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" /></div> : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-navy/70 mb-1">Biografia</label>
              <textarea value={form?.biography ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), biography: e?.target?.value ?? '' }))}
                rows={8} className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy bg-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy/70 mb-2">Fotos</label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {(form?.photoUrls ?? []).map((url: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image src={url} alt="" fill className="object-cover" />
                    <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-navy/5 text-navy rounded-lg hover:bg-navy/10 cursor-pointer text-sm w-fit">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Enviando...' : 'Adicionar Foto'}
                <input type="file" accept="image/*" className="hidden" onChange={(e: any) => { const f = e?.target?.files?.[0]; if (f) uploadPhoto(f); }} />
              </label>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Feather className="w-5 h-5 text-gold" />
                <h3 className="font-playfair text-lg text-navy">Poema sobre o Poeta</h3>
              </div>
              <input placeholder="Título do poema" value={form?.poemTitle ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), poemTitle: e?.target?.value ?? '' }))}
                className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy mb-3" />
              <textarea placeholder="Texto do poema" value={form?.poemText ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...(p ?? {}), poemText: e?.target?.value ?? '' }))}
                rows={6} className="w-full px-4 py-3 rounded-lg border border-navy/10 focus:border-gold outline-none text-navy font-crimson" />
            </div>

            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-all disabled:opacity-50 shadow-md">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Alterações
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
