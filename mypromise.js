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
        excutor(this.resolve.this.reject);
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
      this.onFulfilledCallback.forEach((fn) => fn(this.value));
    }
  }; //resolve状态改变，获得结果
  reject = (reason) => {
    if (this.status === Status.PENDING) {
      this.status = Status.REJECTED;
      this.reason = reason;
      // 失败时调用失败队列里的回调
      this.onRejectCallback.forEach((fn) => fn(this.reason));
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
            resolve(x);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }
      if (this.status === Status.REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolve(x);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }
      //状态为pending时回调不能直接调用，要将回调h函数放到回调队列中
      if (this.status === Status.PENDING) {
        this.onFulfilledCallback.push(() =>
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolve(x);
            } catch (e) {
              reject(e);
            }
          }, 0)
        );
        this.onRejectCallback.push(() =>
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolve(x);
            } catch (e) {
              reject(e);
            }
          }, 0)
        );
      }
    });
    return NextPromise;
  };
}

//catch方法,向then中传入失败的回调
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
//all方法：传入一个promise数组，
