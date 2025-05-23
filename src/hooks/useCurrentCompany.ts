import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface CompanyData {
  company_name: string;
  first_name: string;
  last_name: string;
}

export function useCurrentCompany() {
  const [company, setCompany] = useState<CompanyData | null>(null);

  useEffect(() => {
  const fetchCompany = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.user?.id) {
      console.warn('[⚠️ useCurrentCompany] no session or user found');
      return;
    }

    const userId = sessionData.session.user.id;
    const { data, error } = await supabase
      .from('users')
      .select('company_name, first_name, last_name')  // Sem a verificação de `type`
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[❌ useCurrentCompany] error loading user:', error);
      return;
    }

    // Atualizando o estado com os dados da empresa
    setCompany({
      company_name: data.company_name,
      first_name: data.first_name,
      last_name: data.last_name,
    });
  };

  fetchCompany();
}, []);

  //console.log('[🔑 useCurrentCompany] company state:', company);
  return company;
}
