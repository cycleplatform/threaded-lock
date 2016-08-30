// Lock object

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

            let claimed = false;
            const existing = this.read();
            if (!existing || existing.expires < Date.now()) {
                this.write();
                setTimeout(() => {
                    const doublecheck = this.read();
                    if (doublecheck) {
                        if (doublecheck.seed === this.seed || doublecheck.expires < Date.now()) {
                            claimed = true;
                            this.claimLockFlow(res, rej);
                            return;
                        }
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
        let lock = this.read();

        if (lock && lock.seed !== this.seed && lock.expires > Date.now()) {
            return false;
        }

        clearInterval(this.heartbeat);
        window.removeEventListener("storage", <EventListener>this.lockCheck);
        localStorage.removeItem(this.name);
        return true;
    }

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

    private write() {
        localStorage.setItem(this.name, JSON.stringify(this));
    }

    private setExpiration() {
        this.expires = Date.now() + this.timeout;
    }

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

    private waitOnLockFlow(res: Function, rej: Function) {
        window.addEventListener("storage", <EventListener>this.lockCheck);
        // In case other tab closed pre-maturely while we're waiting
        this.heartbeat = setInterval(() => {
            this.lockCheck();
        }, this.timeout);
    }
}
