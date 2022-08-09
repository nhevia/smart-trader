import React, { useState, useContext } from 'react'
import { AppContext } from 'context/AppContext'
import useCurrentOrders from 'components/Orders/CurrentOrders'
import Candlestick from 'components/Charts/Candlestick'
const coinImages = require.context('assets/coins', true)
import 'style/table.scss'

const ItemList = () => {
  const [pairLive, setPairLive] = useState()
  const [isGraphicRendered, setIsGraphicRendered] = useState(false)
  const [goToCurrentOrders, setGoToCurrentOrders] = useState(false)

  useCurrentOrders(goToCurrentOrders, setGoToCurrentOrders)

  const { dispatch } = useContext(AppContext)

  const changePairLive = (e) => {
    setPairLive(e.target.value)
  }

  const walletDump = async () => {
    dispatch({
      type: 'update',
      payload: { isLoading: true },
    })

    const response = await fetch(`/walletStatus/dump`)
    const jsonData = await response.json()

    // filters coins that are BNB network and sorts them
    const filteredData = jsonData
      .filter((coin) => {
        return coin.networkList.some((network) => network.network === 'BNB')
      })
      .sort((a, b) => b.free - a.free)

    const renderElement = (
      <table className="table-container">
        <thead>
          <tr>
            <th>Coin</th>
            <th>Name</th>
            <th>Free</th>
            <th>Locked</th>
          </tr>
        </thead>
        <tbody>
          {filteredData &&
            filteredData.map((el) => {
              let currentCoinImage
              try {
                currentCoinImage = coinImages(`./${el.coin}.png`).default
              } catch (_) {
                currentCoinImage = null
              }

              return (
                <tr key={el.coin}>
                  <td style={{ width: '20%' }}>
                    <img className="icon-coin" src={currentCoinImage} />
                    {el.coin}
                  </td>

                  <td style={{ width: '20%' }}>
                    <p>{el.name}</p>
                  </td>

                  <td style={{ width: '20%' }}>
                    <p>{el.free}</p>
                  </td>

                  <td style={{ width: '20%' }}>
                    <p>{el.locked}</p>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    )

    dispatch({
      type: 'update',
      payload: { isLoading: false, responseData: renderElement },
    })
  }

  const showGraphic = () => {
    // removes graphic, if there is one
    setIsGraphicRendered(false)

    dispatch({
      type: 'update',
      payload: { isLoading: true },
    })

    const fixedString = pairLive.toUpperCase().replace('/', '').trim()

    // re-renders (or renders for first time) the graphic
    setTimeout(() => {
      const renderElement = (
        <div>
          <Candlestick
            render={isGraphicRendered}
            symbolPair={fixedString}
            height={837}
          />
        </div>
      )

      dispatch({
        type: 'update',
        payload: { isLoading: false, responseData: renderElement },
      })
    }, 200)
  }

  return (
    <div className="list-buttons-container">
      <div className="list-buttons-group">
        <p className="list-buttons-group-title">Information</p>
        <div className="list-buttons-items">
          <button onClick={walletDump}>Wallet coin status</button>
        </div>
        <div className="list-buttons-items">
          <button onClick={() => setGoToCurrentOrders(true)}>
            Show active orders
          </button>
        </div>
        <div className="list-buttons-items-with-input">
          <input
            placeholder="Example: ADAUSDT"
            onChange={changePairLive}
            className="list-input-inputfield"
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                showGraphic()
              }
            }}
          />
          <button onClick={showGraphic}>Live price</button>
        </div>
      </div>
    </div>
  )
}

export default ItemList
