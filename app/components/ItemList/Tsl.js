import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
const Store = require('electron-store')
const storeExchange = new Store({ name: 'exchangeInfo' })
const storeConfig = new Store({ name: 'config' })
const Binance = require('node-binance-api')
import Information from './Information'
import ReactTooltip from 'react-tooltip'
import IconInformation from '../../assets/information.svg'

const binance = new Binance().options({
  APIKEY: storeConfig.get('config.k'),
  APISECRET: storeConfig.get('config.s'),
  reconnect: false,
})

const Tsl = () => {
  const [quickTradeTokenState, setQuickTradeTokenState] = useState()
  const [quickTradeTokenToUseState, setQuickTradeTokenToUseState] = useState()
  const [
    quickTradePercentageGambleUp,
    setQuickTradePercentageGambleUp,
  ] = useState('1.5')
  const [
    quickTradePercentageGambleDown,
    setQuickTradePercentageGambleDown,
  ] = useState('1.5')
  const [selectedTokenToBuy, setSelectedTokenToBuy] = useState('USDT')
  const [startPrice, setStartPrice] = useState()
  const [currentPrice, setCurrentPrice] = useState()
  const [fixedCoinPair, setFixedCoinPair] = useState()
  const [placedOrders, setPlacedOrders] = useState([])
  const [resultInfo, setResultInfo] = useState(false)

  const { dispatch } = useContext(AppContext)

  const changeQuickTradeToken = (e) => {
    setQuickTradeTokenState(e.target.value)
  }

  const changeQuickTradeTokenToUse = (e) => {
    setQuickTradeTokenToUseState(e.target.value)
  }

  const changeQuickTradePercentageGambleUp = (e) => {
    setQuickTradePercentageGambleUp(e.target.value)
  }

  const changeQuickTradePercentageGambleDown = (e) => {
    setQuickTradePercentageGambleDown(e.target.value)
  }

  const changeSelectedTokenToBuy = (e) => {
    setSelectedTokenToBuy(e.target.value)
  }

  const cancelTsl = () => {
    // TODO: don't override old data, as it's going to be useful
    // TODO: cancelling does a market sell?
    dispatch({
      type: 'update',
      payload: { isLoading: true },
    })

    binance.websockets.terminate(`${fixedCoinPair.toLowerCase()}@trade`)

    dispatch({
      type: 'update',
      payload: {
        isLoading: false,
        responseData: (
          <div className="response-smart-trade">
            <p>Canceled</p>
          </div>
        ),
      },
    })
  }

  const startTsl = () => {
    dispatch({
      type: 'reset',
    })

    setStartPrice((prev) => console.log(prev))
    setPlacedOrders([])
    setResultInfo((prev) => console.log(prev))
    setCurrentPrice((prev) => console.log(prev))

    dispatch({
      type: 'update',
      payload: { isLoading: true },
    })

    const fixedString = quickTradeTokenState
      .toUpperCase()
      .replace('/', '')
      .trim()
    const coin = `${fixedString}${selectedTokenToBuy}`
    setFixedCoinPair(coin)

    let XUSDT_current

    binance.prices(coin, (error, ticker) => {
      // get the current price of coin pair
      XUSDT_current = ticker[coin]
      setStartPrice(ticker[coin])
      buyTSL(coin, fixedString)
    })

    binance.websockets.trades(coin, (trades) => {
      let {
        e: eventType,
        E: eventTime,
        s: symbol,
        p: price,
        q: quantity,
        m: maker,
        a: tradeId,
      } = trades
      setCurrentPrice(price)
      if (price > XUSDT_current * (1 + quickTradePercentageGambleUp / 100)) {
        // max price reached, cancel and place new order (based on XUSDT_current)
        XUSDT_current = price
        refreshTSL(price, coin)
      } else if (
        price <
        XUSDT_current * (1 - quickTradePercentageGambleDown / 100)
      ) {
        // min price reached, sell
        XUSDT_current = price
        binance.websockets.terminate(`${coin.toLowerCase()}@trade`)
        setResultInfo(true)
        sellTSL(price)
      }

      // since there aren't any canceled trades, there's no need to have a maxStep
      // if (count >= maxSteps) {
      //   // max counts reached, cancel connection
      //   binance.websockets.terminate(`${coin.toLowerCase()}@trade`);
      //   setResultInfo(true)
      // }
    })

    // no need to dispatch here because useEffect below will take care of it
  }

  useEffect(() => {
    const updateRender = () => {
      const renderElement = (
        <div className="response-smart-trade">
          <p>{`${fixedCoinPair}`}</p>
          <p>
            Buy price: {placedOrders[0].priceBought}. Target step:{' '}
            {(
              placedOrders[0].priceBought *
              (1 + quickTradePercentageGambleUp / 100)
            ).toFixed(8)}{' '}
            (%{quickTradePercentageGambleUp})
          </p>
          <p>Current avg price: {currentPrice}</p>
          {placedOrders &&
            placedOrders.map((el, idx) => {
              if (idx > 0) {
                return (
                  <p style={{ color: 'rgb(14, 203, 129)' }} key={idx}>
                    {`Threshold updated ${quickTradePercentageGambleUp}. Current: ${el.extra.price}`}
                    . Next target step:{' '}
                    {(
                      el.extra.price *
                      (1 + quickTradePercentageGambleUp / 100)
                    ).toFixed(8)}
                  </p>
                )
              }
            })}
          {resultInfo && (
            <p
              style={{ color: 'rgb(246, 70, 93)' }}
            >{`Bottom hit. Stop and sell at ${currentPrice}`}</p>
          )}
        </div>
      )

      dispatch({
        type: 'update',
        payload: { isLoading: false, responseData: renderElement },
      })

      resultInfo &&
        dispatch({
          type: 'update',
          payload: {
            isLoading: false,
            responseData: [
              renderElement,
              <div className="response-smart-trade">
                <hr />
                <p>
                  Used {quickTradeTokenToUseState}
                  {selectedTokenToBuy} at {placedOrders[0].priceBought} sold at{' '}
                  {currentPrice}
                </p>
                <p>
                  Result:{' '}
                  {(
                    quickTradeTokenToUseState *
                    (currentPrice / placedOrders[0].priceBought)
                  ).toFixed(2)}
                </p>
              </div>,
            ],
          },
        })
    }

    currentPrice && updateRender()
  }, [currentPrice, resultInfo])

  const buyTSL = async (coin, baseSymbol) => {
    const tokenInfo = storeExchange
      .get('USDTBTCpairs')
      .find((el) => el.symbol === coin)

    const payload = {
      tokenInfo,
      availableTokenToBuy: quickTradeTokenToUseState,
      percentageGambleUp: quickTradePercentageGambleUp,
      percentageGambleDown: quickTradePercentageGambleDown,
      percentageBelowAvg: 0,
      symbols: coin,
      baseSymbol: baseSymbol,
    }

    const buyResponse = await fetch('/manualBuyMarket/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const buyResponseJson = await buyResponse.json()

    buyResponseJson.extra = {
      price: buyResponseJson.priceBought,
    }

    setPlacedOrders((prev) => [...prev, buyResponseJson])
  }

  const sellTSL = async (price) => {
    const buyResponse = await fetch('/sellOrderAMS/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    const buyResponseJson = await buyResponse.json()

    buyResponseJson.extra = {
      price: price,
    }

    setPlacedOrders((prev) => [...prev, buyResponseJson])
  }

  // updates internal state according to new %'s determined by gain thresholds
  // if this is called, it means that win % was reached, so sets up a new desired value as goal
  const refreshTSL = async (price, coin) => {
    const buyResponseJson = {
      extra: {
        price: price,
      },
    }

    setPlacedOrders((prev) => [...prev, buyResponseJson])
  }

  return (
    <div className="list-buttons-container">
      <div className="list-buttons-group">
        <p className="list-buttons-group-title">Trailing stop loss</p>
        <div className="list-inputs">
          <div className="list-inputs-row">
            <p>Token to buy</p>
            <input
              placeholder="Example: SC"
              onChange={changeQuickTradeToken}
              className="list-input-inputfield"
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  startTsl()
                }
              }}
            />
          </div>
          <div className="list-inputs-row">
            <p>
              Use{' '}
              <select onChange={changeSelectedTokenToBuy}>
                <option id="USDT">USDT</option>
                <option id="BTC">BTC</option>
              </select>
            </p>
            <input
              placeholder={`How many ${selectedTokenToBuy}?`}
              onChange={changeQuickTradeTokenToUse}
              className="list-input-inputfield"
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  startTsl()
                }
              }}
            />
          </div>
          <div className="list-inputs-row">
            <div className="container-input-row-with-icon">
              <a data-tip data-for="gainInfo">
                <IconInformation />
              </a>
              <ReactTooltip id="gainInfo" type="info" effect="solid">
                <span>
                  If this percentage (relative to current price) reaches,
                  current threshold <br />
                  (+%/-%) will update depending on price and TSL continues.{' '}
                </span>
              </ReactTooltip>
              <p>Gain %</p>
            </div>

            <input
              placeholder="Ex: 2%"
              defaultValue="0.2"
              className="list-input-inputfield"
              onChange={changeQuickTradePercentageGambleUp}
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  changeQuickTradePercentageGambleUp()
                }
              }}
            />
          </div>

          <div className="list-inputs-row">
            <div className="container-input-row-with-icon">
              <a data-tip data-for="lossInfo">
                <IconInformation />
              </a>
              <ReactTooltip id="lossInfo" type="info" effect="solid">
                <span>
                  If percentage (relative to current price) reaches, the coin
                  <br />
                  is sold and TSL stops.
                </span>
              </ReactTooltip>
              <p>Loss %</p>
            </div>
            <input
              placeholder="Ex: 1.5%"
              defaultValue="0.2"
              className="list-input-inputfield"
              onChange={changeQuickTradePercentageGambleDown}
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  changeQuickTradePercentageGambleDown()
                }
              }}
            />
          </div>
          <p style={{ fontSize: '13px' }}>
            Tip: lower percentages will trigger a new step faster <br />
            but consider order fee is paid faster as well.
          </p>
        </div>
        <div className="list-buttons-items-multiple">
          <div className="container-button-with-icon">
            <button onClick={startTsl}>Start</button>
          </div>

          <div className="container-button-with-icon">
            <button onClick={cancelTsl}>Cancel</button>
          </div>
        </div>
      </div>

      <Information />
    </div>
  )
}

export default Tsl
