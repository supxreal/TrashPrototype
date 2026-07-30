document.addEventListener('DOMContentLoaded', () => {
    const session = db.getActiveSession();
    if (!session || session.role !== 'Buyer') {
        window.location.href = 'index.html';
        return;
    }

    const username = session.username;
    document.getElementById('display-name').textContent = username;

    // ข้อมูลเรทราคา (Mock Data)
    const rates = {
        'Hazardous': { name: '🔴 Hazardous', points: 100, thb: 10 },
        'Recyclable': { name: '🟡 Recyclable', points: 75, thb: 5 },
        'Organic': { name: '🟢 Organic', points: 50, thb: 2 },
        'General': { name: '🔵 General', points: 25, thb: 1 }
    };

    // เก็บน้ำหนักแยกตามประเภท
    let wasteWeights = { Hazardous: 0, Recyclable: 0, Organic: 0, General: 0 };
    let totalPoints = 0;
    let totalThb = 0;

    // 1. สร้าง UI สำหรับเลือกขยะแบบผสม (Mix & Match)
    const container = document.getElementById('waste-inputs-container');
    Object.keys(rates).forEach(type => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex items-center justify-between bg-white/50 p-3 rounded-xl border border-gray-100';
        itemDiv.innerHTML = `
            <div class="flex flex-col">
                <span class="font-semibold text-gray-800 text-sm">${rates[type].name}</span>
                <span class="text-[10px] text-gray-500">${rates[type].points} Pts/kg | ฿${rates[type].thb}/kg</span>
            </div>
            <div class="flex items-center space-x-3">
                <button class="btn-minus w-7 h-7 rounded-full bg-gray-200 text-gray-600 font-bold hover:bg-gray-300" data-type="${type}">-</button>
                <span class="weight-display font-bold text-lg w-6 text-center" id="weight-${type}">0</span>
                <button class="btn-plus w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold hover:bg-blue-200" data-type="${type}">+</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });

    // 2. ฟังก์ชันคำนวณยอดรวม
    function updateCalculator() {
        totalPoints = 0;
        totalThb = 0;
        Object.keys(wasteWeights).forEach(type => {
            totalPoints += wasteWeights[type] * rates[type].points;
            totalThb += wasteWeights[type] * rates[type].thb;
            document.getElementById(`weight-${type}`).textContent = wasteWeights[type];
        });

        document.getElementById('calc-points').textContent = totalPoints.toLocaleString();
        document.getElementById('calc-thb').textContent = `฿${totalThb.toFixed(2)}`;
    }

    // Event: ปุ่ม +/- น้ำหนัก
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.getAttribute('data-type');
            if (wasteWeights[type] < 99) wasteWeights[type]++;
            updateCalculator();
        });
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.getAttribute('data-type');
            if (wasteWeights[type] > 0) wasteWeights[type]--;
            updateCalculator();
        });
    });

    // 3. จัดการ Profile Settings
    const locationInput = document.getElementById('store-location');
    const pickupToggle = document.getElementById('pickup-toggle');
    const database = db.getDB();
    const myProfileIndex = database.buyersList.findIndex(b => b.username === username);
    
    if(myProfileIndex !== -1) {
        const myData = database.buyersList[myProfileIndex];
        locationInput.value = myData.location === 'Not specified' ? '' : myData.location;
        pickupToggle.checked = myData.homePickup;
    }

    document.getElementById('save-settings-btn').addEventListener('click', () => {
        if(myProfileIndex !== -1) {
            database.buyersList[myProfileIndex].location = locationInput.value || 'Not specified';
            database.buyersList[myProfileIndex].homePickup = pickupToggle.checked;
            db.saveDB(database);
            
            const btn = document.getElementById('save-settings-btn');
            btn.textContent = 'Saved!';
            btn.classList.replace('bg-gray-800', 'bg-green-600');
            setTimeout(() => {
                btn.textContent = 'Save Settings';
                btn.classList.replace('bg-green-600', 'bg-gray-800');
            }, 2000);
        }
    });

    // 4. Generate QR Code (รวมข้อมูลทุกประเภทที่มีน้ำหนัก > 0)
    const generateBtn = document.getElementById('generate-qr-btn');
    const modal = document.getElementById('qr-modal');
    generateBtn.addEventListener('click', () => {
        if (totalPoints === 0) {
            alert("Please add at least 1 kg of waste.");
            return;
        }

        const txId = 'TX-' + Date.now().toString(36).toUpperCase();
        
        // คัดเฉพาะขยะที่มีน้ำหนักมากกว่า 0
        const items = {};
        Object.keys(wasteWeights).forEach(type => {
            if (wasteWeights[type] > 0) items[type] = wasteWeights[type];
        });

        const payload = {
            txId: txId,
            buyer: username,
            items: items, // ส่งไปเป็น Object รวม
            points: totalPoints,
            thb: totalThb
        };

        const dbData = db.getDB();
        dbData.transactions[txId] = {
            ...payload,
            status: 'pending',
            timestamp: Date.now()
        };
        db.saveDB(dbData);

        const qrContainer = document.getElementById('qrcode-container');
        qrContainer.innerHTML = ''; 
        new QRCode(qrContainer, {
            text: JSON.stringify(payload),
            width: 200, height: 200,
            colorDark : "#1f2937", colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.children[0].classList.remove('scale-95');
    });

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.children[0].classList.add('scale-95');
        renderHistory(); // อัปเดตประวัติเผื่อมีการสแกนแล้ว
    });

    // 5. ระบบแสดงประวัติ Transaction (Buyer Side)
    function renderHistory() {
        const dbData = db.getDB();
        const historyList = document.getElementById('buyer-history-list');
        historyList.innerHTML = '';

        // ดึงเฉพาะของ Buyer คนนี้ และสแกนเสร็จแล้ว เรียงใหม่ล่าสุดขึ้นก่อน
        const myTransactions = Object.values(dbData.transactions)
            .filter(tx => tx.buyer === username && tx.status === 'completed')
            .sort((a, b) => b.scannedAt - a.scannedAt);

        if (myTransactions.length === 0) {
            historyList.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">No completed transactions yet.</p>';
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
            div.className = 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm relative';
            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-bold text-gray-800">User: ${tx.scannedBy}</p>
                        <p class="text-xs text-gray-400">${date}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-blue-600">+${tx.points} Pts</p>
                        <p class="font-bold text-green-600">฿${tx.thb}</p>
                    </div>
                </div>
                <div class="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-2">
                    <span class="font-semibold">Items:</span> ${itemsText.join(', ')}
                </div>
                <!-- แสดงที่อยู่ของ User (ถ้ามี) สำหรับ Home Pickup -->
                <div class="text-xs text-gray-600 border-t border-gray-100 pt-2">
                    <span class="font-semibold">📍 User Address:</span> ${tx.userAddress || '<span class="text-gray-400 italic">No address provided</span>'}
                </div>
            `;
            historyList.appendChild(div);
        });
    }

    renderHistory();

    // ฟัง Event เมื่อ User กดสแกนสำเร็จจากแท็บอื่น ให้รีเฟรชประวัติทันที
    window.addEventListener('storage', (e) => {
        if (e.key === db.dbKey) renderHistory();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem(db.sessionKey);
        window.location.href = 'index.html';
    });
});