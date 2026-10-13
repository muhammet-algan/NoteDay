/* ========================================
   DEPOLAMA MODÜLÜ - localStorage Sarmalayıcı
   Tüm verileri tarayıcının localStorage'ında saklar.
   Kullanıcıya özel veri yönetimi sağlar.
   ======================================== */
var DB = (function () {
  'use strict';

  /* localStorage'dan veri okuma */
  function get(key) {
    try {
      var data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  }

  /* localStorage'a veri yazma */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }

  /* localStorage'dan veri silme */
  function remove(key) {
    localStorage.removeItem(key);
  }

  /* Oturum açmış kullanıcıyı döndürme */
  function currentUser() {
    return get('currentUser');
  }

  /* Kullanıcıya özel anahtar oluşturma (her kullanıcının verileri ayrı tutulur) */
  function userKey(key) {
    var user = currentUser();
    if (!user) return key;
    return 'user_' + user.email + '_' + key;
  }

  /* Kullanıcıya özel veri okuma */
  function getForUser(key) {
    return get(userKey(key));
  }

  /* Kullanıcıya özel veri yazma */
  function setForUser(key, value) {
    set(userKey(key), value);
  }

  /* Tüm kayıtlı kullanıcıları getirme */
  function getUsers() {
    return get('users') || [];
  }

  /* Kullanıcı listesini kaydetme */
  function saveUsers(users) {
    set('users', users);
  }

  /* Dışarıya açılan fonksiyonlar */
  return {
    get: get,
    set: set,
    remove: remove,
    currentUser: currentUser,
    userKey: userKey,
    getForUser: getForUser,
    setForUser: setForUser,
    getUsers: getUsers,
    saveUsers: saveUsers
  };
})();
