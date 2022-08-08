import express from 'express'
import crypto from 'crypto'
import axios from 'axios'
const fetch = require('node-fetch')
const router = express.Router()
import { roundFloor } from '../utils/mathExtra'
const config = require('../env.json')
const Store = require('electron-store')
const store = new Store()
const log = require('electron-log')

router.post('/quickTrade/:symbols', async (req, res) => {
  log.info('========== Starts buy order =============')

  console.log(req.body)
  // to know amount to buy, for ex: BTC stepSize is 0,00000100 meaning 6 decimals
  let stepSize = req.body.tokenInfo.filters[2].stepSize.indexOf('1') - 1
  const tickSize = req.body.tokenInfo.filters[0].tickSize.indexOf('1') - 1
  stepSize = stepSize < 0 ? 0 : stepSize
  // amount of desired order quantity to use
  const availableTokenToBuy = parseFloat(req.body.availableTokenToBuy).toFixed(
    req.body.tokenInfo.quoteAssetPrecision
  )

  // create the query params
  const timestamp = `timestamp=${Date.now()}`
  const symbol = `symbol=${req.params.symbols}`
  const side = `side=BUY`
  const type = `type=MARKET`
  const quoteOrderQty = `quoteOrderQty=${availableTokenToBuy}`
  const queryParams = `${symbol}&${side}&${type}&${quoteOrderQty}&${timestamp}`

  // create the signature
  const signature = crypto
    .createHmac('sha256', store.get('config.s'))
    .update(queryParams)
    .digest('hex')

  // build the url
  const orderTestApi = 'api/v3/order'
  const urlBuyOrder = `${config['API_URL']}/${orderTestApi}?${queryParams}&signature=${signature}`
  log.info('Order url: ', urlBuyOrder)

  // add buy and OCO response to the same object so I can send all info later
  const responseBuild = {}
  let quantityBought, commissionPaid, priceBought

  // fetch buy order
  try {
    const response = await fetch(urlBuyOrder, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': store.get('config.k') },
    })

    const responseJSON = await response.json()
    responseBuild.buy = responseJSON
    log.info(responseJSON)

    if (responseJSON.msg === 'Filter failure: MIN_NOTIONAL') {
      log.info('')
    }
    // calculate quantity bought, commision paid and at which price, according to response
    log.info(req.body.baseSymbol)
    quantityBought = parseFloat(responseJSON.executedQty)
    const commissionPaidFilter = responseJSON.fills
      .filter((fill) => fill.commissionAsset === req.body.baseSymbol)
      .map((fill) => parseFloat(fill.commission))

    commissionPaid =
      commissionPaidFilter.length > 0
        ? commissionPaidFilter.reduce((a, b) => a + b)
        : 0

    priceBought =
      responseJSON.fills
        .map((fill) => parseFloat(fill.price))
        .reduce((a, b) => a + b) / responseJSON.fills.length

    // save order info to store for later usage in OCO order
    const dataToSave = {
      token: req.params.symbols,
      quantityBought: quantityBought,
      priceBought: priceBought,
      comissionPaid: commissionPaid,
      stepSize: stepSize,
      tickSize: tickSize,
    }
    log.info('data saved: ', dataToSave)
    store.set('lastorder', dataToSave)
  } catch (err) {
    // cancel the OCO order since it wont be placed anyway
    log.info(err)
    log.info('Error: ', err.response.data.msg)
    res.json(err.response.data.msg || 'No response')
  }

  // ==================== start OCO order
  // this could fail because the order didnt FILL right away and response
  // was still given by server, if that use FIX from UI

  // consider quantity (considering comission applied)
  const targetQuantity = roundFloor(quantityBought - commissionPaid, stepSize)

  // calculate prices
  const targetValueSell = (
    priceBought *
    (1 + req.body.percentageGambleUp / 100)
  ).toFixed(tickSize)
  const targetStopPrice = (
    priceBought *
    (1 - req.body.percentageGambleDown / 100)
  ).toFixed(tickSize)
  const targetStopLimitPrice = (
    priceBought *
    (1 - (req.body.percentageGambleDown * 1.005) / 100)
  ).toFixed(tickSize)

  // create query params
  const timestamp_OCO = `timestamp=${Date.now()}`
  const symbol_OCO = `symbol=${req.params.symbols}`
  const side_OCO = `side=SELL`
  const quantity_OCO = `quantity=${targetQuantity}`
  const price_OCO = `price=${targetValueSell}`
  const stopPrice_OCO = `stopPrice=${targetStopPrice}`
  const stopLimitPrice_OCO = `stopLimitPrice=${targetStopLimitPrice}`
  const stopLimitTimeInForce = `stopLimitTimeInForce=GTC`

  // build the OCO query parameters
  const queryParams_OCO = `${symbol_OCO}&${side_OCO}&${quantity_OCO}&${price_OCO}&${stopPrice_OCO}&${stopLimitPrice_OCO}&${stopLimitTimeInForce}&${timestamp_OCO}`

  // create the OCO signature
  const signature_OCO = crypto
    .createHmac('sha256', store.get('config.s'))
    .update(queryParams_OCO)
    .digest('hex')

  // build the OCO url
  const orderTestApi_OCO = 'api/v3/order/oco'
  const urlBuyOrder_OCO = `${config['API_URL']}/${orderTestApi_OCO}?${queryParams_OCO}&signature=${signature_OCO}`
  log.info('OCO Order: ', urlBuyOrder_OCO)

  let response
  // send the OCO order
  try {
    response = await fetch(urlBuyOrder_OCO, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': store.get('config.k') },
    })
  } catch (err) {
    log.info(err)
    res.json(err || 'No response')
  }

  const responseJSON = await response.json()
  responseBuild.oco = responseJSON

  try {
    // OCO failed to be placed and AMS is enabled
    if (!responseBuild.oco.orderReports && req.body.AMS) {
      console.log(req.body.AMS)
      try {
        const response = await fetch(
          `http://localhost:${global.openPort}/sellOrderAMS`,
          {
            method: 'POST',
          }
        )
        const responseJSON = await response.json()
        responseBuild.AMS = responseJSON
      } catch (err) {
        log.info(err)
        res.json(err || 'No response')
      }
    }
  } catch (err) {
    log.info(err.response.data.msg)
    res.json(err.response.data.msg || 'No response')
  }

  res.json(responseBuild)
})

router.post('/ocoFix/:symbols', async (req, res) => {
  const lastOrder = store.get('lastorder')

  const tickSize = lastOrder.tickSize
  const targetValueSell = (
    lastOrder.priceBought *
    (1 + req.body.percentageGambleUp / 100)
  ).toFixed(tickSize)
  const targetStopPrice = (
    lastOrder.priceBought *
    (1 - req.body.percentageGambleDown / 100)
  ).toFixed(tickSize)
  const targetStopLimitPrice = (
    lastOrder.priceBought *
    (1 - (req.body.percentageGambleDown * 1.005) / 100)
  ).toFixed(tickSize)

  // consider tax
  const quantityToBuy = roundFloor(
    lastOrder.quantityBought - lastOrder.comissionPaid,
    lastOrder.stepSize
  )

  const timestamp = `timestamp=${Date.now()}`
  const symbol = `symbol=${req.params.symbols}`
  const side = `side=SELL`
  const quantity = `quantity=${quantityToBuy}`
  const price = `price=${targetValueSell}`
  const stopPrice = `stopPrice=${targetStopPrice}`
  const stopLimitPrice = `stopLimitPrice=${targetStopLimitPrice}`
  const stopLimitTimeInForce = `stopLimitTimeInForce=GTC`

  // build the query parameters
  const queryParams = `${symbol}&${side}&${quantity}&${price}&${stopPrice}&${stopLimitPrice}&${stopLimitTimeInForce}&${timestamp}`

  // create the signature
  const signature = crypto
    .createHmac('sha256', store.get('config.s'))
    .update(queryParams)
    .digest('hex')

  // build the url
  const orderTestApi = 'api/v3/order/oco'
  const urlBuyOrder = `${config['API_URL']}/${orderTestApi}?${queryParams}&signature=${signature}`
  log.info('OCO fix order: ', urlBuyOrder)
  // send the buy order
  try {
    const response = await fetch(urlBuyOrder, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': store.get('config.k') },
    })

    const responseJSON = await response.json()
    res.json(responseJSON)
  } catch (err) {
    log.info(err.response.data.msg)
    res.json(err.response.data.msg || 'No response')
  }
})

router.delete('/cancelOrder/:symbol/:orderId', async (req, res) => {
  const queryString = `symbol=${req.params.symbol}&orderId=${
    req.params.orderId
  }&timestamp=${Date.now()}`

  const secret = store.get('config.s')
  const key = store.get('config.k')

  const signature = crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('hex')

  const walletCoinApi = 'api/v3/order'
  const url = `${config['API_URL']}/${walletCoinApi}?${queryString}&signature=${signature}`

  try {
    const response = await axios.delete(url, {
      headers: { 'X-MBX-APIKEY': key },
    })

    res.json(response.data)
  } catch (err) {
    res.json(err.response.data.msg || 'No response')
  }

  res.json('ok')
})

router.delete('/cancelOrderOCO/:symbol/:orderListId', async (req, res) => {
  const queryString = `symbol=${req.params.symbol}&orderListId=${
    req.params.orderListId
  }&timestamp=${Date.now()}`

  const secret = store.get('config.s')
  const key = store.get('config.k')

  const signature = crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('hex')

  const walletCoinApi = 'api/v3/orderList'
  const url = `${config['API_URL']}/${walletCoinApi}?${queryString}&signature=${signature}`

  try {
    const response = await axios.delete(url, {
      headers: { 'X-MBX-APIKEY': key },
    })

    res.json(response.data)
  } catch (err) {
    res.json(err.response.data.msg || 'No response')
  }
})

// endpoint name is tricky because it's not only sell, but also cancel
// meant to be used as a PANIC sell. Also applies to /sellOrder
router.post('/sellOrderOco/', async (req, res) => {
  const lastOrder = store.get('lastorder')

  try {
    const response = await fetch(
      `http://localhost:${global.openPort}/cancelOrderOCO/${req.body.symbol}/${req.body.orderListId}`,
      {
        method: 'DELETE',
      }
    )
    const responseJSON = await response.json()
  } catch (err) {
    log.info(err)
    res.json(err || 'No response')
  }

  const quantityToSell = roundFloor(
    lastOrder.quantityBought - lastOrder.comissionPaid,
    lastOrder.stepSize
  )

  const timestamp = `timestamp=${Date.now()}`
  const symbol = `symbol=${req.body.symbol}`
  const side = `side=SELL`
  const type = `type=MARKET`
  const quantity = `quantity=${quantityToSell}`

  // build the query parameters
  const queryParams = `${symbol}&${side}&${type}&${quantity}&${timestamp}`

  // create the signature
  const signature = crypto
    .createHmac('sha256', store.get('config.s'))
    .update(queryParams)
    .digest('hex')

  // build the url
  const orderTestApi = 'api/v3/order'
  const urlSellOrder = `${config['API_URL']}/${orderTestApi}?${queryParams}&signature=${signature}`
  log.info('Sell order: ', urlSellOrder)

  // send the sell order
  try {
    const response = await fetch(urlSellOrder, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': store.get('config.k') },
    })

    const responseJSON = await response.json()
    res.json(responseJSON)
  } catch (err) {
    log.info(err.response.data.msg)
    res.json(err.response.data.msg || 'No response')
  }
})

router.post('/sellOrder/', async (req, res) => {
  const lastOrder = store.get('lastorder')

  try {
    const response = await fetch(
      `http://localhost:${global.openPort}/cancelOrder/${req.body.symbol}/${req.body.orderId}`,
      {
        method: 'DELETE',
      }
    )
    const responseJSON = await response.json()
  } catch (err) {
    log.info(err)
    res.json(err || 'No response')
  }

  const quantityToSell = roundFloor(
    lastOrder.quantityBought - lastOrder.comissionPaid,
    lastOrder.stepSize
  )

  const timestamp = `timestamp=${Date.now()}`
  const symbol = `symbol=${req.body.symbol}`
  const side = `side=SELL`
  const type = `type=MARKET`
  const quantity = `quantity=${quantityToSell}`

  // build the query parameters
  const queryParams = `${symbol}&${side}&${type}&${quantity}&${timestamp}`

  // create the signature
  const signature = crypto
    .createHmac('sha256', store.get('config.s'))
    .update(queryParams)
    .digest('hex')

  // build the url
  const orderTestApi = 'api/v3/order'
  const urlSellOrder = `${config['API_URL']}/${orderTestApi}?${queryParams}&signature=${signature}`
  log.info('Sell order: ', urlSellOrder)

  // send the sell order
  try {
    const response = await fetch(urlSellOrder, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': store.get('config.k') },
    })

    const responseJSON = await response.json()
    res.json(responseJSON)
  } catch (err) {
    log.info(err.response.data.msg)
    res.json(err.response.data.msg || 'No response')
  }
})

// used when AMS is enabled
// can also work as manual market sell
router.post('/sellOrderAMS/', async (req, res) => {
  const lastOrder = store.get('lastorder')

  const quantityToSell = roundFloor(
    lastOrder.quantityBought - lastOrder.comissionPaid,
    lastOrder.stepSize
  )

  const timestamp = `timestamp=${Date.now()}`
  const symbol = `symbol=${lastOrder.token}`
  const side = `side=SELL`
  const type = `type=MARKET`
  const quantity = `quantity=${quantityToSell}`

  // build the query parameters
  const queryParams = `${symbol}&${side}&${type}&${quantity}&${timestamp}`

  // create the signature
  const signature = crypto
    .createHmac('sha256', store.get('config.s'))
    .update(queryParams)
    .digest('hex')

  // build the url
  const orderTestApi = 'api/v3/order'
  const urlSellOrder = `${config['API_URL']}/${orderTestApi}?${queryParams}&signature=${signature}`
  log.info('Sell order: ', urlSellOrder)

  // send the sell order
  try {
    const response = await fetch(urlSellOrder, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': store.get('config.k') },
    })

    const responseJSON = await response.json()
    res.json(responseJSON)
  } catch (err) {
    log.info(err.response.data.msg)
    res.json(err.response.data.msg || 'No response')
  }
})

router.post('/manualBuyMarket/', async (req, res) => {
  log.info('========== Starts market buy order =============')

  // to know amount to buy, for ex: BTC stepSize is 0,00000100 meaning 6 decimals
  let stepSize = req.body.tokenInfo.filters[2].stepSize.indexOf('1') - 1
  const tickSize = req.body.tokenInfo.filters[0].tickSize.indexOf('1') - 1
  stepSize = stepSize < 0 ? 0 : stepSize
  // amount of desired order quantity to use
  const availableTokenToBuy = parseFloat(req.body.availableTokenToBuy).toFixed(
    req.body.tokenInfo.quoteAssetPrecision
  )

  // create the query params
  const timestamp = `timestamp=${Date.now()}`
  const symbol = `symbol=${req.body.symbols}`
  const side = `side=BUY`
  const type = `type=MARKET`
  const quoteOrderQty = `quoteOrderQty=${availableTokenToBuy}`
  const queryParams = `${symbol}&${side}&${type}&${quoteOrderQty}&${timestamp}`

  // create the signature
  const signature = crypto
    .createHmac('sha256', store.get('config.s'))
    .update(queryParams)
    .digest('hex')

  // build the url
  const orderTestApi = 'api/v3/order'
  const urlBuyOrder = `${config['API_URL']}/${orderTestApi}?${queryParams}&signature=${signature}`
  log.info('Order url: ', urlBuyOrder)

  let quantityBought, commissionPaid, priceBought

  // fetch but order
  try {
    const response = await fetch(urlBuyOrder, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': store.get('config.k') },
    })

    const responseJSON = await response.json()
    log.info(responseJSON)

    // calculate quantity bought, commision paid and at which price, according to response
    log.info(req.body.baseSymbol)
    quantityBought = parseFloat(responseJSON.executedQty)
    const commissionPaidFilter = responseJSON.fills
      .filter((fill) => fill.commissionAsset === req.body.baseSymbol)
      .map((fill) => parseFloat(fill.commission))

    commissionPaid =
      commissionPaidFilter.length > 0
        ? commissionPaidFilter.reduce((a, b) => a + b)
        : 0

    priceBought =
      responseJSON.fills
        .map((fill) => parseFloat(fill.price))
        .reduce((a, b) => a + b) / responseJSON.fills.length

    responseJSON.priceBought = priceBought

    // TODO: save orderId to cancel later if neccesary
    const dataToSave = {
      token: req.body.symbols,
      quantityBought: quantityBought,
      priceBought: priceBought,
      comissionPaid: commissionPaid,
      stepSize: stepSize,
      tickSize: tickSize,
    }
    log.info('data saved: ', dataToSave)
    store.set('lastorder', dataToSave)
    res.json(responseJSON)
  } catch (err) {
    // cancel the OCO order since it wont be placed anyway
    log.info(err)
    log.info('Error: ', err.response.data.msg)
    res.json(err.response.data.msg || 'No response')
  }
})

export default router
