import React, { useEffect, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import Spinner from '../Loader/Spinner'

const ResultFeedback = () => {
  const { store } = useContext(AppContext)

  return (
    <div className="response-container">
      {!store.isLoading ? (
        typeof store.responseData !== 'Array' ? (
          store.responseData
        ) : (
          <div className={`response-${store.responseData.length}`}>
            {store.responseData}
          </div>
        )
      ) : (
        <Spinner />
      )}
    </div>
  )
}

export default ResultFeedback
