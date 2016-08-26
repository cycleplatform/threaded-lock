export default class Lock {
    locked: boolean;
    time: Date;
    constructor(locked: boolean) {
        this.locked = locked;
        this.time = new Date();
    }

    public timeout(ttl: number) {
        const curTime = new Date();
        return Math.abs(this.time.getTime() - curTime.getTime()) >= ttl;
    }
}
