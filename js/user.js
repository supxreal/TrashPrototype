document.addEventListener('DOMContentLoaded', () => {
    const session = db.getActiveSession();
    if (!session || session.role !== 'User') {
        window.location.href = 'index.html';
        return;
    }

    const username = session.username;
    document.getElementById('display-name').textContent = username;

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const bgClass = type === 'success' ? 'bg-white/90' : 'bg-red-500/90';
        const textClass = type === 'success' ? 'text-gray-800' : 'text-white';
        const icon = type === 'success' ? '✅' : '❌';
        
        toast.className = `${bgClass} backdrop-blur-xl ${textClass} px-6 py-3 rounded-full shadow-lg font-semibold text-sm flex items-center gap-2 transform -translate-y-10 opacity-0 transition-all duration-300 border border-white/20`;
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.remove('-translate-y-10', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('-translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function updateBalanceUI() {
        const dbData = db.getDB();
        const userData = dbData.users[username];
        const ptsEl = document.getElementById('user-points');
        const thbEl = document.getElementById('user-thb');
        
        ptsEl.style.transform = 'scale(1.1)';
        ptsEl.style.color = '#10b981'; 
        
        setTimeout(() => {
            ptsEl.textContent = userData.points.toLocaleString();
            thbEl.textContent = `฿${userData.balanceTHB.toFixed(2)}`;
            ptsEl.style.transform = 'scale(1)';
            ptsEl.style.color = '#2563eb';
        }, 200);
    }

    updateBalanceUI();

    // 1. จัดการ User Address
    const addressInput = document.getElementById('user-address-input');
    const addressBtn = document.getElementById('save-address-btn');
    
    // โหลดที่อยู่เดิมมาแสดง
    const initialDb = db.getDB();
    if (initialDb.users[username].address) {
        addressInput.value = initialDb.users[username].address;
    }

    addressBtn.addEventListener('click', () => {
        const dbData = db.getDB();
        dbData.users[username].address = addressInput.value.trim();
        db.saveDB(dbData);
        showToast("Address saved!");
    });

    // 2. โหลด Buyers List (เพิ่มปุ่ม Request Home Pickup ให้ทำงานสมจริงขึ้น)
    function renderBuyers() {
        const dbData = db.getDB();
        const listContainer = document.getElementById('buyers-list');
        listContainer.innerHTML = '';

        if (dbData.buyersList.length === 0) {
            listContainer.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">No buyers available yet.</p>';
            return;
        }

        dbData.buyersList.forEach(buyer => {
            const div = document.createElement('div');
            div.className = 'bg-white/50 p-4 rounded-xl border border-gray-100 flex justify-between items-center';
            
            const pickupBadge = buyer.homePickup 
                ? '<span class="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">Pickup Available</span>' 
                : '';

            div.innerHTML = `
                <div>
                    <p class="font-bold text-gray-800">${buyer.username}</p>
                    <p class="text-xs text-gray-500 mb-1">📍 ${buyer.location}</p>
                    ${pickupBadge}
                </div>
                ${buyer.homePickup 
                    ? `<button class="request-pickup-btn text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-black font-semibold transition" data-buyer="${buyer.username}">Request</button>` 
                    : ''}
            `;
            listContainer.appendChild(div);
        });

        document.querySelectorAll('.request-pickup-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buyerName = e.target.getAttribute('data-buyer');
                const currentUserAddress = document.getElementById('user-address-input').value.trim();
                
                if (!currentUserAddress) {
                    showToast("Please save your address above first!", "error");
                    addressInput.focus();
                    return;
                }
                showToast(`Pickup request sent to ${buyerName}!`);
            });
        });
    }
    renderBuyers();

    // 3. ระบบแสดงประวัติ History (ฝั่ง User)
    function renderUserHistory() {
        const dbData = db.getDB();
        const historyList = document.getElementById('user-history-list');
        historyList.innerHTML = '';

        // ดึงของ User คนนี้ที่สแกนเสร็จแล้ว
        const myTransactions = Object.values(dbData.transactions)
            .filter(tx => tx.scannedBy === username && tx.status === 'completed')
            .sort((a, b) => b.scannedAt - a.scannedAt);

        if (myTransactions.length === 0) {
            historyList.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">No transactions yet. Start recycling!</p>';
            return;
        }

        myTransactions.forEach(tx => {
            const date = new Date(tx.scannedAt).toLocaleString();
            let itemsText = [];
            // ดักจับ Error: ถ้าเป็นข้อมูลใหม่ (มี tx.items) ให้ทำงานแบบใหม่
            if (tx.items) {
                for (const [type, qty] of Object.entries(tx.items)) {
                    itemsText.push(`${type} ${qty}kg`);
                }
            } 
            // ดักจับ Error: ถ้าเป็นข้อมูลเก่า (มีแค่ tx.type) ให้ทำงานแบบเก่า
            else if (tx.type) {
                itemsText.push(`${tx.type} ${tx.weight}kg`);
            }

            const div = document.createElement('div');
            div.className = 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm';
            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-bold text-gray-800">Sold to: ${tx.buyer}</p>
                        <p class="text-xs text-gray-400">${date}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-blue-600">+${tx.points} Pts</p>
                        <p class="font-bold text-green-600">฿${tx.thb}</p>
                    </div>
                </div>
                <div class="bg-blue-50/50 p-2 rounded text-xs text-gray-600">
                    <span class="font-semibold">Items:</span> ${itemsText.join(', ')}
                </div>
            `;
            historyList.appendChild(div);
        });
    }
    renderUserHistory();

    // 4. QR Scanner
    const modal = document.getElementById('scanner-modal');
    let html5QrcodeScanner = null;

    document.getElementById('open-scanner-btn').addEventListener('click', () => {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        html5QrcodeScanner = new Html5Qrcode("reader");
        html5QrcodeScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {})
            .catch(() => { showToast("Camera unavailable", "error"); closeScanner(); });
    });

    function closeScanner() {
        if (html5QrcodeScanner) html5QrcodeScanner.stop().catch(() => {});
        modal.classList.add('opacity-0', 'pointer-events-none');
    }
    document.getElementById('close-scanner-btn').addEventListener('click', closeScanner);

    function onScanSuccess(decodedText) {
        closeScanner();
        try {
            const payload = JSON.parse(decodedText);
            const dbData = db.getDB();
            const transaction = dbData.transactions[payload.txId];
            
            if (!transaction) return showToast("Invalid QR Code", "error");
            if (transaction.status === 'completed') return showToast("QR already used!", "error");

            // อัปเดตข้อมูล Transaction และแนบที่อยู่ User ไปให้ Buyer ดูด้วย
            transaction.status = 'completed';
            transaction.scannedBy = username;
            transaction.scannedAt = Date.now();
            transaction.userAddress = dbData.users[username].address || ''; // <--- ดึงที่อยู่แนบไปตรงนี้
            
            // บวกเงินให้ User
            dbData.users[username].points += payload.points;
            dbData.users[username].balanceTHB += payload.thb;
            
            db.saveDB(dbData);
            
            updateBalanceUI();
            renderUserHistory(); // อัปเดตประวัติฝั่ง User ทันที
            showToast(`Earned ${payload.points} Pts!`);
            
        } catch (e) {
            showToast("Unrecognized format", "error");
        }
    }

    // 5. Redeem Rewards
    document.querySelectorAll('.redeem-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cost = parseInt(e.target.getAttribute('data-cost'));
            const itemName = e.target.getAttribute('data-name');
            const dbData = db.getDB();
            const userData = dbData.users[username];
            
            if (userData.points >= cost) {
                userData.points -= cost;
                db.saveDB(dbData);
                updateBalanceUI();
                showToast(`Redeemed ${itemName} successfully!`);
            } else {
                showToast(`Need ${cost - userData.points} more points`, "error");
            }
        });
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem(db.sessionKey);
        window.location.href = 'index.html';
    });
});