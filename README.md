# threaded-lock

A Promise based locking system that works between tabs (across multiple threads).

## The Problem
In certain situations you may need to share information between different tabs. 
If you're reading and writing to storage, it's important to make sure that the information being read 
is thread safe.

## The Solution
Local Storage is shared between tabs. By creating a threaded lock object of the same name in multiple tabs,
they first check to see if a lock has been claimed. If not, a tab claims it, then double checks to make sure
it still owns it. If a lock is already claimed, it checks to see if it's expired. If not it blocks it until 
either the lock expires or it is released.

## Usage

```
import ThreadedLock from "threaded-lock";

async function doStuff() {
    // First, create a new lock
    const tl = new ThreadedLock("cool-lock");

    await tl.lock();

    // Do some thread safe stuff in any tab
    writeCookie();
    waitOnAPICall();

    // Unlock so other tabs can continue.
    tl.unlock();
}
```

In another tab 

```
import ThreadedLock from "threaded-lock";

async function doOtherStuff() {
    // First, create a new lock
    const tl = new ThreadedLock("cool-lock");

    await tl.lock();

    readUpdatedCookie();

    // Unlock so other tabs can continue.
    tl.unlock();
}
```