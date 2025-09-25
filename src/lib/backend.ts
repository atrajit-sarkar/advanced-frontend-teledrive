// Lightweight backend API client for TeleDrive FastAPI backend
// Keeps styling untouched; only logic wiring.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
const SESSION_KEY = 'td_session_id';

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

async function request(path: string, opts: RequestInit = {}) {
  const headers: Record<string,string> = (opts.headers as any) || {};
  const sid = getSessionId();
  if (sid) headers['X-Session-Id'] = sid;
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });
  if (!res.ok) {
    let detail = 'Request failed';
    try { const j = await res.json(); detail = j.detail || detail; } catch {}
    throw new Error(detail);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res;
}

export async function sendCode(phone: string): Promise<string> {
  const data = await request('/auth/send_code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  setSessionId(data.session_id);
  return data.session_id;
}

export async function checkCode(code: string): Promise<'authorized' | 'password_required' | 'unknown'> {
  const sid = getSessionId();
  if (!sid) throw new Error('Missing session');
  const data = await request('/auth/check_code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sid, code })
  });
  return data.status;
}

export async function checkPassword(password: string): Promise<boolean> {
  const sid = getSessionId();
  if (!sid) throw new Error('Missing session');
  const data = await request('/auth/check_password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sid, password })
  });
  return data.status === 'authorized';
}

export interface Me {
  authorized: boolean;
  username?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export async function fetchMe(): Promise<Me> {
  return request('/me');
}

export interface DriveNode { id: number; type: 'file'|'folder'; name: string; parent_id: number|null; message_id?: number; }

export async function fetchDrive(parentId: number | null = null): Promise<DriveNode[]> {
  const q = parentId ? `?parent_id=${parentId}` : '';
  const data = await request(`/drive${q}`);
  return data.nodes || [];
}

// Folder + bulk operations
export interface Folder { id: number; name: string; parent_id: number | null; }

export async function createFolder(name: string, parentId: number | null) : Promise<Folder> {
  const body = { name, parent_id: parentId } as any;
  const data = await request('/folders', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  return data as Folder;
}

export async function renameFolder(id: number, name: string) {
  await request('/folders/rename', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id, name }) });
}

export interface BreadcrumbItem { id: number; name: string; parent_id: number | null; }
export async function fetchBreadcrumbs(folderId: number | null): Promise<BreadcrumbItem[]> {
  const q = folderId ? `?folder_id=${folderId}` : '';
  const data = await request(`/folders/breadcrumbs${q}`);
  return data.items || [];
}

export async function moveItems(fileIds: number[], folderIds: number[], targetParentId: number | null) {
  await request('/move', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ file_ids: fileIds, folder_ids: folderIds, target_parent_id: targetParentId }) });
}

export async function bulkDelete(fileIds: number[], folderIds: number[]) {
  if (!fileIds.length && !folderIds.length) return;
  await request('/delete', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ file_ids: fileIds, folder_ids: folderIds }) });
}

export async function renameFile(id: number, name: string) {
  await request('/files/rename', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id, name }) });
}

export async function deleteFiles(fileIds: number[]) {
  if (!fileIds.length) return;
  await request('/delete', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ file_ids: fileIds, folder_ids: [] }) });
}

export async function logoutBackend() {
  try { await request('/auth/logout', { method: 'POST' }); } catch {}
  clearSession();
}

export interface UploadResult { message_id: number; name: string; }

export async function uploadFile(file: File, folderId: number | null = null, onProgress?: (pct:number)=>void): Promise<UploadResult> {
  const sid = getSessionId();
  if (!sid) throw new Error('Not authenticated');
  // Use XHR for progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const qs = new URLSearchParams();
    qs.set('session_id', sid);
    if (folderId) qs.set('folder_id', String(folderId));
    xhr.open('POST', `${API_BASE}/upload?${qs.toString()}`);
    xhr.setRequestHeader('X-Session-Id', sid);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Bad JSON')); }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).detail)); } catch { reject(new Error('Upload failed')); }
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    const fd = new FormData();
    fd.append('file', file, file.name);
    xhr.send(fd);
  });
}

export function buildDownloadUrl(messageId: number, inline = false): string {
  const sid = getSessionId();
  const disp = inline ? 'inline' : 'attachment';
  const base = `${API_BASE}/download/${messageId}?disposition=${disp}`;
  return sid ? `${base}&session_id=${encodeURIComponent(sid)}` : base;
}

export function avatarUrl(): string | null {
  const sid = getSessionId();
  if (!sid) return null;
  return `${API_BASE}/me/photo?session_id=${encodeURIComponent(sid)}`;
}

export { API_BASE };