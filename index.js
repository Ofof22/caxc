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
    secret: "gizlianahtar", // Güvenli bir şekilde saklanmalıdır
    resave: false,
    saveUninitialized: true,
  }),
);


const hesapJsonFilePath = 'hesap.json';

// Kullanıcı bilgilerini okuma fonksiyonu
function readUsersFromJson() {
    try {
        const hesapJsonData = fs.readFileSync(hesapJsonFilePath, 'utf8');
        const users = JSON.parse(hesapJsonData).kullanicilar;
        return users;
    } catch (error) {
        console.error('Hesap JSON dosyasını okuma hatası:', error.message);
        return [];
    }
}

// Kullanıcı bilgilerini yazma fonksiyonu
function writeUsersToJson(users) {
    try {
        const data = JSON.stringify({ kullanicilar: users }, null, 2);
        fs.writeFileSync(hesapJsonFilePath, data);
    } catch (error) {
        console.error('Hesap JSON dosyasını yazma hatası:', error.message);
    }
}

app.post('/manageUser', (req, res) => {
    const { kullaniciAdi, action, permission } = req.body;
    const users = readUsersFromJson();
    const userIndex = users.findIndex(u => u.kullaniciAdi === kullaniciAdi);

    if (userIndex !== -1) {
        if (action === 'delete') {
            // Silme işlemi
            users.splice(userIndex, 1);
        } else if (action === 'update') {
            // Güncelleme işlemi
            users[userIndex].perm = parseInt(permission);
        }

        // Kullanıcı bilgilerini güncellenmiş haliyle dosyaya yaz
        writeUsersToJson(users);

        res.redirect('/adminpanel');
    } else {
        res.status(404).send('Kullanıcı bulunamadı');
    }
});





















// Kitaplar metin dosyasından yükleniyor

const kitapDosya = "kitap.json";

try {
  const kitaplar = fs.readFileSync(kitapDosya, "utf-8");
} catch (error) {
  console.error("Dosya okuma hatası:", error.message);
}
// Ana sayfa
app.get("/", (req, res) => {
  res.render("index");
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
// Kullanıcıları içeren JSON dosyasının yolu
const hesapDosyaYolu = "hesap.json";

// Kullanıcıları getiren endpoint
app.get("/kullanicilar", (req, res) => {
  const hesapVerileri = JSON.parse(fs.readFileSync(hesapDosyaYolu, "utf8"));
  res.json(hesapVerileri.kullanicilar);
});

// Kullanıcıları silecek endpoint (deleteUser)
app.post("/deleteUser", (req, res) => {
  const kullaniciAdi = req.body.kullaniciAdi;

  // Kullanıcıları içeren JSON dosyasını oku
  const hesapVerileri = JSON.parse(fs.readFileSync(hesapDosyaYolu, "utf8"));

  // Kullanıcıyı sil
  hesapVerileri.kullanicilar = hesapVerileri.kullanicilar.filter(
    (user) => user.kullaniciAdi !== kullaniciAdi,
  );

  // Güncellenmiş verileri JSON dosyasına yaz
  fs.writeFileSync(hesapDosyaYolu, JSON.stringify(hesapVerileri, null, 2));

  res.send(`Kullanıcı "${kullaniciAdi}" başarıyla silindi.`);
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

function hesaplariGetir() {
  const hesaplarJSON = fs.readFileSync("hesap.json");
  return JSON.parse(hesaplarJSON);
}
setInterval(() => {
  const yeniHesapJson = fs.readFileSync("hesap.json");
  const kullanicilar = JSON.parse(yeniHesapJson).kullanicilar;

  // Yeni kullanıcıları kontrol et ve gerekli işlemleri gerçekleştir
}, 1000); // Örneğin, her saniye kontrol et

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
  const yeniHesapJson = fs.readFileSync("hesap.json");
  const kullanicilar = JSON.parse(yeniHesapJson).kullanicilar;

  const kullanici = kullanicilar.find((k) => k.kullaniciAdi === kullaniciAdi);

  if (!kullanici) {
    res.status(404).send("Kullanıcı bulunamadı");
    return;
  }

  res.render("profil.ejs", { kullanici, rolAdiGetir });
});

app.get("/yaz", (req, res) => {
  res.render("yaz");
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
    // Kullanıcı objesini oluştururken "perm" alanını ekleyin
    const yeniKullanici = { kullaniciAdi, sifre, perm: "0" };

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
app.post("/kitap-ekle", (req, res) => {
  const {
    kitapAdi,
    kitapYazari,
    kitapAciklamasi,
    kitapKonusu,
    kitapYazisi,
    kitapFoto,
  } = req.body;

  const yeniKitap = {
    kitapAdi,
    kitapYazari,
    kitapAciklamasi,
    kitapKonusu,
    kitapYazisi,
    kitapFoto,
  };

  kitaplar.push(yeniKitap);

  // Kitapları dosyaya yaz
  fs.writeFile(
    kitapDosya,
    kitaplar.map((k) => JSON.stringify(k)).join("\n"),
    (err) => {
      if (err) throw err;
      console.log("Yeni kitap dosyaya yazıldı.");
    },
  );

  res.redirect("/kitaplar");
});

// Kitaplar sayfası
const rawdata = fs.readFileSync("kitap.json");
const kitaplar = JSON.parse(rawdata);

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

app.post("/yorum-ekle", (req, res) => {
  // Kullanıcı adını session'dan al
  const kullaniciAdi = req.session.kullaniciAdi;

  const kitapAdi = req.body.kitapAdi;
  const yorumMetni = req.body.yorum;

  // Yeni yorum objesi
  const yeniYorum = { kitapAdi, isim: kullaniciAdi, yorum: yorumMetni };

  // Yorumları dosyadan al
  const yorumlar = yorumlariGetir();

  // Yeni yorumu ekle
  yorumlar.push(yeniYorum);

  // Yorumları dosyaya kaydet
  yorumlariKaydet(yorumlar);

  res.redirect("/kitap/" + kitapAdi); // Yorum eklendikten sonra kitap detay sayfasına yönlendir
});

// Sunucu dinleme
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
