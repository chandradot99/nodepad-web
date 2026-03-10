import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import N8nNode from './N8nNode'

const nodeTypes = { n8nNode: N8nNode }

interface Props {
  initialNodes: Node[]
  initialEdges: Edge[]
}

export default function WorkflowCanvas({ initialNodes, initialEdges }: Props) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      className="bg-gray-950"
    >
      <Background color="#1f2937" gap={24} size={1.5} />
      <Controls
        className="[&>button]:bg-gray-800 [&>button]:border-gray-700 [&>button]:text-white [&>button]:hover:bg-gray-700"
      />
    </ReactFlow>
  )
}
