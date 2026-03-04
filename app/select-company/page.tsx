'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type Company = {
  id: string
  name: string
}

export default function SelectCompany() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          companies (
            id,
            name
          )
        `)
        .eq('user_id', userData.user.id)

      if (error || !data) {
        router.push('/')
        return
      }

      const formatted = data.map((item: any) => ({
        id: item.companies.id,
        name: item.companies.name,
      }))

      setCompanies(formatted)
      setLoading(false)
    }

    fetchCompanies()
  }, [router])

  const handleSelect = (companyId: string) => {
    localStorage.setItem('activeCompany', companyId)
    router.push('/dashboard')
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Carregando empresas...</p>
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Selecione a empresa</h1>

      <div style={{ marginTop: 20 }}>
        {companies.map((company) => (
          <div key={company.id} style={{ marginBottom: 12 }}>
            <button onClick={() => handleSelect(company.id)}>
              {company.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
