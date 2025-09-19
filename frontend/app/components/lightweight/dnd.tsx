
export const DragDropContext = ({ children }) => children
export const Droppable = ({ children, droppableId }) => 
  children({ innerRef: null, droppableProps: {} })
export const Draggable = ({ children, draggableId, index }) => 
  children({ innerRef: null, draggableProps: {}, dragHandleProps: {} })
