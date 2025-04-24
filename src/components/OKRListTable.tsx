import React, { useState, useRef, useEffect } from 'react';
import { Save, Trash2, Eye, EyeOff, X, ListStart, ListEnd } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useModalStore } from '../stores/modalStore';
import { useOKRStore } from '../stores/okrStore'; 
import { KeyResultRow } from './KeyResultRow';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../stores/notificationStore';
import { Modal } from './Modal';
import { useNavigate } from 'react-router-dom';



interface OKR {
  id: string;
  objective: string;
  type: 'strategic' | 'tactical' | 'operational';
  status: string;
  keyResults: Array<{
    id: string;
    text: string;
    metric?: string;
    initial_value?: number | null;
    current_value?: number | null;
    target_value?: number | null;
    unit?: string;
    progress: number;
    kr_type: 'moonshot' | 'roofshot';
  }>;
}

interface GroupedOKR {
  strategic: OKR;
  children: {
    tactical: OKR;
    children: OKR[];
  }[];
}

interface OKRListTableProps {
  grouped: GroupedOKR[] | undefined;
  unlinked: OKR[] | undefined;
  onUpdateOKR: (okrId: string, updates: Partial<OKR>) => Promise<void>;
  onUpdateKeyResult: (krId: string, updates: Partial<KeyResult>) => Promise<void>;
  onDeleteOKR: (okrId: string) => Promise<void>;
  onDeleteKeyResult: (krId: string) => Promise<void>;    
  readOnly?: boolean;
}

export function OKRListTable({
  grouped,
  unlinked,
  onUpdateOKR,
  onUpdateKeyResult,
  onDeleteOKR,
  onDeleteKeyResult,
  readOnly = false,
}: OKRListTableProps) {
  const [expandedOKRs, setExpandedOKRs] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const { createKeyResult, deleteKeyResult, deleteOKR } = useOKRStore();
  const { confirm, showModal } = useModalStore();
  const { notifications, markAsRead } = useNotificationStore();
  const checkinNotification = notifications.find(
    (n) => n.type === 'checkin_reminder' && !n.read
  );

  const navigate = useNavigate();
  const [showCheckinButton, setShowCheckinButton] = useState(false);


  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetId: string | null;
    targetType: 'okr' | 'kr' | null;
    parentOkrId?: string | null;
  }>({
    isOpen: false,
    targetId: null,
    targetType: null,
    parentOkrId: null,
  });

  const confirmDelete = async () => {
  const { targetId, targetType, parentOkrId } = confirmModal;
  if (!targetId || !targetType) return;

  if (targetType === 'okr') {
    await onDeleteOKR(targetId);
  } else if (targetType === 'kr' && parentOkrId) {
    await onDeleteKeyResult(targetId, parentOkrId);
  }

  setConfirmModal({ isOpen: false, targetId: null, targetType: null, parentOkrId: null });
};

const cancelDelete = () => {
  setConfirmModal({ isOpen: false, targetId: null, targetType: null, parentOkrId: null });
};

  
  const { keyResults, selectedCycleId } = useOKRStore(); // ✅ OK AQUI
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) setSession(data.session);
    };
    getSession();
  }, []);
  
  const updateKeyResult = useOKRStore((s) => s.updateKeyResult);
  const updateOKR = useOKRStore((s) => s.updateOKR);

  const safeGrouped = Array.isArray(grouped) ? grouped : [];
  const safeUnlinked = Array.isArray(unlinked) ? unlinked : [];

  const handleNumericInput = (
    okrId: string,
    krId: string,
    field: 'initial_value' | 'current_value' | 'target_value',
    value: string
  ) => {
    const parsed = Number(value);
    const numericValue = isNaN(parsed) ? 0 : parsed;
    updateKeyResult(krId, { [field]: numericValue });
  };

  const handleRegisterCheckin = async () => {
  const today = new Date().toLocaleDateString('sv-SE');

  console.log('[🧠 Session]', session);
  console.log('[📦 KeyResults]', keyResults);

  const payload = keyResults.map((kr) => ({
    key_result_id: kr.id,
    date: today,
    progress: kr.progress ?? 0,
    confidence_flag: kr.checkins?.[kr.checkins.length - 1]?.confidence_flag ?? null,
    user_id: session?.user.id,
  }));

  const { data: existing, error: fetchError } = await supabase
    .from('key_result_checkins')
    .select('key_result_id, date')
    .in('key_result_id', keyResults.map((kr) => kr.id))
    .eq('date', today);


  if (fetchError) {
    console.error('[❌ Erro ao verificar check-ins existentes]', fetchError);
    return await showModal({
      title: 'Erro ao verificar check-ins',
      message: 'Não foi possível verificar se os check-ins de hoje já foram feitos. Tente novamente.',
      confirmText: 'OK',
      hideCancel: true,
    });
  }

  const existingMap = new Set(existing.map((row) => `${row.key_result_id}-${row.date}`));
  const filteredPayload = payload.filter((item) => {
    const key = `${item.key_result_id}-${item.date}`;
    return !existingMap.has(key);
  });

  console.log('[⚙️ Payload final do check-in]', filteredPayload);

  if (filteredPayload.length === 0) {
    return await showModal({
      title: 'Check-in já registrado',
      message: 'Os check-ins de hoje já haviam sido registrados anteriormente.',
      confirmText: 'OK',
      hideCancel: true,
    });
  }
    
  console.log('[🕵️‍♂️ today no momento do insert]', today);
  const { error: insertError, data: inserted } = await supabase
    .from('key_result_checkins')
    .insert(filteredPayload);

  console.log('[📥 Insert retorno]', inserted);
  if (insertError) {
    console.error('[❌ Erro ao registrar check-in]', insertError);
    return await showModal({
      title: 'Erro ao registrar check-in',
      message: 'Não foi possível registrar os dados de check-in. Tente novamente mais tarde.',
      confirmText: 'OK',
      hideCancel: true,
    });
  }

   if (checkinNotification) {
    await markAsRead(checkinNotification.id);
    await useNotificationStore.getState().fetchNotifications(session?.user.id); // ← aqui
  }

  await showModal({
    title: 'Check-in realizado!',
    message: 'O check-in foi registrado com sucesso para todos os KRs deste ciclo.',
    confirmText: 'OK',
    hideCancel: true,
  });
};


  const usedIds = new Set<string>();
  safeGrouped.forEach(group => {
    usedIds.add(group.strategic.id);
    group.children.forEach(t => {
      usedIds.add(t.tactical.id);
      t.children.forEach(op => usedIds.add(op.id));
    });
  });

  const toggleExpand = (okrId: string) => {
    setExpandedOKRs((prev) => {
      const newSet = new Set(prev);
      newSet.has(okrId) ? newSet.delete(okrId) : newSet.add(okrId);
      return newSet;
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-green-400';
    if (progress >= 50) return 'bg-yellow-400';
    if (progress >= 30) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const renderOKRRow = (
    okr: OKR,
    options?: { rowClass?: string; prefix?: string; readOnly?: boolean }
  ) => {
    const isExpanded = expandedOKRs.has(okr.id);
    const prefix = options?.prefix || '';
    const rowClass = options?.rowClass || '';
    const keyResults = okr.keyResults ?? [];
    const rowReadOnly = options?.readOnly ?? readOnly;

    return (
      <React.Fragment key={okr.id}>
        <tr className={clsx(
          'border-b transition-colors',
          isExpanded ? 'bg-gray-100' : 'bg-white',
          'hover:bg-gray-100',
          rowClass
        )}>
          <td className="w-4/6 px-3 py-4">
            <div className="w-full flex items-start pl-[8px]">
              {prefix && <span className="text-gray-700 pt-2 pl-2 select-none min-w-[18px]">{prefix}</span>}
              <input 
                disabled={rowReadOnly}
                defaultValue={okr.objective}
                onBlur={(e) => updateOKR(okr.id, { objective: e.target.value })}
                placeholder="Digite aqui o seu objetivo..."
                className="w-full outline-none ring-1 ring-gray-300 bg-transparent break-words text-xs md:text-sm leading-snug hover:ring-2 hover:ring-gray-400 transition focus:ring-2 focus:ring-black rounded-lg p-2 md:p-3 ml-2"
              />
            </div>
          </td>
          <td className="w-1/6 px-6 py-4">
            <select
              value={okr.type}
              onChange={(e) => updateOKR(okr.id, { type: e.target.value as 'strategic' | 'tactical' | 'operational' })}
              disabled={usedIds.has(okr.id) || rowReadOnly}
              className={clsx(
                "block w-full rounded-lg border text-xs md:text-sm p-1.5 md:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition",
                (usedIds.has(okr.id) || rowReadOnly) && "opacity-60 cursor-not-allowed bg-gray-100"
              )}
            >
              <option value="">Selecione o Nível</option>
              <option value="strategic">Estratégico</option>
              <option value="tactical">Tático</option>
              <option value="operational">Operacional</option>
            </select>
          </td>
          <td className="px-6 py-4">
            <span className={clsx(
              'px-2 inline-flex text-sm p-1 leading-5 font-semibold rounded-full',
              {
                'bg-green-100 text-green-800': okr.status === 'active',
                'bg-yellow-100 text-yellow-800': okr.status === 'draft',
                'bg-gray-100 text-gray-800': okr.status === 'archived',
              }
            )}>
              {okr.status}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleExpand(okr.id)}
                title={expandedOKRs.has(okr.id) ? 'Ocultar KRs' : 'Ver KRs'}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                {expandedOKRs.has(okr.id) ? (
                  <>
                    {/* <ListEnd className="w-4 h-4" /> */}
                    Ocultar KRs
                  </>
                ) : (
                  <>
                    {/* <ListStart className="w-4 h-4" /> */}
                    Ver KRs
                  </>
                )}
              </button>
              <button
                  onClick={() =>
                    setConfirmModal({ isOpen: true, targetId: okr.id, targetType: 'okr' })
                  }
                  disabled={rowReadOnly}
                >
                <X className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </td>
        </tr>

        {isExpanded && (
          <tr>
            <td colSpan={4} className={clsx('border-b bg-white')}>
              <div className="space-y-4 p-5">
                {keyResults.map((kr) => (
                  <KeyResultRow
                    key={kr.id}
                    kr={kr}
                    okrId={okr.id}
                    updateKeyResult={onUpdateKeyResult}
                    handleNumericInput={handleNumericInput}
                    handleDeleteKeyResult={(krId: string) =>
                      setConfirmModal({
                        isOpen: true,
                        targetId: krId,
                        targetType: 'kr',
                        parentOkrId: okr.id,
                      })
                    }
                    getProgressColor={getProgressColor}
                    readOnly={rowReadOnly}
                  />
                ))}
                <div className="w-full mt-4 justify-center text-center p-0">
                  <button
                    onClick={() => createKeyResult(okr.id)}
                    className="text-sm text-blue-600 hover:underline justify-center text-center"
                    disabled={rowReadOnly}
                  >
                    + Adicionar Novo Key Result
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const renderMobileOKRRow = (okr: OKR, prefix: string) => {
  const isExpanded = expandedOKRs.has(okr.id);
  const keyResults = okr.keyResults ?? [];
  const rowReadOnly = readOnly || false;

  return (
    <div key={okr.id} className="bg-white p-3 rounded border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>{prefix}</span>
          <span className="text-sm px-2 py-0.5 bg-gray-100 rounded">{okr.type}</span>
        </div>
        <span className={clsx(
          'text-[10px] px-2 py-0.5 rounded-full',
          {
            'bg-green-100 text-green-800': okr.status === 'active',
            'bg-yellow-100 text-yellow-800': okr.status === 'draft',
            'bg-gray-100 text-gray-800': okr.status === 'archived',
          }
        )}>{okr.status}</span>
      </div>

      <>
        {/* Mobile: textarea */}
        <textarea
          disabled={rowReadOnly}
          defaultValue={okr.objective}
          onBlur={(e) => updateOKR(okr.id, { objective: e.target.value })}
          placeholder="Digite aqui o seu objetivo..."
          rows={3}
          className="block md:hidden w-full text-sm ring-1 ring-gray-300 rounded px-3 py-2 resize-none"
        />
      
        {/* Desktop: input */}
        <input
          disabled={rowReadOnly}
          defaultValue={okr.objective}
          onBlur={(e) => updateOKR(okr.id, { objective: e.target.value })}
          placeholder="Digite aqui o seu objetivo..."
          className="hidden md:block w-full text-sm ring-1 ring-gray-300 rounded px-3 py-2"
        />
      </>

      <select
        value={okr.type}
        onChange={(e) => updateOKR(okr.id, { type: e.target.value as OKR['type'] })}
        disabled={rowReadOnly}
        className="w-full text-sm ring-1 ring-gray-300 rounded px-3 py-2"
      >
        <option value="">Nível</option>
        <option value="strategic">Estratégico</option>
        <option value="tactical">Tático</option>
        <option value="operational">Operacional</option>
      </select>

      <div className="flex justify-end items-center gap-2">
        <button onClick={() => toggleExpand(okr.id)}>
          {isExpanded
            ? <ListEnd className="w-4 h-4 text-blue-600" />
            : <ListStart className="w-4 h-4 text-gray-600" />}
        </button>
        <button onClick={() => onDeleteOKR(okr.id)} disabled={rowReadOnly}>
          <X className="w-4 h-4 text-red-500" />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {keyResults.map((kr) => (
            <KeyResultRow
              key={kr.id}
              kr={kr}
              okrId={okr.id}
              updateKeyResult={onUpdateKeyResult}
              handleNumericInput={handleNumericInput}
              handleDeleteKeyResult={onDeleteKeyResult}
              getProgressColor={getProgressColor}
              readOnly={rowReadOnly}
            />
          ))}
          <button
            onClick={() => createKeyResult(okr.id)}
            className="text-sm text-blue-600 hover:underline w-full text-center"
            disabled={rowReadOnly}
          >
            + Adicionar Novo Key Result
          </button>
        </div>
      )}
    </div>
  );
};


  return (
<>
  {/* Botão de Check-in */}
  {!readOnly && (
    <div className="flex justify-end p-4">
      <button
        onClick={handleRegisterCheckin}
        className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition"
      >
        📅 Registrar Check-in
      </button>
    </div>
  )}
  <div className={clsx(
    "bg-white shadow-md rounded-xl",
    readOnly && "opacity-50 pointer-events-none"
  )}>

    {/* MOBILE (sm) */}
    <div className="md:hidden p-2 space-y-3">
      {safeGrouped.map(({ strategic, children }) => (
        <React.Fragment key={strategic.id}>
          {renderMobileOKRRow(strategic, '★ ')}
          {children.map(({ tactical, children: ops }) => (
            <React.Fragment key={tactical.id}>
              {renderMobileOKRRow(tactical, '↳ ')}
              {ops.map(op => renderMobileOKRRow(op, '↳↳ '))}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      {safeUnlinked.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-blue-700">OKRs sem vínculo</h2>
          {safeUnlinked.map((okr) => renderMobileOKRRow(okr, ''))}
        </>
      )}
    </div>

    {/* DESKTOP (md+) */}
    <div className="hidden md:block w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <tbody className="bg-white divide-y divide-gray-200">
          {safeGrouped.length > 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-3 text-sm text-gray-500 bg-gray-200">
                <h2 className="p-3 text-lg text-blue-600 font-bold">OKRs com vínculos entre objetivos</h2>
              </td>
            </tr>
          )}
          {safeGrouped.map(({ strategic, children }) => (
            <React.Fragment key={strategic.id}>
              {renderOKRRow(strategic, { rowClass: 'bg-gray-100', prefix: '★ ', readOnly })}
              {children.map(({ tactical, children: ops }) => (
                <React.Fragment key={tactical.id}>
                  {renderOKRRow(tactical, { rowClass: 'bg-gray-100', prefix: '↳ ', readOnly })}
                  {ops.map(op => renderOKRRow(op, { rowClass: 'bg-gray-100', prefix: '↳↳ ', readOnly }))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
          {safeUnlinked.length > 0 && (
            <>
              <tr>
                <td colSpan={4} className="px-6 py-3 text-sm text-gray-500 font-bold bg-gray-200">
                  <h2 className="p-3 text-lg text-blue-600 font-bold">OKRs sem vínculos entre objetivos</h2>
                </td>
              </tr>
              {safeUnlinked.map((okr) => renderOKRRow(okr, { rowClass: 'bg-white', prefix: '', readOnly }))}
            </>
          )}
        </tbody>
      </table>
    </div>
    <Modal
      isOpen={confirmModal.isOpen}
      onClose={cancelDelete}
      title="Confirmar Exclusão"
      type="warning"
      actions={
        <>
          <button
            onClick={cancelDelete}
            className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
          >
            Excluir
          </button>
        </>
      }
    >
      Tem certeza que deseja excluir este {confirmModal.targetType === 'okr' ? 'objetivo' : 'resultado-chave'}?
    </Modal>
  </div>
  </>
);

}
