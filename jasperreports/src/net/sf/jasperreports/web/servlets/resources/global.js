// remove $ varible from global context
jQuery.noConflict();

/**
 * Define 'global' module  in JasperReports namespace
 */
(function(global) {
	if (typeof global.JasperReports !== 'undefined') {
		return;
	}
	
	var jr = {
			modules: {
				global: {
					scripts: {},
					APPLICATION_CONTEXT_PATH: '',
					JQUERY: {
						CORE: '/jquery/js/jquery-1.6.4.min.js',
						UI: '/jquery/js/jquery-ui-1.8.16.custom.min.js'
					},
					events: {
						SORT_INIT: {
							name: 'sort_init',
							status: 'default'
						},
						HEADERTOOLBAR_INIT: {
							name: 'headertoolbar_init',
							status: 'default'
						}
					},
					eventSubscribers: {},
					isFirstAjaxRequest: true,
					reportContainerSelector: 'div.jrPage:first',		// FIXMEJIVE jrPage hardcoded in JRXHtmlExporter.java
					undoRedoCounters: {
						undos: 0,
						redos: 0
					}
				}
			}
		},
		jg = jr.modules.global;
	
	jg.createImage = function (imageSrc) {
		var result = new Image();
		result.src = imageSrc;
		return result;
	}
	
	/**
	 * Enhances dest with properties of source
	 * 
	 * @param dest
	 * @param src
	 */
	jg.merge = function (dest, arrSource) {
		var i, j, ln, source;
		dest = dest || {};
		
		for (i = 0, ln = arrSource.length; i < ln; i++) {
			source = arrSource[i];
			for (j in source) {
				if (source.hasOwnProperty(j)) {
						dest[j] = source[j];
				}
			}
		}
		return dest;
	};
	
	jg.extractCallbackFunction = function (callbackFn) {
		var result = callbackFn;
		if (typeof callbackFn === 'string') {
			var tokens = callbackFn.split('.');
			result = global;
			for (var i = 0, ln = tokens.length; i < ln; i++) {
				if (result[tokens[i]]) {
					result = result[tokens[i]];
				} else throw new Error('Invalid callback function: ' + callbackFn + '; token: ' + tokens[i]);
			}
		}
		return result;
	};
	
	/** 
	 * Dynamically loads a js script 
	 */
	jg.loadScript = function (scriptName, scriptUrl, callbackFn) {
		var gotCallback = callbackFn || false;
		
		// prevent the script tag from being created more than once 
		if (!jg.scripts[scriptName]) {
			var scriptElement = document.createElement('script');
			
			scriptElement.setAttribute('type', 'text/javascript');
			
			if (scriptElement.readyState){ // for IE
				scriptElement.onreadystatechange = function (){
					if (scriptElement.readyState === 'loaded' || scriptElement.readyState === 'complete'){
						scriptElement.onreadystatechange = null;
						if (gotCallback) {
							jg.extractCallbackFunction(callbackFn)();
						}
					}
				};
			} else { // for Others - this is not supposed to work on Safari 2
				scriptElement.onload = function (){
					if (gotCallback) {
						jg.extractCallbackFunction(callbackFn)();
					}
				};
			}
			
			scriptElement.src = scriptUrl;
			document.getElementsByTagName('head')[0].appendChild(scriptElement);
			jg.scripts[scriptName] = scriptUrl;
		} else if (gotCallback) {
			try {
				jg.extractCallbackFunction(callbackFn)();
			} catch(ex) {} //swallow this FIXMEJIVE
		}
	};
	
	/**
	 * NOT USED YET: Dynamically loads jQuery core and ui and then uses jQuery stuff
	 */
	jg.init = function () {
		if (typeof jQuery === 'undefined') {
			jg.appendScriptElementToDOM('_jqueryCoreScript', jg.JQUERY.CORE, function () {
				jg.appendScriptElementToDOM('_jqueryUiScript', jg.JQUERY.UI, function () {
					jg.doJqueryStuff();
				});
			});
		}
	};
	
	jg.appendScriptElementToDOM = function (scriptname, scripturi, callbackFn, isAbsoluteUrl) {
		if (!isAbsoluteUrl) {
			scripturi = jg.APPLICATION_CONTEXT_PATH + scripturi;
		}
		jg.loadScript(scriptname, scripturi, callbackFn);
	};
	
	jg.getEventByName = function (eventName) {
		var events = jg.events,
			prop,
			event;
		for(prop in events) {
			if (events.hasOwnProperty(prop)) {
				event = events[prop];
				if ('object' === typeof event && event.hasOwnProperty('name') && event['name'] === eventName) {
					return event;
				}
			}
		}
	};
	
	jg.subscribeToEvent = function (eventName, strCallbackFn, arrCallbackArgs) {
		var event = jg.getEventByName(eventName);
		if (event.status === 'default') { 
			if (!jg.eventSubscribers[eventName]) {
				jg.eventSubscribers[eventName] = [];
			}
			var arrEvent = jg.eventSubscribers[eventName];
			arrEvent.push({
				callbackfn: strCallbackFn,
				callbackargs: arrCallbackArgs
			});
		} else if (event.status === 'finished') { 
			// The event has finished so we are safe to execute the callback
			jg.extractCallbackFunction(strCallbackFn).apply(null, arrCallbackArgs);
		}
	};
	
	jg.processEvent = function (eventName) {
		var subscribers = jg.eventSubscribers[eventName];
		if (subscribers) {
			for (var i = 0; i < subscribers.length; i++) {
				var subscriber = subscribers[i];
				jg.extractCallbackFunction(subscriber.callbackfn).apply(null, subscriber.callbackargs);
			}
			// clear subscribers
			jg.eventSubscribers[eventName] = undefined;
		}
	}
	
	jg.isEmpty = function(element) {
		if (element == null || element == undefined || element == '') {
			return true;
		}
		return false;
	};
	
	jg.getUrlBase = function (url) {
		if (url.indexOf("?") != -1) {
			return url.substring(0, url.indexOf("?"));
		} else {
			return url;
		}
	};
	
	jg.getUrlParameters = function (url) {
		var result = {};
		if(!jg.isEmpty(url)) {
			var keyValArray = url.slice(url.indexOf("?") + 1).split("&"),
				keyVal,
				ln = keyValArray.length;
			
			for (var i=0; i< ln; i++) {
				keyVal = keyValArray[i].split("=");
				result[keyVal[0]] = keyVal[1];
			}
		}
		return result;
	};
		
	jg.getUrlParameter = function (url, paramName) {
		if(!jg.isEmpty(url)) {
			var keyValArray = url.slice(url.indexOf("?") + 1).split("&");
			var keyVal;
			for (var i=0; i< keyValArray.length; i++) {
				keyVal = keyValArray[i].split("=");
				if (paramName == keyVal[0]) {
					return keyVal[1];
				}
			}
		}
		return null;
	};

	// @Object
	jg.RegularExecutionContext = function (requestUrl, requestParams) {
		// enforce new
		if (!(this instanceof jg.RegularExecutionContext)) {
			return new jg.RegularExecutionContext(requestUrl, requestParams);
		}
		this.requestUrl = requestUrl;
		this.requestParams = requestParams;
	};

	jg.RegularExecutionContext.prototype.run = function() {
		global.location = jg.extendUrl(this.requestUrl, this.requestParams);
	};
	
	/**
	 * Isolates jQuery dependent functions
	 */
	jg.doJqueryStuff = function () {
		// Remove jQuery '$' alias from global namespace 
		jQuery.noConflict();
		
		jg.ajaxLoad = function (url, elementToAppendTo, elementToExtract, requestParams, callback, arrCallbackArgs, loadMaskTarget) {
			jQuery.ajax(url, 
					{
						data: requestParams,
						
						success: function(data, textStatus, jqXHR) {
							var response = jQuery(jqXHR.responseText);
							if (elementToAppendTo) {
								var toExtract = response;

								if (elementToExtract) {
									toExtract = jQuery(elementToExtract, response);
								}
								
								elementToAppendTo.html(toExtract);
								
								// execute script tags from response after appending to DOM because the script may rely on new DOM elements
								response.filter('script').each(function(idx, elem) {
									var scriptObj = jQuery(elem);
									if (!scriptObj.attr('src')) { // FIXMEJIVE only scripts that don't load files are run
										var scriptString = scriptObj.html();
										if (scriptString) {
							    			global.eval(scriptString);
							    		}
									}
								});
							}
							
							if (callback) {
								if (arrCallbackArgs) {
									callback.apply(null, arrCallbackArgs);
								} else {
									callback(jqXHR.responseText);
								}
							}
							
							loadMaskTarget.loadmask('hide');
						},
						
						error: function(jqXHR, textStatus, errorThrown) {
							loadMaskTarget.loadmask('hide');
							alert('Error: ' + textStatus + ': ' + errorThrown);
						}
					}
			);
		};
		
		// @Object
		jg.AjaxExecutionContext = function(contextId, requestUrl, target, requestParams, elementToExtract, callback, arrCallbackArgs, isJSON) {
			// enforce new
			if (!(this instanceof jg.AjaxExecutionContext)) {
				return new jg.AjaxExecutionContext(contextId, requestUrl, target, requestParams, elementToExtract, callback, arrCallbackArgs, isJSON);
			}
			this.contextId = contextId;
			this.requestUrl = requestUrl;
			this.target = target;
			this.requestParams = requestParams;
			this.elementToExtract = elementToExtract;
			this.callback = callback;
			this.arrCallbackArgs = arrCallbackArgs;
			this.isJSON = isJSON;
		};
		
		jg.AjaxExecutionContext.prototype = {
			getContextId : function() {
				return this.contextId;
			},
			
			run : function() {
				var parent = jQuery(this.target).closest('div.executionContext'),
					isajax = true;
				
				if (jg.isFirstAjaxRequest) {
					isajax = false; 
				}
				
				if (parent.size() == 0) {
					parent = jQuery(this.target).closest('div.jiveContext');
				}
				
				if (parent.size() == 0) {
					parent = this.target;
				}
				
				parent.loadmask();
				
				// FIXME: must know if this is an ajax request, to prevent some resources from reloading
				if (this.requestParams != null) {
					if ('object' == typeof this.requestParams) {
						this.requestParams['isajax'] = isajax; // on first ajax request load all resources
					} else if('string' == typeof this.requestParams) {
						this.requestParams += '&isajax=' + isajax;
					}
				} else if (this.requestParams == null) {
					this.requestParams = {
						isajax: isajax
					};
				}
				
				jg.ajaxLoad(this.requestUrl, this.target, this.elementToExtract, this.requestParams, this.callback, this.arrCallbackArgs, parent);
			}
		};
		
		jg.logObject = function (objName, obj) {
			var objString = [],
				i=0,
				prop;
			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					objString[i] = prop + " = " + obj[prop];
					i++;
				}
			}
			console.log("object: " + objName + " = {" + objString.join(', ') + "}");
		}
		
		/**
		 * Obtains an execution context based on parameters
		 * 
		 * @param startPoint: a jQuery or DOM object
		 * @param requestedUrl: a string url
		 * @param params: an object with additional parameters that must be appended to requestedUrl 
		 */
		jg.getExecutionContext = function(startPoint, requestedUrl, params) {
			if (!requestedUrl) {
				return null;
			}
			var executionContextElement = jQuery(startPoint).closest('div.executionContext');
			
			if (executionContextElement.size() == 0) {
				executionContextElement = jQuery(startPoint).closest('div.jiveContext');
			}

			if (executionContextElement.size() > 0) {
				var contextUrl = executionContextElement.attr('data-contexturl'),
					contextId = executionContextElement.attr('id'),
					reqUrlBase = jg.getUrlBase(requestedUrl),
					reqParams = jg.getUrlParameters(decodeURIComponent(requestedUrl)),
					contextReqParams = jg.getUrlParameters(decodeURIComponent(contextUrl));
				
				// mix params with contextReqParams and reqParams in order to preserve previous params; the order matters
//				var newParams = jg.merge({}, [contextReqParams, reqParams, params]);
				var newParams = jg.merge({}, [reqParams, params]);
				
				// update context url
				executionContextElement.attr('data-contexturl', jg.extendUrl(reqUrlBase, newParams));
				
				return new jg.AjaxExecutionContext(
					contextId, 
					reqUrlBase, 
					jQuery('div.result', executionContextElement), // target 
					newParams,
					null,
					null,
					null
				);
			}
			
			return new jg.RegularExecutionContext(requestedUrl, params); 
		};
		

		jg.getToolbarExecutionContext = function(startPoint, requestedUrl, params, callback, arrCallbackArgs, isJSON) {
			var executionContextElement = jQuery(startPoint).closest('div.mainReportDiv');
			
			if (executionContextElement && executionContextElement.size() > 0) {
				return new jg.AjaxExecutionContext(
					null, 
					requestedUrl, 
					jQuery('div.result', executionContextElement).filter(':first'), // target 
					params,
					'div.result',
					callback,
					arrCallbackArgs,
					isJSON
				);
			}
		};

		jg.getContextElement = function(startPoint) {
			var executionContextElement = jQuery(startPoint).closest('div.executionContext');
			if (executionContextElement && executionContextElement.size() > 0) {
				return executionContextElement;
			} 
			return null;
		};

		jg.extendUrl = function(url, parameters) {
			var result = url;
			
			if (parameters != null) {
				if (url.indexOf('?') != -1) {
					result = url + '&' + jQuery.param(parameters);
				} else {
					result = url + '?' + jQuery.param(parameters); 
				}
			}
			
			return result;
		};
		
		jg.toolbarUtils = (function() {
			var classEnabled = 'enabledPaginationButton',
				classDisabled = 'disabledPaginationButton';
			
			return {
				getClassEnabled: function() {
					return classEnabled;
				},
				getClassDisabled: function() {
					return classDisabled;
				},
				enableElem: function(jqElem) {
					jqElem.removeClass(classDisabled);
					jqElem.addClass(classEnabled);
				},
				disableElem: function(jqElem) {
					jqElem.removeClass(classEnabled);
					jqElem.addClass(classDisabled);
				},
				enablePair: function(jqElem1, jqElem2){
					this.enableElem(jqElem1);
					this.enableElem(jqElem2);
				},
				disablePair: function(jqElem1, jqElem2){
					this.disableElem(jqElem1);
					this.disableElem(jqElem2);
				}
			};
		}());
		
		jg.updateToolbarPaginationButtons = function (jqToolbar) {
			var currentPage = jqToolbar.attr('data-currentpage'),
				totalPages = jqToolbar.attr('data-totalpages'),
				pageFirst = jQuery('.pageFirst', jqToolbar),
				pagePrevious = jQuery('.pagePrevious', jqToolbar),
				pageNext = jQuery('.pageNext', jqToolbar),
				pageLast = jQuery('.pageLast', jqToolbar),
				undo = jQuery('.undo', jqToolbar),
				redo = jQuery('.redo', jqToolbar),
				utils = jg.toolbarUtils,
				classEnabled = utils.getClassEnabled(),
				classDisabled = utils.getClassDisabled();
			
			if (typeof(totalPages) == 'undefined') {
				utils.enableElem(pageNext);
				utils.disableElem(pageLast);
			}
			else if (totalPages > 1 && currentPage < totalPages - 1) {
				utils.enablePair(pageNext, pageLast);
			} else {
				utils.disablePair(pageNext, pageLast);
			}
			
			if (currentPage == 0) {
				utils.disablePair(pageFirst, pagePrevious);
			} else {
				utils.enablePair(pageFirst, pagePrevious);
			}
			
			if (!(undo.hasClass(classEnabled) || undo.hasClass(classDisabled))) {
				utils.disableElem(undo);
			}
			if (!(redo.hasClass(classEnabled) || redo.hasClass(classDisabled))) {
				utils.disableElem(redo);
			}
		};
		
		jg.performAction = function (toolbarId) {
			var undoRedoCounters = jg.undoRedoCounters;
			
			undoRedoCounters.undos ++;
			jg.updateToolbarUndoButton(toolbarId, true); // enable undo
			
			undoRedoCounters.redos = 0;
			jg.updateToolbarRedoButton(toolbarId, false); // disable redo
		};
		
		jg.performUndo = function (toolbarId) {
			var undoRedoCounters = jg.undoRedoCounters;
			
			undoRedoCounters.redos ++;
			jg.updateToolbarRedoButton(toolbarId, true); // enable redo
			
			undoRedoCounters.undos --;
			if (undoRedoCounters.undos <= 0) {
				jg.updateToolbarUndoButton(toolbarId, false); // disable undo
				undoRedoCounters.undos = 0;
			}
		};
		
		jg.performRedo = function (toolbarId) {
			var undoRedoCounters = jg.undoRedoCounters;
			
			undoRedoCounters.undos ++;
			jg.updateToolbarUndoButton(toolbarId, true); // enable undo
			
			undoRedoCounters.redos --;
			if (undoRedoCounters.redos <= 0) {
				jg.updateToolbarRedoButton(toolbarId, false); // disable redo
				undoRedoCounters.redos = 0;
			}
		};
		
		jg.updateToolbarUndoButton = function (toolbarId, boolEnable) {
			var jqToolbar = jQuery('#' + toolbarId),
				utils = jg.toolbarUtils;
			
			if (boolEnable) {
				utils.enableElem(jQuery('.undo', jqToolbar));
			} else {
				utils.disableElem(jQuery('.undo', jqToolbar));
			}
		};

		jg.updateToolbarRedoButton = function (toolbarId, boolEnable) {
			var jqToolbar = jQuery('#' + toolbarId),
				utils = jg.toolbarUtils;
			
			if (boolEnable) {
				utils.enableElem(jQuery('.redo', jqToolbar));
			} else {	
				utils.disableElem(jQuery('.redo', jqToolbar));
			}
		};
		
		jg.setAutoRefresh = function(strRunReportParam, jqToolbar) {
			var pageTimestamp = jqToolbar.attr('data-pageTimestamp');
			if (pageTimestamp) {
				var refreshLater = function() {
					jg.refreshPage(strRunReportParam, jqToolbar, jqToolbar.attr('data-currentpage'), 'jr.pagetimestamp=' + pageTimestamp);
				};
				var timeoutId = window.setTimeout(refreshLater, 5000);//FIXME configure
				jqToolbar.attr('data-autoRefreshId', timeoutId);
			} else {
				jqToolbar.removeAttr('data-autoRefreshId');
			}
		};
		
		jg.cancelAutoRefresh = function(jqToolbar) {
			var timeoutId = jqToolbar.attr('data-autoRefreshId');
			if (timeoutId) {
				window.clearTimeout(timeoutId);
				jqToolbar.removeAttr('data-autoRefreshId');
			}
		};
		
		jg.initToolbar = function(toolbarId, strRunReportParam) {
			console.log('initToolbar');
			
			var toolbar = jQuery('#' + toolbarId);
			
			if (toolbar.size() != 1) {
				console.log('no toolbar with id: ' + toolbarId);
				return;
			}
			
			jg.updateToolbarPaginationButtons(toolbar);
			jg.setAutoRefresh(strRunReportParam, toolbar);
			
			if (toolbar.attr('data-initialized') == null) {
				toolbar.attr('data-initialized', 'true');
				
				toolbar.css({ opacity: 0.8 });

				toolbar.draggable();
				
				toolbar.bind('click', function(event) {
					var target = jQuery(event.target);
					if (target.is('.enabledPaginationButton')) {
						var parent = jQuery(this),
							currentPage = parseInt(parent.attr('data-currentpage')),
							totalPages = parseInt(parent.attr('data-totalpages')),
							requestedPage,
							ctx;
						
						// cancel the auto refresh of the current page
						jg.cancelAutoRefresh(parent);
						
						if (target.is('.pageFirst')) {
							requestedPage = 0;
						} else if (target.is('.pagePrevious')) {
							requestedPage = currentPage - 1;
						} else if (target.is('.pageNext')) {
							requestedPage = currentPage+1;
						} else if (target.is('.pageLast')) {
							requestedPage = totalPages -1;
						}
						
						if (requestedPage != null) {
							jg.refreshPage(strRunReportParam, parent, requestedPage);
						}
						
						if (target.is('.undo')) {		// FIXMEJIVE: place this in headertoolbar.js
							var actionData = {actionName: 'undo'},
								undoActionLink = jQuery('.headerToolbarMask:first').attr('data-resizeAction'),
								ctx = jg.getToolbarExecutionContext(jQuery('div.columnHeader:first'), 
																	undoActionLink, 'jr.action=' + jg.toJsonString(actionData), 
																	jg.performUndo, 
                	    											[parent.attr('id')], 
																	true);
	                        
							if (ctx) {
	                            ctx.run();
	                        }
							
						} else if (target.is('.redo')) {		// FIXMEJIVE: place this in headertoolbar.js
							var actionData = {actionName: 'redo'},
							undoActionLink = jQuery('.headerToolbarMask:first').attr('data-resizeAction'),
							ctx = jg.getToolbarExecutionContext(jQuery('div.columnHeader:first'), 
																undoActionLink, 
																'jr.action=' + jg.toJsonString(actionData), 
																jg.performRedo, 
																[parent.attr('id')], 
																true);
							
	                        if (ctx) {
	                            ctx.run();
	                        }
						}
					}
				});
			}
		};
		
		jg.refreshPage = function(strRunReportParam, toolbar, requestedPage, requestParams) {
			var currentHref = toolbar.attr('data-url');
			var params = (strRunReportParam != null ? strRunReportParam + '&' : '') + 'jr.page=' + requestedPage;
			if (requestParams) {
				params += '&' + requestParams;
			}

			var callback = function(response) {
				// if the total pages is not already available, see if the response has it
				var totalPages;
				var pageTimestamp;
				if (typeof(toolbar.attr('data-totalpages')) == 'undefined') {
					// doing simple response text parsing for now
					var totalPagesAttr = /data-totalpages='(\d+)'/.exec(response);
					if (totalPagesAttr && totalPagesAttr.length > 1) {
						totalPages = totalPagesAttr[1];
					}
						
					// if the report is not finished, check the page timestamp
					var pageTimestampAttr = /data-pagetimestamp='(\d+)'/.exec(response);
					if (pageTimestampAttr && pageTimestampAttr.length > 1) {
						pageTimestamp = pageTimestampAttr[1];
					}
				}
							
				jg.updateCurrentPageForToolbar(toolbar, requestedPage, totalPages, pageTimestamp);
				jg.updateToolbarPaginationButtons(toolbar);
				jg.setAutoRefresh(strRunReportParam, toolbar);
			};
			
			jg.getToolbarExecutionContext(toolbar, currentHref, params, callback, null, null).run();
		}

		jg.updateCurrentPageForToolbar = function(jQueryToolbar, newCurrentPage, newTotalPages, pageTimestamp) {
			jQueryToolbar.attr('data-currentpage', newCurrentPage);
			if (typeof(newTotalPages) != 'undefined') {
				jQueryToolbar.attr('data-totalpages', newTotalPages);
			}
			
			if (pageTimestamp) {
				jQueryToolbar.attr('data-pagetimestamp', pageTimestamp);
			} else {
				jQueryToolbar.removeAttr('data-pagetimestamp');
			}
		};
		
		jg.escapeString = function(str) {
    		return encodeURIComponent(str.replace(/(\n)|(\r)|(\t)|(\b)/g, '').replace(/\"/g, '\\\"'));
    	};
		
		jg.toJsonString = function(object) {
    		var o2s = Object.prototype.toString.call(object),
    			result = '';
    		
    		switch (o2s) {
				case '[object Array]':
					result += "[";
					for (var i = 0, ln = object.length; i < ln; i++) {
						result += jg.toJsonString(object[i]);
						if (i < ln -1) {
							result += ",";
						}
					}
					result += "]";
					break;

				case '[object Object]':
					result += "{";
					for (var property in object) {
		    			if (object.hasOwnProperty(property) && object[property] != null) {
							result += "\"" + property + "\":" + jg.toJsonString(object[property]) + ",";
		    			}
					}
					if (result.indexOf(",") != -1) {
		    			result = result.substring(0, result.lastIndexOf(","));
		    		}
					result += "}";
					break;

				case '[object Function]':
					result += "\"" + escapeString(object.toString()) + "\"";
					break;

				case '[object String]':
					result += "\"" + jg.escapeString(object) + "\"";
					break;

				case '[object Null]':
					result = null;
					break;

				default:
					result += object;
					break;
			}
    		return result;
    	};
		
		/**
		 * A jQuery plugin that displays an overlapping image for a specified element 
		 * (based on element's id)
		 */
		jQuery.fn.loadmask = function(options) {
			return this.each(function(){
				var id = this.id + '_maskDiv',
				jQid = '#' + id;
				if('string' == typeof options) {
					switch (options) {
					case 'hide':
						jQuery(jQid).hide();
						break;
					case 'remove':
						jQuery(jQid).remove();
						break;
					}
				} else {
					var gm = JasperReports.modules.global,
					settings = {
							bgimage : gm.APPLICATION_CONTEXT_PATH + '/jasperreports/images/loadmask.png',
							loadinggif: gm.APPLICATION_CONTEXT_PATH + '/jasperreports/images/loading4.gif',
							opacity: 0.3
					};
					
					if (options) {
						jQuery.extend(settings, options);
					}
					
					// if the mask element does not exist, create it
					if (jQuery(jQid).size() == 0) {
						jQuery(this).parent().append("<div id='" + id + "'></div>")
					}
					
					jQuery(jQid).show().css({
						position : 				'absolute',
						backgroundImage : 		"url('" + settings.bgimage + "')",
						opacity : 				settings.opacity,
						width : 				jQuery(this).css('width'),
						height : 				jQuery(this).css('height'),
						top : 					jQuery(this).position().top,
						left : 					jQuery(this).position().left,
						'border-top-width' : 	jQuery(this).css('borderTopWidth'),
						'border-top-style' : 	jQuery(this).css('borderTopStyle'),
						borderBottomWidth : 	jQuery(this).css('borderBottomWidth'),
						borderBottomStyle : 	jQuery(this).css('borderBottomStyle'),
						borderLeftWidth : 		jQuery(this).css('borderLeftWidth'),
						borderLeftStyle : 		jQuery(this).css('borderLeftStyle'),
						borderRightWidth : 		jQuery(this).css('borderRightWidth'),
						borderRightStyle : 		jQuery(this).css('borderRightStyle'),
						'z-index' : 			999999,
						cursor:					'wait'
					});
				}
				
			});
		};
	};
	
	jg.doJqueryStuff();

	global.JasperReports = jr;
	
} (this));

