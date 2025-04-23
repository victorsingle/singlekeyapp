import { OKR, OKRLink } from '@/types/okr';

type GroupedOKR = {
  strategic: OKR;
  children: {
    tactical: OKR;
    children: OKR[];
  }[];
};

export function groupOKRsByHierarchy(okrs: OKR[], links: OKRLink[]): GroupedOKR[] {
  if (!Array.isArray(okrs) || !Array.isArray(links)) return [];
 
  const parentMap = new Map<string, string>();
  for (const link of links) {
    parentMap.set(link.target_okr_id, link.source_okr_id);
  }

  const okrById = new Map(okrs.map(okr => [okr.id, okr]));
  const groupedMap = new Map<string, GroupedOKR>();
  const tacticalMap = new Map<string, TacticalGroup>(); // auxiliar

  // Estratégicos
  for (const okr of okrs) {
    if (okr.type === 'strategic') {
      groupedMap.set(okr.id, {
        strategic: okr,
        children: [],
      });
    }
  }

  // Táticos
  for (const okr of okrs) {
    if (okr.type !== 'tactical') continue;

    const parentId = parentMap.get(okr.id);
    const parent = parentId ? okrById.get(parentId) : null;
    if (!parent || parent.type !== 'strategic') continue;

    const group = groupedMap.get(parent.id);
    if (!group) continue;

    const tacticalGroup: TacticalGroup = { tactical: okr, children: [] };
    group.children.push(tacticalGroup);
    tacticalMap.set(okr.id, tacticalGroup); // 👈 mapeia para o próximo passo
  }

  // Operacionais
  for (const okr of okrs) {
    if (okr.type !== 'operational') continue;

    const parentId = parentMap.get(okr.id);
    const tacticalGroup = parentId ? tacticalMap.get(parentId) : null;
    if (!tacticalGroup) continue;

    tacticalGroup.children.push(okr);
  }

  return Array.from(groupedMap.values());
}















