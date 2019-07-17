/**!
 * 前端工具类
 *
 * Copyright(c) Alibaba Group Holding Limited.
 *
 */

var $ =  require('jquery');

var Utils={
  getViewData:function(){
    var val = $('#viewDataIpt').val();
    val = val && JSON.parse(val);
    return val;
  }
}

module.exports = Utils;