const express = require('express');
const fs = require('fs');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const ORDERS_FILE = 'orders.json';

let orders = [];
let total = 0;

// Load saved orders
try {
  const data = fs.readFileSync(ORDERS_FILE);
  const parsed = JSON.parse(data);
  orders = parsed.orders || [];
  total = parsed.total || 0;
} catch(e) {
  console.log('No saved orders found, starting fresh');
}

// Save orders
function saveOrders(){
  fs.writeFileSync(ORDERS_FILE, JSON.stringify({orders, total}, null, 2));
}

// Get next smallest order number
function getNextOrderNumber(){
  const numbers = orders.map(o=>o.q).sort((a,b)=>a-b);
  let n = 1;
  for(const num of numbers){
    if(num===n) n++;
    else break;
  }
  return n;
}

// Socket.io
io.on('connection', socket => {
  socket.emit('ordersUpdate', { orders, total });

  socket.on('newOrder', data => {
    const order = {
      id: Date.now(),
      name: data.name,
      flavor: data.flavor,
      qty: data.qty,
      q: getNextOrderNumber()
    };
    orders.push(order);
    saveOrders();
    io.emit('ordersUpdate', { orders, total });
  });

  socket.on('completeOrder', id => {
    const order = orders.find(o=>o.id===id);
    if(order){
      orders = orders.filter(o=>o.id!==id);
      total += order.qty * 50;
      saveOrders();
      io.emit('ordersUpdate', { orders, total });
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));