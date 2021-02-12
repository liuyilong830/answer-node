const { queryFunc, jointoStr, isdef } = require('../../utils');

const game = {
  queryDanList() {
    let sql = 'select * from dan_rank';
    return queryFunc(sql);
  },
  queryUserAboutRank(uid) {
    let sql = `
      select uid, nickname, avatar, level, all_integral, curr_integral, rankcount
      from user where uid = ?
    `;
    return queryFunc(sql, uid);
  },
  queryRankList(start = 0, limit = 10) {
    let sql = `
      select * from user
      where curr_integral != 0
      order by curr_integral desc, rankcount asc limit ${start}, ${limit}
    `;
    return queryFunc(sql);
  },
  queryRankListAll() {
    let sql = `
      select * from user
      where curr_integral != 0
      order by curr_integral desc, rankcount asc
    `;
    return queryFunc(sql);
  },
  queryAppointmentGame(uid, start = 0, limit = 10) {
    let sql = `
      select * 
      from rank_game r inner join challenge_record c on r.rankid = c.rankid
      where c.chuserid = ?
      order by status desc limit ${start}, ${limit}
    `;
    return queryFunc(sql, uid);
  }
}

module.exports = game;
