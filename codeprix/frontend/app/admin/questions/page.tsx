'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

interface Question {
  id: string;
  body: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  sector: 1 | 2 | 3;
}

const EMPTY_FORM: Omit<Question, 'id'> = {
  body: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  sector: 1,
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions]       = useState<Question[]>([]);
  const [qPerSector, setQPerSector]     = useState<number>(3);
  const [filterSector, setFilterSector] = useState<'all' | 1 | 2 | 3>('all');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]                 = useState<Omit<Question, 'id'>>(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [importing, setImporting]       = useState(false);
  const [formError, setFormError]       = useState('');

  const [confirmProps, setConfirmProps] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [toastMsg, setToastMsg]         = useState<{ message: string; type: 'error' | 'success' | null }>({ message: '', type: null });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (message: string, type: 'error' | 'success') => setToastMsg({ message, type });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    const { data } = await supabase.from('questions').select('*').order('sector').order('id');
    setQuestions((data as Question[]) ?? []);
  }, []);

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase.from('event_config').select('questions_per_sector').limit(1).single();
    if (data?.questions_per_sector) setQPerSector(data.questions_per_sector);
  }, []);

  useEffect(() => { fetchQuestions(); fetchConfig(); }, [fetchQuestions, fetchConfig]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const sectorCount = (s: number) => questions.filter(q => q.sector === s).length;
  const correctAnswerText = (q: Question) => {
    const map: Record<string, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
    return `${q.correct_option}: ${map[q.correct_option]}`;
  };

  const filtered = filterSector === 'all' ? questions : questions.filter(q => q.sector === filterSector);

  // ── Add / Edit ────────────────────────────────────────────────────────────
  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({ body: q.body, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option, sector: q.sector });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.body.trim() || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      setFormError('All fields are required.');
      return;
    }
    setSaving(true);
    setFormError('');

    if (editingId !== null) {
      const { error } = await supabase.from('questions').update(form).eq('id', editingId);
      if (error) { setFormError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('questions').insert(form);
      if (error) { setFormError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setModalOpen(false);
    fetchQuestions();
    notify(editingId ? 'Question Updated' : 'Question Added', 'success');
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmProps.id) return;
    const { error } = await supabase.from('questions').delete().eq('id', confirmProps.id);
    if (error) notify(error.message, 'error');
    else {
      setQuestions(prev => prev.filter(q => q.id !== confirmProps.id));
      notify('Question Removed', 'success');
    }
    setConfirmProps({ open: false, id: null });
  };

  // ── Export JSON ───────────────────────────────────────────────────────────
  const exportJSON = () => {
    if (questions.length === 0) { notify('No questions to export', 'error'); return; }
    const exportable = questions.map(({ id: _id, ...q }) => q); // strip id
    const json = JSON.stringify(exportable, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeprix_questions_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${questions.length} questions`, 'success');
  };

  // ── Import JSON / CSV ─────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const text = await file.text();
      let records: Omit<Question, 'id'>[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [];
      } else {
        // CSV: header must be: body,option_a,option_b,option_c,option_d,correct_option,sector
        const lines = text.trim().split('\n').slice(1); // skip header
        records = lines.map(line => {
          // Handle quoted commas
          const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) ?? [];
          return {
            body:           cols[0] ?? '',
            option_a:       cols[1] ?? '',
            option_b:       cols[2] ?? '',
            option_c:       cols[3] ?? '',
            option_d:       cols[4] ?? '',
            correct_option: (cols[5]?.toUpperCase() ?? 'A') as Question['correct_option'],
            sector:         (parseInt(cols[6]) || 1) as Question['sector'],
          };
        }).filter(r => r.body);
      }

      if (records.length === 0) {
        notify('No valid questions found in file', 'error');
        setImporting(false);
        return;
      }

      // Validate correct_option values
      const valid = records.filter(r => ['A','B','C','D'].includes(r.correct_option) && [1,2,3].includes(r.sector));
      const skipped = records.length - valid.length;

      const { error } = await supabase.from('questions').insert(valid);
      if (error) notify('Import error: ' + error.message, 'error');
      else {
        fetchQuestions();
        notify(`Imported ${valid.length} questions${skipped > 0 ? `, skipped ${skipped} invalid` : ''}`, 'success');
      }
    } catch (err: any) {
      notify('Failed to parse file: ' + err.message, 'error');
    }

    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AuthGuard role="admin">
      <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 pt-20 md:pt-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-racing text-3xl tracking-wide uppercase">Questions</h1>
              <p className="mt-1 font-racing text-[11px] uppercase tracking-[0.28em] text-white/40">Manage Race Challenges</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Import */}
              <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-racing text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                {importing ? '⏳ Importing...' : '⬆ Import JSON/CSV'}
                <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={handleImportFile} />
              </label>
              {/* Export */}
              <button onClick={exportJSON} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-racing text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                ⬇ Export JSON
              </button>
              {/* Add */}
              <button onClick={openAdd} className="rounded-[14px] bg-[#E10600] px-6 py-3 font-racing text-[9px] uppercase tracking-widest text-white hover:bg-[#ff1a0e] shadow-[0_0_16px_rgba(225,6,0,0.25)] transition-all">
                + Add Question
              </button>
            </div>
          </div>

          {/* Sector summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(s => {
              const count = sectorCount(s);
              const ok = count >= qPerSector;
              return (
                <div key={s} className={`rounded-[18px] border px-5 py-4 ${ok ? 'border-[#00c853]/30 bg-[#00c853]/[0.05]' : 'border-[#E10600]/30 bg-[#E10600]/[0.05]'}`}>
                  <p className="font-racing text-[10px] uppercase tracking-[0.34em] text-white/40">Sector {s}</p>
                  <p className="mt-2 font-racing text-2xl">{count}</p>
                  <p className="mt-1 font-racing text-[10px] uppercase tracking-[0.2em] text-white/35">
                    {ok ? `✓ ${count} / ${qPerSector} min` : `⚠ ${count} / ${qPerSector} needed`}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Import format hint */}
          <div className="mb-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-4">
            <p className="font-racing text-[9px] uppercase tracking-widest text-white/30 mb-1">Bulk Import Format</p>
            <p className="text-[10px] text-white/40 font-sans">
              JSON: <code className="text-white/55">[{"{"}"body":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_option":"A","sector":1{"}"}]</code>
            </p>
            <p className="text-[10px] text-white/40 font-sans mt-1">
              CSV header: <code className="text-white/55">body,option_a,option_b,option_c,option_d,correct_option,sector</code>
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {(['all', 1, 2, 3] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterSector(s)}
                className={`rounded-full border px-4 py-1.5 font-racing text-[10px] uppercase tracking-[0.22em] transition-colors ${
                  filterSector === s
                    ? 'border-[#E10600]/60 bg-[#E10600]/15 text-[#E10600]'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {s === 'all' ? `All (${questions.length})` : `Sector ${s} (${sectorCount(s)})`}
              </button>
            ))}
          </div>

          {/* Questions table */}
          <div className="overflow-hidden rounded-[18px] border border-white/10">
            <div className="grid border-b border-white/10 px-5 py-3 font-racing text-[10px] uppercase tracking-[0.28em] text-white/40"
              style={{ gridTemplateColumns: '60px 1fr 220px 100px' }}>
              <span>Sector</span><span>Question</span><span>Correct Answer</span><span className="text-right">Actions</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-5xl mb-4 opacity-20">❓</div>
                <p className="font-racing text-[11px] uppercase tracking-[0.2em] text-white/25">No questions yet</p>
                <p className="font-racing text-[9px] uppercase tracking-widest text-white/15 mt-1">Import a JSON file or add manually</p>
              </div>
            ) : filtered.map(q => (
              <div
                key={q.id}
                className="grid items-center border-b border-white/[0.06] px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
                style={{ gridTemplateColumns: '60px 1fr 220px 100px' }}
              >
                <span className="font-racing text-xs text-[#E10600] font-black">S{q.sector}</span>
                <span className="truncate pr-4 text-sm text-white/80 font-sans">{q.body}</span>
                <span className="truncate pr-4 font-racing text-[10px] text-white/50">{correctAnswerText(q)}</span>
                <div className="flex justify-end gap-2">
                  <button onClick={() => openEdit(q)} className="rounded-[8px] border border-white/15 px-3 py-1 font-racing text-[9px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white transition-all">Edit</button>
                  <button onClick={() => setConfirmProps({ open: true, id: q.id })} className="rounded-[8px] border border-[#E10600]/20 px-3 py-1 font-racing text-[9px] uppercase tracking-widest text-red-500/50 hover:border-[#E10600] hover:text-[#E10600] transition-all">Del</button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* ── Toast & Confirm ── */}
        <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(t => ({ ...t, type: null }))} />
        <ConfirmModal
          isOpen={confirmProps.open}
          onClose={() => setConfirmProps({ open: false, id: null })}
          onConfirm={handleDelete}
          title="Delete Question?"
          desc="This permanently removes the question from all future race sessions."
          type="danger"
        />

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
            <div className="relative z-10 w-full max-w-xl overflow-y-auto max-h-[90vh] rounded-[28px] border border-white/12 bg-[#0d0d0d] p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1.5 w-10 rounded-full bg-[#E10600]" />
                <h3 className="font-racing text-xl tracking-wide uppercase">{editingId !== null ? 'Edit Question' : 'Add Question'}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-racing text-[9px] uppercase tracking-widest text-white/40">Question Body</label>
                  <textarea
                    rows={3}
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#E10600]/50 focus:outline-none font-sans"
                    placeholder="Enter the question..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(['a', 'b', 'c', 'd'] as const).map(opt => (
                    <div key={opt}>
                      <label className="mb-1.5 block font-racing text-[9px] uppercase tracking-widest text-white/40">Option {opt.toUpperCase()}</label>
                      <input
                        type="text"
                        value={form[`option_${opt}` as keyof typeof form] as string}
                        onChange={e => setForm(f => ({ ...f, [`option_${opt}`]: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#E10600]/50 focus:outline-none"
                        placeholder={`Option ${opt.toUpperCase()}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block font-racing text-[9px] uppercase tracking-widest text-white/40">Correct Answer</label>
                    <select
                      value={form.correct_option}
                      onChange={e => setForm(f => ({ ...f, correct_option: e.target.value as Question['correct_option'] }))}
                      className="w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-2.5 text-sm text-white focus:border-[#E10600]/50 focus:outline-none"
                    >
                      {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block font-racing text-[9px] uppercase tracking-widest text-white/40">Sector</label>
                    <select
                      value={form.sector}
                      onChange={e => setForm(f => ({ ...f, sector: parseInt(e.target.value) as Question['sector'] }))}
                      className="w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-2.5 text-sm text-white focus:border-[#E10600]/50 focus:outline-none"
                    >
                      {[1, 2, 3].map(s => <option key={s} value={s}>Sector {s}</option>)}
                    </select>
                  </div>
                </div>

                {formError && <p className="font-racing text-xs uppercase tracking-widest text-[#E10600]">{formError}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setModalOpen(false)} className="rounded-xl border border-white/15 px-5 py-2.5 font-racing text-[9px] uppercase tracking-widest text-white/50 hover:text-white transition-all">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#E10600] px-5 py-2.5 font-racing text-[9px] uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all disabled:opacity-40">
                    {saving ? 'Saving...' : 'Save Question'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
