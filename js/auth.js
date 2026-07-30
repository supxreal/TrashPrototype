document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    // เช็กว่ามี Session ค้างอยู่ไหม ถ้ามีให้เตะไปหน้า Dashboard เลย
    const currentSession = db.getActiveSession();
    if (currentSession) {
        window.location.href = currentSession.role === 'User' ? 'user.html' : 'buyer.html';
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username').value.trim();
        // หาว่า Radio ตัวไหนถูกเลือก
        const roleInput = document.querySelector('input[name="role"]:checked').value;

        if (usernameInput === '') return;

        // บันทึกข้อมูลผ่านคลาส db
        db.loginUser(usernameInput, roleInput);

        // ทำ Apple-style smooth transition ก่อนเปลี่ยนหน้า
        document.body.classList.add('fade-out');
        
        setTimeout(() => {
            if (roleInput === 'User') {
                window.location.href = 'user.html';
            } else {
                window.location.href = 'buyer.html';
            }
        }, 400); // รอ 400ms ให้เฟดเสร็จ
    });
});