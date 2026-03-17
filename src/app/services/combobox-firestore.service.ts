import { Injectable } from '@angular/core';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '../../firebase';

interface ComboboxData {
  items: string[];
  default: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComboboxFirestoreService {
  // In-memory cache
  private cache = new Map<string, ComboboxData>();
  private watchers = new Map<string, () => void>();

  /**
   * Normalize list values
   * - remove empty lines
   * - trim spaces
   * - remove duplicates
   */
  private normalize(text: string): string[] {
    return Array.from(
      new Set(
        (text || '')
          .split(/\r?\n/)
          .map(v => v.trim())
          .filter(v => v.length > 0)
      )
    );
  }

  /**
   * Get combobox values (cached first, then Firestore)
   */
  async getCombobox(
    field: string,
    collection = 'collection'
  ): Promise<ComboboxData> {

    if (!field) throw new Error('field is required');

    // Return from cache if available
    if (this.cache.has(field)) {
      return this.cache.get(field)!;
    }

    const ref = doc(db, collection, field);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const emptyData = { items: [], default: '' };
      this.cache.set(field, emptyData);
      return emptyData;
    }

    const data = snap.data();

    const items =
      typeof data?.items === 'string'
        ? this.normalize(data.items)
        : [];

    const def =
      typeof data?.default === 'string'
        ? data.default
        : items[0] ?? '';

    const result = { items, default: def };
    this.cache.set(field, result);
    return result;
  }

  /**
   * Preload multiple comboboxes in parallel
   */
  async preloadComboboxes(fields: string[], collection = 'collection'): Promise<void> {
    const promises = fields.map(field => this.getCombobox(field, collection));
    await Promise.all(promises);
    console.log(`[ComboboxService] Preloaded ${fields.length} comboboxes`);
  }

  /**
   * Update combobox values
   */
  async updateCombobox(
    field: string,
    text: string,
    defaultValue: string,
    collection = 'collection'
  ): Promise<void> {

    if (!field) throw new Error('field is required');

    const items = this.normalize(text);

    if (!items.length) {
      throw new Error('List must contain at least one value');
    }

    if (!items.includes(defaultValue)) {
      defaultValue = items[0];
    }

    const ref = doc(db, collection, field);

    await setDoc(
      ref,
      {
        items: items.join('\n'),
        default: defaultValue,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    // Update cache
    this.cache.set(field, { items, default: defaultValue });
  }

  /**
   * Watch realtime changes
   */
  watchCombobox(
    field: string,
    callback: (data: ComboboxData) => void,
    collection = 'collection'
  ): () => void {

    if (!field) throw new Error('field is required');

    // If already watching, unsubscribe old listener
    if (this.watchers.has(field)) {
      this.watchers.get(field)?.();
    }

    const ref = doc(db, collection, field);

    const unsubscribe: () => void = onSnapshot(ref, (snap) => {

      if (!snap.exists()) {
        const empty = { items: [], default: '' };
        this.cache.set(field, empty);
        callback(empty);
        return;
      }

      const data = snap.data();

      const raw =
        typeof data?.items === 'string'
          ? data.items
          : '';

      const items = this.normalize(raw);

      const def =
        typeof data?.default === 'string'
          ? data.default
          : items[0] ?? '';

      const result = { items, default: def };
      this.cache.set(field, result);
      callback(result);

    }) as unknown as () => void;

    this.watchers.set(field, unsubscribe);
    return unsubscribe;
  }

}