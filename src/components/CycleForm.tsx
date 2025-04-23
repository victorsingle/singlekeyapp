import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOKRStore } from '../stores/okrStore';

interface CycleFormProps {
  cycle?: any;
  onClose: () => void;
  onSubmit: () => void;
}

export function CycleForm({ cycle, onClose, onSubmit }: CycleFormProps) {
  const { createCycle, updateCycle } = useOKRStore();
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    strategic_theme: '',
  });

  const [checkins, setCheckins] = useState<string[]>([]);
  
  const isReadOnly = ['completed', 'closed', 'done'].includes(cycle?.status);
  
  useEffect(() => {
  if (!cycle) return;

  setFormData({
    name: cycle.name,
    start_date: cycle.start_date_text || '',
    end_date: cycle.end_date_text || '',
    strategic_theme: cycle.strategic_theme || '',
  });

  const fetchCheckins = async () => {
    try {
      // se tiver checkins válidos no ciclo, usa eles
      if (Array.isArray(cycle.checkins) && cycle.checkins.length > 0) {
        setCheckins(cycle.checkins.map((c: any) => c.checkin_date));
        return;
      }

      // senão, busca do supabase
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
      let cycleId = cycle?.id;
  
      if (cycle) {
        await updateCycle(cycle.id, formData);
      } else {
        cycleId = await createCycle(formData); // agora retorna o id
      }
  
      // 🔄 Remove check-ins anteriores (em modo edição)
      await supabase.from('okr_checkins').delete().eq('cycle_id', cycleId);
  
      // ➕ Insere os check-ins atuais
      const insertPayload = checkins
        .filter(date => !!date)
        .map(date => ({
          cycle_id: cycleId,
          checkin_date: date,
        }));
  
      if (insertPayload.length > 0) {
        const { error: insertError } = await supabase
          .from('okr_checkins')
          .insert(insertPayload);
  
        if (insertError) {
          console.error('[❌ Erro ao inserir check-ins]', insertError);
          return;
        }
      }
  
      onSubmit();
    } catch (error) {
      console.error('[❌ Erro ao salvar ciclo e check-ins]', error);
    }
  };


  return (
    <div className="max-h-[90vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {cycle ? 'Editar Ciclo' : 'Novo Ciclo'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
  
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Ciclo
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
  
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Início
            </label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
  
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Término
            </label>
            <input
              type="date"
              id="end_date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
  
        <div>
          <label htmlFor="strategic_theme" className="block text-sm font-medium text-gray-700 mb-1">
            Tema Estratégico
          </label>
          <input
            type="text"
            id="strategic_theme"
            value={formData.strategic_theme}
            onChange={(e) => setFormData({ ...formData, strategic_theme: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* BLOCO DE CHECKINS */}
        {!isReadOnly && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lembrete de Check-in
          </label>
        
              {/* Lista de datas */}
              <div className="space-y-2">
                {checkins.map((date, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        const updated = [...checkins];
                        updated[index] = e.target.value;
                        setCheckins(updated);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...checkins];
                        updated.splice(index, 1);
                        setCheckins(updated);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            
              {/* Botão alinhado à direita */}
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => setCheckins([...checkins, ''])}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-3 rounded"
                >
                  + Adicionar Check-in
                </button>
              </div>
            </div>
      )}
        {/* FIM DO BLOCO DE CHECKINS */}
  
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {cycle ? 'Salvar Alterações' : 'Criar Ciclo'}
          </button>
        </div>
      </form>
    </div>
  );


}