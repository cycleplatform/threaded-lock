import Lock from "./lock";

export interface LockStorage {
    read(key: string): Lock | undefined;
    write(key: string, value: Lock): void;
    clear(key?: string): void;
}

export class LocalLockStorage implements LockStorage {
    public write(key: string, value: Lock) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    public read(key: string): Lock {
        const obj = JSON.parse(localStorage.getItem(key));
        return obj;
    }

    public clear(key?: string) {
        if (key) {
            localStorage.removeItem(key);
        } else {
            localStorage.clear();
        }
    }
}

let s: LockStorage = new LocalLockStorage();

export function getStorage() {
    return s;
}

export function setStorage(storage: LockStorage) {
    s = storage;
}
