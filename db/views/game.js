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
      order by status asc limit ${start}, ${limit}
    `;
    return queryFunc(sql, uid);
  },
  queryAllGames(start = 0, limit = 10) {
    let sql = `select * from rank_game limit ${start}, ${limit}`
    return queryFunc(sql);
  },
  queryAppointmentOtherGames(uid, start = 0, limit = 10) {
    let sql = `
      select * 
      from rank_game
      where rankid not in (
        select c.rankid
        from challenge_record c inner join rank_game r on c.rankid = r.rankid
        where c.chuserid = ?
      )
      order by starttime asc limit ${start}, ${limit}
    `;
    return queryFunc(sql, uid);
  },
  updateGameAppointment(rankid, num = 0) {
    let sql = `
      update rank_game set reservation_num = reservation_num + ${num}
      where rankid = ?
    `;
    return queryFunc(sql, rankid);
  },
  insertChallengeRecord(rankid, uid) {
    let sql = `
      insert into challenge_record(rankid, chuserid)
      values(${rankid}, ${uid})
    `;
    return queryFunc(sql);
  },
  deleteChallengeRecord(rankid, uid) {
    let sql = `
      delete from challenge_record where rankid = ${rankid} and chuserid = ${uid}
    `;
    return queryFunc(sql);
  },
  queryDoingGames(uid) {
    let sql = `
      select * 
      from rank_game r inner join challenge_record c on r.rankid = c.rankid
      where c.chuserid = ? and c.status = 1
    `;
    return queryFunc(sql, uid);
  },
  updateChallengeRecord(uid, challengeid, info) {
    let str = '';
    let keyStr = ['finishtime', 'json']
    let keyint = ['time', 'finishtime', 'json', 'status'];
    let keyinsert = ['res_count', 'fail_count', 'prompt_count', 'score'];
    let keys = Object.keys(info);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (keyStr.includes(key)) {
        str += `${key}='${info[key]}'`;
      } else if (keyint.includes(key)) {
        str += `${key}=${info[key]}`;
      } else if (keyinsert.includes(key)) {
        str += `${key}+=${info[key]}`;
      }
    }
    console.log(str);
    let sql = `
      update challenge_record set ${str}
      where challengeid = ${challengeid} and chuserid = ${uid}
    `;
    return queryFunc(sql);
  },
}

module.exports = game;
