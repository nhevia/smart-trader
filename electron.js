require = require('esm')(module)
const electron = require('electron')
const Store = require('electron-store')
const console = require('console')
const getOpenPort = require('./app')

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const nativeImage = electron.nativeImage

Store.initRenderer()

try {
  require('electron-reloader')(module)
} catch {}

const path = require('path')
const url = require('url')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    icon: nativeImage.createFromPath(__dirname + '/app/assets/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      preload: __dirname + '/preload.js',
      enableRemoteModule: true,
    },
  })
  mainWindow.maximize()
  mainWindow.show()

  mainWindow.setMenuBarVisibility(false)

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// dynamic port
const checkForGlobalPort = setInterval(function () {
  if (global.openPort) {
    console.log('loading URL on port', global.openPort)
    mainWindow.loadURL(`http://localhost:${global.openPort}/`)
    clearInterval(checkForGlobalPort)
  }
}, 100)

// process.on('uncaughtException', function (error) {
//     // Handle the error
// })

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.console = new console.Console(process.stdout, process.stderr)
