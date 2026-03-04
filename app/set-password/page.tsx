'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage('Erro ao atualizar senha: ' + error.message)
    } else {
      setMessage('Senha criada com sucesso! Você já pode fazer login.')
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Definir Senha</h1>
      <form onSubmit={handleUpdatePassword}>
        <input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Salvar senha</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
