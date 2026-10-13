# NoteDay - Kişisel Verimlilik ve Not Yönetimi

NoteDay; günlük tutma, görev ve hatırlatıcı planlama, finans takibi, özelleştirilebilir veritabanı tabloları ve kişisel not yönetimini tek bir arayüzde birleştiren modern bir web uygulamasıdır.

## 🚀 Hızlı Başlangıç

Projeyi çalıştırmak son derece basittir:

1. **Depoyu Klonlayın:**
   ```bash
   git clone <REPO_URL>
   cd <REPO_KLASORU>
   ```

2. **Tek Tıkla Başlatın:**
   - Proje ana dizinindeki **`Noteday.bat`** dosyasına çift tıklayın.
   - Tarayıcınız otomatik olarak `http://localhost:8080` adresinde açılacaktır.

> **Gereksinim:** Bilgisayarınızda **Python 3.x** kurulu olması yeterlidir (ekstra bir paket kurulumu gerektirmez).

## ✨ Temel Özellikler

- 📔 **Günüm (Günlük Tutma):** Günlük anılarınızı, duygularınızı ve düşüncelerinizi fotoğraflarla kaydedin.
- 📋 **Notlar:** Zengin metin editörü, etiketler ve özel gün desteği.
- ⏰ **Hatırlatıcılar & Görevler:** Saatli ve öncelikli görev planlaması.
- 💰 **Finanslarım:** Gelir ve gider takibi, kategori bazlı bütçe yönetimi.
- 📊 **Notion Tarzı Veritabanı Tabloları:** 14 farklı veri türü (Metin, Sayı, Seçim, Tarih, Onay Kutusu, Formül vb.) ile esnek tablo yönetimi.
- 🎨 **Kişiselleştirme:** Açık/Koyu tema, özel renkler ve gizlilik tercihleri.

## 📁 Proje Yapısı

- `Web/`: Web arayüzü dosyaları (HTML, CSS, JavaScript).
  - `index.html`: Ana uygulama arayüzü.
  - `css/styles.css`: Uygulama stilleri ve tema tanımları.
  - `js/`: Modüler JavaScript dosyaları (`app.js`, `tablo.js`, `settings.js`, vb.).
  - `server.py`: Çoklu iş parçacıklı hafif yerel web sunucusu.
- `Noteday.bat`: Uygulamayı tek tıkla başlatan Windows komut dosyası.
