// Lock object

interface SavedLock {
    name: string;
    timeout: number;
    seed: number;
    expires: number;
}

// ms interval to double check
const interval = 40;

export class Lock {
    private lockCheck: Function;
    private heartbeat: number;
    private expires: number;

    constructor(public name: string, public timeout = 5000, public seed?: number) {
        if (!this.seed) {
            this.seed = Math.random();
        }
        this.setExpiration();
    }

    public lock() {
        return new Promise<void>((res, rej) => {
            // Called on local storage change
            this.lockCheck = () => {
                const doublecheck = this.read();
                // If exists and hasn't expired'
                if (doublecheck && doublecheck.expires > Date.now()) {
                    console.log("Lock is still claimed.", this.seed);
                    return;
                }
                
                if (this.unlock()) {
                    res();
                }
            };

            let claimed = false;
            const existing = this.read();
            if (!existing || existing.expires < Date.now()) {
                if (!existing) {
                    console.log("Lock doesn't exist. Attempting claim.", this.seed);
                } else {
                    console.log(existing.expires, Date.now(), existing.expires < Date.now());
                    console.log("Lock expired. Attempting claim.");
                }

                this.write();
                setTimeout(() => {
                    console.log("Double checking lock is still ours", this.seed);
                    const doublecheck = this.read();
                    console.log("Doublecheck says: ", doublecheck);
                    if (doublecheck) {
                        if (doublecheck.seed === this.seed || doublecheck.expires < Date.now()) {
                            claimed = true;
                            this.claimLockFlow(res, rej);
                            return;
                        }

                        console.log("Lock isn't ours. Waiting...");
                    }

                    if (claimed) {
                        return;
                    }

                    this.waitOnLockFlow(res, rej);
                }, interval);

                return;
            }

            this.waitOnLockFlow(res, rej);
        });
    }

    public unlock() {
        // Dont unlock one that's not the same
        console.log("Unlocking....", this.seed);
        let lock = this.read();

        if (lock && lock.seed !== this.seed && lock.expires > Date.now()) {
            console.log("Lock is claimed and not expired. Not deleting.", lock.seed);
            return false;
        }

        console.log("Clearing out lock", this.seed);

        clearInterval(this.heartbeat);
        window.removeEventListener("storage", <EventListener>this.lockCheck);
        localStorage.removeItem(this.name);
        return true;
    }

    private read(): SavedLock | undefined {
        const res = localStorage.getItem(this.name);
        console.log("Raw storage output: ", res);
        if (!res) {
            return undefined;
        }

        try {
            return JSON.parse(res);
        } catch (e) {
            return undefined;
        }
    }

    private write() {
        localStorage.setItem(this.name, JSON.stringify(this));
    }

    private setExpiration() {
        this.expires = Date.now() + this.timeout;
    }

    private claimLockFlow(res: Function, rej: Function) {
        console.log("Lock is ours. Claiming.");
        this.setExpiration();
        // lock has been claimed
        window.removeEventListener("storage", <EventListener>this.lockCheck);
        this.heartbeat = setInterval(() => {
            console.log("Updating expiration.");
            this.setExpiration();
            this.write();
        }, this.timeout - this.timeout / 2);
        res();
        console.log("resolved");
    }

    private waitOnLockFlow(res: Function, rej: Function) {
        console.log("Waiting on lock in another tab");
        window.addEventListener("storage", <EventListener>this.lockCheck);
        // In case other tab closed pre-maturely while we're waiting
        this.heartbeat = setInterval(() => {
            this.lockCheck();
        }, this.timeout);
    }
}
