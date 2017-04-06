/**
 * Threaded lock
 * Copyright 2017 Petrichor, Inc. 
 */

// Object read out of localStorage
interface SavedLock {
    name: string;
    timeout: number;
    seed: number;
    expires: number;
}

// ms interval to double check
const interval = 40;

export default class {
    private lockCheck: Function;
    private heartbeat: number;
    private expires: number;

    constructor(public name: string, public timeout = 5000, public seed?: number) {
        if (!this.seed) {
            this.seed = Math.random();
        }
        this.setExpiration();
    }

    /**
     * Attempt to claim the lock.
     * Will either claim a lock and block others,
     * or will wait for the claimer to unlock
     */
    public lock() {
        return new Promise<void>((res, rej) => {
            // Called on local storage change
            this.lockCheck = () => {
                const doublecheck = this.read();
                // If exists and hasn't expired'
                if (doublecheck && doublecheck.expires > Date.now()) {
                    return;
                }
                
                if (this.unlock()) {
                    res();
                }
            };

            const existing = this.read();
            if (!existing || existing.expires < Date.now()) {
                this.write();
                // Double check after our interval to ensuer
                // that we still have the lock claimed.
                setTimeout(() => {
                    const doublecheck = this.read();
                    let claimed = false;

                    if (doublecheck) {
                        if (doublecheck.seed === this.seed || doublecheck.expires < Date.now()) {
                            claimed = true;
                            // Trigger claimed flow
                            this.claimLockFlow(res, rej);
                            return;
                        }
                    }

                    if (claimed) {
                        return;
                    }

                    // Trigger blocked flow
                    this.waitOnLockFlow();
                }, interval);

                return;
            }

            this.waitOnLockFlow();
        });
    }

    /**
     * Unlock this lock
     */
    public unlock() {
        // Dont unlock one that's not the same
        let lock = this.read();

        // Only unlock if we own the lock, or there is a stale lock in storage (expired)
        if (lock && lock.seed !== this.seed && lock.expires > Date.now()) {
            return false;
        }

        clearInterval(this.heartbeat);
        window.removeEventListener("storage", <EventListener>this.lockCheck);
        localStorage.removeItem(this.name);
        return true;
    }

    /**
     * Read out of localstorage and parse it
     */
    private read(): SavedLock | undefined {
        const res = localStorage.getItem(this.name);
        if (!res) {
            return undefined;
        }

        try {
            return JSON.parse(res);
        } catch (e) {
            return undefined;
        }
    }

    /**
     * Write current object to storage
     */
    private write() {
        localStorage.setItem(this.name, JSON.stringify(this));
    }

    /**
     * Update the expiration time
     */
    private setExpiration() {
        this.expires = Date.now() + this.timeout;
    }

    /**
     * In this situation, the lock will be claimed by us.
     */
    private claimLockFlow(res: Function, rej: Function) {
        this.setExpiration();
        // lock has been claimed
        window.removeEventListener("storage", <EventListener>this.lockCheck);
        this.heartbeat = setInterval(() => {
            this.setExpiration();
            this.write();
        }, this.timeout - this.timeout / 2);
        res();
    }

    /**
     * In this situation, the lock has already been claimed.
     * Wait until either it has been unlocked from local storage 
     * or expires.
     */
    private waitOnLockFlow() {
        window.addEventListener("storage", <EventListener>this.lockCheck);
        // In case other tab closed pre-maturely while we're waiting
        this.heartbeat = setInterval(() => {
            this.lockCheck();
        }, this.timeout);
    }
}
