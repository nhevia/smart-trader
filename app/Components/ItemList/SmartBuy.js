import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../../Context/AppContext'
const Store = require('electron-store')
const storeExchange = new Store({ name: 'exchangeInfo' })
import Information from './Information'
import useCancelOrder from '../Orders/CancelOrder'
import ReactTooltip from 'react-tooltip'
import IconInformation from '../../assets/information.svg'
import Candlestick from '../Charts/Candlestick'
import { store as storeNotification } from 'react-notifications-component'

const SmartBuy = () => {
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
  const [orderToCancel, setOrderToCancel] = useState()
  const [orderToSellOco, setOrderToSellOco] = useState()
  const [orderToSell, setOrderToSell] = useState()
  const [AMS, setAMS] = useState(false)

  useCancelOrder(orderToCancel)

  const { dispatch } = useContext(AppContext)

  const fetchSellOrderOco = async (order) => {
    const sellResponse = await fetch('/sellOrderOco', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(order),
    })
    const sellResponseJson = await sellResponse.json()

    console.log(sellResponseJson)

    if (sellResponseJson.status === 'FILLED') {
      const priceSell =
        sellResponseJson.fills
          .map((fill) => Number.parseFloat(fill.price))
          .reduce((a, b) => a + b) / sellResponseJson.fills.length
      storeNotification.addNotification({
        title: `Sold ${sellResponseJson.symbol}`,
        message: `Quantity: ${sellResponseJson.executedQty}. Price: ${priceSell}`,
        type: 'success',
        insert: 'top',
        container: 'top-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        dismiss: {
          duration: 3000,
          onScreen: true,
        },
      })
      // TODO: redirect to active orders
    } else if (sellResponseJson.msg) {
      storeNotification.addNotification({
        title: `Error`,
        message: sellResponseJson.msg,
        type: 'danger',
        insert: 'top',
        container: 'top-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        dismiss: {
          duration: 4000,
          onScreen: true,
        },
      })
    }
  }

  const fetchSellOrder = async (order) => {
    const sellResponse = await fetch('/sellOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(order),
    })
    const sellResponseJson = await sellResponse.json()

    console.log(sellResponseJson)

    if (sellResponseJson.status === 'FILLED') {
      const priceSell =
        sellResponseJson.fills
          .map((fill) => Number.parseFloat(fill.price))
          .reduce((a, b) => a + b) / sellResponseJson.fills.length
      storeNotification.addNotification({
        title: `Sold ${sellResponseJson.symbol}`,
        message: `Quantity: ${sellResponseJson.executedQty}. Price: ${priceSell}`,
        type: 'success',
        insert: 'top',
        container: 'top-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        dismiss: {
          duration: 3000,
          onScreen: true,
        },
      })
      // TODO: redirect to active orders
    } else if (sellResponseJson.msg) {
      storeNotification.addNotification({
        title: `Error`,
        message: sellResponseJson.msg,
        type: 'danger',
        insert: 'top',
        container: 'top-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        dismiss: {
          duration: 4000,
          onScreen: true,
        },
      })
    }
  }

  useEffect(() => {
    orderToSellOco && fetchSellOrderOco(orderToSellOco)
  }, [orderToSellOco])

  useEffect(() => {
    orderToSell && fetchSellOrder(orderToSell)
  }, [orderToSell])

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

  const quickTrade = async () => {
    dispatch({
      type: 'update',
      payload: { isLoading: true },
    })

    const fixedString = quickTradeTokenState
      .toUpperCase()
      .replace('/', '')
      .trim()
    const tokenInfo = storeExchange
      .get('USDTBTCpairs')
      .find((el) => el.symbol === `${fixedString}${selectedTokenToBuy}`)

    const payload = {
      tokenInfo,
      availableTokenToBuy: quickTradeTokenToUseState,
      percentageGambleUp: quickTradePercentageGambleUp,
      percentageGambleDown: quickTradePercentageGambleDown,
      percentageBelowAvg: 0,
      baseSymbol: fixedString,
      AMS: AMS,
    }

    let buyResponseJson

    const minNotional = tokenInfo.filters.find(
      (f) => f.filterType === 'MIN_NOTIONAL'
    ).minNotional
    const minNotionalInt = Number.parseInt(minNotional)
    if (minNotionalInt > quickTradeTokenToUseState) {
      // is base amount higher than MIN_NOTIONAL?
      buyResponseJson = {
        buy: {
          msg: `Minimum ${tokenInfo.quoteAsset} required to buy ${fixedString}: ${minNotionalInt} but tried to sell: ${quickTradeTokenToUseState} `,
        },
      }
    } else {
      const buyResponse = await fetch(
        `/quickTrade/${fixedString}${selectedTokenToBuy}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )
      buyResponseJson = await buyResponse.json()
    }

    const renderElement = (
      <div className="response-smart-trade" key="render-smart-trade-results">
        {buyResponseJson.buy.msg ? (
          <p>Error message: {buyResponseJson.buy.msg}</p>
        ) : (
          <>
            <h3>Buy order</h3>
            <table className="table-container table-container-block">
              <thead>
                <tr>
                  <th>Coin pair</th>
                  <th>Side</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  {/* <th>Order ID</th> */}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr key={buyResponseJson.buy.clientOrderId}>
                  <td style={{ width: '12%' }}>{buyResponseJson.buy.symbol}</td>

                  <td style={{ width: '10%' }}>
                    <p>{buyResponseJson.buy.side}</p>
                  </td>

                  <td style={{ width: '19%' }}>
                    <p>{buyResponseJson.buy.type}</p>
                  </td>

                  <td style={{ width: '20%' }}>
                    <p>{buyResponseJson.buy.origQty}</p>
                  </td>

                  <td style={{ width: '15%' }}>
                    <p>
                      {buyResponseJson.buy.fills
                        .map((el) => Number.parseFloat(el.price))
                        .reduce((a, b) => a + b) /
                        buyResponseJson.buy.fills.length}
                    </p>
                  </td>

                  <td style={{ width: '22%' }}>
                    <div className="table-action-buttons">
                      {!buyResponseJson.oco.orderReports &&
                        !buyResponseJson.AMS && (
                          <button
                            key="sell_normal"
                            onClick={() => setOrderToSell(buyResponseJson.buy)}
                          >
                            Sell
                          </button>
                        )}
                    </div>
                  </td>

                  {/* <td style={{width: '12%'}}>
                    <p >
                      {buyResponseJson.buy.orderId}
                    </p>
                  </td> */}
                </tr>
              </tbody>
            </table>

            {buyResponseJson.oco.orderReports ? (
              <>
                <h3>OCO Sell order</h3>

                <table className="table-container table-container-block">
                  <thead>
                    <tr>
                      <th>Coin pair</th>
                      <th>Side</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      {/* <th>Order ID</th> */}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyResponseJson.oco.orderReports.map((el) => {
                      return (
                        <tr key={el.clientOrderId}>
                          <td style={{ width: '10%' }}>{el.symbol}</td>

                          <td style={{ width: '8%' }}>
                            <p>{el.side}</p>
                          </td>

                          <td style={{ width: '14%' }}>
                            <p>{el.type}</p>
                          </td>

                          <td style={{ width: '20%' }}>
                            <p>{el.origQty}</p>
                          </td>

                          <td style={{ width: '14%' }}>
                            <p>{el.price}</p>
                          </td>

                          {/* <td style={{width: '12%'}}>
                            <p >
                              {el.orderId}
                            </p>
                          </td> */}

                          <td style={{ width: '22%' }}>
                            <div className="table-action-buttons">
                              <button
                                key="sell"
                                onClick={() => setOrderToSellOco(el)}
                              >
                                Sell
                              </button>
                              <button
                                key="cancel"
                                onClick={() => setOrderToCancel(el)}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              // Means AMS was enabled because OCO failed and market sell was placed automatically
              <>
                {buyResponseJson.AMS && buyResponseJson.oco.msg && (
                  <>
                    <h3>Panic sell activated automatically (AMS enabled)</h3>
                    <p>OCO returned message: {buyResponseJson.oco.msg}</p>
                  </>
                )}

                {!buyResponseJson.AMS && buyResponseJson.oco.msg && (
                  <>
                    <h3>OCO order couldn't be placed</h3>
                    <p>OCO returned message: {buyResponseJson.oco.msg}</p>
                  </>
                )}

                {buyResponseJson.AMS &&
                  storeNotification.addNotification({
                    title: `Panic sold ${buyResponseJson.AMS.symbol}`,
                    message: `Quantity: ${buyResponseJson.AMS.executedQty}.`,
                    type: 'success',
                    insert: 'top',
                    container: 'top-right',
                    animationIn: ['animate__animated', 'animate__fadeIn'],
                    animationOut: ['animate__animated', 'animate__fadeOut'],
                    dismiss: {
                      duration: 3000,
                      onScreen: true,
                    },
                  })}
              </>
            )}
          </>
        )}
      </div>
    )

    const renderGraphic = (
      <div key="graphic">
        <Candlestick
          render={true}
          height={300}
          symbolPair={`${fixedString}${selectedTokenToBuy}`}
        />
      </div>
    )

    dispatch({
      type: 'update',
      payload: {
        isLoading: false,
        responseData: [renderElement, renderGraphic],
      },
    })
  }

  const quickTradeFix = async () => {
    dispatch({
      type: 'update',
      payload: { isLoading: true },
    })

    const fixedString = quickTradeTokenState
      .toUpperCase()
      .replace('/', '')
      .trim()
    const tokenInfo = storeExchange
      .get('USDTBTCpairs')
      .find((el) => el.symbol === `${fixedString}${selectedTokenToBuy}`)

    const payload = {
      tokenInfo,
      availableTokenToBuy: quickTradeTokenToUseState,
      percentageGambleUp: quickTradePercentageGambleUp,
      percentageGambleDown: quickTradePercentageGambleDown,
      percentageBelowAvg: 0,
      baseSymbol: fixedString,
    }

    const buyResponse = await fetch(
      `/ocoFix/${fixedString}${selectedTokenToBuy}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    const buyResponseJson = await buyResponse.json()

    const renderElement = (
      <div className="response-smart-trade">
        {buyResponseJson.msg ? (
          <p>{buyResponseJson.msg}</p>
        ) : (
          <>
            <h3>OCO Order placed</h3>
            <p>{`${buyResponseJson.orderReports[0].type}: ${buyResponseJson.orderReports[0].price}`}</p>
            <p>{`${buyResponseJson.orderReports[1].type}: ${buyResponseJson.orderReports[1].price}`}</p>
          </>
        )}
      </div>
    )

    dispatch({
      type: 'update',
      payload: { isLoading: false, responseData: renderElement },
    })
  }

  const changeAutomaticMarketSell = (e) => {
    setAMS(e.target.checked)
  }

  return (
    <div className="list-buttons-container">
      <div className="list-buttons-group">
        <p className="list-buttons-group-title">Smart trade</p>
        <div className="list-inputs">
          <div className="list-inputs-row">
            <p>Token to buy</p>
            <input
              placeholder="Example: SC"
              onChange={changeQuickTradeToken}
              className="list-input-inputfield"
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  quickTrade()
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
                  quickTrade()
                }
              }}
            />
          </div>
          <div className="list-inputs-row">
            <p>Gain %</p>
            <input
              placeholder="Ex: 2%"
              defaultValue="1.5"
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
            <p>Loss %</p>
            <input
              placeholder="Ex: 1.5%"
              defaultValue="1.5"
              className="list-input-inputfield"
              onChange={changeQuickTradePercentageGambleDown}
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  changeQuickTradePercentageGambleDown()
                }
              }}
            />
          </div>
          <div className="list-inputs-row">
            <div className="list-checkbox-row">
              <a data-tip data-for="autMarketInfo">
                <p>AMS</p>
              </a>
              <ReactTooltip id="autMarketInfo" type="info" effect="solid">
                <span>
                  Automatic Market Sell
                  <br />
                  Enables automatic panic sell when the OCO order can't <br />
                  be placed, due to loss percentage being too low.
                  <br />
                  Useful for high market volatility scenarios (ex: pumps).
                </span>
              </ReactTooltip>
              <input type="checkbox" onChange={changeAutomaticMarketSell} />
            </div>
          </div>
        </div>
        <div className="list-buttons-items-multiple">
          <div className="container-button-with-icon">
            <a data-tip data-for="orderInfo">
              <IconInformation />
            </a>
            <ReactTooltip id="orderInfo" type="info" effect="solid">
              <span>
                Places an order. If it's filled instantly, then <br />
                automatically places an OCO order (two SELL orders) according{' '}
                <br />
                to gain/loss percentages entered above
              </span>
            </ReactTooltip>
            <button onClick={quickTrade}>Place order</button>
          </div>
        </div>
      </div>

      <Information />
    </div>
  )
}

export default SmartBuy
