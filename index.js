class Subscriber {
  constructor(destination, subscription) {
    this.closed = false;
    this.destination = destination;
    this.subscription = subscription;

    this.subscription.add(() => this.closed = true);
  }

  next(value) {
    if (!this.closed) {
      this.destination.next(value);
    }
  }

  error(err) {
    if (!this.closed) {
      this.destination.error(err);
      this.subscription.unsubscribe();
    }
  }

  complete() {
    if (!this.closed) {
      this.destination.complete();
      this.subscription.unsubscribe();
    }
  }
}

class Subscription {
  constructor() {
    this.teardowns = [];
  }

  add(teardown) {
    this.teardowns.push(teardown);
  }

  unsubscribe() {
    this.teardowns.forEach((teardown) => {
      teardown();
    })

    this.teardowns = [];
  }
}

class Observable {
  constructor(init) {
    this.init = init;
  }

  subscribe(observer) {
    const subscription = new Subscription();
    const subscriber = new Subscriber(observer, subscription);

    subscription.add(this.init(subscriber));

    return subscription;
  }

  lett(fn) {
    return fn(this);
  }

  pipe(...fns) {
    return fns.reduce((curr, fn) => {
      return fn(curr);
    }, this);
  }

}

const map = (fn) => {
  return (source) => {
    return new Observable(s => {
      const subs = source.subscribe({
        next(value) {
          s.next(fn(value));
        },
        error(err) {
          s.error(err);
        },
        complete() {
          s.complete();
        }
      });

      return () => {
        subs.unsubscribe();
      }
    })
  }
}

const myObservable = new Observable((observer) => {
  let i = 0;

  const id = setInterval(() => {
    observer.next(i++);

    if (i > 3) {
      observer.complete();
      observer.next(98989999999);
    }
  }, 1000);

  return () => {
    console.log('tearing down');
    clearInterval(id);
  }
});

const teardown = myObservable.pipe(
  map(x => x + 100),
  map(x => x + '111')
).subscribe({
  next(val) {
    console.log(val);
  },
  error(err) {
    console.log(err);
  },
  complete() {
    console.log('done');
  }
});

setTimeout(() => {
  teardown.unsubscribe();
}, 5200);
