/* eslint-disable react/prop-types */
import { useState } from 'react'
import { TodoForm } from './TodoForm'

export function TodoItem({ todo, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <TodoForm
        initialData={todo}
        onSubmit={updatedTodo => {
          onUpdate(updatedTodo)
          setIsEditing(false)
        }}
      />
    )
  }

  return (
    <div className='todo-item'>
      <input
        type='checkbox'
        checked={todo.completed}
        onChange={() => onUpdate({ ...todo, completed: !todo.completed })}
      />
      <span
        style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
      >
        {todo.text}
      </span>
      <div className='todo-actions'>
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={() => onDelete(todo.id)}>Delete</button>
      </div>
    </div>
  )
}
