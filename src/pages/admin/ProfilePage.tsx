'use client';
import { useEffect, useState } from 'react';
import { RoleSelector } from '../../components/admin/RoleSelector';
import { ConfirmDeleteSection } from '../../components/admin/ConfirmDeleteSection';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { SubHeader } from '../../components/SubHeader';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { userId, organizationId } = useAuthStore();

  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    cnpj: '',
    role_in_org: '',
    wants_updates: true,
  });

  const [orgData, setOrgData] = useState({
    name: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  useEffect(() => {
    async function fetchData() {
      console.log('[🔍 Debug ProfilePage] userId:', userId);
      console.log('[🔍 Debug ProfilePage] organizationId:', organizationId);

      if (!userId || !organizationId) {
        console.warn('[⚠️] userId ou organizationId ausentes — aguardando...');
        return;
      }

      try {
        const [{ data: user }, { data: org }, { data: auth }] = await Promise.all([
          supabase.from('users').select('*').eq('user_id', userId).single(),
          supabase.from('accounts').select('*').eq('id', organizationId).single(),
          supabase.auth.getUser(),
        ]);

        console.log('[✅ Dados carregados]', { user, org, auth });

        if (user && auth?.user) {
          setUserData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            email: auth.user.email || '',
            cnpj: user.cnpj || '',
            role_in_org: user.role_in_org || '',
            wants_updates: user.wants_updates ?? true,
          });
        }

        if (org) {
          setOrgData({
            name: org.name || '',
            cep: org.cep || '',
            endereco: org.endereco || '',
            numero: org.numero || '',
            complemento: org.complemento || '',
            bairro: org.bairro || '',
            cidade: org.cidade || '',
            estado: org.estado || '',
          });
        }
      } catch (err) {
        console.error('[❌ Erro ao buscar dados do perfil]', err);
      }
    }

    fetchData();
  }, [userId, organizationId]);

async function handleSave() {
  try {
    const { cnpj, ...orgDataWithoutCnpj } = orgData;

    const { error: userError } = await supabase
      .from('users')
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        cnpj: userData.cnpj,
        role_in_org: userData.role_in_org,
        wants_updates: userData.wants_updates,
      })
      .eq('user_id', userId);

    const { error: orgError } = await supabase
      .from('accounts')
      .update(orgDataWithoutCnpj)
      .eq('id', organizationId);

    console.log('[📦 PATCH RESULT]', { userError, orgError });

    if (userError || orgError) {
      toast.error('Erro ao salvar dados');
    } else {
      toast.success('Dados salvos com sucesso');
    }
  } catch (err) {
    console.error('Erro inesperado ao salvar:', err);
    toast.error('Erro inesperado');
  }
}

function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, '') // Remove tudo que não é dígito
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18); // Limita a 18 caracteres
}
  return (
    <>
      <SubHeader
        title="Minha Conta"
        breadcrumb={[
          { label: 'Administração', href: '/admin/profile' },
          { label: 'Minha Conta', active: true }
        ]}
      />

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* BLOCO DE INFORMAÇÕES PESSOAIS */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-semibold text-gray-600">Dados do Administrador</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome</label>
              <input
                type="text"
                className="border rounded px-2 py-1 text-xs w-full"
                value={userData.first_name}
                onChange={(e) => setUserData({ ...userData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Sobrenome</label>
              <input
                type="text"
                className="border rounded px-2 py-1 text-xs w-full"
                value={userData.last_name}
                onChange={(e) => setUserData({ ...userData, last_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Telefone</label>
              <input
                type="text"
                className="border rounded px-2 py-1 text-xs w-full"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">E-mail</label>
              <input
                type="text"
                className="border rounded px-2 py-1 text-xs w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                value={userData.email}
                readOnly
                disabled
              />
            </div>
          </div>

          <label className="flex items-center space-x-2 text-xs text-gray-600 pt-2">
            <input
              type="checkbox"
              checked={userData.wants_updates}
              onChange={(e) => setUserData({ ...userData, wants_updates: e.target.checked })}
            />
            <span>Quero receber novidades e dicas sobre o SingleKey</span>
          </label>
        </section>

        {/* BLOCO DE ENDEREÇO */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-600">Dados da Empresa</h2>
          <div className="flex gap-4">
            {/* Campo CNPJ */}
            <div className="w-1/2">
              <label className="text-xs text-gray-500 mb-1 block">CNPJ</label>
              <input
                type="text"
                className="border rounded px-2 py-1 text-xs w-full"
                value={formatCNPJ(userData.cnpj)}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    cnpj: e.target.value.replace(/\D/g, ''),
                  })
                }
              />
            </div>

            {/* Campo Papel na Empresa */}
            <div className="w-1/2">
              <label className="text-xs text-gray-500 mb-1 block">Papel na Empresa</label>
              <RoleSelector
                value={userData.role_in_org}
                onChange={(val) => setUserData({ ...userData, role_in_org: val })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['Nome da Empresa', 'name'],
              ['CEP', 'cep'],
              ['Endereço', 'endereco'],
              ['Número', 'numero'],
              ['Complemento', 'complemento'],
              ['Bairro', 'bairro'],
              ['Cidade', 'cidade'],
              ['Estado', 'estado'],
            ].map(([label, field]) => (
              <div key={field}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  type="text"
                  className="border rounded px-2 py-1 text-xs w-full"
                  value={orgData[field as keyof typeof orgData]}
                  onChange={(e) => setOrgData({ ...orgData, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </section>

        {/* BOTÃO FINAL */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-6 rounded-lg"
          >
            Salvar Alterações
          </button>
        </div>

        {/* BLOCO DE EXCLUSÃO */}
        <div className="pt-6">
          <ConfirmDeleteSection orgName={orgData.name} />
        </div>
      </div>
    </>
  );
}
