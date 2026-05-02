/**
 * pdfStorage.js
 * Stores raw PDF binary data in the browser's IndexedDB.
 * Each entry is keyed by a resourceId string.
 */

const DB_NAME = 'APL_PdfStore';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

let _db = null;

const openDb = () => {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
};

/**
 * Save a PDF File object under the given resourceId.
 */
export const savePdf = async (resourceId, file) => {
  const db = await openDb();
  const buf = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ buffer: buf, name: file.name, type: file.type }, String(resourceId));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Retrieve a PDF as an object URL string, or null if not found.
 */
export const getPdfUrl = async (resourceId) => {
  const db = await openDb();
  return new Promise((resolve) => {
    const req = db
      .transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME)
      .get(String(resourceId));
    req.onsuccess = () => {
      if (!req.result) { resolve(null); return; }
      const blob = new Blob([req.result.buffer], { type: req.result.type || 'application/pdf' });
      resolve(URL.createObjectURL(blob));
    };
    req.onerror = () => resolve(null);
  });
};

/**
 * Delete a stored PDF by resourceId.
 */
export const deletePdf = async (resourceId) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(String(resourceId));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};
