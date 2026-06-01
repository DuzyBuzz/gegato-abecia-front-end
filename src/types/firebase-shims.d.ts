declare module 'firebase/app' {
  export function initializeApp(...args: any[]): any;
  export default any;
}

declare module 'firebase/firestore' {
  export function getFirestore(...args: any[]): any;
  export function collection(...args: any[]): any;
  export function deleteDoc(...args: any[]): any;
  export function doc(...args: any[]): any;
  export function getDoc(...args: any[]): any;
  export function getDocs(...args: any[]): any;
  export function addDoc(...args: any[]): any;
  export function setDoc(...args: any[]): any;
  export function updateDoc(...args: any[]): any;
  export function query(...args: any[]): any;
  export function where(...args: any[]): any;
  export function orderBy(...args: any[]): any;
  export function serverTimestamp(...args: any[]): any;
  export type DocumentData = any;
  export class Timestamp {
    static now(): any;
  }
  export function onSnapshot(ref: any, onNext: (snap: any) => void, onError?: (error: any) => void): () => void;
  export default any;
}

declare module 'firebase/auth' {
  export function getAuth(...args: any[]): any;
  export default any;
}

declare module 'firebase/analytics' {
  export function getAnalytics(...args: any[]): any;
  export default any;
}

// fallback for other firebase subpaths
declare module 'firebase/*' {
  const whatever: any;
  export default whatever;
}
