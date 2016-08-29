import { getId } from "./helpers/seed";

export interface ThreadedLockParams {
    key: string;
    seed: string;
    ttl: number;
}

export async function NewThreadedLock(key: string, ttl: number = 5000): Promise<ThreadedLock> {
    const promise = new Promise<ThreadedLock>((res) => {
        setTimeout(() => {
            let tl = new ThreadedLock(key, ttl);
            if (!tl.isLocked()) {
                console.log("Lock is not locked. Generating new.");
                localStorage[tl.key] = tl.id;
            }
            res(tl);
        }, Math.ceil(Math.random() * 1000));
    });
    return promise;
}

export class ThreadedLock {
    public id: string;
    constructor(public key: string, private ttl: number = 5000) {
        ttl += new Date().getTime();
        this.id = getId() + "|" + ttl;
    }

    public lock() {
        return new Promise<any>((res) => {
            if (!this.isLocked()) {
                localStorage[this.key] = this.id;
                res();
            }
            let resolve = () => {
                console.log("Storage event received");
                console.log("Lock is", this.isLocked());
                if (!this.isLocked()) {
                    console.log("Removing event");
                    window.removeEventListener("storage", resolve);
                    console.log("Updating id in storage", localStorage[this.key], "to", this.id);
                    localStorage[this.key] = this.id;
                    console.log("unblocking");
                    res();
                }
            };
            window.addEventListener("storage", resolve);
        });
    }

    public unlock() {
        return new Promise(res => {
            if (this.canUnlock()) {
                localStorage.removeItem(this.key);
                res();
            }
            let resolve = () => {
                if (this.canUnlock()) {
                    window.removeEventListener("storage", resolve);
                    localStorage.removeItem(this.key);
                    res();
                }
            };
            window.removeEventListener("storage", resolve);
        });
    }

    public isLocked() {
        console.log("Checking if", this.key, "is locked");
        let value = localStorage[this.key];
        console.log("Current lock value", value);
        if (!value) {
            return false;
        }
        
        let splitted = value.split(/\|/);
        console.log("Time in storage: ", parseInt(splitted[1], 10));
        console.log("Current time: ", new Date().getTime());
        if (parseInt(splitted[1], 10) < new Date().getTime()) {
            console.log("Timed out");
            return false;
        }

        const id = splitted[0];
        console.log("Storage id:", id);
        if (id) {
            console.log("Current id: ", this.id.split(/\|/)[0]);
            return this.id.split(/\|/)[0] !== id;
        }
        return false;
    }

    private canUnlock() {
        let value = localStorage[this.key];
        if (!value) {
            // Already unlocked
            return true;
        }
        return value === this.id;
    }
}
