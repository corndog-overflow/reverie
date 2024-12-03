const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel, data) => {
      let validChannels = ['entry_data', 'delete-entry'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = ['entries-updated', 'delete-complete'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, data) => {
      let validChannels = ['get-entries'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
    }
  }
);

function getEntryValue(){
    val = document.getElementById("new_entry").value
    if (val == ""){
        return
    }
    else{
        substance = document.getElementById("new_entry").value
        console.log(val);
        document.getElementById("new_entry").value = ""
    }
    return val;
}


function sendToMainData(){
    val = getEntryValue();
    data = sqlite3.connect("reverie_data.db");
    const db = new sqlite3.Database('./reverie_data.db');
    ipcRenderer.send('entry_data', toString(val))
}
  



contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})