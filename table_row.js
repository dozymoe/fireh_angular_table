'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableRow', [
        'FhTableDefinitionMixin',
        'FhCustomEventHandlersMixin',
        'FhMiddlewaresMixin',
        'FhEventHandlersMixin',
        function(
            TableDefinitionMixin,
            CustomEventHandlersMixin,
            MiddlewaresMixin,
            EventHandlersMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            //// element attributes

            // required if you use middleware FhFormSessionStorage
            var dataType = $attrs.fhDataType;

            var originalData = $scope[$attrs.fhTableRow || $attrs.fhpRowItem];

            TableDefinitionMixin($scope, $attrs);

            //// scope variables

            var params = $scope.params;

            $scope.isEditing = false;

            $scope.isSelected = _.find($scope.data.selectedItems,
                    params.getItemId(originalData));

            var formId = _.uniqueId('fh-table-form-');

            //// scope functions

            $scope.cancel = function rowEditCancel() {
                params.trigger(
                    'editingEnd',
                    $scope.draft,
                    $scope.original,
                    {
                        formName: formId
                    });
            };

            $scope.delete = function rowDelete() {
                params.trigger(
                    'deleteItem',
                    $scope.original,
                    {
                        formName: formId
                    });
            };

            $scope.edit = function rowEdit() {
                params.trigger(
                    'editingBegin',
                    $scope.draft,
                    $scope.original,
                    {
                        formName: formId
                    });
            };

            $scope.create = function formCreate() {
                params.trigger(
                    'addItem',
                    $scope.draft,
                    {
                        formName: name
                    });
            };

            $scope.save = function rowSave() {
                params.trigger(
                    'updateItemData',
                    $scope.draft,
                    $scope.original,
                    {
                        formName: formId
                    });
            };

            $scope.toggleSelect = function toggleSelect(event) {
                var eventName = event.currentTarget.checked ? 'selectItem'
                        : 'deselectItem';

                params.trigger(eventName, $scope.original);
            };

            $scope.select = function select() {
                $scope.toggleSelect({currentTarget: {checked: true}});
            };

            $scope.isFieldModified = function isFieldModified(fieldName) {
                return !params.isFieldsEqual(fieldName,
                        $scope.original[fieldName], $scope.draft[fieldName]);
            };

            //// events

            var actionEvents = {};

            actionEvents.draftSetField = function(event, item, fieldName,
                    value, options) {

                if (!params.isItemsEqual($scope.original, item)) { return }
                $scope.draft[fieldName] = value;
                params.trigger('draftUpdated', $scope.draft, options);
            }

            actionEvents.draftUnsetField = function(event, item, fieldName,
                    value, options) {

                if (!params.isItemsEqual($scope.original, item) ||
                        !params.isFieldsEqual(fieldName,
                        $scope.draft[fieldName], value)) { return }

                $scope.draft[fieldName] = null;
                params.trigger('draftUpdated', $scope.draft, options);
            }

            actionEvents.editingBegin = function(event, draft, item, options) {
                if (options.formName === formId) { $scope.isEditing = true }
            };

            actionEvents.editingEnd = function(event, draft, item, options) {
                if (options.formName === formId) { $scope.isEditing = false }
            };

            actionEvents.updateFormData = function(event, value, options) {
                if (options.formName !== formId) { return }
                $scope.original = value;
                $scope.draft = _.cloneDeep(value);
                params.trigger('formDataUpdated', value, options);
                params.trigger('draftUpdated', $scope.draft, options);
            };

            var displayEvents = {};

            displayEvents.itemAdded = function(event, item, draft, options) {
                if (!params.isItemsEqual($scope.draft, draft)) { return }
                if (options && options.formName === formId) {
                    params.trigger('editingEnd', draft, item, options);
                    params.trigger('resetDraft', draft, options);
                }
            };

            displayEvents.itemDataUpdated = function(event, newItem, oldItem, options) {
                if (!params.isItemsEqual($scope.original, oldItem)) { return }
                $scope.original = newItem;
                if (options && options.formName === formId) {
                    params.trigger('editingEnd', newItem, oldItem, options);
                    params.trigger('resetDraft', oldItem, options);
                }
            };

            displayEvents.itemDeleted = function(event, item, options) {
                if (!params.isItemsEqual($scope.original, item) ||
                        !$scope.isEditing) { return }

                params.trigger('editingEnd', item, item, options);
                params.trigger('resetDraft', item, options);
            };

            displayEvents.itemDeselected = function(event, item) {
                if (!params.isItemsEqual($scope.original, item)) { return }
                $scope.isSelected = false;
            };

            displayEvents.itemSelected = function(event, item) {
                if (!params.isItemsEqual($scope.original, item)) { return }
                $scope.isSelected = true;
            };

            CustomEventHandlersMixin(actionEvents, $attrs, params);
            MiddlewaresMixin(actionEvents, $attrs, params);
            CustomEventHandlersMixin(displayEvents, $attrs, params);
            MiddlewaresMixin(displayEvents, $attrs, params, true);

            EventHandlersMixin(
                _.merge(actionEvents, displayEvents),
                {
                    scope: $scope,
                    params: params,
                    dataType: dataType
                });

            params.trigger(
                'updateFormData',
                originalData,
                {
                    formName: formId
                });
        };

        return myDirective;
    }])
;
