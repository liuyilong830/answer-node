const { queryFunc } = require('../../utils');

const questions = {
  deleteQuestionByClassid(classid) {
    let sql = `delete from ques_cls where cid = ?`;
    return queryFunc(sql, classid);
  }
}

module.exports = questions;