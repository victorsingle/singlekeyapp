// Mock data for development and testing
import { v4 as uuid } from 'uuid';

const okrStrategicId = uuid();
const okrTacticalId = uuid();
const okrOperationalId = uuid();

export const mockOKRs = [
  {
    id: okrStrategicId,
    objective: 'Expandir Presença no Mercado Global',
    type: 'strategic',
    status: 'active',
    keyResults: [
      {
        id: 'kr1',
        text: 'Expandir operações para 3 novos mercados internacionais',
        progress: 33,
        status: 'active'
      },
      {
        id: 'kr2',
        text: 'Aumentar receita internacional em 50%',
        progress: 45,
        status: 'active'
      }
    ]
  },
  {
    id: okrTacticalId,
    objective: 'Melhorar Experiência do Cliente',
    type: 'tactical',
    status: 'active',
    keyResults: [
      {
        id: 'kr3',
        text: 'Reduzir tempo médio de resposta para 2 horas',
        progress: 75,
        status: 'active'
      },
      {
        id: 'kr4',
        text: 'Aumentar NPS para 70',
        progress: 80,
        status: 'active'
      }
    ]
  },
  {
    id: okrOperationalId,
    objective: 'Otimizar Processos Operacionais',
    type: 'operational',
    status: 'active',
    keyResults: [
      {
        id: 'kr5',
        text: 'Automatizar 5 processos manuais críticos',
        progress: 60,
        status: 'active'
      },
      {
        id: 'kr6',
        text: 'Reduzir tempo de processamento em 30%',
        progress: 40,
        status: 'active'
      }
    ]
  }
];
export const mockLinks = [
  {
    id: uuid(),
    source_id: okrTacticalId,
    target_okr_id: okrStrategicId,
    link_type: 'tactical_to_strategic',
  },
  {
    id: uuid(),
    source_id: okrOperationalId,
    target_okr_id: okrTacticalId,
    link_type: 'operational_to_tactical',
  }
];