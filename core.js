'use strict';

angular.module('fireh_angular_table', [])

    .factory('FhTableDefinition', ['$rootScope', function($rootScope) {
        var FhTableDefinition = function(settings) {
            // use angular.merge on newer version
            _.merge(this, {
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

                orderBy: [],
                orderDefinition: {}
            });
            _.merge(this, settings);

            if (console.assert) {
                console.assert(this.items.identifierFields !== void(0), "FhTableDefinition: identifierFields is required.");
            }

            var scope = this.scope = $rootScope.$new();

            this.on = function on(eventType, callback) {
                scope.$on(eventType, callback);
            };

            this.trigger = function trigger() {
                // ES5 convert arguments into array, see http://stackoverflow.com/a/960870
                var args = Array.prototype.slice.call(arguments);
                scope.$broadcast.apply(scope, args);
            }

            this.createQueryPayload = function createQueryPayload(data) {
                // remove empty filters, save into pairs
                var cleanedFilter = _.transform(data.filterBy, function(result, value, key) {
                    if (!value) { return; }
                    // if it's an array of objects with one property, convert into array of the property values,
                    // for example [{id: 1}, {id: 2}] into [1, 2]
                    if (_.isArray(value)) {
                        value = _.transform(value, function(result, value) {
                            if (_.isObject(value) && _.keys(value).length == 1) {
                                value = _.values(value)[0];
                            }
                            result.push(value);
                        })
                    }
                    result.push([key, value]);
                }, []);
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

            this.isFieldsEqual = function isFieldsEqual(fieldName, item1, item2) {
                return _.isEqual(this.getFieldId(fieldName, item1),
                        this.getFieldId(fieldName, item2));
            };

            this.getItemId = function getItemId(item) {
                return _.pick(item, this.items.identifierFields);
            };

            this.isItemsEqual = function isItemsEqual(item1, item2) {
                return _.isEqual(this.getItemId(item1), this.getItemId(item2));
            };

            return this;
        };

        return FhTableDefinition;
    }])
;
