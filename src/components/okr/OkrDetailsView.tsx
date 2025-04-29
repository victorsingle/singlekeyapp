import React from 'react';
import { OKRCardEditable } from '../OKRCardEditable';
import { useOKRStore } from '../../stores/okrStore';

export function OkrDetailsView({ okrs }) {
  const { keyResults, expandedIds, toggleExpand } = useOKRStore();

  return (
    <div className="space-y-4">
      {okrs.map((okr) => (
        <OKRCardEditable
          key={okr.id}
          id={okr.id}
          type={okr.type}
          status={okr.status}
          objective={okr.objective}
          keyResults={keyResults.filter(kr => kr.okr_id === okr.id)}
          expanded={expandedIds.includes(okr.id)}
          onToggleExpand={() => toggleExpand(okr.id)}
        />
      ))}
    </div>
  );
}
