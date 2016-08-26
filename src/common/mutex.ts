import * as Storage from "./storage";
import Lock from "./lock";

export default class Mutex {
    constructor (private key: string, private ttl: number) {}

    public lock() {
        return new Promise<Lock>((res) => {
            let lock = Storage.getStorage().read(this.key);
            if (!lock || lock.timeout(this.ttl)) {
                Storage.getStorage().write(this.key, new Lock(true));
                res(lock);
                return;
            }

            let interval = setInterval(() => {
                lock = Storage.getStorage().read(this.key);
                if (!lock || lock.timeout(this.ttl)) {
                    Storage.getStorage().write(this.key, new Lock(true));
                    clearInterval(interval);
                    res();
                    return;
                }
            });
        });
    }

    public unlock() {
        Storage.getStorage().clear(this.key);
    }
}
