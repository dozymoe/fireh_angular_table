'use strict';

if (window.require) {
    require('./core');
}

angular.module('fireh_angular_table')

    .factory('FhTableDefinitionMixin', function() {
        return function(scope, attrs, alternateAttrField) {
            if (attrs.fhpParams) {
                scope.params = scope[attrs.fhpParams];
            } else if (attrs[alternateAttrField]) {
                scope.params = scope[attrs[alternateAttrField]];
            }
        }
    })


    .factory('FhSelectedItemsMixin', function() {
        return function(scope, options) {
            var params = scope.params;

            options = _.merge(
                {
                    multipleSelection: true
                },
                options || {});

            scope.data.selectedItems = [];

            params.on('itemSelected', function(event, item) {
                var id = _.pick(item, params.items.identifierFields);
                var index = _.findIndex(scope.data.selectedItems, id);
                if (index !== -1) {
                    scope.data.selectedItems[index] = item;
                } else {
                    if (!options.multipleSelection &&
                            scope.data.selectedItems.length) {

                        params.trigger('itemDeselected',
                                scope.data.selectedItems[0]);
                    }
                    scope.data.selectedItems.push(item);
                }
            });

            params.on('itemDeselected', function(event, item) {
                var id = _.pick(item, params.items.identifierFields);
                _.remove(scope.data.selectedItems, id);
            });

            params.on('itemDeleted', function(event, item) {
                var id = _.pick(item, params.items.identifierFields);
                _.remove(scope.data.selectedItems, id);
            });

            params.on('itemDataUpdated', function(event, newItem, oldItem) {
                var id = _.pick(oldItem, params.items.identifierFields);
                var index = _.findIndex(scope.data.selectedItems, id);
                if (index !== -1) {
                    scope.data.selectedItems[index] = newItem;
                }
            });
        }
    })


    .factory('FhTableListResourceControllerMixin', function() {
        return function(scope, options) {
            var params = scope.params;
            var initialFetchItems = true;

            options = _.merge({}, options || {});

            scope.data = {
                items: [],
                total: 0
            };

            scope.dataParams = {
                filterBy: params.filterBy,
                orderBy: params.orderBy,
                page: params.items.page,
                pageSize: params.items.pageSize
            };

            scope.isLoading = 0;

            params.on('ajaxRequestStarted', function incrIsLoading() {
                scope.isLoading += 1;
            });

            params.on('ajaxRequestFinished', function decrIsLoading() {
                if (scope.isLoading > 0) {
                    scope.isLoading -= 1;
                }
            });

            params.on('fetchItems', function fetchItems(event, options) {
                // initializing table and widgets, delay all item fetches until
                // we are ready
                if (initialFetchItems) {
                    if (options.initialFetchItems) {
                        initialFetchItems = false;
                    } else {
                        return;
                    }
                }

                var payload = angular.copy(scope.dataParams);

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

                params.trigger('ajaxRequestStarted');

                var resourceGetter = params.items.getter(
                        params.createQueryPayload(payload));

                if (resourceGetter.$promise) {
                    resourceGetter = resourceGetter.$promise;
                }
                resourceGetter.then(
                    function (response) {
                        params.trigger('ajaxRequestFinished');

                        if (options.flush) {
                            scope.data.items = [];
                        }
                        if (options.page) {
                            scope.dataParams.page = payload.page;
                        }
                        Array.prototype.push.apply(scope.data.items,
                                response.items);

                        var updateNotifOptions = {
                            hasNextItems: scope.data.items.length <
                                    response.total
                        };
                        params.trigger('itemsUpdated', updateNotifOptions);
                        params.trigger('itemsTotalUpdated', response.total);

                        // update all local cache
                        _.forEach(response.items, function(item) {
                            params.trigger('itemDataUpdated', item, item);
                        });
                    },
                    function (err) {
                        params.trigger('ajaxRequestFinished');
                    }
                );
            });

            params.on('itemsTotalUpdated', function itemsTotalUpdated(event,
                    totalItems) {

                scope.data.total = totalItems;
            });

            params.on('resetItems', function resetItems() {
                params.trigger('fetchItems', {flush: true, page: 1});
            });

            params.on('addMultipleValuesFilter', function(event, filterName,
                    filterValue) {

                var filters = scope.dataParams.filterBy;
                var filter = filters[filterName];

                function updateFilter(value) {
                    // save value into $scope.dataParams
                    filters[filterName] = value;
                    params.trigger('filterUpdated', filterName, value);
                    params.trigger('resetItems');
                }

                if (filter) {
                    var index = _.findIndex(filter, filterValue);
                    if (index === -1) {
                        filter.push(filterValue);
                        filter = _.uniq(_.sortBy(filter));
                        updateFilter(filter);
                    }
                } else {
                    updateFilter([filterValue])
                }
            });

            params.on('removeMultipleValuesFilter', function(event, filterName,
                    filterValue) {

                var filters = scope.dataParams.filterBy;
                var filter = filters[filterName];

                function updateFilter(value) {
                    // save value into $scope.dataParams
                    filters[filterName] = value;
                    params.trigger('filterUpdated', filterName, value);
                    params.trigger('resetItems');
                }

                if (filter) {
                    var items = _.remove(filter, filterValue);
                    if (items.length) {
                        updateFilter(filter);
                    }
                }
            });

            params.on('setSingleValueFilter', function(event, filterName,
                    filterValue) {

                scope.dataParams.filterBy[filterName]  = filterValue;
                params.trigger('filterUpdated', filterName, filterValue);
                params.trigger('resetItems');
            });

            params.on('setOrder', function(event, sortingName, sortingValue) {
                var list = scope.dataParams.orderBy;
                var priority = _.findIndex(
                    list,
                    function(item) {
                        return item[0] === sortingName
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
                            params.trigger(
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
                        params.trigger('orderUpdated', sortingName, null);
                    }
                } else if (sortingValue) {
                    var direction = sortingValue.direction || 'asc';
                    list.push([sortingName, direction]);
                    priority = sortingValue.priority || list.length;
                    params.trigger(
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
                        params.trigger(
                            'orderUpdated',
                            value[0],
                            {
                                direction: value[1],
                                priority: parseInt(key) + 1
                            });
                    }
                });

                params.trigger('resetItems');
            });

            params.on('setPageOffset', function(event, pageOffset) {
                scope.dataParams.page = pageOffset;
                params.trigger('pageOffsetUpdated', pageOffset);
                params.trigger('fetchItems', {flush: true, page: pageOffset});
            });

            params.on('setPageSize', function(event, pageSize) {
                scope.dataParams.pageSize = pageSize;
                params.trigger('pageSizeUpdated', pageSize);
                params.trigger('resetItems');
            });

            params.on('selectItem', function(event, itemId, options) {
                var item = _.find(scope.data.items, itemId);
                if (item) {
                    params.trigger('itemSelected', item, options);
                }
            });

            params.on('deselectItem', function(event, itemId, options) {
                var item = _.find(scope.data.items, itemId);
                if (item) {
                    params.trigger('itemDeselected', item, options);
                }
            });

            params.on('selectAllItems', function(event, options) {
                _.forEach(scope.data.items, function(item) {
                    params.trigger('itemSelected', item, options);
                });
            });

            params.on('deselectAllItems', function(event, options) {
                _.forEach(scope.data.items, function(item) {
                    params.trigger('itemDeselected', item, options);
                });
            });

            params.on('itemAdded', function(event, item) {
                var id = _.pick(item, params.items.identifierFields);
                var index = _.findIndex(scope.data.items, id);
                if (index !== -1) {
                    scope.data.items[index] = item;
                } else {
                    scope.data.items.push(item);
                    params.trigger('itemsTotalUpdated', scope.data.total + 1);
                }
            });

            params.on('itemDeleted', function(event, item) {
                var id = _.pick(item, params.items.identifierFields);
                var items = _.remove(scope.data.items, id);
                if (items.length) {
                    var total = scope.data.total - items.length;
                    params.trigger('itemsTotalUpdated', total < 0 ? 0 : total);
                }
            });

            params.on('itemDataUpdated', function(event, newItem, oldItem) {
                var id = _.pick(oldItem, params.items.identifierFields);
                var index = _.findIndex(scope.data.items, id);
                if (index !== -1) {
                    scope.data.items[index] = newItem;
                }
            });
        }
    })


    .factory('FhTranscludeChildDirectiveMixin', function() {
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
        return function(el, clone) {
            var transcluded_directive_attrname = 'data-fh-transcluded';
            var transcluded_pane_attrname = 'data-fh-transclude-pane';

            // buggy in jQuery2 :(
            // angular jQLite's el.find() doesn't work

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

            //el.find('.fh-table-field-select-content').append(clone);
            _.forEach(el[0].querySelectorAll('[' +
                    transcluded_pane_attrname +']'), function(elpane) {

                var $el = angular.element(elpane);
                var pane_name = $el.attr(transcluded_pane_attrname);
                if (pane_name && elpanes[pane_name]) {
                    $el.replaceWith(elpanes[pane_name]);
                } else {
                    $el.addClass('empty');
                }
            });

            //// data-fh-transcluded

            _.forEach(el[0].querySelectorAll('[' +
                    transcluded_directive_attrname + ']'), function(eltr) {

                var $el = angular.element(eltr);
                $el.attr($el.attr(transcluded_directive_attrname), '');
                $el.removeAttr(transcluded_directive_attrname);
            });
        }
    })


    .factory('FhCustomEventHandlersMixin', function() {
        return function(eventHandlers, attrs, params) {
            _.forEach(eventHandlers, function(callback, eventName) {
                var callbackArray = _.castArray(callback);
                var attrName = 'fhe' + _.capitalize(eventName);
                if (attrs[attrName] && scope[attrs[attrName]]) {
                    callbackArray.push(scope[attrs[attrName]]);
                } else if (params.eventHandlers[eventName]) {
                    callbackArray.push(params.eventHandlers[eventName]);
                }
                eventHandlers[eventName] = callbackArray;
            });
        }
    })


    .factory('FhMiddlewaresMixin', function() {
        return function(eventHandlers, attrs, params, reversed) {
            var middlewares;
            if (attrs.fheMiddlewares) {
                middlewares = _.transform(
                    attrs.fheMiddlewares.split(','),
                    function(result, value) { result.push(value.trim()) },
                    []);
            } else {
                middlewares = params.middlewares;
            }
            if (reversed) { _.reverse(middlewares) }

            _.forEach(eventHandlers, function(callback, eventName) {
                var callbackArray = _.castArray(callback);

                _.forEach(middlewares, function(middlewareName) {
                    var middleware = params.services[middlewareName];
                    if (!middleware || !middleware.getEventHandlers) { return }
                    var mEventHandlers = middleware.getEventHandlers();
                    if (!mEventHandlers[eventName]) { return }
                    callbackArray.push(mEventHandlers[eventName]);
                });

                eventHandlers[eventName] = callbackArray;
            });
        }
    })


    .factory('FhEventHandlersMixin', function() {
        return function(eventHandlers, options) {
            var scope = options.scope;
            if (options.params === void(0)) { options.params = scope.params }
            var params = options.params;

            _.forEach(eventHandlers, function(callback, eventName) {
                var callbackArray = _.castArray(callback);
                var lastCallback;
                _.forEach(callbackArray, function(callback) {
                    var callbackOptions = _.clone(options);
                    callbackOptions.oldCallback = lastCallback;
                    lastCallback = callback.bind(callbackOptions);
                });
                params.on(eventName, lastCallback);
            });
        }
    })
;
