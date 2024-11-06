// server.js
const express = require('express')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 3000
app.use(express.json())
app.use(
  cors({
    origin: '*',
  })
)

let data = [] // Mock database

// CREATE
app.post('/data', (req, res) => {
  const newData = req.body
  data.push(newData)
  res.status(201).send(newData)
})

// READ
app.get('/data', (req, res) => {
  res.send(data)
})

// UPDATE
app.put('/data/:id', (req, res) => {
  const { id } = req.params
  const updatedData = req.body
  const index = data.findIndex(item => item.id === parseInt(id))
  if (index !== -1) {
    data[index] = updatedData
    res.send(updatedData)
  } else {
    res.status(404).send({ message: 'Item not found' })
  }
})

// DELETE
app.delete('/data/:id', (req, res) => {
  const { id } = req.params
  data = data.filter(item => item.id !== parseInt(id))
  res.status(204).send()
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
