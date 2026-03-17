'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id?: string;
  category: string;
  title: string;
  description: string;
  difficulty: string;
}

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState('Speed Coding');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/questions`);
      const payload = await res.json();
      if (payload.success) setQuestions(payload.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      router.push('/auth');
    } else {
      setIsAuthorized(true);
      fetchQuestions();
    }
  }, [router]);

  if (!isAuthorized) return null;

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, title, description, difficulty }),
      });
      const payload = await res.json();
      if (payload.success) {
        setTitle('');
        setDescription('');
        setMessage('Question added successfully!');
        fetchQuestions(); // update list
      } else {
        setMessage(`Error: ${payload.message}`);
      }
    } catch (error) {
      setMessage('Failed to create question.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('Are you certain you wish to delete this question?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/questions/${id}`, {
        method: 'DELETE',
      });
      const payload = await res.json();
      if (payload.success) {
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="carbon-bg" style={{ minHeight: '100vh', paddingTop: 100 }}>
      <section className="section">
        <div className="racing-stripe" />
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="section-subtitle">Manage race challenges directly into the Database.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '40px', alignItems: 'start' }}>
          
          {/* Add Question Form */}
          <div className="panel animate-in">
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', marginBottom: '20px', letterSpacing: '0.05em' }}>
              Add New Challenge
            </h2>
            <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                >
                  <option value="Speed Coding">Speed Coding</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="Fun">Fun</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Difficulty</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. The Liar Puzzle"
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Description</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Challenge details..."
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {message && <p style={{ fontSize: '0.85rem', color: message.includes('Error') || message.includes('Failed') ? 'var(--brand-red)' : '#00c853' }}>{message}</p>}

              <button type="submit" disabled={isLoading} className="btn-racing" style={{ justifyContent: 'center', marginTop: '10px' }}>
                {isLoading ? 'Processing...' : 'Deploy Challenge'}
              </button>
            </form>
          </div>

          {/* Existing Questions */}
          <div className="panel animate-in animate-delay-1">
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', marginBottom: '20px', letterSpacing: '0.05em' }}>
              Current Database ({questions.length})
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
              {questions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No challenges found.</p>
              ) : (
                questions.map((q) => (
                  <div key={q.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{q.title}</span>
                        <span className={`badge`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{q.category}</span>
                        <span className={`badge`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{q.difficulty}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                        {q.description}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(q.id)}
                      style={{ background: 'transparent', border: '1px solid var(--brand-red)', color: 'var(--brand-red)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', outline: 'none' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--brand-red)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--brand-red)'; }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
