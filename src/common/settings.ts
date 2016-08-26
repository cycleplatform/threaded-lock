import { setStorage, LockStorage } from "./storage";

export default class Settings {
    public set lockStorage(s: LockStorage) {
        setStorage(s);
    }
}
