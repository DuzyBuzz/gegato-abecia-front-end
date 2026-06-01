import { Injectable } from '@angular/core';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { db } from '../../firebase';
import { ServiceRequest, ServiceRequestStatus } from '../models/service-request.model';

const COLLECTION = 'service_requests';

@Injectable({ providedIn: 'root' })
export class ServiceRequestService {

  async submitRequest(
    request: Omit<ServiceRequest, 'id' | 'status' | 'requestedAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...request,
      status: 'pending' as ServiceRequestStatus,
      requestedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  getPendingRequests(): Observable<ServiceRequest[]> {
    return new Observable<ServiceRequest[]>((observer) => {
      const q = query(
        collection(db, COLLECTION),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot: any) => {
          const items = snapshot.docs.map((d: any) => this.mapDoc(d.id, d.data()));
          observer.next(items);
        },
        (err: any) => observer.error(err)
      );
      return () => unsubscribe();
    });
  }

  getAllRequests(): Observable<ServiceRequest[]> {
    return new Observable<ServiceRequest[]>((observer) => {
      const q = query(
        collection(db, COLLECTION),
        orderBy('requestedAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot: any) => {
          const items = snapshot.docs.map((d: any) => this.mapDoc(d.id, d.data()));
          observer.next(items);
        },
        (err: any) => observer.error(err)
      );
      return () => unsubscribe();
    });
  }

  getRequestsByContract(contractId: number): Observable<ServiceRequest[]> {
    return new Observable<ServiceRequest[]>((observer) => {
      const q = query(
        collection(db, COLLECTION),
        where('contractId', '==', contractId),
        orderBy('requestedAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot: any) => {
          const items = snapshot.docs.map((d: any) => this.mapDoc(d.id, d.data()));
          observer.next(items);
        },
        (err: any) => observer.error(err)
      );
      return () => unsubscribe();
    });
  }

  async approveRequest(id: string, adminNotes: string, reviewedBy: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      status: 'approved' as ServiceRequestStatus,
      adminNotes: adminNotes || '',
      reviewedBy,
      reviewedAt: Timestamp.now(),
    });
  }

  async rejectRequest(id: string, adminNotes: string, reviewedBy: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      status: 'rejected' as ServiceRequestStatus,
      adminNotes: adminNotes || '',
      reviewedBy,
      reviewedAt: Timestamp.now(),
    });
  }

  private mapDoc(id: string, data: DocumentData): ServiceRequest {
    return {
      id,
      type: data['type'],
      contractId: data['contractId'],
      contractNo: data['contractNo'],
      deceasedName: data['deceasedName'],
      requestedBy: data['requestedBy'],
      requestedByUid: data['requestedByUid'],
      requestedAt: data['requestedAt'],
      status: data['status'],
      fieldLabel: data['fieldLabel'],
      fieldKey: data['fieldKey'],
      targetId: data['targetId'],
      oldValue: data['oldValue'],
      newValue: data['newValue'],
      chargeData: data['chargeData'],
      paymentData: data['paymentData'],
      notes: data['notes'],
      adminNotes: data['adminNotes'],
      reviewedBy: data['reviewedBy'],
      reviewedAt: data['reviewedAt'] ?? null,
    };
  }
}
