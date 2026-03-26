'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

interface Participant {
  id: string;
  team_name: string;
  access_code: string;
  created_at: string;
}

const EMPTY_FORM = { team_name: '', access_code: '' };

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmProps, setConfirmProps] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'error' | 'success' | null }>({ message: '', type: null });

  const notify = (message: string, type: 'error' | 'success') => setToastMsg({ message, type });

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('participants').select('*').order('team_name', { ascending: true });
    if (error) notify(error.message, 'error');
    else setParticipants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  // ── Register single team ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.team_name.trim() || !form.access_code.trim()) {
      notify('Both fields are required.', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('participants').insert([{ team_name: form.team_name.trim(), access_code: form.access_code.trim() }]);
    if (error) notify(error.message.includes('unique') ? 'Team name already exists.' : error.message, 'error');
    else {
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchParticipants();
      notify('Team Registered', 'success');
    }
    setSaving(false);
  };

  // ── Delete participant ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmProps.id) return;
    const { error } = await supabase.from('participants').delete().eq('id', confirmProps.id);
    if (error) notify(error.message, 'error');
    else {
      setParticipants(prev => prev.filter(p => p.id !== confirmProps.id));
      notify('Participant Removed', 'success');
    }
    setConfirmProps({ open: false, id: null });
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (participants.length === 0) { notify('No participants to export', 'error'); return; }
    const header = 'team_name,access_code';
    const rows = participants.map(p => `"${p.team_name}","${p.access_code}"`).join('\n');
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeprix_participants_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${participants.length} participants`, 'success');
  };

  // ── Import CSV / JSON ─────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const text = await file.text();
      let records: { team_name: string; access_code: string }[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [];
      } else {
        // CSV: skip header row
        const lines = text.trim().split('\n').slice(1);
        records = lines.map(line => {
          const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          return { team_name: cols[0], access_code: cols[1] };
        }).filter(r => r.team_name && r.access_code);
      }

      if (records.length === 0) { notify('No valid records found in file', 'error'); setImporting(false); return; }

      const { error } = await supabase.from('participants').upsert(records, { onConflict: 'team_name', ignoreDuplicates: true });
      if (error) notify('Import error: ' + error.message, 'error');
      else {
        fetchParticipants();
        notify(`Imported ${records.length} participants`, 'success');
      }
    } catch (err: any) {
      notify('Failed to parse file: ' + err.message, 'error');
    }

    setImporting(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AuthGuard role="admin">
      <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-racing">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 pt-20 md:pt-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl tracking-wide uppercase">Participants</h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-white/40">Manage Teams & Access Credentials</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Import */}
              <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                {importing ? '⏳ Importing...' : '⬆ Import CSV/JSON'}
                <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={handleImportFile} />
              </label>
              {/* Export */}
              <button onClick={exportCSV} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                ⬇ Export CSV
              </button>
              {/* Register */}
              <button
                onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }}
                className="rounded-2xl bg-[#E10600] px-7 py-3 text-[9px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(225,6,0,0.25)] hover:bg-[#ff1a0e] transition-all"
              >
                + Register Team
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mb-8 flex gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-7 py-5">
              <p className="text-[9px] uppercase tracking-[0.34em] text-white/40">Total Entries</p>
              <p className="mt-1 text-3xl font-black">{loading ? '—' : participants.length}</p>
            </div>
            <div className="flex-1 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-7 py-5 flex items-center">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">Bulk Import Format</p>
                <p className="mt-1 text-[10px] text-white/50 font-sans">CSV: <code className="text-white/60">team_name,access_code</code> &nbsp;|&nbsp; JSON: <code className="text-white/60">[{"{"}"team_name":"...","access_code":"..."{"}"}]</code></p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.01]">
            <div className="grid border-b border-white/10 px-8 py-4 text-[9px] uppercase tracking-[0.3em] text-white/30" style={{ gridTemplateColumns: '1fr 200px 80px' }}>
              <span>Team Identity</span>
              <span>Access Code</span>
              <span className="text-right">Action</span>
            </div>

            {loading && <div className="py-20 text-center text-[10px] uppercase tracking-widest text-white/10 animate-pulse">Scanning Pit Lane...</div>}
            {!loading && participants.length === 0 && (
              <div className="py-24 text-center">
                <div className="text-5xl mb-4 opacity-20">👥</div>
                <p className="text-white/20 uppercase tracking-widest text-sm">No participants registered</p>
                <p className="text-white/10 text-[10px] mt-2 uppercase tracking-widest">Import a CSV or register teams manually</p>
              </div>
            )}
            {!loading && participants.map(p => (
              <div key={p.id} className="grid items-center border-b border-white/[0.04] px-8 py-5 transition-all hover:bg-white/[0.02]" style={{ gridTemplateColumns: '1fr 200px 80px' }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E10600]/10 text-sm">🏎️</div>
                  <span className="text-sm font-black tracking-tighter uppercase">{p.team_name}</span>
                </div>
                <code className="text-[10px] text-white/50 tracking-widest bg-white/5 py-1.5 px-3 rounded-lg border border-white/5 font-mono">{p.access_code}</code>
                <div className="flex justify-end">
                  <button onClick={() => setConfirmProps({ open: true, id: p.id })} className="text-[8px] uppercase tracking-widest text-red-500/30 hover:text-red-500 transition-all font-bold">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Toast & Confirm */}
        <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(t => ({ ...t, type: null }))} />
        <ConfirmModal
          isOpen={confirmProps.open}
          onClose={() => setConfirmProps({ open: false, id: null })}
          onConfirm={handleDelete}
          title="Remove Participant?"
          desc="This removes their login access. Their historical race attempts remain in the database."
          type="danger"
        />

        {/* Register modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-md rounded-[36px] border border-white/15 bg-[#0d0d0d] p-10 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-1.5 w-12 rounded-full bg-[#E10600]" />
                <h3 className="text-xl uppercase tracking-tighter">Register Team</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[9px] uppercase tracking-widest text-white/40">Team Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={form.team_name}
                    onChange={e => setForm(f => ({ ...f, team_name: e.target.value }))}
                    placeholder="e.g. RedBull_Racing"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold focus:border-[#E10600] focus:outline-none transition-all placeholder:text-white/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[9px] uppercase tracking-widest text-white/40">Access Code (Password)</label>
                  <input
                    type="text"
                    value={form.access_code}
                    onChange={e => setForm(f => ({ ...f, access_code: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="e.g. rb2024"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold focus:border-[#E10600] focus:outline-none transition-all placeholder:text-white/10"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-white/10 py-4 text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-[#E10600] py-4 text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-30">
                  {saving ? 'Saving...' : 'Register'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
