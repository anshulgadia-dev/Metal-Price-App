import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const socket = io('http://localhost:3000')

const containerDiv = document.querySelector('.container');

const url = 'http://localhost:3000/v1/prices';

socket.on('metal-prices-updated' , (data) => {
    console.log('Latest Price Recieved');
    updateOnUI(data);
})


let data;
let isFetching = false;
const fetchPrices = async () => {
    if(isFetching) return;
    isFetching = true;


  try {
    const res = await fetch(url);
    data = await res.json();

    if (!data) {
      console.log("No Metals Data Found");
      return;
    }

    console.log(data);
    updateOnUI(data);
  } catch (err) {
    console.error("Fetch failed:", err);
  } finally{
    isFetching = false;
  }
};

const updateOnUI = (data) => {
  containerDiv.innerHTML = '';

  for (const [key, val] of Object.entries(data?.metals || {})) {

    const cardDiv = document.createElement('div');
    cardDiv.className = 'card'

    const h2Tag = document.createElement('h2');
    h2Tag.innerText = key;
    h2Tag.className = 'metal-name';

    const pTag = document.createElement('p');
    pTag.innerText = `${data.currency} - ${Number(val).toFixed(3)} /${data.unit}`;
    pTag.className = 'metal-price';

    cardDiv.appendChild(h2Tag);
    cardDiv.appendChild(pTag)
    containerDiv.appendChild(cardDiv);
  }
};

// setInterval(fetchPrices, 5000);

fetchPrices();
