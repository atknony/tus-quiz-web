
import 'dotenv/config'; // .env dosyasını yükle
import { db } from '../server/db'; // Drizzle bağlantı dosyanızın yolunu kontrol edin.
import { questions } from './schema';
import * as fs from 'fs/promises';

// JSON dosyanızın yolu
const KLINIK_PATH = 'data/klinik.json';
const PREKLINIK_PATH = 'data/preklinik.json';

async function seed() {
  console.log('Veritabanına veri tohumlama başlatılıyor...');

  try {
    // 1. JSON verilerini oku
    const [klinikData, preklinikData] = await Promise.all([
      fs.readFile(KLINIK_PATH, 'utf-8').then(JSON.parse),
      fs.readFile(PREKLINIK_PATH, 'utf-8').then(JSON.parse),
    ]);

    // 2. Verilere Section Etiketini Ekle ve Birleştir (ZORUNLU DÜZELTME)
    // Her soruya 'section' alanını ekleyerek eksik veriyi tamamlıyoruz.
    const klinikQuestions = klinikData.map((q: any) => ({ ...q, section: 'Klinik' }));
    const preklinikQuestions = preklinikData.map((q: any) => ({ ...q, section: 'Preklinik' }));
    
    const allQuestionsWithSection = [...klinikQuestions, ...preklinikQuestions];
    
    // Veritabanına yazmadan önce temiz bir başlangıç için mevcut verileri siliyoruz.
    console.log('Mevcut tüm sorular siliniyor...');
    await db.delete(questions);
    
    // 3. 'id' Alanını Kaldır
    // Drizzle'ın otomatik ID üretmesi için JSON'daki 'id' alanını kaldırıyoruz.
    const questionsToInsert = allQuestionsWithSection.map((q: any) => { 
      const { id, ...rest } = q;
      return rest; // Sadece id olmayan kısımları geri döndür
    });
    
    // 4. Verileri questions tablosuna ekle
    console.log(`Toplam ${questionsToInsert.length} soru veritabanına ekleniyor...`);
    
    // KRİTİK DÜZELTME: Artık 'id' içermeyen questionsToInsert dizisini kullanıyoruz.
    await db.insert(questions).values(questionsToInsert); 

    console.log('✅ Veri tohumlama başarıyla tamamlandı!');

  } catch (error) {
    console.error('❌ Veri tohumlama sırasında bir hata oluştu:', error);
    process.exit(1);
  }
}

seed();