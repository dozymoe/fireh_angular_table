'use strict';

angular.module('fireh_angular_table', [])

    .factory('FhTableDefinition', [
        '$rootScope',
        function(
            $rootScope) {

        var FhTableDefinition = function(settings) {
            _.merge(
                this,
                {
                    eventHandlers: {},

                    fieldDefinition: {},

                    filter: {
                        throttle: 500
                    },
                    filterBy: {},
                    filterDefinition: {},

                    items: {
                        getter: null,
                        //identifierFields: 'id', // will be used with _.pick()
                        page: 1,
                        pageSize: 20
                    },

                    middlewares: [],

                    orderBy: [],
                    orderDefinition: {},

                    services: []
                });
            _.mergeDeep(this, settings);

            if (console.assert) {
                console.assert(this.items.identifierFields !== void(0),
                        "FhTableDefinition: identifierFields is required.");
            }

            var scope = this.scope = $rootScope.$new();

            this.on = function on(eventType, callback) {
                scope.$on(eventType, callback);
            };

            this.trigger = function trigger() {
                // ES5 convert arguments into array, see http://stackoverflow.com/a/960870
                var args = Array.prototype.slice.call(arguments);
                scope.$broadcast.apply(scope, args);
            };

            this.createQueryPayload = function createQueryPayload(data) {
                // remove empty filters, save into pairs
                var cleanedFilter = _.transform(
                    data.filterBy,
                    function(result, value, key) {
                        if (!value) { return; }
                        // if it's an array of objects with one property,
                        // convert into array of the property values,
                        // for example [{id: 1}, {id: 2}] into [1, 2]
                        if (_.isArray(value)) {
                            value = _.transform(
                                value,
                                function(result, value) {
                                    if (_.isObject(value) &&
                                            _.keys(value).length == 1) {

                                        value = _.values(value)[0];
                                    }
                                    result.push(value);
                                });
                        }
                        result.push([key, value]);
                    },
                    []);
                // sort filter by name, save into object
                var sortedFilter = _.sortBy(cleanedFilter, 0);
                if (_.fromPairs) {
                    sortedFilter = _.fromPairs(sortedFilter);
                } else {
                    sortedFilter = _.zipObject(sortedFilter);
                }

                var payload = {
                    filterBy: sortedFilter,
                    orderBy: data.orderBy || [],
                    page: data.page || 1,
                    pageSize: data.pageSize || 0
                };
                return payload;
            };

            this.POST2GETpayload = function POST2GETpayload(payload) {
              var queryString = {},
                  params;

              _.forOwn(payload, function(item, key) {
                if (key !== 'orderBy' && key !== 'filterBy') {
                  queryString[key] = item;
                }
              });

              // orderBy
              params = _.transform(payload.orderBy, function(result, item) {
                var direction = item[1] === 'desc' ? '-' : '';
                    result.push(direction + item[0]);
              }, []);

              if (params.length) { queryString.orderBy = params.join(','); }

              // filterBy
              _.forOwn(payload.filterBy, function(item, key) {
                if (_.isArray(item)) {
                  item = item.join(',');
                }
                queryString['filterBy' + _.capitalize(key)] = item;
              });

              return queryString;
            };

            this.getFieldId = function getFieldId(fieldName, item) {
                // check if field has identifierFields
                if (this.fieldDefinition[fieldName] &&
                        this.fieldDefinition[fieldName].items &&
                        this.fieldDefinition[fieldName].items.identifierFields) {

                    return _.pick(item, this.fieldDefinition[fieldName].items.
                            identifierFields);

                } else {
                    return item;
                }
            };

            this.isFieldsEqual = function isFieldsEqual(fieldName, item1,
                    item2) {

                return _.isEqual(this.getFieldId(fieldName, item1),
                        this.getFieldId(fieldName, item2));
            };

            this.getItemId = function getItemId(item) {
                return _.pick(item, this.items.identifierFields);
            };

            this.isItemsEqual = function isItemsEqual(item1, item2) {
                return _.isEqual(this.getItemId(item1), this.getItemId(item2));
            };

            this.identifierAsString = function identifierAsString(item,
                    options) {

                if (options === void(0)) { options = {} }
                var keyValueSeparator = options.keyValueSeparator || '=';
                var keysSeparator = options.keysSeparator || ';';

                var id = _.pick(item, this.items.identifierFields);
                var resultArray = _.transform(id, function(result, value, key) {
                    result.push(key + keyValueSeparator + value);
                }, []);
                return resultArray.join(keysSeparator);
            };

            return this;
        };

        return FhTableDefinition;
    }])
;
