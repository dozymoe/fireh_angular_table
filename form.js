'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhForm', [
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

            var name = $attrs.fhForm || $attrs.fhName;

            // required if you use middleware FhFormSessionStorage
            var dataType = $attrs.fhDataType;

            var originalData = $attrs.fhFormItem ? $scope[$attrs.fhFormItem]
                    : null;

            TableDefinitionMixin($scope, $attrs);

            //// scope variables

            var params = $scope.params;

            $scope.original = {};
            $scope.draft = {};

            var isEditing = false;

            //// scope functions

            $scope.cancel = function formCancel() {
                params.trigger(
                    'editingEnd',
                    $scope.draft,
                    $scope.original,
                    {
                        formName: name
                    });
            };

            $scope.delete = function formDelete() {
                params.trigger(
                    'deleteItem',
                    $scope.original,
                    {
                        formName: name
                    });
            };

            $scope.edit = function formEdit() {
                params.trigger(
                    'editingBegin',
                    $scope.draft,
                    $scope.original,
                    {
                        formName: name
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

            $scope.save = function formSave() {
                params.trigger(
                    'updateItemData',
                    $scope.draft,
                    $scope.original,
                    {
                        formName: name
                    });
            };

            $scope.isFieldModified = function isFieldModified(fieldName) {
                return !params.isFieldEqual(fieldName,
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
                if (options.formName === name) { $scope.isEditing = true }
            };

            actionEvents.editingEnd = function(event, draft, item, options) {
                if (options.formName === name) { $scope.isEditing = false }
            };

            actionEvents.updateFormData = function(event, value, options) {
                if (options.formName !== name) { return }
                $scope.original = value;
                $scope.draft = _.cloneDeep(value);
                params.trigger('formDataUpdated', value, options);
                params.trigger('draftUpdated', $scope.draft, options);
                params.trigger('editingBegin', $scope.draft, value, options);
            };

            var displayEvents = {};

            displayEvents.itemAdded = function(event, item, draft, options) {
                if (!params.isItemsEqual($scope.draft, draft)) { return }
                if (options && options.formName === name) {
                    params.trigger('editingEnd', draft, item, options);
                    params.trigger('resetDraft', draft, options);
                }
            };

            displayEvents.itemDataUpdated = function(event, newItem, oldItem, options) {
                if (!params.isItemsEqual($scope.original, oldItem)) { return }
                $scope.original = newItem;
                if (options && options.formName === name) {
                    params.trigger('editingEnd', newItem, oldItem, options);
                    params.trigger('resetDraft', newItem, options);
                }
            };

            displayEvents.itemDeleted = function(event, item, options) {
                if (!params.isItemsEqual($scope.original, item) ||
                        !$scope.isEditing) { return }

                params.trigger('editingEnd', item, item, options);
                params.trigger('resetDraft', item, options);
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

            if (originalData) {
                params.trigger(
                    'updateFormData',
                    originalData,
                    {
                        formName: name
                    });
            }
        };

        return myDirective;
    }])
;
