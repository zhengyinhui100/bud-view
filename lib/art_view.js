/**
 * 基于 art 的 egg View 实现
 *
 * Copyright(c) Alibaba Group Holding Limited.
 *
 * Author: xiaoge
 */

'use strict';

/**
 * Module dependencies.
 */

const helper = require('./view_helper');
const HelperClass = Symbol.for('ArtView#HelperClass');
const Helper = Symbol.for('ArtView#Helper');
const path = require('path');
const fs = require('fs');
const art = require('art-template');
const DEF_RENDER_CTX = Symbol.for('Context#defRenderCtx');
const BUD_VIEW_DATA = Symbol.for('Context#budViewData');
const BUD_RENDER_DATA = Symbol.for('Context#budRenderData');


const _ = require('underscore');
// use 'config' function to change art-template default settings
// art.config('extname', '.art');  // change default file-extention
// art.config('cache', false);     // change to not cache template, default true


// 扩展art模板语法，内置脚步、注释
art.defaults.rules.unshift({
  test: /{{!\s?([\w\W]*?)}}/,
  use: function(match, code) {
    return {
      code: code,
      output: false
    }
  }
});

// budCont(用于layout里输出view内容)不编码输出
art.defaults.rules.unshift({
  test: /{{budCont}}/,
  use: function(match, code) {
    return {
      code: 'budCont',
      output: 'raw'
    }
  }
});

// 辅助tag函数不编码输出
art.defaults.rules.unshift({
  test: /{{(helper\.(cssTag|jsTag|view|ctr)\([\w\W]*?)}}/,
  use: function(match, code) {
    return {
      code: code,
      output: 'raw'
    }
  }
});

class ARTView {
  constructor(ctx) {
    this.ctx = ctx;
    this.app = ctx.app;
    const config = ctx.app.config.budView;
    this.root = config.root;
    // PS:这里egg框架不知道哪里会把root改写成数组形式
    if(typeof this.root === 'object'){
      this.root = this.root[0];
    }

    if(config.projectName){
      this.viewProjName = config.projectName;
    }else{
      let projName=ctx.app.name||'';
      //@ali/bud-project => bud-project
      this.viewProjName =projName.replace(/^[^\/]+\//,'');
    }

    // set cache default to false
    if (config.cache === true) {
      art.defaults.cache = true;
    } else {
      art.defaults.cache = false;
    }

    // set debug default to false
    if (config.debug === true) {
      art.defaults.debug = true;
    } else {
      art.defaults.debug = false;
    }


    art.defaults.extname = config.extname||'.art';
    art.defaults.escape = config.escape||true;
  }

  getContext(data){
    let ctx = this.ctx;
    let renderCtx = ctx[DEF_RENDER_CTX];
    let defCtx={
      urls:ctx.app.config.urls,
      ctx: ctx,
      request: ctx.request,
      helper: this.helper
    };
    let result=Object.assign({},defCtx,ctx.locals,renderCtx,data);;
    return result;
  }

  getRenderContext(data){
    let renderCtx=this.getContext(data);
    return renderCtx;
  }

  getLayoutRenderContext(pageName){
    //默认会把config里的urls内置
    let layoutData=this.getContext(this.ctx.layoutData);
    layoutData.pageName=pageName;
    //设置传递给前端的参数
    if(this.ctx[BUD_VIEW_DATA]){
      let viewDataStr=JSON.stringify(this.ctx[BUD_VIEW_DATA]);
      viewDataStr= _.escape(viewDataStr);
      layoutData.viewDataIpt='<input id="viewDataIpt" name="hhhh" value="'+viewDataStr+'" type="hidden"/>';
    }
    return layoutData;
  }

  mixClsData(data,name){
    const viewProjName=this.viewProjName;
    //将模块名中的下划线转化成中划线
    const vName=name.replace(/_/g,'-');
    let clsData={
      projectName : viewProjName,
      modName:name,
      viewName:vName,
      viewClass : viewProjName+'-view '+viewProjName+'-view-'+vName
    };
    return Object.assign(data, clsData);
  }

  resolve(name){
    let path;
    //模块名
    if(/^[^\/]+$/.test(name)){
      viewpath= path.join(this.root, name+'/view');
    }else if(/^[^\/]+$/.test(name)){
      // 相对路径
      //文件路径，module/name
    }else if(0){
      // 绝对路径
    }else{

    }
    path = path.join(this.root, name);
    //viewName转换成module-name
    name = name.replace(/\//g,'-');
    return name;
  }

  renderSync(name, data , assetsType,fromHelper) {
    this.ctx.addTiming && this.ctx.addTiming('bud-view',name);
    if(assetsType!='noAssets'){
      if(assetsType!='noCss'){
        this.helper.assetsCss(name);
      }
      if(assetsType!='noJs'){
        this.helper.assetsJs(name);
      }
    }
    let viewpath;

    //模块名
    if(/^[^\/]+$/.test(name)){
      viewpath= path.join(this.root, name+'/view');
    }else{
      //文件路径，module/name
      viewpath= path.join(this.root, name);
      //viewName转换成module-name
      name=name.replace(/\//g,'-');
    }
    let renderData;
    //如果渲染数据有定义，则使用传入的数据，否则，使用父模块的数据
    if(data !== undefined || !this[BUD_RENDER_DATA]){
      renderData=this[BUD_RENDER_DATA]=this.getRenderContext(data);
    }else{
      renderData=this[BUD_RENDER_DATA];
    }
    this.mixClsData(renderData,name);

    // console.log(2226666,viewpath)
    // let ttttt=fs.readFileSync(viewpath+'.art').toString();
    // console.log(ttttt)
    // console.log(art.compile(ttttt).toString())
    //渲染模块
    let content = art(viewpath, renderData);
    if(fromHelper){
      this.ctx.addTiming && this.ctx.addTiming('bud-view',name);
      return content;
    }else{
      let html;
      let layoutRenderCtx=this.getLayoutRenderContext(name);
      layoutRenderCtx.budCont = content;
      let noLayout=this.ctx.layout===null;
      let layout = noLayout?name:(this.ctx.layout || 'layout');
      this.mixClsData(layoutRenderCtx,layout);
      if(!noLayout){
        const layoutPath=path.join(this.root, layout+'/view');
        // ttttt=fs.readFileSync(layoutPath+'.art').toString();
        // console.log(ttttt)
        // console.log(art.compile(ttttt).toString())
        //渲染layout
        html = art(layoutPath, layoutRenderCtx);
      }else{
        html=content;
      }
      if(layoutRenderCtx.viewDataIpt){
        html = html.replace(/<body[^>]*>/,function(match){
          return match+layoutRenderCtx.viewDataIpt
        });
      }
      this.ctx.addTiming && this.ctx.addTiming('bud-view',name);
      return html;
    }
  }

  render(name, locals) {
    return this.renderSync(name, locals);
  }


  renderString(tpl, locals) {
    let renderData=this.getRenderContext(locals);
    return art.render(tpl ,renderData);
  }

  get helper() {
    if(!this[Helper]){
      if (!this[HelperClass]) {
        this[HelperClass] = helper(this.ctx.app);
      }
      this[Helper] = new this[HelperClass](this.ctx, this);
    }
    return this[Helper];
  }
}

module.exports = ARTView;
