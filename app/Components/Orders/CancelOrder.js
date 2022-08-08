import React, { useEffect, useContext } from 'react'
import { AppContext } from '../../Context/AppContext'
import { store as storeNotification } from 'react-notifications-component'

const useCancelOrder = (order, onlyShowOrders) => {
  const { dispatch } = useContext(AppContext)
  useEffect(() => {
    if (order) {
      const executeAsync = async (_) => {
        const cancelOrder = async (_) => {
          const type = order.orderListId > 0 ? 'oco' : 'normal'

          if (type === 'normal') {
            const response = await fetch(
              `/cancelOrder/${order.symbol}/${order.orderId}`,
              {
                method: 'DELETE',
              }
            )
            // TODO: catch errors
            // jsonData = await response.json()
          } else if (type === 'oco') {
            const response = await fetch(
              `/cancelOrderOCO/${order.symbol}/${order.orderListId}`,
              {
                method: 'DELETE',
              }
            )
            // jsonData = await response.json()
          }

          storeNotification.addNotification({
            title: 'Success',
            message: `Order ${order.symbol} cancelled`,
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
        }

        // TODO: do somethign about this... it should show the active orders again
        // const dispatchResults = async _ => {
        //   dispatch({
        //     type: 'update',
        //     payload: { isLoading: true },
        //   })

        //   const response = await fetch(
        //     `/currentOrders`
        //   )
        //   const jsonData = await response.json()

        //   const renderElement = (
        //     <table className="table-container">
        //       <thead>
        //         <tr>
        //           <th>Coin pair</th>
        //           <th>Side</th>
        //           <th>Type</th>
        //           <th>Quantity</th>
        //           <th>Price</th>
        //           <th>Order ID</th>
        //           <th>Action</th>
        //         </tr>
        //       </thead>
        //       <tbody>
        //         {jsonData && jsonData.map(el => {
        //           return (
        //             <tr key={el.clientOrderId}>
        //               <td style={{width: '12%'}}>
        //                 {el.symbol}
        //               </td>

        //               <td style={{width: '10%'}}>
        //                 <p>
        //                   {el.side}
        //                 </p>
        //               </td>

        //               <td style={{width: '19%'}}>
        //                 <p>
        //                   {el.type}
        //                 </p>
        //               </td>

        //               <td style={{width: '20%'}}>
        //                 <p>
        //                   {el.origQty}
        //                 </p>
        //               </td>

        //               <td style={{width: '15%'}}>
        //                 <p>
        //                   {el.price}
        //                 </p>
        //               </td>

        //               <td style={{width: '12%'}}>
        //                 <p >
        //                   {el.orderId}
        //                 </p>
        //               </td>

        //               {/*
        //               // TODO: this won't work here, fix. I thought it did but i had no other orders showing when canceling
        //               <td style={{width: '12%'}}>
        //                 <p>
        //                   <button onClick={() => setOrderToCancel(el)}>Cancel</button>
        //                 </p>
        //               </td> */}
        //             </tr>
        //           )
        //         })}
        //       </tbody>
        //     </table>
        //   )

        //   dispatch({
        //     type: 'update',
        //     payload: { isLoading: false, responseData: renderElement },
        //   })
        // }

        await cancelOrder()
        // await dispatchResults()
      }

      executeAsync()
    }
  }, [order])
}

export default useCancelOrder
