'use strict';

require('./core_mixins');

angular.module('fireh-angular-table', [])

    .directive('fhTableRow', ['FhTableDefinitionMixin',
            function(TableDefinitionMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.link = function(scope, el, attrs) {
            TableDefinitionMixin(scope);
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
                params.trigger('deleteItem', _.pick(scope.original,
                        params.items.identifierFields));
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

                params.trigger('editItem', scope.original, scope.draft);
            };

            scope.select = function rowSelect() {
                var eventName = event.currentTarget.checked ? 'selectItem'
                        : 'deselectItem';

                params.trigger(eventName, _.pick(scope.original,
                        params.items.identifierFields));
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
        };

        return myDirective;
    })
;
