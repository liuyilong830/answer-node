const connection = require('./db/index');
const baseURL = 'http://localhost:5000';
const toString = Object.prototype.toString;
const timeReg = /(time|birthday)$/i;
const numReg = /^(is)|(id|num|count|sex)$/i;
const urlReg = /(icon|avatar)$/i;

const toType = function (target) {
  let str = toString.call(target);
  return str.slice(8, str.length-1);
}

const identityInfo = function (info) {
  if (toType(info) !== 'Object') {
    return console.warn('请传入一个对象形式的信息');
  }
  let { uid , rid, phone } = info;
  return {
    uid,
    rid,
    phone,
  }
}

const queryFunc = function (sql = '', ...args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, data) => {
      if (error) reject(error);
      resolve(data);
    })
  })
}

const tokenFailure = function(flag, ctx) {
  if (!flag) {
    resBody(ctx, {
      status: 401,
      message: '登录状态已过期，请重新登录',
    })
  }
  return flag;
}

const format = function(obj, filter = [], deletes = []) {
  let type = toType(obj);
  if (type === 'Null' || type === 'Undefined' || type === 'Number' || type === 'Boolean') return obj;
  if (type === 'Date') return obj.getTime();
  if (type === 'Object') {
    let keys = Object.keys(obj);
    keys.forEach(key => {
      if (filter.includes(key)) return;
      let val = obj[key];
      if (timeReg.test(key)) {
        let t = toType(val);
        obj[key] = t === 'Date' ? val.getTime() : t === 'String' ? new Date(val).getTime() : val;
      } else if (numReg.test(key)) {
        obj[key] = /\./.test(val) ? parseFloat(val) : parseInt(val);
      } else if (urlReg.test(key)) {
        val = val.trim();
        if (/^http/.test(val)) {
          obj[key] = val;
        } else {
          while (/^\/.*!/.test(val)) {
            val = val.slice(1);
          }
          obj[key] = baseURL + '/img/' + val;
        }
      }
    })
    deletes.forEach(key => {
      delete obj[key];
    })
  }
  return obj;
}

const responseFormat = function(obj, filter = [], deletes = []) {
  let type = toType(obj);
  if (type === 'Array') {
    return obj.map(item => responseFormat(item, filter, deletes));
  } else {
    return format(obj, filter, ['password', ...deletes]);
  }
}

const resBody = function(ctx, {status = 200, message = '', data = {}, ...res}) {
  ctx.response.type = 'json';
  let obj = {};
  obj.status = status;
  obj.message = message;
  obj.data = data;
  return ctx.response.body = {
    ...obj,
    ...res
  }
}

const jointoStr = function(obj, options = ['=', ',']) {
  let str = '';
  Object.keys(obj).forEach(key => {
    let type = toType(obj[key]);
    let val = obj[key];
    if (timeReg.test(key)) {
      val = (
        type === 'Date' ? `"${obj[key].toLocaleDateString()}"` :
        (type === 'String' || type === 'Number') ? `"${new Date(obj[key]).toLocaleDateString()}"` : ''
      );
    } else if (type === 'String') {
      val = `"${obj[key]}"`;
    }
    let temp = key + options[0] + val;
    str += temp + options[1];
  })
  return str.slice(0, str.length-1);
}

const isdef = function (target) {
  return typeof target === 'undefined' || target === null;
}

module.exports = {
  secret: 'pterlon',
  queryFunc,
  tokenFailure,
  format,
  responseFormat,
  resBody,
  jointoStr,
  identityInfo,
  isdef,
}