declare module 'firebase/app' {
  export function initializeApp(...args: any[]): any;
  export default any;
}

declare module 'firebase/firestore' {
  export function getFirestore(...args: any[]): any;
  export function doc(...args: any[]): any;
  export function getDoc(...args: any[]): any;
  export function setDoc(...args: any[]): any;
  export function serverTimestamp(...args: any[]): any;
  export default any;

    export function onSnapshot(ref: any, arg1: (snap: any) => void) {
        throw new Error('Function not implemented.');
    }
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
