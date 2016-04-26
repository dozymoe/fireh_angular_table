'use strict';

if (window.require) {
    require('./core_mixins');
}

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

            scope.isSelected = _.find(scope.data.selectedItems,
                    params.getItemId(scope.original));

            scope.cancel = function rowEditCancel() {
                scope.isEditing = false;
                params.trigger('editingEnd', scope.original);
            };

            scope.delete = function rowDelete() {
                params.trigger('deleteItem', scope.original);
            };

            scope.edit = function rowEdit() {
                scope.isEditing = true;
                params.trigger('editingBegin', scope.original);
            };

            scope.save = function rowSave() {
                scope.isEditing = false;
                params.trigger('editingEnd', scope.original);

                params.trigger('updateItemData', scope.draft, scope.original);
            };

            scope.select = function rowSelect(event) {
                var eventName = event.currentTarget.checked ? 'selectItem'
                        : 'deselectItem';

                params.trigger(eventName, scope.original);
            };

            scope.isFieldModified = function isFieldModified(fieldName) {
                return !params.isFieldsEqual(fieldName, scope.original[fieldName],
                        scope.draft[fieldName]);
            };

            params.on('itemSelected', function(event, item) {
                if (params.isItemsEqual(scope.original, item)) {
                    scope.isSelected = true;
                }
            });

            params.on('itemDeselected', function(event, item) {
                if (params.isItemsEqual(scope.original, item)) {
                    scope.isSelected = false;
                }
            });

            params.on('draftSetField', function(event, item, fieldName, value) {
                if (params.isItemsEqual(scope.original, item)) {
                    scope.draft[fieldName] = value;
                    params.trigger('draftUpdated', scope.draft);
                }
            });

            params.on('draftUnsetField', function(event, item, fieldName, value) {
                if (params.isItemsEqual(scope.original, item) &&
                        params.isFieldsEqual(fieldName, scope.draft[fieldName],
                        value)) {

                    scope.draft[fieldName] = null;
                    params.trigger('draftUpdated', scope.draft);
                }
            });

            params.on('itemDataUpdated', function(event, item) {
                if (params.isItemsEqual(scope.original, item)) {
                    scope.original = angular.copy(item);
                }
            });

            // update field selections and other field editing widgets
            params.trigger('draftUpdated', scope.draft);
        };

        return myDirective;
    }])
;
