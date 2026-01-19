const socket = io();

const ordersContainer = document.getElementById('orders');
const summaryEl = document.getElementById('summary');
const dataEl = document.getElementById('data');
const emptyEl = document.getElementById('empty');

function notify(msg){
  const n = document.getElementById('notify');
  n.innerText = msg;
  n.classList.remove('show');
  void n.offsetWidth;
  n.classList.add('show');
}

// Render orders
function renderOrders({ orders, total }){
  ordersContainer.innerHTML = '';
  emptyEl.style.display = orders.length ? 'none' : 'block';
  let totalQty = 0;

  orders.forEach(o => {
    totalQty += o.qty;
    const d = document.createElement('div');
    d.className = 'order';
    d.dataset.id = o.id;
    d.innerHTML = `
      <div class="badge">#${o.q}</div>
      <div class="name">${o.name}</div>
      <div class="meta">${o.flavor} • 12oz</div>
      <div class="meta">Qty: ${o.qty}</div>
      <div class="price">₱${o.qty*50}</div>
      <button class="complete" data-id="${o.id}">Complete</button>
    `;
    ordersContainer.appendChild(d);

    d.querySelector('.complete').addEventListener('click', ()=>{
      d.classList.add('destroy');
      setTimeout(()=> socket.emit('completeOrder', o.id), 450);
    });
  });

  summaryEl.innerText = `Total Sales Today: ₱${total}`;
  dataEl.innerText = `Orders Count: ${orders.length} | Total Quantity: ${totalQty}`;
}

// Place new order
document.getElementById('placeOrderBtn').addEventListener('click', ()=>{
  const name = document.getElementById('name').value.trim();
  const flavor = document.getElementById('flavor').value;
  const qty = +document.getElementById('qty').value;
  if(!name) return alert('Enter name');

  socket.emit('newOrder',{name,flavor,qty});
  document.getElementById('name').value = '';
  notify('Order added ✔');
});

// Export PNG
document.getElementById('exportBtn').addEventListener('click', ()=>{
  notify('Exporting daily sales...');
  html2canvas(document.querySelector('.card:last-child'), {backgroundColor:null})
    .then(c=>{
      const a = document.createElement('a');
      a.download = 'daily-sales.png';
      a.href = c.toDataURL();
      a.click();
      notify('Export complete ✔');
    });
});

// Live updates from server
socket.on('ordersUpdate', renderOrders);