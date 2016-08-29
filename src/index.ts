// Lock object

interface SavedLock {
    name: string;
    timeout: number;
    seed: number;
}

// ms interval to double check
const interval = 40;

export class Lock {
    constructor(public name: string, public timeout = 5000, public seed: number) {
        if (!this.seed) {
            this.seed = Math.random();
        }
    }

    public lock() {
        return new Promise<void>((res, rej) => {
            let check: EventListener;
            check = () => {
                const doublecheck = this.read();
                if (!doublecheck) {
                    // Lock released
                    window.removeEventListener("storage", check);
                    res();
                }
            };

            const existing = this.read();
            if (!existing) {
                this.write();
                setTimeout(() => {
                    const doublecheck = this.read();
                    if (doublecheck && doublecheck.seed === this.seed) {
                        window.removeEventListener("storage", check);
                        res();
                    }
                }, interval);
            }

            window.addEventListener("storage", check);
        });
    }

    public unlock() {
        // Dont unlock one that's not the same
        const lock = this.read();
        if (!lock || lock.seed !== this.seed) {
            return;
        }

        localStorage.removeItem(this.name);
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
}
