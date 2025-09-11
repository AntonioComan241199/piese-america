import fs from 'fs';
import path from 'path';

export class FileExportUtil {
  /**
   * Scrie conținut CSV într-un fișier și returnează path-ul
   */
  static async writeCsvFile(csvContent, filename) {
    const exportsDir = path.join(process.cwd(), 'exports');
    
    // Creează directorul exports dacă nu există
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    const filePath = path.join(exportsDir, `${filename}-${Date.now()}.csv`);
    fs.writeFileSync(filePath, csvContent);
    
    return filePath;
  }

  /**
   * Șterge fișierul după descărcare (cleanup)
   */
  static deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}