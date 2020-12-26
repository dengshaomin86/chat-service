// 一些基本配置项

// 默认头像
const avatarDefault = "/static/avatar/default.jpeg";

// 公共房间名称
const roomNameDefault = "publicRoom";

// 获取好友请求状态值对应文本
const getFriendStatusText = (friendStatus) => {
  let map = new Map();
  map.set("0", "未添加");
  map.set("1", "已添加");
  map.set("2", "待对方确认");
  map.set("3", "待您确认");
  map.set("4", "已拒绝");
  return map.get(friendStatus);
};

module.exports = {
  avatarDefault,
  roomNameDefault,
  getFriendStatusText,
};
