import React, { useState, useEffect } from 'react';
import { X, CalendarPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { clearOutdatedCheckinReminder } from '../lib/notifications';
import { useCycleStore } from '../stores/okrCycleStore';

interface CycleFormProps {
  cycle?: any;
  onClose: () => void;
  onSubmit: () => void;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

export function CycleForm({ cycle, onClose, onSubmit }: CycleFormProps) {
  const { createCycle, updateCycle } = useCycleStore();

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    strategic_theme: '',
  });

  const [checkins, setCheckins] = useState<string[]>([]);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempDate, setTempDate] = useState('');

  const isReadOnly = ['completed', 'closed', 'done'].includes(cycle?.status);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!cycle) return;

    setFormData({
      name: cycle.name || '',
      start_date: cycle.startDateText || '',
      end_date: cycle.endDateText || '',
      strategic_theme: cycle.strategicTheme || '',
    });

    const fetchCheckins = async () => {
      try {
        if (Array.isArray(cycle.checkins) && cycle.checkins.length > 0) {
          setCheckins(cycle.checkins.map((c: any) => c.checkin_date));
          return;
        }

        const { data, error } = await supabase
          .from('okr_checkins')
          .select('checkin_date')
          .eq('cycle_id', cycle.id)
          .order('checkin_date', { ascending: true });

        if (error) {
          console.error('[❌ Erro ao buscar checkins]', error);
          return;
        }

        if (data) {
          setCheckins(data.map((c) => c.checkin_date));
        }
      } catch (err) {
        console.error('[❌ Falha inesperada no fetch de checkins]', err);
      }
    };

    fetchCheckins();
  }, [cycle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { organizationId, userId } = useAuthStore.getState();
      if (!organizationId || !userId) return;

      let cycleId = cycle?.id;
      const now = new Date();
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      let status = 'draft';
      if (now >= startDate && now <= endDate) status = 'active';
      else if (now > endDate) status = 'completed';

      const payload = {
        ...formData,
        organization_id: organizationId,
        user_id: userId,
        status,
      };

      if (cycle) {
        await updateCycle(cycle.id, payload);
      } else {
        cycleId = await createCycle(payload);
        // ✅ Define o ciclo recém-criado como selecionado
       useCycleStore.getState().setSelectedCycleId(cycleId);
      }

      await supabase.from('okr_checkins').delete().eq('cycle_id', cycleId);

      const insertPayload = checkins
        .filter(date => !!date)
        .map(date => ({ cycle_id: cycleId, checkin_date: date }));

      if (insertPayload.length > 0) {
        const { error: insertError } = await supabase
          .from('okr_checkins')
          .insert(insertPayload);
        if (insertError) return;
      }

      await clearOutdatedCheckinReminder(cycleId, userId);
      onSubmit();
    } catch (error) {
      console.error('[❌ Erro ao salvar ciclo e check-ins]', error);
    }
  };

  const openCheckinEditor = (index: number | null = null) => {
    setEditingIndex(index);
    setTempDate(index !== null ? checkins[index] : '');
    setShowCheckinModal(true);
  };

  const handleSaveCheckin = () => {
    const updated = [...checkins];
    if (editingIndex !== null) {
      updated[editingIndex] = tempDate;
    } else {
      updated.push(tempDate);
    }
    setCheckins(updated);
    setShowCheckinModal(false);
    setTempDate('');
    setEditingIndex(null);
  };

  return (
    <div id="cycle-form-modal" className="p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {cycle ? 'Editar Ciclo' : 'Novo Ciclo'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Ciclo</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              onFocus={(e) => e.target.showPicker?.()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
            <input
              type="date"
              id="end_date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              onFocus={(e) => e.target.showPicker?.()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="strategic_theme" className="block text-sm font-medium text-gray-700 mb-1">Tema Estratégico</label>
          {isMobile ? (
            <textarea
              id="strategic_theme"
              className="w-[calc(100%-1rem)] border text-sm rounded py-2 px-2 resize-none overflow-hidden leading-snug min-h-[3.5rem] box-content whitespace-pre-wrap break-words"
              value={formData.strategic_theme}
              rows={1}
              onInput={(e) => {
                const target = e.currentTarget;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              onChange={(e) => setFormData({ ...formData, strategic_theme: e.target.value })}
            />
          ) : (
            <input
              type="text"
              id="strategic_theme"
              value={formData.strategic_theme}
              onChange={(e) => setFormData({ ...formData, strategic_theme: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          )}
        </div>

        {/* CHECKINS */}
        {!isReadOnly && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programar Check-ins
            </label>

            {checkins.length === 0 && (
              <p className="text-sm text-gray-500 italic">Ainda não há check-ins programados.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {checkins.map((date, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                  <span onClick={() => openCheckinEditor(index)} className="cursor-pointer">
                    {new Intl.DateTimeFormat('pt-BR').format(new Date(date))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCheckins(checkins.filter((_, i) => i !== index))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => openCheckinEditor(null)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <CalendarPlus className="w-4 h-4" />
                Adicionar Check-in
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {cycle ? 'Salvar Alterações' : 'Criar Ciclo'}
          </button>
        </div>
      </form>

      {/* MODAL DE CHECK-IN */}
      {showCheckinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">{editingIndex !== null ? 'Editar' : 'Novo'} Check-in</h3>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              onFocus={(e) => e.target.showPicker?.()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowCheckinModal(false)} className="text-sm text-gray-500">Cancelar</button>
              <button onClick={handleSaveCheckin} className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
