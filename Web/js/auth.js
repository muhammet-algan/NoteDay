/* ========================================
   KİMLİK DOĞRULAMA MODÜLÜ
   Kullanıcı giriş, kayıt ve oturum yönetimi.
   Veriler localStorage'da saklanır.
   ======================================== */
var Auth = (function () {
    'use strict';

    /* Form olaylarını başlatma (giriş ve kayıt formları) */
    function init() {
        var loginForm = document.getElementById('login-form');
        var registerForm = document.getElementById('register-form');

        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
    }

    /* Giriş formunu gösterme, kayıt formunu gizleme */
    function showLogin() {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('register-section').classList.add('hidden');
        clearErrors();
    }

    /* Kayıt formunu gösterme, giriş formunu gizleme */
    function showRegister() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('register-section').classList.remove('hidden');
        clearErrors();
    }

    /* Tüm hata mesajlarını temizleme */
    function clearErrors() {
        var errors = document.querySelectorAll('.auth-error');
        errors.forEach(function (el) {
            el.classList.remove('show');
            el.textContent = '';
        });
    }

    /* Belirtilen alana hata mesajı gösterme */
    function showError(id, message) {
        var el = document.getElementById(id);
        if (el) {
            el.textContent = message;
            el.classList.add('show');
        }
    }

    /* Kayıt formu gönderildiğinde çalışır - Yeni kullanıcı oluşturma */
    function handleRegister(e) {
        e.preventDefault();
        clearErrors();

        /* Form alanlarını al */
        var firstName = document.getElementById('reg-firstname').value.trim();
        var lastName = document.getElementById('reg-lastname').value.trim();
        var email = document.getElementById('reg-email').value.trim();
        var password = document.getElementById('reg-password').value;
        var passwordConfirm = document.getElementById('reg-password-confirm').value;

        /* Boş alan kontrolü */
        if (!firstName || !lastName || !email || !password || !passwordConfirm) {
            showError('register-error', 'Lütfen tüm alanları doldurun.');
            return;
        }

        /* Şifre uzunluk kontrolü */
        if (password.length < 6) {
            showError('register-error', 'Şifre en az 6 karakter olmalıdır.');
            return;
        }

        /* Şifre eşleşme kontrolü */
        if (password !== passwordConfirm) {
            showError('register-error', 'Şifreler eşleşmiyor.');
            return;
        }

        /* E-posta daha önce kullanılmış mı kontrolü */
        var users = DB.getUsers();
        var existing = users.find(function (u) { return u.email.toLowerCase() === email.toLowerCase(); });
        if (existing) {
            showError('register-error', 'Bu e-posta adresi zaten kayıtlı.');
            return;
        }

        /* Yeni kullanıcı nesnesi oluştur */
        var newUser = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            createdAt: new Date().toISOString()
        };

        /* Kullanıcıyı kaydet */
        users.push(newUser);
        DB.saveUsers(users);

        /* Kayıt sonrası otomatik giriş yap */
        DB.set('currentUser', {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email
        });

        /* Hoş geldiniz bildiriminin sadece 1 kez gösterilmesi için flag */
        localStorage.setItem('user_' + newUser.email + '_welcome_shown', 'false');

        /* Yeni kayıt olan kullanıcının doğrudan Anasayfa'dan başlamasını sağla */
        localStorage.setItem('app_current_section', 'home');

        document.getElementById('register-form').reset();
        App.onLoginSuccess();
    }

    /* Giriş formu gönderildiğinde çalışır - Kimlik doğrulama */
    function handleLogin(e) {
        e.preventDefault();
        clearErrors();

        /* Form alanlarını al */
        var email = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;

        /* Boş alan kontrolü */
        if (!email || !password) {
            showError('login-error', 'Lütfen tüm alanları doldurun.');
            return;
        }

        /* Kullanıcıyı e-posta ve şifre ile bul */
        var users = DB.getUsers();
        var user = users.find(function (u) {
            return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
        });

        /* Kullanıcı bulunamadıysa hata göster */
        if (!user) {
            showError('login-error', 'E-posta veya şifre hatalı.');
            if (typeof Toast !== 'undefined') {
                Toast.error('E-posta veya şifre hatalı.', 3000);
            }
            return;
        }

        /* Oturum bilgisini kaydet */
        DB.set('currentUser', {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        });

        document.getElementById('login-form').reset();
        App.onLoginSuccess();
    }

    /* Oturumu kapatma - Kullanıcı bilgisini sil ve açılış sayfasına dön */
    function logout() {
        DB.remove('currentUser');
        App.onLogout();
    }

    /* Kullanıcının oturum açıp açmadığını kontrol etme */
    function isLoggedIn() {
        return DB.currentUser() !== null;
    }

    /* Oturum açmış kullanıcının bilgilerini döndürme */
    function getUser() {
        return DB.currentUser();
    }

    /* getCurrentUser - getUser ile aynı (settings.js uyumluluğu) */
    function getCurrentUser() {
        return DB.currentUser();
    }

    /* Kullanıcı bilgilerini güncelleme */
    function updateUser(updatedUser) {
        /* Oturum bilgisini güncelle */
        DB.set('currentUser', {
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email
        });

        /* Kullanıcılar listesinde de güncelle */
        var users = DB.getUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].email === updatedUser.email) {
                users[i].firstName = updatedUser.firstName;
                users[i].lastName = updatedUser.lastName;
                break;
            }
        }
        DB.saveUsers(users);
    }

    /* Dışarıya açılan fonksiyonlar */
    return {
        init: init,
        showLogin: showLogin,
        showRegister: showRegister,
        logout: logout,
        isLoggedIn: isLoggedIn,
        getUser: getUser,
        getCurrentUser: getCurrentUser,
        updateUser: updateUser
    };
})();
