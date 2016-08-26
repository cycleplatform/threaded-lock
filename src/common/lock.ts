import * as moment from "moment";

export default class Lock {
    locked: boolean;
    time: string;
    constructor(locked: boolean) {
        this.locked = locked;
        this.time = new Date().toISOString();
    }

    public timeout(ttl: number) {
        return moment(this.time).diff(moment()) > ttl;
    }
}
