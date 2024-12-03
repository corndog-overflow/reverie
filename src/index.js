const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const ipc = require('electron').ipcMain;
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const db = new sqlite3.Database('./reverie_data.db');

let mainWindow;
const createWindow = () => {
  // Create the browser window.
    mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // frame: false,
    autoHideMenuBar: true,
    center: true,
    // transparent: true,
    titleBarStyle : "transparent",
    resizable: true,
    icon: __dirname +  "/assets/reverie.png",
    contextIsolation: false,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setMinimumSize(620, 720);
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  db.serialize(() => {
    // Create a table
    db.run("CREATE TABLE IF NOT EXISTS Entries (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, data TEXT)", function(err) {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Table "Entries" created or already exists.');
      }
    });
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};


ipcMain.on("entry_data", (event, args) => {
  const today = new Date();
  const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  
  console.log("Inserting new entry:", args);
  
  db.run("INSERT INTO Entries (date, data) VALUES (?, ?)", [formattedDate, args], function(err) {
    if (err) {
      console.error('Error inserting entry:', err.message);
      return;
    }
    
    console.log("Entry inserted, fetching all entries");
    // After successful insert, fetch all entries and send back to renderer
    db.all("SELECT * FROM Entries ORDER BY id DESC", (err, rows) => {
      if (err) {
        console.error('Error fetching entries:', err.message);
        return;
      }
      console.log("Sending updated entries to renderer:", rows);
      event.reply('entries-updated', rows);
    });
  });
});

// Add new IPC handler for initial load
ipcMain.handle('get-entries', async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM Entries ORDER BY id DESC", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
});

// ipcMain.handle('db-query', async (event, sqlQuery) => {
//   return new Promise(res => {
//       db.all(sqlQuery, (err, rows) => {
//         res(rows);
//       });
//   });
// });

// Add new IPC handler for deleting entries
ipcMain.on('delete-entry', (event, id) => {
  console.log("Deleting entry with id:", id);
  
  db.run("DELETE FROM Entries WHERE id = ?", [id], function(err) {
    if (err) {
      console.error('Error deleting entry:', err.message);
      event.reply('entries-updated', null);
      return;
    }
    
    // After successful delete, fetch all entries and send back to renderer
    db.all("SELECT * FROM Entries ORDER BY id DESC", (err, rows) => {
      if (err) {
        console.error('Error fetching entries:', err.message);
        event.reply('entries-updated', null);
        return;
      }
      console.log("Sending updated entries after delete:", rows);
      event.reply('entries-updated', rows);
      
      // Send an additional confirmation of deletion
      event.reply('delete-complete', id);
    });
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// app.on('quit', () => {
//   db.close((err) => {
//       if (err) {
//           console.error(err.message);
//       }
//       console.log('Closed the database connection.');
//   });
// });

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

