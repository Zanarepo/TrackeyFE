import React from 'react';

// Node data structure helper
const createNode = (title, children = []) => ({ title, children });

// Sample mind map data for Product Management
const productManagementData = createNode("Product Management", [
  createNode("Strategy", [
    createNode("Vision"),
    createNode("Goals"),
  ]),
  createNode("Development", [
    createNode("Planning"),
    createNode("Execution"),
  ]),
  createNode("Marketing", [
    createNode("Research"),
    createNode("Campaigns"),
  ]),
]);

// Layout constants
const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const HORIZONTAL_SPACING = 20;
const VERTICAL_SPACING = 60;

// Function to assign positions to nodes
function layoutTree(node, level = 0, startX = 0) {
  if (!node.children.length) {
    node.x = startX;
    node.y = level * (NODE_HEIGHT + VERTICAL_SPACING);
    return NODE_WIDTH;
  }
  let currentX = startX;
  node.children.forEach(child => {
    const childWidth = layoutTree(child, level + 1, currentX);
    currentX += childWidth + HORIZONTAL_SPACING;
  });
  const subtreeWidth = currentX - startX - HORIZONTAL_SPACING;
  node.x = startX + subtreeWidth / 2 - NODE_WIDTH / 2;
  node.y = level * (NODE_HEIGHT + VERTICAL_SPACING);
  return subtreeWidth;
}

// Collect all nodes to determine bounds
function getAllNodes(node) {
  let nodes = [node];
  node.children.forEach(child => nodes = nodes.concat(getAllNodes(child)));
  return nodes;
}

// Collect edges for connecting lines
function getEdges(node) {
  let edges = [];
  node.children.forEach(child => {
    edges.push({
      fromX: node.x + NODE_WIDTH / 2,
      fromY: node.y + NODE_HEIGHT,
      toX: child.x + NODE_WIDTH / 2,
      toY: child.y,
    });
    edges = edges.concat(getEdges(child));
  });
  return edges;
}

// Recursive Node Component
const NodeComponent = ({ node }) => (
  <>
    <div
      className="absolute bg-blue-100 text-center text-sm font-medium rounded shadow p-2 border border-blue-300"
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${NODE_WIDTH}px`,
        height: `${NODE_HEIGHT}px`,
      }}
    >
      {node.title}
    </div>
    {node.children.map((child, index) => (
      <NodeComponent key={index} node={child} />
    ))}
  </>
);

// Main MindMap Component
const MindMap = ({ root }) => {
  layoutTree(root);
  const allNodes = getAllNodes(root);
  const maxX = Math.max(...allNodes.map(n => n.x + NODE_WIDTH));
  const maxY = Math.max(...allNodes.map(n => n.y + NODE_HEIGHT));
  const edges = getEdges(root);

  return (
    <div
      className="relative bg-white rounded-lg shadow-lg p-4 mx-auto"
      style={{ width: `${maxX + 40}px`, height: `${maxY + 40}px` }}
    >
      <svg
        className="absolute top-0 left-0"
        style={{ width: `${maxX + 40}px`, height: `${maxY + 40}px`, zIndex: 0 }}
      >
        {edges.map((edge, index) => (
          <line
            key={index}
            x1={edge.fromX + 20}
            y1={edge.fromY + 20}
            x2={edge.toX + 20}
            y2={edge.toY + 20}
            stroke="gray"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="relative z-10">
        <NodeComponent node={root} />
      </div>
    </div>
  );
};

// App Component
const App = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h1 className="text-2xl font-bold mb-4 text-gray-800">Mind Mapping for Product Management</h1>
    <MindMap root={productManagementData} />
  </div>
);

export default App;