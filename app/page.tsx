'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('E-mail ou senha inválidos. Verifique suas credenciais.')
      setLoading(false)
      return
    }

    const { data: companies, error: companiesError } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

    if (companiesError) {
      setMessage('Erro ao carregar suas empresas. Tente novamente.')
      setLoading(false)
      return
    }

    if (!companies || companies.length === 0) {
      setMessage('Nenhuma empresa vinculada à sua conta.')
      setLoading(false)
      return
    }

    if (companies.length === 1) {
      window.location.href = '/dashboard'
    } else {
      window.location.href = '/select-company'
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      {/* Seção Visual */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          {/* Logo */}
          <div style={{ marginBottom: '3rem' }}>
            <img 
              src="/logo-dm-white.png" 
              alt="D&M Consultoria" 
              style={{ height: '70px' }}
            />
          </div>

          {/* Headline */}
          <p className="label" style={{ marginBottom: '1.5rem' }}>
            Portal do Cliente
          </p>
          
          <h1 style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            color: 'var(--dm-white)',
            marginBottom: '1.5rem'
          }}>
            Seus indicadores<br/>
            financeiros em<br/>
            <em style={{ color: 'var(--dm-gold)' }}>um só lugar.</em>
          </h1>

          <p style={{ 
            fontSize: '0.95rem', 
            lineHeight: 1.7, 
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '360px'
          }}>
            Acesse seus dashboards personalizados com análises de resultado, 
            fluxo de caixa e indicadores de desempenho.
          </p>
        </div>
      </div>

      {/* Seção do Formulário */}
      <div className="auth-form-section">
        <div className="auth-form-container">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              color: 'var(--dm-dark)',
              marginBottom: '0.5rem'
            }}>
              Entrar
            </h2>
            <p style={{ color: 'var(--dm-mid)', fontSize: '0.9rem' }}>
              Acesse sua área restrita
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label 
                htmlFor="email" 
                style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 500,
                  color: 'var(--dm-dark)',
                  marginBottom: '0.5rem'
                }}
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="password" 
                style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 500,
                  color: 'var(--dm-dark)',
                  marginBottom: '0.5rem'
                }}
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {message && (
            <div className="message message-error">
              {message}
            </div>
          )}

          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid var(--dm-light)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--dm-mid)' }}>
              Problemas para acessar?{' '}
              <a 
                href="mailto:contato@demconsultoriafinanceira.com"
                style={{ color: 'var(--dm-gold)', fontWeight: 500 }}
              >
                Fale conosco
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
