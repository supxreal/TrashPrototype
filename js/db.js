class EcoTrashDB {
    constructor() {
        this.dbKey = 'ecoTrash_db';
        this.sessionKey = 'ecoTrash_session';
        this.init();
    }

    // สร้าง Database พื้นฐานหากยังไม่มี
    init() {
        if (!localStorage.getItem(this.dbKey)) {
            const initialData = {
                users: {},       // เก็บข้อมูลโปรไฟล์แต่ละคน (ทั้ง User และ Buyer)
                buyersList: [],  // เก็บรายชื่อ Buyer สำหรับให้ User ค้นหา
                transactions: {} // เก็บประวัติ QR Code (กันสแกนซ้ำ)
            };
            localStorage.setItem(this.dbKey, JSON.stringify(initialData));
        }
    }

    // ดึงข้อมูลทั้งหมด
    getDB() {
        return JSON.parse(localStorage.getItem(this.dbKey));
    }

    // เซฟข้อมูลทั้งหมด
    saveDB(data) {
        localStorage.setItem(this.dbKey, JSON.stringify(data));
    }

    // จัดการล็อกอินหรือสมัครสมาชิก
    loginUser(username, role) {
        const db = this.getDB();
        
        // ถ้าไม่เคยมีชื่อนี้ในระบบ ให้สร้างโปรไฟล์ใหม่
        if (!db.users[username]) {
            db.users[username] = {
                username: username,
                role: role,
                points: 0,
                balanceTHB: 0,
                history: []
            };

            // ถ้าเป็น Buyer ให้โยนชื่อเข้า buyersList ด้วย
            if (role === 'Buyer') {
                db.buyersList.push({ 
                    username: username, 
                    location: 'Not specified', 
                    homePickup: false 
                });
            }
            this.saveDB(db);
        }

        // สร้าง Session ไว้ว่าใครกำลังล็อกอินอยู่
        const sessionData = { username, role: db.users[username].role };
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        
        return db.users[username];
    }

    // ดึง Session ปัจจุบัน (เอาไว้ใช้หน้า Dashboard)
    getActiveSession() {
        const session = localStorage.getItem(this.sessionKey);
        return session ? JSON.parse(session) : null;
    }
}

// สร้าง Instance ไว้ให้ไฟล์อื่นเรียกใช้ (Global)
const db = new EcoTrashDB();