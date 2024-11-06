import { useState, useEffect } from 'react'
import { DataService } from '../services/DataService'
import { TodoForm } from './TodoForm'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const [todos, setTodos] = useState([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('synced') // 'synced', 'pending', 'syncing'

  // Load initial data
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const localTodos = await DataService.getAll()
        // Ensure localTodos is an array
        setTodos(Array.isArray(localTodos) ? localTodos : [])
      } catch (error) {
        console.error('Error loading todos:', error)
        setTodos([]) // Set empty array on error
      }
    }
    loadTodos()
  }, [])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setSyncStatus('syncing')
      try {
        const syncedTodos = await DataService.syncWithServer()
        setTodos(Array.isArray(syncedTodos) ? syncedTodos : [])
        setSyncStatus('synced')
      } catch (error) {
        console.error('Sync failed:', error)
        setSyncStatus('pending')
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('pending')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleCreate = async newTodo => {
    try {
      await DataService.create(newTodo)
      setTodos(prevTodos => [
        ...(Array.isArray(prevTodos) ? prevTodos : []),
        newTodo,
      ])
      if (!isOnline) setSyncStatus('pending')
    } catch (error) {
      console.error('Error creating todo:', error)
    }
  }

  const handleUpdate = async updatedTodo => {
    try {
      await DataService.update(updatedTodo)
      setTodos(prevTodos =>
        Array.isArray(prevTodos)
          ? prevTodos.map(todo =>
              todo.id === updatedTodo.id ? updatedTodo : todo
            )
          : []
      )
      if (!isOnline) setSyncStatus('pending')
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const handleDelete = async id => {
    try {
      await DataService.delete(id)
      setTodos(prevTodos =>
        Array.isArray(prevTodos) ? prevTodos.filter(todo => todo.id !== id) : []
      )
      if (!isOnline) setSyncStatus('pending')
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  return (
    <div className='todo-list'>
      <div className={`connection-status ${syncStatus}`}>
        Status: {isOnline ? 'Online' : 'Offline'}
        {syncStatus !== 'synced' && (
          <span>
            {' '}
            ({syncStatus === 'syncing' ? 'Syncing...' : 'Changes pending'})
          </span>
        )}
      </div>

      <TodoForm onSubmit={handleCreate} />

      <div className='todos'>
        {Array.isArray(todos) &&
          todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
      </div>
    </div>
  )
}
