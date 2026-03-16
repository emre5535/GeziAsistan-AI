import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, setDoc, getDocs, getDoc
} from 'firebase/firestore';
import { getFirebaseDb, routesPath } from '../utils/firebase';
import { nanoid } from 'nanoid';

export function useRoutes(uid) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setRoutes([]); setLoading(false); return; }
    const db = getFirebaseDb();
    const ref = collection(db, routesPath(uid));
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRoutes(list);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  const createRoute = useCallback(async (name) => {
    if (!uid || !name.trim()) return null;
    const db = getFirebaseDb();
    const ref = collection(db, routesPath(uid));
    const docRef = await addDoc(ref, {
      name: name.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dayStartTimes: { 1: '09:00' },
      dayDates: { 1: '' },
      itinerary: [],
    });
    return docRef.id;
  }, [uid]);

  const deleteRoute = useCallback(async (routeId) => {
    if (!uid) return;
    const db = getFirebaseDb();
    await deleteDoc(doc(db, routesPath(uid), routeId));
  }, [uid]);

  const copyRoute = useCallback(async (route) => {
    if (!uid) return;
    const db = getFirebaseDb();
    const ref = collection(db, routesPath(uid));
    await addDoc(ref, {
      name: `${route.name} (Kopya)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dayStartTimes: route.dayStartTimes || {},
      dayDates: route.dayDates || {},
      itinerary: (route.itinerary || []).map((item) => ({
        ...item,
        id: nanoid(8),
      })),
    });
  }, [uid]);

  return { routes, loading, createRoute, deleteRoute, copyRoute };
}

export function useRoute(uid, routeId) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !routeId) { setLoading(false); return; }
    const db = getFirebaseDb();
    const ref = doc(db, routesPath(uid), routeId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setRoute({ id: snap.id, ...snap.data() });
      else setRoute(null);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid, routeId]);

  return { route, loading };
}

export async function saveRoute(uid, routeId, data) {
  const db = getFirebaseDb();
  const ref = doc(db, routesPath(uid), routeId);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getRouteOnce(uid, routeId) {
  const db = getFirebaseDb();
  const ref = doc(db, routesPath(uid), routeId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}
