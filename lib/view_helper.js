'use strict';

const path = require('path');

module.exports = function(app) {
  // 仅用于 View, 避免污染 Helper
  class ViewHelper extends app.Helper {
    constructor(ctx, viewEngine) {
      super(ctx);
      const config = ctx.app.config.budView;
      let assetsMap = config.assets;
      // 兼容不需要前端构建的项目
      if( !assetsMap ){
        try{
          assetsMap = require(path.resolve('./config/webpack-assets.json'));
        }catch (e) {
          assetsMap = {};
        }
      }
      //let replace = config.assetsReplace || ['//img.ucdl.pp.uc.cn/upload_files/open_platform/public','/public'];
      //if(0&&replace){
      //  if(typeof replace!='string'){
      //    replace=replace.join('|');
      //  }
      //  const urls=ctx.app.config.urls;
      //  let staticRoot;
      //  let buildInfo=config.buildInfo || require(path.resolve('./config/build.info.json'));
      //  if(buildInfo.cdn){
      //    staticRoot=urls.staticCdnRoot;
      //  }else{
      //    staticRoot=urls.staticRoot;
      //  }
      //  console.log(replace)
      //  assetsMap=JSON.parse(JSON.stringify(assetsMap).replace(new RegExp(replace,'g'),staticRoot));
      //}
      this.viewEngine = viewEngine;
      this.assetsMap = assetsMap;
      const jsArr = assetsMap[''] && assetsMap[''].js;
      const js = jsArr && jsArr[ jsArr.length - 1 ]
      if( js && js.indexOf('vendor') >= 0 ){
        this.vendorJs = js;
      }
      const cssArr = assetsMap[''] && assetsMap[''].css;
      const css = cssArr && cssArr[ cssArr.length - 1 ]
      if( css && css.indexOf('vendor') >= 0 ){
        this.vendorCss = css;
      }
      this.assets={
        css:[],
        js:[]
      };
    }

    // 防止 shtml sjs surl 处理过的字符串再被 escape，就不需要 `safe(sjs(foo))`
    shtml(str) {
      return this.safe(super.shtml(str));
    }

    surl(str) {
      return this.safe(super.surl(str));
    }

    sjs(str) {
      return this.safe(super.sjs(str));
    }

    getAssetsUrl(name,type){
      const assetsMap=this.assetsMap;
      // 绝对路径
      if( name.startsWith( '/' ) ){
        return name;
      }
      // 模块名称
      return assetsMap[name] && assetsMap[name][type];
    }

    assetsCss(name,group){
      const url=this.getAssetsUrl(name,'css');
      if(!url){
        //console.warn('assetsCss:"'+name+'" is not found!');
        return;
      }
      group=group||'default';
      let cssArr=this.assets.css[group];
      if(!cssArr){
        cssArr=this.assets.css[group]=[];
      }
      if(!cssArr.includes(url)){
        cssArr.push(url);
      }
    }

    cssTag(group,name){
      if(name!==undefined){
        this.assetsCss(name,group);
      }
      group = group || 'default';
      let cssArr=this.assets.css[group];
      if( group === 'default' ){
        if( this.vendorCss ){
          cssArr.unshift( this.vendorCss );
        }
      }
      if(cssArr){
        let tags=[];
        for(let url of cssArr){
          tags.push('<link rel="stylesheet" href="'+url+'">');
        }
        return tags.join('');
      }
      return '';
    }

    assetsJs(name,group){
      const url=this.getAssetsUrl(name,'js');
      if(!url){
        //console.warn('assetsJs:"'+name+'" is not found!');
        return;
      }
      group=group||'default';
      let jsArr=this.assets.js[group];
      if(!jsArr){
        jsArr=this.assets.js[group]=[];
      }
      if(!jsArr.includes(url)){
        jsArr.push(url);
      }
    }

    jsTag(group,name){
      if(name!==undefined){
        this.assetsJs(name,group);
      }
      group=group||'default';
      let jsArr=this.assets.js[group];
      if( group === 'default' ){
        if( this.vendorJs ){
          jsArr.unshift( this.vendorJs );
        }
      }
      if(jsArr){
        let tags=[];
        for(let url of jsArr){
          tags.push('<script type="text/javascript" src="'+url+'"></script>');
        }
        return tags.join('');
      }
      return '';
    }

    // 包含view
    view(name,data,assetsType){
      if(assetsType === undefined && typeof data ==='string'){
        assetsType=data;
        data=undefined;
      }
      let content = this.viewEngine.renderSync(name,data,assetsType,true);
      return content;
    }

    // 包含控制器
    ctr(name,data,assetsType){
      if(assetsType === undefined && typeof data ==='string'){
        assetsType=data;
        data=undefined;
      }
      let content = this.viewEngine.renderSync(name,data,assetsType,true);
      return content;
    }

    // 包含整个请求
    req(name,data,assetsType){
      if(assetsType === undefined && typeof data ==='string'){
        assetsType=data;
        data=undefined;
      }
      let content = this.viewEngine.renderSync(name,data,assetsType,true);
      return content;
    }

    viewData(data){
      let ctx=this.ctx || this;
      let budViewData=ctx.budViewData=ctx.budViewData||{};
      ctx.budViewData=Object.assign(budViewData,data);
    }

    stringify(data){
      let content = JSON.stringify(data);
      return content;
    }

  }

  return ViewHelper;
};
