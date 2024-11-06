import { IndexedDB } from '../utils/db'

const API_URL = 'https://offline-pwa-production.up.railway.app'

export class DataService {
  static async getAll() {
    try {
      // Try to get data from server first if online
      if (navigator.onLine) {
        const response = await fetch(`${API_URL}/data`)
        const serverData = await response.json()

        // Update local storage with server data
        const db = await IndexedDB.init()
        const tx = db.transaction('items', 'readwrite')
        const store = tx.objectStore('items')

        // Clear existing items and add server items
        await store.clear()
        for (const item of serverData) {
          await store.add(item)
        }

        return serverData
      }
    } catch (error) {
      console.error('Error fetching from server:', error)
    }

    // Fallback to local data if offline or server error
    const db = await IndexedDB.init()
    const tx = db.transaction('items', 'readonly')
    const store = tx.objectStore('items')
    return store.getAll()
  }

  static async create(item) {
    const db = await IndexedDB.init()
    const tx = db.transaction(['items', 'syncQueue'], 'readwrite')

    // Add to local DB
    await tx.objectStore('items').add(item)

    if (!navigator.onLine) {
      await tx.objectStore('syncQueue').add({
        id: Date.now(),
        type: 'CREATE',
        data: item,
        timestamp: new Date().toISOString(),
      })
    } else {
      try {
        const response = await fetch(`${API_URL}/data`, {
          method: 'POST',
          body: JSON.stringify(item),
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) throw new Error('Server error')
      } catch (error) {
        console.error('Error syncing item:', error)
        await tx.objectStore('syncQueue').add({
          id: Date.now(),
          type: 'CREATE',
          data: item,
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  static async update(item) {
    const db = await IndexedDB.init()
    const tx = db.transaction(['items', 'syncQueue'], 'readwrite')

    await tx.objectStore('items').put(item)

    if (!navigator.onLine) {
      await tx.objectStore('syncQueue').add({
        id: Date.now(),
        type: 'UPDATE',
        data: item,
        timestamp: new Date().toISOString(),
      })
    } else {
      try {
        const response = await fetch(`${API_URL}/data/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify(item),
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) throw new Error('Server error')
      } catch (error) {
        console.error('Error syncing item:', error)
        await tx.objectStore('syncQueue').add({
          id: Date.now(),
          type: 'UPDATE',
          data: item,
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  static async delete(id) {
    const db = await IndexedDB.init()
    const tx = db.transaction(['items', 'syncQueue'], 'readwrite')

    await tx.objectStore('items').delete(id)

    if (!navigator.onLine) {
      await tx.objectStore('syncQueue').add({
        id: Date.now(),
        type: 'DELETE',
        data: { id },
        timestamp: new Date().toISOString(),
      })
    } else {
      try {
        const response = await fetch(`${API_URL}/data/${id}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Server error')
      } catch (error) {
        console.error('Error syncing item:', error)
        await tx.objectStore('syncQueue').add({
          id: Date.now(),
          type: 'DELETE',
          data: { id },
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  static async syncWithServer() {
    const db = await IndexedDB.init()

    // Get all items from sync queue first
    const queueTx = db.transaction('syncQueue', 'readonly')
    const queueStore = queueTx.objectStore('syncQueue')
    const items = await new Promise((resolve, reject) => {
      const request = queueStore.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    for (const item of items) {
      try {
        let response
        switch (item.type) {
          case 'CREATE':
            response = await fetch(`${API_URL}/data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            })
            break
          case 'UPDATE':
            response = await fetch(`${API_URL}/data/${item.data.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            })
            break
          case 'DELETE':
            response = await fetch(`${API_URL}/data/${item.data.id}`, {
              method: 'DELETE',
            })
            break
        }

        if (!response?.ok) {
          throw new Error('Server error during sync')
        }

        // Create new transaction for each delete operation
        const deleteTx = db.transaction('syncQueue', 'readwrite')
        const deleteStore = deleteTx.objectStore('syncQueue')
        await deleteStore.delete(item.id)
      } catch (error) {
        console.error('Error syncing item:', error)
        // Don't throw error here to allow other items to sync
      }
    }

    // After sync, get fresh data from server
    return this.getAll()
  }
}
