/* eslint-disable react/prop-types */
import { useState } from 'react'

export function TodoForm({ onSubmit, initialData = null }) {
  const [text, setText] = useState(initialData?.text || '')

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({
      id: initialData?.id || Date.now(),
      text,
      completed: initialData?.completed || false,
      timestamp: new Date().toISOString(),
    })
    if (!initialData) setText('') // Clear only if it's a new item
  }

  return (
    <form onSubmit={handleSubmit} className='todo-form'>
      <input
        type='text'
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder='Enter a new todo...'
        required
      />
      <button type='submit'>{initialData ? 'Update' : 'Add'} Todo</button>
    </form>
  )
}
