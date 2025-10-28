# 🤖 LM Studio Desktop

LM Studio entegrasyonlu modern masaüstü uygulaması. Bu uygulama ile yerel AI modellerinizle kolayca sohbet edebilirsiniz.

## ✨ Özellikler

- 🎨 **Modern Arayüz**: Türkçe dil desteği ile şık ve kullanıcı dostu tasarım
- 🔌 **LM Studio Entegrasyonu**: REST API üzerinden sorunsuz bağlantı
- 💬 **Gerçek Zamanlı Sohbet**: Hızlı ve akıcı konuşma deneyimi
- 📎 **Dosya Ekleme**: PDF, DOCX, TXT, MD ve kod dosyalarını sohbete ekleyebilme
- ⚙️ **Kapsamlı Ayarlar Sistemi**: Sunucu, arayüz, sohbet ve dosya ayarları
-  **Responsive Tasarım**: Her ekran boyutunda optimum görüntü
- 🔄 **Model Yönetimi**: Mevcut modelleri görüntüleme ve seçme
- 💾 **Otomatik Kaydetme**: Ayarlar ve tercihlerin otomatik kaydı

## 🚀 Kurulum

### Gereksinimler

1. **Node.js** (v16 veya üzeri): [nodejs.org](https://nodejs.org) adresinden indirin
2. **LM Studio**: [lmstudio.ai](https://lmstudio.ai) adresinden indirin ve çalıştırın

### Kurulum Adımları

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **LM Studio'yu hazırlayın:**
   - LM Studio'yu açın
   - Bir AI modeli indirip yükleyin
   - Local Server'ı başlatın (port: 1234)

3. **Uygulamayı çalıştırın:**
   ```bash
   npm start
   # veya geliştirme modu için
   npm run dev
   ```

## 🎯 Kullanım

1. **Bağlantı Kontrolü**: Uygulama açıldığında üst bardan LM Studio bağlantı durumunu kontrol edin
2. **Model Seçimi**: Sol panelden kullanmak istediğiniz modeli seçin  
3. **Dosya Ekleme**: 📎 Dosya Ekleme bölümünden PDF, Word, metin veya kod dosyalarınızı ekleyin
4. **Ayarlar**: 
   - **Hızlı Ayarlar**: Sol panelden sıcaklık ve token sayısını ayarlayın
   - **Gelişmiş Ayarlar**: "🔧 Gelişmiş Ayarlar" butonuna tıklayarak detaylı konfigürasyona erişin
5. **Sohbet**: Alt kısımdaki metin kutusuna mesajınızı yazıp Enter'a basın veya Gönder butonuna tıklayın

### 📎 Desteklenen Dosya Formatları

- **Metin Dosyaları**: .txt, .md (Markdown)
- **Ofis Belgeleri**: .pdf, .docx  
- **Kod Dosyaları**: .js, .html, .css, .py, .json
- **Diğer**: Herhangi bir metin tabanlı dosya

### ⚙️ Gelişmiş Ayarlar

Sol paneldeki "🔧 Gelişmiş Ayarlar" butonuna tıklayarak aşağıdaki konfigürasyon seçeneklerine erişebilirsiniz:

#### 🖥️ Sunucu Ayarları
- **Sunucu URL'si**: LM Studio sunucu adresi (varsayılan: http://localhost:1234)
- **API Anahtarı**: Güvenlik için API anahtarı (opsiyonel)
- **Zaman Aşımı**: Bağlantı zaman aşımı süresi
- **Bağlantı Testi**: Anlık bağlantı kontrolü

#### 🎨 Arayüz Ayarları  
- **Tema**: Açık/Koyu tema seçimi
- **Yazı Boyutu**: Küçük, Orta, Büyük seçenekleri
- **Zaman Damgaları**: Mesaj zamanlarını gösterme/gizleme
- **Ses Bildirimleri**: Sesli uyarılar

#### 💬 Sohbet Ayarları
- **Varsayılan Sıcaklık**: AI yanıt çeşitliliği kontrolü
- **Maksimum Token**: Yanıt uzunluğu sınırı
- **Sistem İstemcisi**: AI'ya özel talimatlar
- **Otomatik Kaydet**: Sohbet geçmişi kaydetme
- **Bağlam Hafızası**: Konuşma bağlamını koruma

#### 📎 Dosya Ayarları
- **Maksimum Dosya Boyutu**: Yüklenebilir dosya boyutu sınırı
- **Önizleme Uzunluğu**: Dosya içeriği önizleme karakter sayısı  
- **Otomatik Dahil Etme**: Dosyaları sohbete otomatik ekleme
- **Dosya Önizlemesi**: Dosya içeriği önizleme gösterimi

## 🛠️ Geliştirme

### Proje Yapısı

```
lmstudio-desktop/
├── main.js          # Ana Electron süreci
├── preload.js       # Güvenlik katmanı
├── renderer.js      # UI işlemleri
├── index.html       # Ana sayfa
├── styles.css       # Stil dosyası
├── package.json     # Proje konfigürasyonu
└── .github/
    └── copilot-instructions.md
```

### Mevcut Komutlar

- `npm start` - Uygulamayı başlat
- `npm run dev` - Geliştirme modu (DevTools açık)
- `npm run build` - Uygulama paketi oluştur
- `npm run pack` - Paketleme (dağıtım olmadan)
- `npm run dist` - Dağıtım paketi oluştur

### VS Code Görevleri

F1 tuşuna basıp "Tasks: Run Task" yazarak aşağıdaki görevleri çalıştırabilirsiniz:
- **Install Dependencies** - Bağımlılıkları yükle
- **LM Studio Desktop - Dev Mode** - Geliştirme modunda başlat

## 🔧 Konfigürasyon

### LM Studio Ayarları

Varsayılan olarak uygulama `http://localhost:1234` adresinden LM Studio'ya bağlanır. Farklı bir port kullanıyorsanız `main.js` dosyasındaki `LM_STUDIO_BASE_URL` değişkenini değiştirin.

### Electron Paketi Ayarları

`package.json` dosyasındaki `build` bölümünden uygulama simgesi, hedef platformlar ve diğer paket ayarlarını özelleştirebilirsiniz.

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Projeyi klonlayın: `git clone https://github.com/your-username/lmstudio-desktop.git`
3. Bağımlılıkları yükleyin: `npm install`
4. Özellik branch'i oluşturun: `git checkout -b yeni-ozellik`
5. Değişikliklerinizi yapın ve test edin
6. Değişikliklerinizi commit edin: `git commit -am 'Yeni özellik ekle'`
7. Branch'inizi push edin: `git push origin yeni-ozellik`
8. Pull Request oluşturun

### 🔧 Geliştirme Ortamı

```bash
# Projeyi klonla
git clone https://github.com/your-username/lmstudio-desktop.git
cd lmstudio-desktop

# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev

# Build oluştur
npm run build

# Dağıtım paketi oluştur
npm run dist
```

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🆘 Sorun Giderme

### LM Studio'ya Bağlanamıyor
- LM Studio'nun çalışır durumda olduğundan emin olun
- Local Server'ın başlatıldığını kontrol edin
- Port 1234'ün açık olduğunu doğrulayın

### Model Bulunamadı
- LM Studio'da en az bir model yüklenmiş olmalı
- Model yükleme işleminin tamamlandığından emin olun
- LM Studio'yu yeniden başlatmayı deneyin

### Uygulama Başlamıyor
- Node.js'in doğru yüklendiğinden emin olun
- `npm install` komutunu çalıştırarak bağımlılıkları güncelleyin
- `npm cache clean --force` ile npm cache'ini temizleyin

## 📞 İletişim

Sorularınız veya önerileriniz için GitHub Issues bölümünü kullanabilirsiniz.

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!