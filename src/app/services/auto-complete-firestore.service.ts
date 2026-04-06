import { Injectable } from '@angular/core';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface AutoCompleteData {
  items: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AutoCompleteFirestoreService {
  private cache = new Map<string, AutoCompleteData>();
  private watchers = new Map<string, () => void>();

  private normalize(text: string): string[] {
    return Array.from(
      new Set(
        (text || '')
          .split(/\\r?\\n/)
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      )
    );
  }

  async getList(field: string, collection = 'autocomplete'): Promise<AutoCompleteData> {
    if (!field) throw new Error('field is required');

    if (this.cache.has(field)) return this.cache.get(field)!;

    const ref = doc(db, collection, field);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const empty = { items: [] };
      this.cache.set(field, empty);
      return empty;
    }

    const data = snap.data();
    const items =
      typeof data?.items === 'string'
        ? this.normalize(data.items)
        : Array.isArray(data?.items)
          ? (data.items as any[]).map(String).map((v) => v.trim()).filter(Boolean)
          : [];

    const result = { items };
    this.cache.set(field, result);
    return result;
  }

  async updateList(field: string, text: string, collection = 'autocomplete'): Promise<void> {
    if (!field) throw new Error('field is required');

    const items = this.normalize(text);
    if (!items.length) throw new Error('List must contain at least one value');

    const ref = doc(db, collection, field);
    await setDoc(
      ref,
      {
        items: items.join('\\n'),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    this.cache.set(field, { items });
  }

  watchList(
    field: string,
    callback: (data: AutoCompleteData) => void,
    collection = 'autocomplete'
  ): () => void {
    if (!field) throw new Error('field is required');

    if (this.watchers.has(field)) {
      this.watchers.get(field)?.();
    }

    const ref = doc(db, collection, field);
    const unsubscribe: () => void = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        const empty = { items: [] };
        this.cache.set(field, empty);
        callback(empty);
        return;
      }

      const data = snap.data();
      const raw = typeof data?.items === 'string' ? data.items : '';
      const items = this.normalize(raw);
      const result = { items };
      this.cache.set(field, result);
      callback(result);
    }) as unknown as () => void;

    this.watchers.set(field, unsubscribe);
    return unsubscribe;
  }
}
