import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Connection,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  BaseEdge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import { useReactFlow } from 'reactflow'; 
import 'reactflow/dist/style.css';
import { useOKRStore } from '../stores/okrStore';
import { Target, Workflow, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useModalStore } from '../stores/modalStore';

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
//  console.log('ENTROU NO OKR NODE')
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isStrategic = data.nodeType === 'strategic';
  const isTactical = data.nodeType === 'tactical';
  const isOperational = data.nodeType === 'operational';
  
  return (
     <div
      className={clsx(
        'rounded-lg shadow-lg p-4 border-2 w-[320px] cursor-pointer transition-all duration-300',
        getTypeStyles(data.type)
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* TARGET HANDLE */}
      {(isTactical || isOperational) && (
        <Handle
          id="target"
          type="target"
          position={Position.Top}
          isConnectable={true}
          className="w-5 h-5 bg-gray-400"
        />
      )}

      <div className="flex items-center gap-2 mb-3">
        {getTypeIcon(data.type)}
        <span className="font-medium text-gray-600 capitalize">{data.type}</span>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2 text-base leading-snug">
        {data.objective}
      </h3>

      {isExpanded && (
        <div className="space-y-3">
          {data.keyResults?.map((kr: any, index: number) => (
            <div key={kr.id} className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">KR {index + 1}</div>
              <div className="text-gray-800">{kr.text}</div>
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
      )}

      {/* SOURCE HANDLE */} 
      {(isTactical || isStrategic) && (
          <Handle
            id="source"
            type="source"
            position={Position.Bottom}
            isConnectable={true}
            className="w-5 h-5 bg-gray-400"
          />
        )}
    </div>
  );
}

const nodeTypes = {
  okr: OKRNode,
};

export function OKRRelationMap({ okrs, links }: { okrs: any[], links: any[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const { showModal } = useModalStore();
  const { createLink, deleteLink, fetchLinks } = useOKRStore();

  // Transform OKRs into nodes
  useEffect(() => {
    const spacingX = 500;
    const spacingY = 250;
    const centerX = 500;

    const grouped = {
      strategic: okrs.filter((okr) => okr.type === 'strategic'),
      tactical: okrs.filter((okr) => okr.type === 'tactical'),
      operational: okrs.filter((okr) => okr.type === 'operational'),
    };

    function distributeHorizontally(list: any[], level: number): Node[] {
      const totalWidth = (list.length - 1) * spacingX;
      return list.map((okr, i) => ({
        id: okr.id,
        type: 'okr',
        position: {
          x: centerX - totalWidth / 2 + i * spacingX,
          y: spacingY * level,
        },
        data: {
          ...okr,
          nodeType: okr.type,
        },
        draggable: true,
      }));
    }

    const newNodes: Node[] = [
      ...distributeHorizontally(grouped.strategic, 0),
      ...distributeHorizontally(grouped.tactical, 1),
      ...distributeHorizontally(grouped.operational, 2),
    ];

    setNodes(newNodes);
  }, [okrs, setNodes]);

  useEffect(() => {
    if (nodes.length > 0) {
      requestAnimationFrame(() => {
        fitView({ padding: 0.9 }, { duration: 500 });
      });
    }
  }, [nodes, fitView]);

 useEffect(() => {
  const okrIds = new Set(okrs.map((okr) => okr.id)); // ✅ garante que os nós existem

  const newEdges: Edge[] = links
    .filter(link => okrIds.has(link.source_okr_id) && okrIds.has(link.target_okr_id))
    .map((link) => ({
      id: link.id,
      source: link.source_okr_id,
      target: link.target_okr_id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: {
        strokeWidth: 4,
        stroke: link.link_type === 'strategic_to_tactical'
          ? '#8b5cf6'
          : link.link_type === 'tactical_to_operational'
          ? '#3b82f6'
          : '#999999',
      },
      animated: true,
    }));

  setEdges(newEdges);
}, [links, okrs, setEdges]);


  const onConnect = useCallback(async (connection: Connection) => {
   // console.log('[⚡ onConnect disparado]', connection);

    
    if (!connection.source || !connection.target) return;

    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return;

    const sourceType = sourceNode.data.nodeType;
    const targetType = targetNode.data.nodeType;

    let linkType = null;

    if (sourceType === 'strategic' && targetType === 'tactical') {
      linkType = 'strategic_to_tactical';
    } else if (sourceType === 'tactical' && targetType === 'operational') {
      linkType = 'tactical_to_operational';
    }

    if (!linkType) {
      showModal({
        type: 'error',
        title: 'Conexão Inválida',
        message: 'Só é permitido conectar:\n• Tático → Estratégico\n• Operacional → Tático'
      });
      return;
    }

    try {
      await createLink(connection.source, connection.target, linkType);
      const organizationId = useAuthStore.getState().organizationId;
      await fetchLinks(organizationId);

    } catch (error) {
      console.error('Error creating link:', error);
    }
  }, [nodes, createLink, showModal]);

  const onEdgeDelete = useCallback(async (edge: Edge) => {
    try {
      await deleteLink(edge.id);
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  }, [deleteLink]);

  return (
    <div className="h-full w-full">
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
          type: 'smoothstep', // 🧠 usa o edge customizado com botão de deletar
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { strokeWidth: 5 },
          animated: true,
        }}
        //isValidConnection={() => true}
        isValidConnection={({ source, target }) => {
          const sourceNode = nodes.find(n => n.id === source);
          const targetNode = nodes.find(n => n.id === target);
          if (!sourceNode || !targetNode) return false;
        
          const sourceType = sourceNode.data.nodeType;
          const targetType = targetNode.data.nodeType;
        
          return (
            (sourceType === 'strategic' && targetType === 'tactical') ||
            (sourceType === 'tactical' && targetType === 'operational')
          );
        }}
      >
        <Background gap={10} />
        <Controls />
      </ReactFlow>
    </div>
  );
}