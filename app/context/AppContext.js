import React from 'react'

export const initialStateApp = {
  isLoading: false,
  responseData: undefined,
}

export const reducer = (state, action) => {
  switch (action.type) {
    case 'reset':
      return initialStateApp
    case 'update':
      return {
        isLoading: action.payload.isLoading,
        responseData: action.payload.responseData,
      }
    default:
      return state
  }
}

export const AppContext = React.createContext()
