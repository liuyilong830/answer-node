const { queryFunc } = require('../../utils');

/**
 * 该文件的作用是书写跟登录相关的操作
 */
const login = {
  isExistPhone(phone) {
    let sql = `select * from user where phone=?`;
    return queryFunc(sql, phone);
  },
  toLogin(phone, password) {
    let sql = `
      select *
      from user s
      where phone=? and password=?;
    `
    return queryFunc(sql, phone, password);
  },
  toRegister(info) {
    let sql = `
      insert into user(nickname, sname, sex, birthday, phone, password, rid)
      values (?,?,?,?,?,?,?);
    `
    let {nickname, sname, sex, birthday, phone, password, rid } = info;
    rid = parseInt(rid);
    sex = parseInt(sex);
    return queryFunc(sql, nickname, sname, sex, birthday, phone, password, rid);
  },
}

module.exports = login;