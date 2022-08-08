import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../../Context/AppContext'
import useCancelOrder from './CancelOrder'

const useCurrentOrders = (visible, setVisible) => {
  const [orderToCancel, setOrderToCancel] = useState()

  const { dispatch } = useContext(AppContext)

  useCancelOrder(orderToCancel)

  useEffect(() => {
    if (visible) {
      const dispatchResults = async (_) => {
        dispatch({
          type: 'update',
          payload: { isLoading: true },
        })

        const response = await fetch(`/currentOrders`)
        const jsonData = await response.json()

        const renderElement = (
          <table className="table-container">
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
              {jsonData &&
                jsonData.map((el) => {
                  return (
                    <tr key={el.clientOrderId}>
                      <td style={{ width: '12%' }}>{el.symbol}</td>

                      <td style={{ width: '10%' }}>
                        <p>{el.side}</p>
                      </td>

                      <td style={{ width: '19%' }}>
                        <p>{el.type}</p>
                      </td>

                      <td style={{ width: '20%' }}>
                        <p>{el.origQty}</p>
                      </td>

                      <td style={{ width: '15%' }}>
                        <p>{el.price}</p>
                      </td>

                      {/* <td style={{width: '12%'}}>
                    <p >
                      {el.orderId}
                    </p>
                  </td> */}

                      <td style={{ width: '12%' }}>
                        <p>
                          <button onClick={() => setOrderToCancel(el)}>
                            Cancel
                          </button>
                        </p>
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

      dispatchResults()
    }
    return () => setVisible(false)
  }, [visible])

  return null
}

export default useCurrentOrders
