import express from 'express'
import axios from 'axios'
import crypto from 'crypto'
const fetch = require('node-fetch')
const Store = require('electron-store')
const store = new Store()
const router = express.Router()
const config = require('../config.json')

// returns all coins balance of a wallet
router.get('/walletStatus/dump', async (req, res) => {
  const queryString = `timestamp=${Date.now()}`

  const secret = store.get('config.s')
  const key = store.get('config.k')

  const signature = crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('hex')

  const walletCoinApi = 'sapi/v1/capital/config/getall'
  const url = `${config['API_URL']}/${walletCoinApi}?${queryString}&signature=${signature}`

  fetch(url, { headers: { 'X-MBX-APIKEY': key } })
    .then((res) => res.json())
    .then((json) => res.json(json))
    .catch((err) => {
      console.log(err)
      res.json('Error')
    })
})

// returns all the active orders of an account
router.get('/currentOrders', async (req, res) => {
  const timeApi = await axios.get(`${config['API_URL']}/api/v3/time`)

  const queryString = `timestamp=${timeApi.data.serverTime || Date.now()}`

  const secret = store.get('config.s')
  const key = store.get('config.k')

  const signature = crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('hex')

  const currentOrdersApi = 'api/v3/openOrders'
  const url = `${config['API_URL']}/${currentOrdersApi}?${queryString}&signature=${signature}`

  fetch(url, { headers: { 'X-MBX-APIKEY': key } })
    .then((res) => res.json())
    .then((json) => res.json(json))
    .catch((err) => {
      console.log(err)
      res.json('Error')
    })
})

export default router
