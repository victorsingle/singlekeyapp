export const mockUsers = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@exemplo.com',
    role: 'Admin',
    team: 'Time de Produto',
    status: 'Ativo',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@exemplo.com',
    role: 'Membro',
    team: 'Time de Marketing',
    status: 'Ativo',
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@exemplo.com',
    role: 'Líder',
    team: 'Time de Vendas',
    status: 'Pendente',
  },
];

export const mockTeams = [
  {
    id: '1',
    name: 'Time de Produto',
    memberCount: 8,
    leader: 'João Silva',
  },
  {
    id: '2',
    name: 'Time de Marketing',
    memberCount: 5,
    leader: 'Maria Santos',
  },
  {
    id: '3',
    name: 'Time de Vendas',
    memberCount: 6,
    leader: 'Pedro Oliveira',
  },
];

export const mockTeamMembers = {
  '1': [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@exemplo.com',
      isLeader: true,
      joinedAt: '01/01/2024',
    },
    {
      id: '2',
      name: 'Ana Costa',
      email: 'ana.costa@exemplo.com',
      isLeader: false,
      joinedAt: '15/01/2024',
    },
    {
      id: '3',
      name: 'Carlos Souza',
      email: 'carlos.souza@exemplo.com',
      isLeader: false,
      joinedAt: '01/02/2024',
    },
  ],
};