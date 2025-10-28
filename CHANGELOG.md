# Changelog

Bu dosya projeye eklenen tüm önemli değişiklikleri içerir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır ve bu proje [Semantic Versioning](https://semver.org/spec/v2.0.0.html) kullanır.

## [1.0.0] - 2025-10-28

### Added ✨
- **Modern Electron Arayüzü**: Türkçe dil desteği ile şık masaüstü uygulaması
- **LM Studio Entegrasyonu**: REST API üzerinden yerel AI modelleri ile iletişim
- **Gerçek Zamanlı Sohbet**: Hızlı mesajlaşma sistemi
- **Dosya Ekleme Sistemi**: 
  - PDF dosya okuma desteği (`pdf-parse`)
  - Word belgeleri okuma desteği (`mammoth`)
  - Metin dosyaları (TXT, MD, JS, HTML, CSS, Python, JSON)
  - Dosya boyutu ve türü bilgileri
  - Dosya önizleme sistemi
- **Kapsamlı Ayarlar Sistemi**:
  - 🖥️ **Sunucu Ayarları**: URL, API anahtarı, zaman aşımı
  - 🎨 **Arayüz Ayarları**: Tema, yazı boyutu, bildirimler
  - 💬 **Sohbet Ayarları**: Sıcaklık, token, sistem istemcisi
  - 📎 **Dosya Ayarları**: Boyut limiti, önizleme uzunluğu
- **Model Yönetimi**: Mevcut modelleri görüntüleme ve seçme
- **Bağlantı Kontrolü**: LM Studio sunucu durumu izleme
- **Ayar Kalıcılığı**: Kullanıcı tercihlerinin otomatik kaydı
- **Responsive Tasarım**: Tüm ekran boyutlarında uyumlu arayüz
- **Hata Yönetimi**: Kapsamlı hata yakalama ve kullanıcı bildirimleri

### Technical 🔧
- **Electron Framework**: Modern masaüstü uygulama çerçevesi
- **Security**: Context isolation ve preload script güvenliği
- **File Processing**: PDF ve Word belge işleme kütüphaneleri
- **Settings Management**: JSON tabanlı ayar kaydetme sistemi
- **API Integration**: Axios ile HTTP istekleri
- **UI Components**: Modern CSS Grid ve Flexbox layout
- **Cross-platform**: Windows, macOS, Linux desteği

### Dependencies 📦
- `electron`: ^39.0.0 - Masaüstü uygulama çerçevesi
- `axios`: ^1.6.0 - HTTP istemcisi
- `pdf-parse`: ^1.1.1 - PDF dosya okuma
- `mammoth`: ^1.6.0 - Word belge okuma
- `electron-builder`: ^24.6.4 - Uygulama paketleme

### Files Structure 📁
```
lmstudio-desktop/
├── main.js          # Ana Electron süreci
├── preload.js       # Güvenlik katmanı
├── renderer.js      # UI işlemleri
├── index.html       # Ana arayüz
├── styles.css       # Stil dosyası
├── package.json     # Proje konfigürasyonu
├── .gitignore       # Git ignore kuralları
├── .gitattributes   # Git dosya özellikleri
├── LICENSE          # MIT lisansı
├── README.md        # Kullanım rehberi
└── CHANGELOG.md     # Değişiklik geçmişi
```

### Known Issues 🐛
- Electron builder'da Windows symbolic link uyarıları (kritik değil)
- DevTools'da Autofill API uyarıları (işlevselliği etkilemez)

---

## [1.1.0] - 2025-10-28

### Eklendi
- Cevaplar ekranda formatlı (markdown/kod blokları) gösteriliyor
- Uygulama sürümü ve token bilgisi üst barda gösteriliyor

### Düzeltildi
- Gönder düğmesi ve mesaj ekleme hatası giderildi

---

## Gelecek Sürümler İçin Planlananlar 🚀

### [1.2.0] - Planlanan
- **Eklenti Sistemi**: Üçüncü parti eklenti desteği
- **Sohbet Dışa Aktarma**: PDF/HTML formatında kaydetme
- **Gelişmiş Dosya Desteği**: Excel, PowerPoint dosyaları
- **Sesli Sohbet**: Mikrofon ve hoparlör entegrasyonu
- **Çoklu Model**: Aynı anda birden fazla model kullanma

### [2.0.0] - Uzun Vadeli
- **Bulut Entegrasyonu**: Çevrimiçi AI servisleri desteği
- **Takım Çalışması**: Çoklu kullanıcı sohbet odaları
- **AI Workflow**: Otomatik görev zincirleri
- **Plugin Store**: Eklenti mağazası
- **Mobile Sync**: Mobil uygulama senkronizasyonu

---

## Versiyon Notları 📝

Bu proje [Semantic Versioning](https://semver.org/) kullanır:
- **MAJOR** (X.y.z): Geriye dönük uyumluluğu bozan değişiklikler
- **MINOR** (x.Y.z): Geriye dönük uyumlu yeni özellikler
- **PATCH** (x.y.Z): Geriye dönük uyumlu hata düzeltmeleri