import * as fs from 'fs';
import * as path from 'path';

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export class JsonlWriter {
  private static writePromises: Map<string, Promise<void>> = new Map();

  public static async appendLine(filePath: string, data: Record<string, any>): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const line = JSON.stringify(data) + '\n';
    
    // Serialization of appends to avoid write interleaving/race conditions on the same file
    let currentPromise = this.writePromises.get(filePath) || Promise.resolve();
    const nextPromise = currentPromise.then(() => {
      return new Promise<void>((resolve, reject) => {
        fs.appendFile(filePath, line, 'utf8', (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(`[JsonlWriter] Failed to write trace to ${filePath}:`, err);
    });

    this.writePromises.set(filePath, nextPromise);
    await nextPromise;
  }
}
