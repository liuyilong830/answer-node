const { queryFunc } = require('../../utils')

const comments = {
  getQuesCommentList(qid, start = 0, limit = 10) {
    let sql = `
      select *
      from comments c inner join user u on c.usid = u.uid
      where questionid = ? and c.fromid is null and c.targetid is null limit ${start}, ${limit}
    `;
    return queryFunc(sql, qid);
  },
  getAllReplyComments(cid, start, limit) {
    let sql = `
      select *
      from comments c inner join user u on c.usid = u.uid
      where c.fromid = ?
      order by c.createtime asc limit ${start}, ${limit}
    `;
    return queryFunc(sql, cid);
  },
}

module.exports = comments;
