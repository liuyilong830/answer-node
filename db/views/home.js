const { queryFunc } = require('../../utils');

/**
 * 该文件的作用是书写跟首页相关的操作数据库的操作
 */
const home = {
  questionsList(limit = 10, start = 0) {
    let sql = `
      SELECT q.qid, q.qname, q.description, q.icon, q.mode, q.createtime, q.workcount, q.score, q.zancount, u.nickname, u.avatar, u.sname, u.sex, u.uid
      FROM questions q inner join user u on q.uid = u.uid
      where ishidden != 1 and istoclass != 1 limit ${start}, ${limit}
    `;
    return queryFunc(sql);
  },
}

module.exports = home;