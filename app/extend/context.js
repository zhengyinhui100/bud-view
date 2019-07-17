'use strict';

const ContextView = require('../../lib/context_view');
const VIEW = Symbol.for('Context#view');
const DEF_RENDER_CTX = Symbol.for('Context#defRenderCtx');
const BUD_VIEW_DATA = Symbol.for('Context#budViewData');

module.exports = {
  /**
   * Render a file, then set to body, the parameter is same as {@link @ContextView#render}
   * @return {Promise} result
   */
  render(...args) {
    return this.renderView(...args).then(body => {
      this.body = body;
    });
  },

  /**
   * Render a file, same as {@link @ContextView#render}
   * @return {Promise} result
   */
  renderView(...args) {
    return this.view.render(...args);
  },

  /**
   * Render template string, same as {@link @ContextView#renderString}
   * @return {Promise} result
   */
  renderString(...args) {
    return this.view.renderString(...args);
  },

  /**
   * View instance that is created every request
   * @member {ContextView} Context#view
   */
  get view() {
    if (!this[VIEW]) {
      this[VIEW] = new ContextView(this);
    }
    return this[VIEW];
  },

  setDefRenderCtx(data,isCover){
    if(this[DEF_RENDER_CTX]===undefined || isCover){
      this[DEF_RENDER_CTX]=data;
    }else{
      Object.assign(this[DEF_RENDER_CTX],data);
    }
  },

  getDefRenderCtx(){
		return this[DEF_RENDER_CTX];
	},

	setViewData(data,isCover){
		if(this[BUD_VIEW_DATA]===undefined || isCover){
			this[BUD_VIEW_DATA]=data;
		}else{
			Object.assign(this[BUD_VIEW_DATA],data);
		}
	},

	getViewData(){
		return this[BUD_VIEW_DATA];
	}
}


