import React from 'react'
const Binance = require('node-binance-api')
const binance = new Binance().options({
  reconnect: false,
})
import { createChart } from 'lightweight-charts'

let chart
let candlestickSeries

const Candlestick = ({ symbolPair, height = 837 }) => {
  const chartRef = React.useRef()

  React.useEffect(() => {
    chart = createChart(chartRef.current, {
      width: chartRef.current.offsetWidth,
      height: height,
      alignLabels: true,
      layout: {
        backgroundColor: '#283040',
        textColor: 'white',
      },
      grid: {
        vertLines: {
          color: 'rgba(70, 130, 180, 0.5)',
          style: 1,
          visible: true,
        },
        horzLines: {
          color: 'rgba(70, 130, 180, 0.5)',
          style: 1,
          visible: true,
        },
      },
      timeScale: {
        rightOffset: 0,
        barSpacing: 15,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        borderVisible: false,
        borderColor: '#fff000',
        visible: true,
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const offset = new Date(time).getTimezoneOffset()

          const fixedTime = new Date((time + offset * 60) * 1000)

          // parse the time like "HH:mm"
          const hours = fixedTime.getHours()
          const minutes = fixedTime.getMinutes()
          let fixedHour = `${hours < 10 ? `0${hours}` : hours}:${
            minutes < 10 ? `0${minutes}` : minutes
          }`

          // show day number instead of 00:00
          if (fixedHour === '00:00') {
            fixedHour = fixedTime.getDate()
          }

          return fixedHour
        },
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.3,
          bottom: 0.25,
        },
        borderVisible: false,
      },
      priceScale: {
        autoScale: true,
      },
      watermark: {
        color: 'rgba(255, 255, 255, 0.7)',
        visible: true,
        fontSize: 18,
        horzAlign: 'left',
        vertAlign: 'top',
        text: symbolPair,
      },
    })

    candlestickSeries = chart.addCandlestickSeries({
      priceScaleId: 'right',
      upColor: '#00AA00',
      downColor: '#AA0000',
      borderVisible: false,
      wickVisible: true,
      borderColor: '#000000',
      borderUpColor: '#00AA00',
      borderDownColor: '#AA0000',
      wickUpColor: '#00AA00',
      wickDownColor: '#AA0000',
      priceFormat: {
        type: 'custom',
        minMove: '0.00000001',
        formatter: (price) => {
          return parseFloat(price).toFixed(8)
        },
      },
    })
  }, [])

  React.useEffect(() => {
    binance.candlesticks(
      `${symbolPair}`,
      '5m',
      (error, ticks, symbol) => {
        const parsedTicks = ticks.map((tick) => {
          let [time, open, high, low, close] = tick

          const offset = new Date(time).getTimezoneOffset()
          const offsetedTime = time - offset * 60 * 1000

          return {
            time: offsetedTime / 1000,
            open: parseFloat(open),
            high: parseFloat(high),
            low: parseFloat(low),
            close: parseFloat(close),
          }
        })
        candlestickSeries.setData(parsedTicks)
      },
      { limit: 500, endTime: Date.now() }
    )
  }, [])

  React.useEffect(() => {
    binance.websockets.candlesticks(`${symbolPair}`, '5m', (candlesticks) => {
      let { s: symbol, k: ticks } = candlesticks
      let { o: open, h: high, l: low, c: close, t: time } = ticks

      const offset = new Date(time).getTimezoneOffset()
      const offsetedTime = time - offset * 60 * 1000

      const lastCandle = {
        time: offsetedTime / 1000,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
      }
      candlestickSeries.update(lastCandle)
    })
    return () => {
      binance.websockets.terminate(`${symbolPair.toLowerCase()}@kline_5m`)
      chart.remove()
      chart = null
      chartRef.current = null
    }
  }, [])

  return (
    <div
      ref={chartRef}
      id="chart"
      style={{ position: 'relative', width: '100%' }}
    />
  )
}

export default Candlestick
