export function getId() {
    const rand = Math.random() * 1000000000 | 0;
    return new Date().getTime() + ":" + rand;
}
