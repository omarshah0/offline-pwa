const CACHE_NAME = 'my-pwa-cache-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  // Add other static assets
]

const API_URL = 'http://localhost:3000'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request)
      .then(response => response || fetch(event.request))
  )
})

async function syncData() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('offlineDB', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })

  const tx = db.transaction('syncQueue', 'readwrite')
  const store = tx.objectStore('syncQueue')
  const items = await store.getAll()

  for (const item of items) {
    try {
      switch (item.type) {
        case 'CREATE':
          await fetch(`${API_URL}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
          break
        case 'UPDATE':
          await fetch(`${API_URL}/data/${item.data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
          break
        case 'DELETE':
          await fetch(`${API_URL}/data/${item.data.id}`, {
            method: 'DELETE',
          })
          break
      }
      // Remove from sync queue after successful sync
      await store.delete(item.id)
    } catch (error) {
      console.error('Error syncing item:', error)
    }
  }
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-updates') {
    event.waitUntil(syncData())
  }
})
