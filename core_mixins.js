(function(){
'use strict';

if (window.require) {
    require('./core');
}

angular.module('fireh_angular_table')

    .factory('FhTableDefinitionMixin', function() {
        return function(scope, attrs, alternateAttrField) {
            if (attrs.fhpTable) {
                scope.fhtable = scope[attrs.fhpTable];
            } else if (attrs[alternateAttrField]) {
                scope.fhtable = scope[attrs[alternateAttrField]];
            }
        };
    })


    .factory('FhSelectedItemsMixin', function() {
        // keep this mixin passive, don't trigger unnecessary events, it's
        // being used by widgets to keep copies of selectedItems

        return function(scope, options, cleanupList) {
            var fhtable = scope.fhtable;

            var _config = _.merge(
                {
                    multipleSelection: true
                },
                options || {});

            scope.data.selectedItems = [];

            var result = {eventCleanupCallbacks: []};

            fhtable.on('itemSelected', function(event, item, options) {
                var id = _.pick(item, fhtable.items.identifierFields);
                var index = _.findIndex(scope.data.selectedItems, id);
                if (index !== -1) {
                    scope.data.selectedItems[index] = item;
                } else {
                    if (!_config.multipleSelection &&
                            scope.data.selectedItems.length) {

                        fhtable.trigger('itemDeselected',
                                scope.data.selectedItems[0], options);
                    }
                    scope.data.selectedItems.push(item);
                }

            }, result.eventCleanupCallbacks);

            fhtable.on('itemDeselected', function(event, item, options) {
                var id = _.pick(item, fhtable.items.identifierFields);
                _.remove(scope.data.selectedItems, id);

            }, result.eventCleanupCallbacks);

            fhtable.on('itemDeleted', function(event, item, options) {
                var id = _.pick(item, fhtable.items.identifierFields);
                _.remove(scope.data.selectedItems, id);

            }, result.eventCleanupCallbacks);

            fhtable.on('itemDataUpdated', function(event, newItem, oldItem,
                    options) {

                var id = _.pick(oldItem, fhtable.items.identifierFields);
                var index = _.findIndex(scope.data.selectedItems, id);
                if (index !== -1) {
                    scope.data.selectedItems[index] = newItem;
                }

            }, result.eventCleanupCallbacks);

            if (cleanupList) {
                _.forEach(result.eventCleanupCallbacks, function(fn) {
                    cleanupList.push(fn);
                });
            }

            return result;
        };
    })


    .factory('FhTableListResourceControllerMixin', function() {
        return function(scope, options, cleanupList) {
            var fhtable = scope.fhtable;
            var initialFetchItems = true;

            var _config = _.merge({}, options || {});

            scope.data.items = [];
            scope.data.total = 0;

            scope.dataParams = {
                filterBy: fhtable.filterBy,
                orderBy: fhtable.orderBy,
                page: fhtable.items.page,
                pageSize: fhtable.items.pageSize
            };

            scope.isLoading = 0;

            var result = {eventCleanupCallbacks: []};

            fhtable.on('ajaxRequestStarted', function incrIsLoading() {
                scope.isLoading += 1;

            }, result.eventCleanupCallbacks);

            fhtable.on('ajaxRequestFinished', function decrIsLoading() {
                if (scope.isLoading > 0) {
                    scope.isLoading -= 1;
                }

            }, result.eventCleanupCallbacks);

            fhtable.on('fetchItems', function fetchItems(event, options) {
                // initializing table and widgets, delay all item fetches until
                // we are ready
                if (initialFetchItems) {
                    if (options.initialFetchItems) {
                        initialFetchItems = false;
                    } else {
                        return;
                    }
                }

                var payload = _.cloneDeep(scope.dataParams);

                if (options.page === 'next') {
                    payload.page += 1;
                } else if (options.page === 'prev') {
                    if (payload.page <= 1) {
                        console.log('ERROR: paging to a page before the first');
                        return;
                    } else {
                        payload.page -= 1;
                    }
                } else if (_.isNumber(options.page)) {
                    payload.page = parseInt(options.page);
                }

                fhtable.trigger('ajaxRequestStarted');

                var resourceGetter = fhtable.items.getter(
                        fhtable.createQueryPayload(payload), fhtable);

                if (resourceGetter.$promise) {
                    resourceGetter = resourceGetter.$promise;
                }
                resourceGetter.then(
                    function (response) {
                        fhtable.trigger('ajaxRequestFinished');

                        if (options.flush) {
                            scope.data.items = [];
                        }
                        if (options.page) {
                            scope.dataParams.page = payload.page;
                        }
                        Array.prototype.push.apply(scope.data.items,
                                response.data.items);

                        fhtable.trigger('itemsUpdated', scope.data.items);

                        fhtable.trigger('itemsTotalUpdated',
                                response.data.total, scope.data.items.length);

                        // update all local cache
                        _.forEach(response.data.items, function(item) {
                            fhtable.trigger('itemDataUpdated', item, item, {});
                        });
                    },
                    function (response) {
                        fhtable.trigger('ajaxRequestFinished');

                        fhtable.trigger('itemsUpdateFailed', response.status,
                                response.data, scope.data.items);
                    }
                );

            }, result.eventCleanupCallbacks);

            fhtable.on('itemsTotalUpdated', function itemsTotalUpdated(event,
                    totalItems) {

                scope.data.total = totalItems;

            }, result.eventCleanupCallbacks);

            fhtable.on('resetItems', function resetItems() {
                fhtable.trigger('fetchItems', {flush: true, page: 1});

            }, result.eventCleanupCallbacks);

            fhtable.on('addMultipleValuesFilter', function(event, filterName,
                    filterValue) {

                var filters = scope.dataParams.filterBy;
                var filter = filters[filterName];

                function updateFilter(value) {
                    // save value into $scope.dataParams
                    filters[filterName] = value;
                    fhtable.trigger('filterUpdated', filterName, value);
                    fhtable.trigger('resetItems');
                }

                if (filter) {
                    var filterId = fhtable.getFilterId(filterName,
                            filterValue);

                    var index = _.findIndex(filter, filterId);
                    if (index === -1) {
                        filter.push(filterValue);
                        filter = _.uniq(_.sortBy(filter));
                        updateFilter(filter);
                    }
                } else {
                    updateFilter([filterValue]);
                }

            }, result.eventCleanupCallbacks);

            fhtable.on('removeMultipleValuesFilter', function(event, filterName,
                    filterValue) {

                var filters = scope.dataParams.filterBy;
                var filter = filters[filterName];

                if (filter) {
                    var items = _.remove(filter, filterValue);
                    if (items.length) {
                        fhtable.trigger('filterUpdated', filterName, filter);
                        fhtable.trigger('resetItems');
                    }
                }

            }, result.eventCleanupCallbacks);

            fhtable.on('setSingleValueFilter', function(event, filterName,
                    filterValue) {

                scope.dataParams.filterBy[filterName]  = filterValue;
                fhtable.trigger('filterUpdated', filterName, filterValue);
                fhtable.trigger('resetItems');

            }, result.eventCleanupCallbacks);

            fhtable.on('setOrder', function(event, sortingName, sortingValue) {
                var list = scope.dataParams.orderBy;
                var priority = _.findIndex(
                    list,
                    function(item) {
                        return item[0] === sortingName;
                    }) + 1;

                if (priority) {
                    if (sortingValue) {
                        var changed = false;
                        var sorting = list[priority - 1];

                        if (sortingValue.direction &&
                                sortingValue.direction !== sorting[1]) {

                            sorting[1] = sortingValue.direction;
                            changed = true;
                        }
                        if (sortingValue.priority &&
                                sortingValue.priority !== priority) {

                            list.splice(priority -1, 1);
                            priority = sortingValue.priority;
                            list.splice(priority - 1, 0, sorting);
                            changed = true;
                        }
                        if (changed) {
                            fhtable.trigger(
                                'orderUpdated',
                                sortingName,
                                {
                                    direction: sorting[1],
                                    priority: priority
                                });
                        } else {
                            return;
                        }
                    } else {
                        list.splice(priority -1, 1);
                        fhtable.trigger('orderUpdated', sortingName, null);
                    }
                } else if (sortingValue) {
                    var direction = sortingValue.direction || 'asc';
                    list.push([sortingName, direction]);
                    priority = sortingValue.priority || list.length;
                    fhtable.trigger(
                        'orderUpdated',
                        sortingName,
                        {
                            direction: direction,
                            priority: priority
                        });
                } else {
                    return;
                }

                // trigger orderUpdated to update other sortings
                _.forOwn(list, function(value, key) {
                    if (value[0] !== sortingName) {
                        fhtable.trigger(
                            'orderUpdated',
                            value[0],
                            {
                                direction: value[1],
                                priority: parseInt(key) + 1
                            });
                    }
                });

                fhtable.trigger('resetItems');

            }, result.eventCleanupCallbacks);

            fhtable.on('setPageOffset', function(event, pageOffset) {
                scope.dataParams.page = pageOffset;
                fhtable.trigger('pageOffsetUpdated', pageOffset);
                fhtable.trigger('fetchItems', {flush: true, page: pageOffset});

            }, result.eventCleanupCallbacks);

            fhtable.on('setPageSize', function(event, pageSize) {
                scope.dataParams.pageSize = pageSize;
                fhtable.trigger('pageSizeUpdated', pageSize);
                fhtable.trigger('resetItems');

            }, result.eventCleanupCallbacks);

            fhtable.on('selectItem', function(event, itemId, options) {
                var item = _.find(scope.data.items, itemId);
                if (item) {
                    fhtable.trigger('itemSelected', item, options);
                }

            }, result.eventCleanupCallbacks);

            fhtable.on('deselectItem', function(event, itemId, options) {
                var item = _.find(scope.data.items, itemId);
                if (item) {
                    fhtable.trigger('itemDeselected', item, options);
                }

            }, result.eventCleanupCallbacks);

            fhtable.on('selectAllItems', function(event, options) {
                _.forEach(scope.data.items, function(item) {
                    fhtable.trigger('itemSelected', item, options);
                });
            });

            fhtable.on('deselectAllItems', function(event, options) {
                _.forEach(scope.data.items, function(item) {
                    fhtable.trigger('itemDeselected', item, options);
                });

            }, result.eventCleanupCallbacks);

            fhtable.on('itemAdded', function(event, newItem, oldItem, options) {
                var id = _.pick(newItem, fhtable.items.identifierFields);
                var index = _.findIndex(scope.data.items, id);
                if (index !== -1) {
                    scope.data.items[index] = newItem;
                } else {
                    scope.data.items.push(newItem);

                    var total = scope.data.total + 1;
                    fhtable.trigger('itemsTotalUpdated', total, total);
                }

            }, result.eventCleanupCallbacks);

            fhtable.on('itemDeleted', function(event, item, options) {
                var id = _.pick(item, fhtable.items.identifierFields);
                var items = _.remove(scope.data.items, id);
                if (items.length) {
                    var total = scope.data.total - items.length;
                    if (total < 0) { total = 0; }
                    fhtable.trigger('itemsTotalUpdated', total, total);
                }

            }, result.eventCleanupCallbacks);

            fhtable.on('itemDataUpdated', function(event, newItem, oldItem,
                    options) {

                var id = _.pick(oldItem, fhtable.items.identifierFields);
                var index = _.findIndex(scope.data.items, id);
                if (index !== -1) {
                    scope.data.items[index] = newItem;
                }

            }, result.eventCleanupCallbacks);

            if (cleanupList) {
                _.forEach(result.eventCleanupCallbacks, function(fn) {
                    cleanupList.push(fn);
                });
            }

            return result;
        };
    })


    .factory('FhTranscludeChildElementsMixin', function() {
        /* Sub-directives inside directive with transclude will be initialized
         * twice, something we do not wish to happen. So we need pseudo
         * directive, an attribute (data-fh-transcluded) that parent directive
         * will checked for real sub-directive name which is its value.
         *
         * The real sub-directive name will be added later by this mixin as
         * attribute to the html element with attribute `data-fh-transcluded`.
         *
         * The temporary attribute (data-fh-transcluded) will be removed.
         */
        return function(element, clone) {
            var transcluded_pane_attrname = 'data-fh-transclude-pane';
            var transcluded_directive_attrname = 'data-fh-transcluded';
            var transcluded_directive_value_attrname =
                    'data-fh-transcluded-value';

            //// data-fh-transclude-pane

            var elpanes = {};
            _.forEach(clone, function(elcl) {
                if (elcl.hasAttribute && elcl.hasAttribute(
                        transcluded_pane_attrname)) {

                    var name = elcl.getAttribute(transcluded_pane_attrname);
                    elpanes[name] = elcl;
                }
            });
            if (!elpanes) {
                elpanes.content = clone;
            }

            _.forEach(element[0].querySelectorAll('[' +
                    transcluded_pane_attrname +']'), function(elpane) {

                var $el = angular.element(elpane);
                var pane_name = $el.attr(transcluded_pane_attrname);
                if (pane_name && elpanes[pane_name]) {
                    $el.replaceWith(elpanes[pane_name]);
                } else {
                    $el.remove();
                }
            });

            //// data-fh-transcluded

            _.forEach(element[0].querySelectorAll('[' +
                    transcluded_directive_attrname + ']'), function(eltr) {

                var $el = angular.element(eltr);
                $el.attr(
                    $el.attr(transcluded_directive_attrname),
                    $el.attr(transcluded_directive_value_attrname) || '');

                $el.removeAttr(transcluded_directive_attrname);
            });
        };
    })


    .factory('FhCustomEventHandlersMixin', function() {
        return function(eventHandlers, attrs, fhtable) {
            _.forEach(eventHandlers, function(callback, eventName) {
                var callbackArray = _.castArray(callback);
                var attrName = 'fhe' + _.capitalize(eventName);
                if (attrs[attrName] && scope[attrs[attrName]]) {
                    callbackArray.push(scope[attrs[attrName]]);
                } else if (fhtable.eventHandlers[eventName]) {
                    callbackArray.push(fhtable.eventHandlers[eventName]);
                }
                eventHandlers[eventName] = callbackArray;
            });
        };
    })


    .factory('FhMiddlewaresMixin', function() {
        return function(eventHandlers, attrs, fhtable, reversed) {
            var middlewares, forLoop;
            if (attrs.fhpMiddlewares) {
                middlewares = _.transform(
                    attrs.fhpMiddlewares.split(','),
                    function(result, value) { result.push(value.trim()); },
                    []);
            } else {
                middlewares = fhtable.middlewares;
            }
            if (reversed) {
                forLoop = _.forEachRight;
            } else {
                forLoop = _.forEach;
            }

            forLoop(eventHandlers, function(callback, eventName) {
                var callbackArray = _.castArray(callback);

                _.forEach(middlewares, function(middlewareName) {
                    var middleware = fhtable.services[middlewareName];
                    if (!middleware || !middleware.getEventHandlers) { return; }
                    var mEventHandlers = middleware.getEventHandlers();
                    if (!mEventHandlers[eventName]) { return; }
                    callbackArray.push(mEventHandlers[eventName]);
                });

                eventHandlers[eventName] = callbackArray;
            });
        };
    })


    .factory('FhEventHandlersMixin', function() {
        return function(eventHandlers, options, cleanupList) {
            var scope = options.scope;
            if (options.fhtable === void(0)) {
                options.fhtable = scope.fhtable;
            }
            var fhtable = options.fhtable;

            var result = {eventCleanupCallbacks: []};

            _.forEach(eventHandlers, function(callback, eventName) {
                var callbackArray = _.castArray(callback);
                var lastCallback;
                _.forEach(callbackArray, function(callback) {
                    var callbackOptions = _.clone(options);
                    callbackOptions.nextCallback = lastCallback;
                    lastCallback = callback.bind(callbackOptions);
                });
                fhtable.on(eventName, lastCallback,
                        result.eventCleanupCallbacks);
            });

            if (cleanupList) {
                _.forEach(result.eventCleanupCallbacks, function(fn) {
                    cleanupList.push(fn);
                });
            }

            return result;
        };
    })


    .factory('FhFormIdMixin', function() {
        return function(scope, attrs, item, create, name) {
            function generateFormId(name) {
                if (!_.isEmpty(item)) {
                    // dynamic form-id based on identifier-fields
                    var id = scope.fhtable.identifierAsString(
                        item,
                        {
                            keyValueSeparator: '',
                            keysSeparator: '-',
                        });
                    return name + id;
                } else {
                    // this will create totally random form-id which is
                    // impossible to cache (for example, in SessionStorage)
                    //
                    // last resort of a unique id for throw away forms
                    return _.uniqueId(name);
                }
            }

            if (attrs.fhpFormId) {
                scope.formId = attrs.fhpFormId;
            } else if (attrs.fhpFormName) {
                scope.formId = generateFormId(attrs.fhpFormName);
            } else if (create) {
                scope.formId = generateFormId(name || 'fh-form-');
            }

            return scope.formId;
        };
    })


    .factory('FhElementIdMixin', function() {
        return function(attrs, name) {
            if (attrs.fhpElementId) {
                return attrs.fhpElementId;
            }
            return _.uniqueId(attrs.fhpElementName || name || 'fh-widget-');
        };
    })
;
}());
