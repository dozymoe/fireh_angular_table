'use strict';

require('./core_mixins');

angular.module('fireh_angular_table')

    .directive('fhTableRow', ['FhTableDefinitionMixin',
            function(TableDefinitionMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.link = function(scope, el, attrs) {
            TableDefinitionMixin(scope, attrs);
            var params = scope.params;

            scope.original = scope[attrs.fhTableRow];
            scope.draft = angular.copy(scope.original);
            scope.isEditing = false;
            scope.isSelected = false;

            scope.cancel = function rowEditCancel() {
                scope.isEditing = false;
                params.trigger('editingEnd', _.pick(scope.original,
                        params.items.identifierFields));
            };

            scope.delete = function rowDelete() {
                params.trigger('deleteItem', scope.original);
            };

            scope.edit = function rowEdit() {
                scope.isEditing = true;
                params.trigger('editingBegin', _.pick(scope.original,
                        params.items.identifierFields));
            };

            scope.save = function rowSave() {
                scope.isEditing = false;
                params.trigger('editingEnd', _.pick(scope.original,
                        params.items.identifierFields));

                params.trigger('updateItemData', scope.draft, scope.original);
            };

            scope.select = function rowSelect() {
                var eventName = event.currentTarget.checked ? 'selectItem'
                        : 'deselectItem';

                params.trigger(eventName, _.pick(scope.original,
                        params.items.identifierFields));
            };

            scope.isFieldModified = function isFieldModified(fieldName) {
                // check if field has identifierFields
                if (params.fieldDefinition[fieldName] &&
                        params.fieldDefinition[fieldName].identifierFields) {

                    var idFields = params.fieldDefinition[fieldName]
                            .identifierFields;

                    var origId = _.pick(scope.original[fieldName], idFields);
                    var draftId = _.pick(scope.draft[fieldName], idFields);
                    return !_.isEqual(origId, draftId);
                } else {
                    return !_.isEqual(scope.original[fieldName],
                            scope.draft[fieldName]);
                }
            };

            function isRowItem(item) {
                var ourId = _.pick(scope.original,
                        scope.params.identifierFields);

                var itemId = _.pick(item,
                        scope.params.identifierFields);

                return _.isEqual(ourId, itemId);
            }

            params.on('itemSelected', function(event, item) {
                if (isRowItem(item)) {
                    scope.isSelected = true;
                }
            });

            params.on('itemDeselected', function(event, item) {
                if (isRowItem(item)) {
                    scope.isSelected = false;
                }
            });

            params.on('itemDataUpdated', function(event, item) {
                if (isRowItem(item)) {
                    scope.original = angular.copy(item);
                }
            });
        };

        return myDirective;
    }])
;
