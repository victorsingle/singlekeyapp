import { OKR, OKRLink } from '@/types/okr';

// export function getUnlinkedOKRs(okrs: OKR[], links: OKRLink[]): OKR[] {
//   const linkedIds = new Set<string>();

//   for (const link of links) {
//     linkedIds.add(link.source_id);
//     linkedIds.add(link.target_id);
//   }

//   return okrs.filter((okr) => !linkedIds.has(okr.id));
// }
export function getUnlinkedOKRs(okrs: OKR[], usedIds: Set<string>): OKR[] {
  return okrs.filter((okr) => !usedIds.has(okr.id));
}
