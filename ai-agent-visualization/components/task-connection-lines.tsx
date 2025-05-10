interface TaskConnectionLinesProps {
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}

export function TaskConnectionLines({ depth, hasChildren, isExpanded }: TaskConnectionLinesProps) {
  if (depth === 0) return null

  return (
    <>
      {/* Vertical connection line */}
      <div
        className="absolute border-l-2 border-gray-700 h-full"
        style={{
          left: `${(depth - 1) * 20 + 10}px`,
          top: "-10px",
          bottom: hasChildren && isExpanded ? "10px" : "50%",
        }}
      />

      {/* Horizontal connection line */}
      <div
        className="absolute border-t-2 border-gray-700"
        style={{
          left: `${(depth - 1) * 20 + 10}px`,
          width: "10px",
          top: "16px",
        }}
      />
    </>
  )
} 