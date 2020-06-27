'use strict';

const Service = require('egg').Service;

async function createRelationship(ctx, data) {
  let contactList = await ctx.model.Contact.find({
    username: data.username
  });

  let friendObj = {
    username: data.friendName,
    userId: data.friendId
  };

  if (contactList.length) {
    let dataObj = contactList[0];
    if (dataObj.list.find(item => item.username === data.friendName)) {
      return new Promise((resolve, reject) => {
        reject("已经是好友了");
      });
    }

    // 不是好友则新增一条
    dataObj.list.push(friendObj);
    return await ctx.model.Contact.updateOne({
      username: data.username
    }, dataObj);
  }

  // 没有当前用户的记录则新增一条
  let obj = {
    username: data.username,
    userId: data.userId,
    list: [friendObj]
  };
  return await ctx.model.Contact.create(obj);
}

class ContactService extends Service {
  // 新增联系人
  async add() {
    const { ctx } = this;
    const params = ctx.query;

    // 给双方增加关系数据
    return await createRelationship(ctx, {
      username: ctx.session.username,
      userId: ctx.session.userId,
      friendName: params.username,
      friendId: params.userId,
    }).then(await createRelationship(ctx, {
      username: params.username,
      userId: params.userId,
      friendName: ctx.session.username,
      friendId: ctx.session.userId,
    }));
  }
}
module.exports = ContactService;
