'use strict';

if (window.require) {
    require('./core');
}

angular.module('fireh_angular_table')

    .factory('FhTableDefinitionMixin', ['$parse', function($parse) {
        return function(scope, attrs, alternateAttrField) {
            if (attrs.params) {
                scope.params = $parse(attrs.params)(scope);
            } else if (attrs[alternateAttrField]) {
                scope.params = $parse(attrs[alternateAttrField])(scope);
            }
        }
    }])


    .factory('FhTableListResourceControllerMixin', function() {
        return function(scope, options) {
            var params = scope.params;
            var initialFetchItems = true;

            options = _.merge(
                {
                    multipleSelection: true
                },
                options || {});

            scope.data = {
                items: [],
                selectedItems: [],
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

                var resourceGetter = params.items.getter(params.createQueryPayload(payload));
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
                        Array.prototype.push.apply(scope.data.items, response.items);
                        scope.data.total = response.total;

                        var updateNotifOptions = {
                            hasNextItems: scope.data.items.length < response.total
                        };
                        params.trigger('itemsUpdated', updateNotifOptions);
                        params.trigger('itemsTotalUpdated', response.total);
                    },
                    function (err) {
                        params.trigger('ajaxRequestFinished');
                    }
                );
            });

            params.on('resetItems', function resetItems() {
                params.trigger('fetchItems', {flush: true, page: 1});
            });

            params.on('addMultipleValuesFilter', function(event, filterName, filterValue) {
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

            params.on('removeMultipleValuesFilter', function(event, filterName, filterValue) {
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

            params.on('setSingleValueFilter', function(event, filterName, filterValue) {
                scope.dataParams.filterBy[filterName]  = filterValue;
                params.trigger('filterUpdated', filterName, filterValue);
                params.trigger('resetItems');
            });

            params.on('setOrder', function(event, sortingName, sortingValue) {
                var list = scope.dataParams.orderBy;
                var priority = _.findIndex(list, function(item) { return item[0] === sortingName }) + 1;

                if (priority) {
                    if (sortingValue) {
                        var changed = false;
                        var sorting = list[priority - 1];

                        if (sortingValue.direction && sortingValue.direction !== sorting[1]) {
                            sorting[1] = sortingValue.direction;
                            changed = true;
                        }
                        if (sortingValue.priority && sortingValue.priority !== priority) {
                            list.splice(priority -1, 1);
                            priority = sortingValue.priority;
                            list.splice(priority - 1, 0, sorting);
                            changed = true;
                        }
                        if (changed) {
                            params.trigger('orderUpdated', sortingName, {direction: sorting[1], priority: priority});
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
                    params.trigger('orderUpdated', sortingName, {direction: direction, priority: priority});
                } else {
                    return;
                }

                // trigger orderUpdated to update other sortings
                _.forOwn(list, function(value, key) {
                    if (value[0] !== sortingName) {
                        params.trigger('orderUpdated', value[0], {direction: value[1], priority: parseInt(key) + 1});
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

            params.on('selectItem', function(event, itemId) {
                var item = _.find(scope.data.selectedItems, itemId);
                if (!item) {
                    item = _.find(scope.data.items, itemId);
                    if (item) {
                        if (!options.multipleSelection && scope.data.selectedItems.length) {
                            params.trigger('itemDeselected', scope.data.selectedItems[0]);
                            scope.data.selectedItems.splice(0);
                        }
                        scope.data.selectedItems.push(item);
                    }
                }
                if (item) {
                    params.trigger('itemSelected', item);
                    params.trigger('itemsSelected', scope.data.selectedItems);
                }
            });

            params.on('deselectItem', function(event, itemId) {
                var items = _.remove(scope.data.selectedItems, itemId);
                if (items.length === 0) {
                    return;
                }
                for (var i = 0; i < items.length; i++) {
                    params.trigger('itemDeselected', items[i]);
                }
                params.trigger('itemsSelected', scope.data.selectedItems);
            });

            params.on('selectAllItems', function() {
                var id, item;
                var changed = false;
                for (var i = 0; i < scope.data.items.length; i++) {
                    item = scope.data.items[i];
                    id = _.pick(item, params.items.identifierFields);
                    if (_.findIndex(scope.data.selectedItems, id) === -1) {
                        scope.data.selectedItems.push(item);
                        params.trigger('itemSelected', item);
                        changed = true;
                    }
                }
                if (changed) {
                    params.trigger('itemsSelected', scope.data.selectedItems);
                }
            });

            params.on('deselectAllItems', function() {
                var id, item, deletedItems;
                var changed = false;
                for (var i = 0; i < scope.data.items.length; i++) {
                    item = scope.data.items[i];
                    id = _.pick(item, params.items.identifierFields);
                    deletedItems = _.remove(scope.data.selectedItems, id);
                    for (var j = 0; j < deletedItems.length; j++) {
                        params.trigger('itemDeselected', deletedItems[j]);
                        changed = true;
                    }
                }
                if (changed) {
                    params.trigger('itemsSelected', scope.data.selectedItems);
                }
            });

            params.on('itemAdded', function(event, item) {
                var id = _.pick(item, params.items.identifierFields);
                var index = _.findIndex(scope.data.items, id);
                if (index !== -1) {
                    scope.data.items[index] = item;
                } else {
                    scope.data.items.push(item);
                }

                index = _.findIndex(scope.data.selectedItems, id);
                if (index !== -1) {
                    scope.data.selectedItems[index] = item;
                }
            });

            params.on('itemDeleted', function(event, item) {
                var id = _.pick(item, params.items.identifierFields);
                _.remove(scope.data.items, id);
                _.remove(scope.data.selectedItems, id);
            });

            params.on('itemDataUpdated', function(event, newItem, oldItem) {
                var id = _.pick(oldItem, params.items.identifierFields);
                var index = _.findIndex(scope.data.items, id);
                if (index !== -1) {
                    scope.data.items[index] = newItem;
                }

                index = _.findIndex(scope.data.selectedItems, id);
                if (index !== -1) {
                    scope.data.selectedItems[index] = newItem;
                }
            });
        }
    })


    .factory('FhTranscludeChildDirectiveMixin', function() {
        /* Sub-directives inside directive with transclude will be initialized twice,
         * something we do not wish to happen. So we need pseudo directive, an
         * attribute (data-fh-transcluded) that parent directive will checked for
         * real sub-directive name which is its value.
         *
         * The real sub-directive name will be added later by this mixin as attribute
         * to the html element with attribute `data-fh-transcluded`.
         *
         * The temporary attribute (data-fh-transcluded) will be removed.
         */
        return function(el) {
            var attribute_name = 'data-fh-transcluded';

            // angular jQLite's el.find() doesn't work
            _.forEach(el[0].querySelectorAll('[' + attribute_name + ']'), function(eltr) {
                var $el = angular.element(eltr);
                $el.attr($el.attr(attribute_name), '');
                $el.removeAttr(attribute_name);
            });
        }
    })
;
