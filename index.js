const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const port = 3000;

const hesaplar = require("./hesap.json");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("views"));

// express-session ayarları
app.use(
  session({
    secret: "çokgizlianahtar", // Güvenli bir şekilde saklanmalıdır
    resave: false,
    saveUninitialized: true,
  }),
);

// Kitaplar metin dosyasından yükleniyor

const kitapDosya = "kitap.json";
const kitaplar = JSON.parse(fs.readFileSync(kitapDosya, "utf-8"));
// Ana sayfa
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/yaz", (req, res) => {
  // kitap.json dosyasını oku
  fs.readFile("kitap.json", "utf8", (err, data) => {
    if (err) {
      console.error("Dosya Okuma Hatası:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    try {
      // JSON formatındaki veriyi JavaScript nesnesine çevir
      const kitapData = JSON.parse(data);

      // Örneğin, ilk kitap bilgilerini al
      const kitapInfo = {
        kod: kitapData[0].kod,
        kitapYazisi: kitapData[0].kitapYazisi,
      };

      // Yaz sayfasını render ederken kitapInfo'yu kullan
      res.render("yaz.ejs", { kitapInfo });
    } catch (parseError) {
      console.error("JSON Parse Hatası:", parseError);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});
app.get("/applyChanges/:kod", (req, res) => {
  const kod = req.params.kod;

  // kitap.json dosyasını oku
  fs.readFile("kitap.json", "utf8", (err, data) => {
    if (err) {
      console.error("Dosya Okuma Hatası:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    try {
      // JSON formatındaki veriyi JavaScript nesnesine çevir
      const kitapData = JSON.parse(data);

      // Kod ile eşleşen kitap var mı kontrol et
      const hedefKitap = kitapData.find((kitap) => kitap.kod === kod);

      if (hedefKitap) {
        // Eğer kod ile eşleşen kitap varsa, bilgileri gönder
        res.json({
          kod: hedefKitap.kod,
          kitapYazisi: hedefKitap.kitapYazisi,
        });
      } else {
        res.status(404).json({ error: "Kitap bulunamadı" });
      }
    } catch (parseError) {
      console.error("JSON Parse Hatası:", parseError);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

app.get("/paylas", (req, res) => {
  if (req.session.kullaniciAdi) {
    res.render("paylas", {
      kullaniciAdi: req.session.kullaniciAdi,
      duyurular: duyurular,
    });
  } else {
    res.redirect("/giris");
  }
});
app.get("/oku", (req, res) => {
  res.render("oku");
});
// Kayıt sayfası
app.get("/kayit", (req, res) => {
  res.render("kayit");
});
app.get("/duyuru", (req, res) => {
  res.render("duyuru", { duyurular: duyurular });
});
app.get("/chat", (req, res) => {
  res.render("chat");
});
app.get("/adminpanel", (req, res) => {
  // Oturum açılmış mı kontrolü
  if (req.session && req.session.kullaniciAdi) {
    // Kullanıcının perm değerine göre kontrol
    const kullaniciAdi = req.session.kullaniciAdi;
    const hesaplar = hesaplariGetir(); // Burada hesap.json'dan veriyi alın

    const kullanici = hesaplar.kullanicilar.find(
      (k) => k.kullaniciAdi === kullaniciAdi,
    );

    fs.readFile("hesap.json", "utf8", (err, data) => {
      if (err) {
        console.error("Hesap.json dosyasını okuma hatası:", err);
        // Hata durumunda gerekli işlemleri yapabilirsiniz
        res.status(500).send("Internal Server Error");
        return;
      }

      fs.readFile("kitap.json", "utf8", (err, kitapData) => {
        if (err) {
          console.error("Kitap.json dosyasını okuma hatası:", err);
          // Hata durumunda gerekli işlemleri yapabilirsiniz
          res.status(500).send("Internal Server Error");
          return;
        }

        // Dosya okuma başarılı olduysa JSON verisine dönüştür
        const kitaplar = JSON.parse(kitapData);

        // Dosya okuma başarılı olduysa JSON verisine dönüştür
        const hesapData = JSON.parse(data);

        // Kullanıcı verilerini al
        const users = hesapData.kullanicilar;

        if (
          kullanici &&
          (kullanici.perm === 1 || kullanici.perm === 2 || kullanici.perm === 3)
        ) {
          // Eğer kullanıcı admin, mod veya civai ise adminpanel sayfasına erişime izin ver
          res.render("adminpanel", { users, kitaplar });
        } else {
          // Eğer kullanıcı izinsiz ise başka bir sayfaya yönlendirme yapabilirsiniz
          res.redirect("/");
        }
      });
    });
  } else {
    // Oturum açılmamışsa giriş sayfasına yönlendirme yapabilirsiniz
    res.redirect("/giris");
  }
});

app.get("/result", (req, res) => {
  res.render("result");
});
// Giriş sayfası
app.get("/giris", (req, res) => {
  res.render("giris");
});
app.post("/yorum-ekle", (req, res) => {
  // Kullanıcı adını session'dan al
  const kullaniciAdi = req.session.kullaniciAdi;

  const kitapAdi = req.body.kitapAdi;
  const isim = req.body.isim;
  const yorum = req.body.yorum;

  // Yeni yorum objesi
  const yeniYorum = { kitapAdi, isim, yorum };

  // Yorumları dosyadan al
  let yorumlar = yorumlariGetir();

  // Hesap.json kontrolü ve emoji belirleme
  const hesaplar = JSON.parse(fs.readFileSync("hesap.json", "utf-8"));
  const kullanici = hesaplar.kullanicilar.find((k) => k.kullaniciAdi === isim);

  if (kullanici && kullanici.perm === 0) {
    // Kullanıcının izin seviyesi 0 ise emoji eklenmez
    yeniYorum.emoji = "";
  } else {
    // KullaniciRol undefined değilse switch'e gir
    if (kullanici && kullanici.perm !== undefined) {
      switch (kullanici.perm) {
        case 1:
          yeniYorum.emoji = "💼";
          break;
        case 2:
          yeniYorum.emoji = "🤖";
          break;
        case 3:
          yeniYorum.emoji = "🔨";
          break;
        default:
          // Tanımlanmamış bir rol durumunda da emoji eklenmez
          yeniYorum.emoji = "";
      }
    } else {
      // KullaniciRol undefined ise emoji eklenmez
      yeniYorum.emoji = "";
    }
  }

  // Emoji'yi kullanıcının adının yanına ekleme
  if (isim && kullanici && kullanici.perm !== 0) {
    yeniYorum.isim = `${yeniYorum.emoji} ${yeniYorum.isim}`;
  }

  // Yeni yorumu ekle
  yorumlar.push(yeniYorum);

  // Yorumları dosyaya kaydet
  yorumlariKaydet(yorumlar);

  // Sayfayı yeniden yükle
  res.redirect(`/kitap/${kitapAdi}`);
});

function kullaniciRoluGetir(kullaniciAdi) {
  const kullanici = hesaplar.kullanicilar.find(
    (k) => k.kullaniciAdi === kullaniciAdi,
  );
  return kullanici ? kullanici.perm : 0;
}

/*/
app.post("/yorum-ekle", (req, res) => {
  const kitapAdi = req.body.kitapAdi;
  const isim = req.body.isim;
  const yorum = req.body.yorum;

  // Yorumları dosyaya kaydet
  kaydetYoruma(kitapAdi, isim, yorum);

  // Sayfayı yeniden yükle
  res.redirect(`/kitap/${kitapAdi}`);
});
/*/
// Panel sayfası
app.get("/panel", (req, res) => {
  if (req.session.kullaniciAdi) {
    res.render("panel", {
      kullaniciAdi: req.session.kullaniciAdi,
      duyurular: duyurular,
    });
  } else {
    res.redirect("/giris");
  }
});
// Örneğin, duyuruları bir array olarak tutuyorsanız
let duyurular = okuDuyurular(); // Başlangıçta duyuruları dosyadan oku

app.post("/duyuru-ekle", (req, res) => {
  const yeniDuyuru = {
    baslik: req.body.baslik,
    icerik: req.body.icerik,
    tarih: req.body.tarih,
  };

  // Duyurulara yeni duyuruyu ekle
  duyurular.push(yeniDuyuru);

  // Duyuruları dosyaya kaydet
  kaydetDuyurular(duyurular);

  // Render işlemi
  res.render("duyuru", { duyurular: duyurular });
});

app.get("/duyuru", (req, res) => {
  // Render işlemi
  res.render("duyuru", { duyurular: duyurular });
});

// Duyuruları dosyaya kaydet
function kaydetDuyurular(duyuruListesi) {
  fs.writeFile("duyurular.json", JSON.stringify(duyuruListesi), (err) => {
    if (err) {
      console.error(err);
    }
  });
}

// Duyuruları dosyadan oku
function okuDuyurular() {
  try {
    const data = fs.readFileSync("duyurular.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Kayıt işlemi
app.post("/kayit", (req, res) => {
  const { kullaniciAdi, sifre } = req.body;

  const kullaniciVarMi = hesaplar.kullanicilar.some(
    (k) => k.kullaniciAdi === kullaniciAdi,
  );

  if (!kullaniciVarMi) {
    // "perm" özelliğini ekleyerek her zaman 0 olarak ayarla
    const yeniKullanici = { kullaniciAdi, sifre, perm: 0 };

    hesaplar.kullanicilar.push(yeniKullanici);

    // Dosyaya veriyi yaz
    fs.writeFile("hesap.json", JSON.stringify(hesaplar, null, 2), (err) => {
      if (err) throw err;
      console.log("Kullanıcı bilgileri dosyaya yazıldı.");
    });

    res.redirect("/giris");
  } else {
    res.render("kayit", {
      hataMesaji: "Bu kullanıcı adı zaten kullanılıyor.",
    });
  }
});

// Giriş işlemi
app.post("/giris", (req, res) => {
  const { kullaniciAdi, sifre } = req.body;

  const dogrulama = hesaplar.kullanicilar.find(
    (k) => k.kullaniciAdi === kullaniciAdi && k.sifre === sifre,
  );

  if (dogrulama) {
    req.session.kullaniciAdi = kullaniciAdi; // Oturum değişkenine atanıyor
    res.redirect("/panel");
  } else {
    res.render("giris", {
      hataMesaji: "Kullanıcı adı veya şifre hatalı.",
    });
  }
});

// Çıkış işlemi
app.post("/cikis", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Oturum sonlandırma hatası:", err);
    }
    res.redirect("/");
  });
});

// Kitap ekleme işlemi
function generateRandomCode() {
  return Math.floor(1000 + Math.random() * 9000);
}
// HTML sayfasını render etmek için bir route

app.post("/kitap-ekle", (req, res) => {
  const {
    kitapAdi,
    kitapYazari,
    kitapAciklamasi,
    kitapKonusu,
    kitapYazisi,
    kitapFoto,
  } = req.body;

  // Rastgele 4 haneli kod oluştur
  const rastgeleKod = generateRandomCode();

  const yeniKitap = {
    kitapAdi,
    kitapYazari,
    kitapAciklamasi,
    kitapKonusu,
    kitapYazisi,
    kitapFoto,
    kod: rastgeleKod, // Oluşturulan kodu ekle
  };

  // Kitapları dosyaya yazmadan önce eklenen kitabın bilgilerini sakla
  const eklenenKitapInfo = {
    kitapAdi,
    kitapYazari,
    kitapAciklamasi,
    kitapKonusu,
    kitapYazisi,
    kitapFoto,
    kod: rastgeleKod,
  };

  // Dosyaya yaz
  const dosyaYolu = "kitap.json";
  let mevcutKitaplar = [];

  // Önce dosyadan mevcut kitapları oku (eğer varsa)
  try {
    const dosyaIcerigi = fs.readFileSync(dosyaYolu, "utf-8");
    mevcutKitaplar = JSON.parse(dosyaIcerigi);
  } catch (hata) {
    console.error("Dosya okuma hatası:", hata);
    // Dosya okuma hatası olursa isteği başarısız olarak işaretle
    return res.status(500).json({ error: "Dosya okuma hatası" });
  }

  // Yeni kitabı ekleyerek tüm kitapları güncelle
  mevcutKitaplar.push(eklenenKitapInfo);

  // Güncellenmiş kitap listesini dosyaya yaz
  try {
    fs.writeFileSync(dosyaYolu, JSON.stringify(mevcutKitaplar, null, 2));
    // Başarılı bir şekilde eklendiğine dair bilgiyi kullanıcıya gönder
    res.status(200).json({ success: "Kitap başarıyla eklendi" });
  } catch (hata) {
    console.error("Dosya yazma hatası:", hata);
    // Dosya yazma hatası olursa isteği başarısız olarak işaretle
    res.status(500).json({ error: "Dosya yazma hatası" });
  }
});

// ...

app.post("/applyChanges", (req, res) => {
  const kod = req.body.kod;
  const yeniKitapYazisi = req.body.kitapYazisi;

  fs.readFile("kitap.json", "utf8", (err, data) => {
    if (err) {
      console.error("Dosya Okuma Hatası:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    try {
      let kitapData = JSON.parse(data);

      // Log mesajları ekleyin
      console.log("Gelen Kod:", kod);
      console.log("kitapData:", kitapData);

      // Kod ile eşleşen kitap varsa, sadece kitapYazisi'ni güncelle
      const hedefKitapIndex = kitapData.findIndex((kitap) => kitap.kod === kod);

      if (hedefKitapIndex !== -1) {
        kitapData[hedefKitapIndex].kitapYazisi = yeniKitapYazisi;

        fs.writeFile(
          "kitap.json",
          JSON.stringify(kitapData, null, 2),
          "utf8",
          (err) => {
            if (err) {
              console.error("Dosya Yazma Hatası:", err);
              res.status(500).json({ error: "Internal Server Error" });
              return;
            }

            console.log("Güncellenmiş kitapData:", kitapData);

            // res.json'ı res.render'dan önce çağır
            res.json({
              kod,
              kitapYazisi: kitapData[hedefKitapIndex].kitapYazisi,
            });

            const kitapInfo = {
              kod: kod,
              kitapYazisi: yeniKitapYazisi,
            };

            // res.render'ı res.json'dan sonra çağır
            res.render("applyChanges.ejs", { kitapInfo });
          },
        );
      } else {
        res
          .status(404)
          .json({ error: "Kitap başarılı bir şekilde yazdırıldı." });
      }
    } catch (parseError) {
      console.error("JSON Parse Hatası:", parseError);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

// ...

// Kitaplar sayfası
app.get("/kitaplar", (req, res) => {
  res.render("kitaplar", { kitaplar });
});

app.get("/kitap/:kitapAdi", (req, res) => {
  const kitapAdi = req.params.kitapAdi;
  const kitap = kitaplar.find((k) => k.kitapAdi === kitapAdi);

  // Oturum kontrolü yap
  if (req.session && req.session.kullaniciAdi) {
    const yorumlar = yorumlariGetir().filter((y) => y.kitapAdi === kitapAdi);

    if (!kitap) {
      return res.status(404).send("Kitap bulunamadı");
    }

    res.render("kitap", {
      kitapAdi: kitap.kitapAdi,
      kitapYazari: kitap.kitapYazari,
      kitapAciklama: kitap.kitapAciklamasi,
      kitapKonusu: kitap.kitapKonusu,
      kitapYazi: kitap.kitapYazisi,
      kullaniciAdi: req.session.kullaniciAdi, // Kullanıcı adını ekleyin
      yorumlar: yorumlar, // Sadece ilgili kitaba ait yorumları sayfaya geçir
    });
  }
});

// Yorumları dosyaya kaydetme fonksiyonu
// Yorum ekleme fonksiyonu
function kaydetYoruma(kitapAdi, isim, yorum) {
  const yeniYorum = { kitapAdi, isim, yorum };
  const yorumlar = yorumlariGetir();
  yorumlar.push(yeniYorum);
  yorumlariKaydet(yorumlar);
}

const yorumlarDosyasi = "yorumlar.json";

function yorumlariGetir() {
  try {
    const yorumlar = fs.readFileSync(yorumlarDosyasi, "utf8");
    return JSON.parse(yorumlar);
  } catch (err) {
    return [];
  }
}

function yorumlariKaydet(yorumlar) {
  fs.writeFileSync(yorumlarDosyasi, JSON.stringify(yorumlar, null, 2), "utf8");
}

const { GoogleGenerativeAI } = require("@google/generative-ai");
const similarity = require("string-similarity");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const customResponses = [
  {
    trigger: "Merhaba",
    response:
      "Merhaba, Ben Civa Yapay Zeka destekli bir sohbet robotuyum. Çeşitli desteklerde bulunabilirim örnegin kitap yazma istediğin olanakların hepsi bende mevcut",
  },
  {
    trigger: "Kim tarafından destekleniyorsun",
    response: "Civa kitap adlı şirketinden efendim",
  },
  {
    trigger: "Senin modelin ne",
    response: "Civa kurumunun civai modelini kullanmaktayım",
  },
  {
    trigger: "chatgpt nin hangi sürümünü kullanıyorsun",
    response: "Chatgpt kullanmamaktayım ben civai modelini kullanmaktayım.",
  },
  // Diğer özel cevaplar ekleyebilirsiniz.
];

app.get("/civai/:query", async (req, res) => {
  try {
    const { query } = req.params;

    if (!query) {
      return res.status(400).json({ error: "Query is required." });
    }

    const bestMatch = similarity.findBestMatch(
      query,
      customResponses.map((item) => item.trigger),
    );
    const bestMatchIndex = bestMatch.bestMatchIndex;
    const matchedResponse = customResponses[bestMatchIndex].response;

    if (bestMatch.bestMatch.rating > 0.5) {
      return res.json({ result: matchedResponse });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(query);
    const response = await result.response;
    const text = response.text();

    res.json({ result: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/generate", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required." });
    }

    res.render("result", { query });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function hesaplariGetir() {
  const hesaplarJSON = fs.readFileSync("hesap.json");
  return JSON.parse(hesaplarJSON);
}

app.post("/deleteUser", async (req, res) => {
  try {
    const { kullaniciAdi, sifre } = req.body;

    // Kullanıcıları dosyadan oku
    const rawUserData = await fs.readFile("hesap.json", "utf8");
    let users = JSON.parse(rawUserData).kullanicilar;

    // Belirtilen kullanıcıyı bul
    const userIndex = users.findIndex(
      (user) => user.kullaniciAdi === kullaniciAdi && user.sifre === sifre,
    );

    // Kullanıcı bulunduysa sil
    if (userIndex !== -1) {
      users.splice(userIndex, 1);

      // Güncellenmiş kullanıcı listesini dosyaya kaydet
      await fs.writeFile("hesap.json", JSON.stringify({ kullanicilar: users }));

      res.status(200).json({ message: "Kullanıcı başarıyla silindi." });
    } else {
      res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
  } catch (err) {
    console.error("Kullanıcı silme hatası:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/deleteKitap", (req, res) => {
  const { kitapAdi } = req.body;

  const rawKitapData = fs.readFileSync("kitap.json");
  let kitaplar = JSON.parse(rawKitapData);

  // Kitabı silme
  let kitapIndex = -1;
  for (let i = 0; i < kitaplar.length; i++) {
    if (kitaplar[i].kitapAdi.toLowerCase() === kitapAdi.toLowerCase()) {
      // Silinecek kitabın index'ini kaydet
      kitapIndex = i;
      break;
    }
  }

  // Kitap bulunduysa sil ve güncellenmiş kitap listesini dosyaya kaydet
  if (kitapIndex !== -1) {
    kitaplar.splice(kitapIndex, 1);

    fs.writeFile("kitap.json", JSON.stringify(kitaplar), (err) => {
      if (err) {
        console.error("Kitap silme hatası:", err);
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

      res.status(200).json({ message: "Kitap başarıyla silindi." });
    });
  } else {
    res
      .status(404)
      .json({ message: "Belirtilen isme sahip kitap bulunamadı." });
  }
});

// Sunucu dinleme
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const hesapJson = fs.readFileSync("hesap.json");
const kullanicilar = JSON.parse(hesapJson).kullanicilar;

// Kullanıcıya ait rolü adı getirme fonksiyonu
const rolAdiGetir = (perm) => {
  switch (perm) {
    case 1:
      return "Kurucu";
    case 2:
      return "Yapay zeka (Aİ)";
    case 3:
      return "Moderatör";
    default:
      return "Yazar";
  }
};

// Kullanıcı profil sayfasını gösteren endpoint
app.get("/profil/:kullaniciAdi", (req, res) => {
  const kullaniciAdi = req.params.kullaniciAdi;
  const kullanici = kullanicilar.find((k) => k.kullaniciAdi === kullaniciAdi);

  if (!kullanici) {
    res.status(404).send("Kullanıcı bulunamadı");
    return;
  }

  res.render("profil.ejs", { kullanici, rolAdiGetir });
});
const socketIo = require('socket.io');
const { createServer } = require('http'); // Doğru
const server = createServer(app);

const io = socketIo(server);
const users = new Set(); // Online kullanıcılar
const messages = []; // Gönderilen mesajlar
app.get('/sohbet', (req, res) => {
    res.render('sohbet');
});

io.on('connection', (socket) => {
    let username;

    // Kullanıcı adını al ve online kullanıcılara ekle
    socket.on('addUser', (name) => {
        username = name;
        users.add(username);
        io.emit('userList', Array.from(users));
        io.emit('messageList', messages);
    });

    // Mesaj gönderme
    socket.on('sendMessage', (message) => {
        const formattedMessage = `${username}: ${message}`;
        messages.push(formattedMessage);
        if (messages.length > 10) {
            messages.shift(); // Sadece son 10 mesajı sakla
        }
        io.emit('messageList', messages);
    });

    // Bağlantı koptuğunda kullanıcıyı listeden çıkar
    socket.on('disconnect', () => {
        users.delete(username);
        io.emit('userList', Array.from(users));
    });
});
