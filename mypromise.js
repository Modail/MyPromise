/**
 * 1. new Promise时，需要传递一个 executor 执行器，执行器立刻执行
 * 2. executor 接受两个参数，分别是 resolve 和 reject
 * 3. promise 只能从 pending 到 rejected, 或者从 pending 到 fulfilled
 * 4. promise 的状态一旦确认，就不会再改变
 * 5. promise 都有 then 方法，then 接收两个参数，分别是 promise 成功的回调 onFulfilled,
 *      和 promise 失败的回调 onRejected
 * 6. 如果调用 then 时，promise已经成功，则执行 onFulfilled，并将promise的值作为参数传递进去。
 *      如果promise已经失败，那么执行 onRejected, 并将 promise 失败的原因作为参数传递进去。
 *      如果promise的状态是pending，需要将onFulfilled和onRejected函数存放起来，等待状态确定后，再依次将对应的函数执行(发布订阅)
 * 7. then 的参数 onFulfilled 和 onRejected 可以缺省
 * 8. promise 可以then多次，promise 的then 方法返回一个 promise
 * 9. 如果 then 返回的是一个结果，那么就会把这个结果作为参数，传递给下一个then的成功的回调(onFulfilled)
 * 10. 如果 then 中抛出了异常，那么就会把这个异常作为参数，传递给下一个then的失败的回调(onRejected)
 * 11.如果 then 返回的是一个promise,那么需要等这个promise，那么会等这个promise执行完，promise如果成功，
 *   就走下一个then的成功，如果失败，就走下一个then的失败
 */
const Status = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};
class Mypromise {
  constructor(excutor) {
    {
      if (typeof excutor !== "function") {
        throw new TypeError(`Promise resolve is {$excutor} not a function`);
      } //验证用户的输入
      this.initValue();
      try {
        excutor(this.resolve, this.reject);
      } catch (e) {
        //出错走失败逻辑
        this.reject(e);
      }
    }
  }
  //下面的函数通过箭头函数绑定this
  initValue = () => {
    this.value = null; //结果
    this.reason = null; //拒因
    this.status = Status.PENDING; //当前状态
    this.onFulfilledCallback = []; //存放成功的回调的队列
    this.onRejectCallback = []; //存放失败的回调的队列
  };
  resolve = (value) => {
    if (this.status === Status.PENDING) {
      this.status = Status.FULFILLED;
      this.value = value;
      // 成功时调用成功队列里的回调
      this.onFulfilledCallback.forEach((fn) => fn());
    }
  }; //resolve状态改变，获得结果
  reject = (reason) => {
    if (this.status === Status.PENDING) {
      this.status = Status.REJECTED;
      this.reason = reason;
      // 失败时调用失败队列里的回调
      this.onRejectCallback.forEach((fn) => fn());
    }
  }; //reject状态改变，获得抛出的错误
  then = (onFulfilled, onRejected) => {
    //对输入的参数进行验证
    if (typeof onFulfilled !== "function") {
      onFulfilled = function (value) {
        return value;
      };
    }
    if (typeof onRejected !== "function") {
      onFulfilled = function (reason) {
        throw reason;
      };
    }
    //为了达到链式调用，new一个promise实例并返回
    let NextPromise = new Mypromise((resolve, reject) => {
      if (this.status === Status.FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(NextPromise, x, resolve, reject); //resolvePromise是处理then返回值的函数
          } catch (e) {
            reject(e);
          }
        }, 0);
      }
      if (this.status === Status.REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(NextPromise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }
      //状态为pending时回调不能直接调用，要将回调函数放到回调队列中
      if (this.status === Status.PENDING) {
        this.onFulfilledCallback.push(() =>
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(NextPromise, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0)
        );
        this.onRejectCallback.push(() =>
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(NextPromise, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0)
        );
      }
    });
    return NextPromise;
  };
  //根据promise的解析规范
  resolvePromise = (NextPromise, x, resolve, reject) => {
    if (NextPromise === x) {
      throw new TypeError("Promise Cycle");
    }
    if (x && (typeof x === "object" || typeof x === "function")) {
      let used; //只能使用一次
      try {
        let then = x.then;
        if (typeof then === "function") {
          then.call(
            x,
            (y) => {
              if (used) {
                return;
              }
              used = true;
              this.resolvePromise(NextPromise, y, resolve, reject);
            },
            (r) => {
              if (used) {
                return;
              }
              used = true;
              reject(r);
            }
          );
        } else {
          if (used) {
            return;
          }
          used = true;
          resolve(x);
        }
      } catch (e) {
        if (used) {
          return;
        }
        used = true;
        reject(x);
      }
    } else {
      resolve(x);
    }
  };
}

/* 
Promise.resolve(value) 返回一个以给定值解析后的Promise 对象.
1.如果 value 是个 thenable 对象，返回的promise会“跟随”这个thenable的对象，采用它的最终状态
2.如果传入的value本身就是promise对象，那么Promise.resolve将不做任何修改、原封不动地返回这个promise对象。
3.其他情况，直接返回以该值为成功状态的promise对象。*/
Mypromise.resolve = (param) => {
  if (param instanceof Promise0) {
    return param;
  }
  return new Promise((resolve, reject) => {
    if (param && param.then && typeof param.then === "function") {
      setTimeout(() => (param.then = then(resolve, reject)), 0);
    } else {
      resolve(param);
    }
  });
};
/*
Promise.reject方法和Promise.resolve不同，Promise.reject()方法的参数，会原封不动地作为reject的理由，变成后续方法的参数。
*/
Mypromise.reject = (reason) => {
  return new Promise((resolve, reject) => reject(reason));
};

//catch方法,向then中传入失败的回调,是特殊的then方法，catch之后，可以继续 .then
Mypromise.prototype.catch = (onRejected) => {
  return this.then(null, onRejected);
};
//finally方法不管前面的状态是resolved还是rejected(不接受参数)，都会执行finally操作，finally实际上是then的特例
Mypromise.prototype.finally = (onFinished) => {
  return this.then((val) => {
    onFinished(); //finally执行的操作
    return val;
  }).catch((err) => {
    onFinished(); //finally执行的操作
    return err;
  });
};
/*
Promise.all(promises) 返回一个promise对象
1.如果传入的参数是一个空的可迭代对象，那么此promise对象回调完成(resolve),只有此情况，是同步执行的，其它都是异步返回的。
2.如果传入的参数不包含任何 promise，则返回一个异步完成.
3.promises 中所有的promise都promise都“完成”时或参数中不包含 promise 时回调完成。
4.如果参数中有一个promise失败，那么Promise.all返回的promise对象失败
5.在任何情况下，Promise.all 返回的 promise 的完成状态的结果都是一个数组
*/
Mypromise.prototype.all = (promises) => {
  return new Mypromise((resolve, reject) => {
    let fulfilled = [];
    let count = 0;
    if (promises.length === 0) {
      resolve(fulfilled);
    } else {
      function processValue(i, data) {
        fulfilled[i] = data;
        //全部fulfilled
        if (++count === promises.length) {
          resolve(result);
        }
        for (let i = 0; i < promises.length; ++i) {
          //promises中不一定全是promise对象，所以用resolve方法
          Mypromise.resolve(Promise[i]).then(
            (data) => {
              processValue(i, data);
            },
            (e) => {
              reject(e);
              return;
            }
          );
        }
      }
    }
  });
};
/*Promise.race函数返回一个 Promise，它将与第一个传递的 promise 相同的完成方式被完成。
它可以是完成（ resolves），也可以是失败（rejects），这要取决于第一个完成的方式是两个中的哪个。
如果传的参数数组是空，则返回的 promise 将永远等待。
如果迭代包含一个或多个非承诺值和/或已解决/拒绝的承诺，则 Promise.race 将解析为迭代中找到的第一个值。
*/
Mypromise.prototype.race = (promises) => {
  if (promsie.length) {
    return;
  } else {
    for (let i = 0; i < promises.length; ++i) {
      Mypromise.resolve(promises[i]).then(
        (data) => {
          resolve(data);
          return;
        },
        (err) => {
          reject(err);
          return;
        }
      );
    }
  }
};
