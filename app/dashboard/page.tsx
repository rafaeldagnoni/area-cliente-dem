'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push('/')
        return
      }

      const activeCompany = localStorage.getItem('activeCompany')

      if (!activeCompany) {
        router.push('/select-company')
        return
      }

      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', activeCompany)
        .single()

      setCompanyName(company?.name ?? null)
      setUserEmail(data.session.user.email ?? null)
      setLoading(false)
    }

    checkAccess()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('activeCompany')
    router.push('/')
  }

  const handleSwitchCompany = () => {
    router.push('/select-company')
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Carregando...</p>
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <p>
        Empresa ativa: <strong>{companyName}</strong>
      </p>

      <p>Usuário: {userEmail}</p>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSwitchCompany} style={{ marginRight: 10 }}>
          Trocar empresa
        </button>

        <button onClick={handleLogout}>
          Sair
        </button>
      </div>
    </div>
  )
}
