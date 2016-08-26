import * as Storage from "./storage";
import Lock from "./lock";

export default class {
    constructor(private key: string, private ttl: number) { }

    public lock() {
        console.log("Locking ", this.key);
        return new Promise<Lock>((res) => {
            if (!this.isLocked()) {
                console.log("Lock is not locked. Generating new.");
                const lock = new Lock(true);
                Storage.getStorage().write(this.key, lock);
                res(lock);
                return;
            }

            let resolve = () => {
                console.log("Storage event received");
                console.log("Lock is", this.isLocked());
                if (!this.isLocked()) {
                    console.log("Removing event");
                    window.removeEventListener("storage", resolve);
                    console.log("unblocking");
                    res();
                }
            };

            window.addEventListener("storage", resolve);

        });
    }

    public unlock() {
        Storage.getStorage().write(this.key, new Lock(false));
    }

    private isLocked() {
        console.log("Checking if", this.key, "is locked");
        const lock = Storage.getStorage().read(this.key);
        console.log(lock);
        if (lock) {
            console.log("Lock exists");
            if (lock.timeout(this.ttl)) {
                console.log("Lock is expired");
                return false;
            }
            console.log("Lock is ", lock.locked);
            return lock.locked;
        }
        console.log("Lock doesn't exist");
        return false;
    }
}
