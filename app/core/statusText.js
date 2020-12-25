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
  getFriendStatusText
};
