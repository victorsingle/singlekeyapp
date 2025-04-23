import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Connection,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import { useReactFlow } from 'reactflow'; 
import 'reactflow/dist/style.css';
import { useOKRStore } from '../stores/okrStore';
import { Target, Workflow, Settings, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'strategic':
      return <Target className="w-5 h-5 text-orange-600" />;
    case 'tactical':
      return <Workflow className="w-5 h-5 text-purple-600" />;
    case 'operational':
      return <Settings className="w-5 h-5 text-blue-600" />;
    default:
      return null;
  }
};

const getTypeStyles = (type: string) => {
  switch (type) {
    case 'strategic':
      return 'border-orange-200 bg-orange-50';
    case 'tactical':
      return 'border-purple-200 bg-purple-50';
    case 'operational':
      return 'border-blue-200 bg-blue-50';
    default:
      return 'border-gray-200 bg-white';
  }
};

function OKRNode({ data, id }: { data: any; id: string }) {
  return (
    <div className={clsx(
      'rounded-lg shadow-lg p-4 border-2 min-w-[300px]',
      getTypeStyles(data.type)
    )}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      
      <div className="flex items-center gap-2 mb-3">
        {getTypeIcon(data.type)}
        <span className="font-medium text-gray-600 capitalize">{data.type}</span>
      </div>
      
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">{data.objective}</h3>
      
      <div className="space-y-3">
        {data.keyResults?.map((kr: any, index: number) => (
          <div key={kr.id} className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">KR {index + 1}</div>
                <div className="text-gray-800">{kr.text}</div>
              </div>
            </div>
            
            <div className="mt-2 flex items-center">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${kr.progress}%` }}
                />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">
                {kr.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
}

const nodeTypes = {
  okr: OKRNode,
};
 
export function OKRRelationMap() {
  const { okrs, links, createLink, deleteLink } = useOKRStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView  } = useReactFlow();
  // Transform OKRs into nodes
  useEffect(() => {
    const newNodes: Node[] = okrs.map((okr, index) => ({
      id: okr.id,
      type: 'okr',
      position: { 
        x: 100 + (index % 3) * 450, 
        y: 100 + Math.floor(index / 3) * 400 
      },
      data: okr,
      draggable: true,
    }));
    setNodes(newNodes);
  }, [okrs, setNodes]);

  
  useEffect(() => {
  if (nodes.length > 0) {
    // aguarda o próximo frame para garantir que tudo foi renderizado
    requestAnimationFrame(() => {
      fitView({ padding: 1 }, { duration: 500 });
    });
  }
}, [nodes, fitView]);

  // Transform links into edges
  useEffect(() => {
    const newEdges: Edge[] = links.map((link) => ({
      id: link.id,
      source: link.source_id,
      target: link.target_okr_id,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: {
        strokeWidth: 4,
        stroke: link.link_type === 'tactical_to_strategic' ? '#8b5cf6' : '#3b82f6',
      },
      animated: true,
    }));
    setEdges(newEdges);
  }, [links, setEdges]);

  const onConnect = useCallback(
  (connection: Connection) => {
    if (connection.source && connection.target) {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      console.log('[⚡ Conexão]', { source: sourceNode, target: targetNode });

      if (sourceNode && targetNode) {
        const sourceType = sourceNode.data.type;
        const targetType = targetNode.data.type;

        console.log('[🎯 CONECTANDO]', {
          source: sourceNode.id,
          target: targetNode.id,
          sourceType,
          targetType,
        });

        let linkType: 'tactical_to_strategic' | 'operational_to_tactical' | null = null;

        if (sourceType === 'tactical' && targetType === 'strategic') {
          linkType = 'tactical_to_strategic';
        } else if (sourceType === 'operational' && targetType === 'tactical') {
          linkType = 'operational_to_tactical';
        } else {
          alert('Conexão inválida. Só é permitido:\n• Tático → Estratégico\n• Operacional → Tático');
          return;
        }

        createLink(connection.source, connection.target, linkType);
      }
    }
  },
  [nodes, createLink]
);


  const onEdgeDelete = useCallback(
    (edge: Edge) => {
      deleteLink(edge.id);
    },
    [deleteLink]
  );

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={(_, edge) => onEdgeDelete(edge)}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { strokeWidth: 4 },
          animated: true,
        }}
        isValidConnection={({ source, target }) => {
          const sourceNode = nodes.find(n => n.id === source);
          const targetNode = nodes.find(n => n.id === target);
          if (!sourceNode || !targetNode) return false;
      
          const sourceType = sourceNode.data.type;
          const targetType = targetNode.data.type;
      
          return (
            (sourceType === 'tactical' && targetType === 'strategic') ||
            (sourceType === 'operational' && targetType === 'tactical')
          );
        }}
      >
        <Background gap={10} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default OKRRelationMap;