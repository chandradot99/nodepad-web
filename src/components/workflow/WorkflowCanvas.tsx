import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import N8nNode, { type N8nNodeData } from './N8nNode'

const nodeTypes = { n8nNode: N8nNode }

interface Props {
  initialNodes: Node[]
  initialEdges: Edge[]
  onNodeSelect: (data: N8nNodeData | null) => void
}

export default function WorkflowCanvas({ initialNodes, initialEdges, onNodeSelect }: Props) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onNodeSelect(node.data as N8nNodeData)}
      onPaneClick={() => onNodeSelect(null)}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      className="bg-[#0d0d12]"
    >
      <Background color="#1f2937" gap={20} size={1} />
      <Controls
        className="[&>button]:bg-gray-800 [&>button]:border-gray-700 [&>button]:text-white [&>button]:hover:bg-gray-700"
      />
    </ReactFlow>
  )
}
