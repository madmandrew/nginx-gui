const {app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, electron} = require('electron')
const url = require("url");
const path = require("path");
const nodeCmd = require('node-cmd');
const fs = require('fs');
const bfs = require('fs-backwards-stream');
const store = new (require('electron-store'))();

let mainWindow;
let isQuitting = false;
let nginxDir;
let tray;
let isRunning = false;
let errors = [];

if (store.get('runOnStartup') == null) {
  console.log("Set run on startup")
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe')
  });
}

setInterval(checkStatus, 20000);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    icon: path.join(__dirname, '/nginx-logo.ico'),
    webPreferences: {
      nodeIntegration: true,
      devTools: false
    }
  })

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/index.html`),
      protocol: "file:",
      slashes: true
    })
  );
  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('minimize', function (event) {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', function (event) {
    mainWindow = null
  });

  //Tray setup
  const trayIconPath = path.join(__dirname, '/nginx-logo-bad.png');
  let trayImg = nativeImage.createFromPath(trayIconPath);
  trayImg = trayImg.resize({width: 16, height: 16});

  tray = new Tray(trayImg);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Info and Logs', type: 'normal', click: function () {
        mainWindow.show();
      }
    },
    {
      label: 'Start Nginx', type: 'normal', click: function () {
        startNginx();
      }
    },
    {
      label: 'Stop Nginx', type: 'normal', click: function () {
        killTasks();
      }
    },
    {
      label: 'Reload Nginx', type: 'normal', click: function () {
        reloadNginx();
      }
    },
    {
      label: 'Quit', type: 'normal', click: function () {
        isQuitting = true;
        app.quit();
      }
    },
  ]);
  tray.setToolTip('This is a test!');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());

  app.setAppUserModelId(process.execPath);
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

ipcMain.on('getNginxStatus', (event, arg) => getNginxStatus(event));
ipcMain.on('killNginx', (event, arg) => killTasks(arg));
ipcMain.on('startNginx', (event, arg) => startNginx());
ipcMain.on('reloadNginx', (event, arg) => reloadNginx());
ipcMain.on('setNginxDir', (event, arg) => setAndWatchNginxDir(arg));
ipcMain.on('getErrors', (event, arg) => event.sender.send('replyErrors', errors));
ipcMain.on('clearErrors', (event, arg) => errors = []);
ipcMain.on('readNginxConfig', (event, arg) => readConfig());
ipcMain.on('runOnStartup', (event, arg) => {
  app.setLoginItemSettings({
    openAtLogin: arg,
    path: app.getPath('exe')
  });
  store.set('runOnStartup', arg);
});
ipcMain.on('loadLogFiles', (event, arg) => {
  const accessFile = nginxDir + 'logs/access.log';
  const errorFile = nginxDir + 'logs/error.log';
  readFile(accessFile, 'accessFile');
  readFile(errorFile, 'errorFile');
});

function getNginxStatus(event) {
  nodeCmd.get('tasklist /fi "imagename eq nginx.exe" /FO CSV', (err, data, stderr) => {
    if (err || stderr) {
      handleError(err, stderr, 'Failed to check nginx status');
    } else {
      if (data.indexOf('No tasks are running') !== -1) {
        console.warn("Nginx isn't running")
      }
      event.sender.send('replyNginxStatus', data);

    }
    checkStatus();
  });
}

function killTasks() {
  nodeCmd.get('tasklist /fi "imagename eq nginx.exe" /FO CSV', (err, data, stderr) => {
    if (err || stderr) {
      handleError(err, stderr, 'Failed to check nginx status');
      return;
    }

    let taskList = data.trim().split('\n');
    const taskPIDs = taskList.map(i => i.split('","')[1]);

    for (let taskPID of taskPIDs) {
      nodeCmd.get(`taskkill /F /PID ${taskPID}`, (err, data, stderr) => {
        if (err || stderr) {
          handleError(err, stderr, `Failed to kill task PID(${taskPID})`)
        }
      });
    }

    //TODO wait for all tasks to finish, convert callbacks to promises and await all probably
    const notification = new Notification({title: 'Stopped Nginx Tasks', body: ''});
    notification.show();

    checkStatus();
  });
}

function startNginx() {

  nodeCmd.get(`cd ${nginxDir} && start nginx.exe`, (err, data, stderr) => {
    if (err || stderr) {
      handleError(err, stderr, 'Failed to start Nginx');
    } else {
      const notification = new Notification({title: 'Started Nginx', body: ''});
      notification.show();
    }

    checkStatus();
  });
}

function reloadNginx() {
  nodeCmd.get(`cd ${nginxDir} && nginx.exe -s reload`, (err, data, stderr) => {
    if (err || stderr) {
      handleError(err, stderr, 'Failed to reload Nginx');
    } else {
      const notification = new Notification({title: 'Reloaded Nginx', body: ''});
      notification.show();
    }
    checkStatus();
  })

}

function checkStatus() {
  nodeCmd.get('tasklist /fi "imagename eq nginx.exe" /FO CSV', (err, data, stderr) => {
    if (data.indexOf('No tasks are running') !== -1) {
      //Prevents duplicate updates
      if (!isRunning)
        return;
      //update red status
      const trayIconPath = path.join(__dirname, '/nginx-logo-bad.png');
      let trayImg = nativeImage.createFromPath(trayIconPath);
      trayImg = trayImg.resize({width: 16, height: 16});

      tray.setImage(trayImg);
      tray.setToolTip('Nginx is Stopped');
      isRunning = false;
    } else {
      if (isRunning)
        return;
      //update green status
      const trayIconPath = path.join(__dirname, '/nginx-logo-good.png');
      let trayImg = nativeImage.createFromPath(trayIconPath);
      trayImg = trayImg.resize({width: 16, height: 16});

      tray.setImage(trayImg);
      tray.setToolTip('Nginx is Running!');
      isRunning = true;
    }
  });
}

function handleError(err, stderr, msg) {
  if (errors.length > 10) {
    errors.shift();
  }
  const error = err == null ? stderr : err;
  errors.push({
    error: error,
    timestamp: new Date()
  });
  const notification = new Notification({title: 'Error', body: msg});
  notification.show();
}


function setAndWatchNginxDir(newDir) {
  if (newDir === nginxDir) {
    return;
  }
  nginxDir = newDir;

  const accessFile = nginxDir + 'logs/access.log';
  fs.watchFile(accessFile, (curr, prev) => {
    //TODO curr.size, prev.size  could compare and use read backwards to just read difference, and append log file
    //TODO probably easier for now to just read the whole thing
    readFile(accessFile, 'accessFile');
  });

  const errorFile = nginxDir + 'logs/error.log';
  fs.watchFile(errorFile, (curr, prev) => {
    readFile(errorFile, 'errorFile');
  });
}

function readFile(file, sendTo) {
  //read stream
  console.log("start file stream", file);
  const stream = fs.createReadStream(file);
  let fileData = '';
  stream.on('data', function (data) {
    fileData += data.toString();
  });

  stream.on('close', () => {
    const fileLines = fileData.split(/\r?\n/);
    mainWindow.webContents.send(sendTo, fileLines);
  });

  stream.on('error', function (err) {
    console.warn("ERROR reading file: ", file)
  });
}

function readConfig()
{
  const stream = fs.createReadStream(nginxDir + 'conf/nginx.conf');
  let fileData = '';
  stream.on('data', function (data) {
    fileData += data.toString();
  });

  stream.on('close', () => {
    mainWindow.webContents.send('replyNginxConfig', fileData);
  });

  stream.on('error', function (err) {
    console.warn("ERROR reading file: ", file)
  });
}

// function readFileBackwards(file)
// {
//   console.log("starting stream");
//   //read stream backwards
//   const stream = bfs(file, {block: 1024});
//   stream.on('data',(buffer) => {
//     console.log("TEST backwards: ", buffer.toString());
//   })
// }
