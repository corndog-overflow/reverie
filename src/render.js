// import { createClient } from 'redis';
const ipcRenderer = require("electron")
// console.log('hello, world!')

// const client = createClient({
//     password: 'PAKKOtVnS5Q2rZ4wkBYI2g4Sz5HSECfb',
//     socket: {
//         host: 'redis-10597.c99.us-east-1-4.ec2.redns.redis-cloud.com',
//         port: 10597
//     }
// });

// client.on('error', (err) => console.log('Redis Client Error', err));

// await client.connect();

// electron = require('electron');


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
    const val = getEntryValue();
    if (!val) return;
    
    // Trigger rainbow animation only for "reverie"
    const title = document.querySelector('h1');
    const titleText = title.textContent;
    const beforeReverie = titleText.substring(0, 0); // Empty in this case
    const afterReverie = titleText.substring(7); // " 1.o; it's good to see you"
    
    // Split only the word "reverie"
    const reverieLetters = "reverie".split('').map(letter => 
      `<span class="rainbow-letter" style="animation-delay: 0s">${letter}</span>`
    ).join('');
    
    // Reconstruct the title with only "reverie" animated
    title.innerHTML = beforeReverie + reverieLetters + afterReverie;
    
    // Animate each letter of "reverie" with a delay
    const spans = title.querySelectorAll('.rainbow-letter');
    spans.forEach((span, index) => {
      span.style.animationDelay = `${index * 0.1}s`;
    });

    console.log("Sending entry to main:", val);
    window.api.send('entry_data', val);
    document.getElementById("new_entry").value = "";
    changePlaceholder();
    
    // Refresh entries immediately after sending
    loadEntries();
}
  



function bagel(){
    console.log("hello, world!");
}
async function updatePage() {
    try {
        const response = await fetch("https://zenquotes.io/api/random");
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);

        const banner = document.getElementById("banner");
        console.log(data[0]["q"]);
        
        banner.innerHTML = data[0]["q"] + "<br> <br> - " + data[0]["a"] ;
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function changePlaceholder(){
    const placeholders = ["What was something good you had to eat lately?", "Are you looking forward to anything soon?", 
        "Whats a song that you cant stop listening to?", "Is there anyone you miss right now?", "What's your next stylish outfit gonna be?",
        "The highest form of self sovereignty is being able to take care of yourself. How do you do that?"
    ];
    const change = document.getElementById("new_entry")
    change.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];


    const today = new Date();

    // Get individual components
    const day = today.getDate();
    const month = today.getMonth() + 1; // Months are 0-indexed
    const year = today.getFullYear();

    // Format the date
    const formattedDate = `${month}/${day}/${year}`;
    console.log(formattedDate); // Output: 11/4/2024
    const date_holder = document.getElementById("date");
    console.log(date)
    date_holder. innerText = formattedDate;
}




function centerWindow() {

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const elementToCenter = document.getElementById("myWindow"); // Replace with your window element ID
    const elementWidth = elementToCenter.offsetWidth;
    const elementHeight = elementToCenter.offsetHeight;
    const leftPos = (windowWidth / 2) - (elementWidth / 2);
    const topPos = (windowHeight / 2) - (elementHeight / 2);
    elementToCenter.style.left = leftPos + "px";
  
    elementToCenter.style.top = topPos + "px";
  
  }

  window.addEventListener('resize', centerWindow())

async function loadEntries() {
  try {
    const entries = await window.api.invoke('get-entries');
    updateEntriesPanels(entries);
  } catch (error) {
    console.error('Error loading entries:', error);
  }
}

function updateEntriesPanels(entries) {
  console.log("Updating panels with entries:", entries);
  const container = document.querySelector('.previous_entries_container');
  container.innerHTML = ''; // Clear existing entries

  if (!entries || entries.length === 0) {
    container.innerHTML = '<div class="no-entries">No entries yet</div>';
    return;
  }

  entries.forEach(entry => {
    const panel = document.createElement('div');
    panel.className = 'entry_panel';
    panel.dataset.entryId = entry.id; // Store the entry ID
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'entry_date';
    dateDiv.textContent = entry.date;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'entry_content';
    contentDiv.textContent = entry.data;
    
    panel.appendChild(dateDiv);
    panel.appendChild(contentDiv);
    
    // Add context menu event listener
    panel.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e, entry.id);
    });
    
    container.appendChild(panel);
  });
}

// Add context menu functions
function showContextMenu(event, entryId) {
  removeContextMenu();
  
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.position = 'fixed';
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete Entry';
  deleteButton.onclick = async () => {
    window.api.send('delete-entry', entryId);
    removeContextMenu();
    
    // Wait briefly for the delete operation to complete
    setTimeout(async () => {
      try {
        // Reload entries after deletion
        const entries = await window.api.invoke('get-entries');
        updateEntriesPanels(entries);
      } catch (error) {
        console.error('Error refreshing entries after delete:', error);
      }
    }, 100);
  };
  
  menu.appendChild(deleteButton);
  document.body.appendChild(menu);
  
  // Close menu when clicking outside
  document.addEventListener('click', removeContextMenu);
}

function removeContextMenu() {
  const existingMenu = document.querySelector('.context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  document.removeEventListener('click', removeContextMenu);
}

// Make sure loadEntries is called when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("Loading entries...");
  loadEntries();
  changePlaceholder();
  updatePage();
});

// Make sure we're properly listening for updates
window.api.receive('entries-updated', (entries) => {
  console.log("Received updated entries:", entries);
  if (entries) {
    updateEntriesPanels(entries);
  } else {
    console.error('Received null or undefined entries');
  }
});

// Add a refresh function that can be called when needed
async function refreshEntries() {
  try {
    const entries = await window.api.invoke('get-entries');
    updateEntriesPanels(entries);
  } catch (error) {
    console.error('Error refreshing entries:', error);
  }
}
