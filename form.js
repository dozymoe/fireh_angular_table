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
        'FhFormIdMixin',
        function(
            TableDefinitionMixin,
            CustomEventHandlersMixin,
            MiddlewaresMixin,
            EventHandlersMixin,
            FormIdMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            $scope.data = {};

            //// element attributes

            var originalData = $attrs.fhFormItem ? $scope[$attrs.fhFormItem]
                    : {};

            TableDefinitionMixin($scope, $attrs, 'fhForm');

            //// scope variables

            $scope.data.modifiedFields = {};

            $scope.original = {};
            $scope.draft = {};

            var fhtable = $scope.fhtable;

            //// scope functions

            function getEventOptions() {
                return {
                    // allows for dynamic form-id
                    formId: FormIdMixin($scope, $attrs, $scope.original, true)
                }
            }

            $scope.cancel = function formCancel() {
                fhtable.trigger('editingEnd', $scope.draft, $scope.original,
                        getEventOptions());
            };

            $scope.delete = function formDelete() {
                fhtable.trigger('deleteItem', $scope.original,
                        getEventOptions());
            };

            $scope.edit = function formEdit() {
                fhtable.trigger('editingBegin', $scope.draft, $scope.original,
                        getEventOptions());
            };

            $scope.create = function formCreate() {
                fhtable.trigger('addItem', $scope.draft, $scope.original,
                        getEventOptions());
            };

            $scope.save = function formSave() {
                fhtable.trigger('updateItemData', $scope.draft, $scope.original,
                        getEventOptions());
            };

            $scope.resetField = function resetField(fieldName) {
                fhtable.trigger('draftSetField', $scope.original, fieldName,
                        $scope.original[fieldName], getEventOptions());
            };

            //// events

            var actionEvents = {};

            actionEvents.draftSetField = function(event, item, fieldName,
                    value, options) {

                if (options.formId !== $scope.formId) { return }
                $scope.draft[fieldName] = value;

                fhtable.trigger('draftUpdated', $scope.draft, item, options);
            }

            actionEvents.draftUnsetField = function(event, item, fieldName,
                    value, options) {

                if (options.formId !== $scope.formId) { return }
                $scope.draft[fieldName] = null;

                fhtable.trigger('draftUpdated', $scope.draft, item, options);
            }

            actionEvents.updateFormData = function(event, item, options) {
                if (options.formId !== $scope.formId) { return }
                $scope.original = item;
                $scope.draft = _.cloneDeep(item);

                fhtable.trigger('formDataUpdated', item, options);
                fhtable.trigger('draftUpdated', $scope.draft, item, options);
                fhtable.trigger('editingBegin', $scope.draft, item, options);
            };

            var displayEvents = {};

            displayEvents.draftUpdated = function(event, draft, item, options) {
                if (!options.formId !== $scope.formId) { return }

                _.forEach(draft, function(value, fieldName) {
                    $scope.data.modifiedFields[fieldName] =
                            !fhtable.isFieldsEqual(fieldName, value,
                            $scope.original[fieldName]);
                });
            };

            displayEvents.itemAdded = function(event, newItem, oldItem,
                    options) {

                if (options.formId !== $scope.formId) { return }
                fhtable.trigger('editingEnd', newItem, oldItem, options);
                fhtable.trigger('resetDraft', oldItem, options);
            };

            displayEvents.itemDataUpdated = function(event, newItem, oldItem,
                    options) {

                if (options.formId === $scope.formId) {
                    // form related activities
                    fhtable.trigger('editingEnd', newItem, oldItem, options);
                    fhtable.trigger('resetDraft', oldItem, options);
                } else if (fhtable.isItemsEqual($scope.original, oldItem)) {
                    // order our own form data to be updated
                    fhtable.trigger('updateFormData', newItem,
                            getEventOptions());
                }
            };

            displayEvents.itemDeleted = function(event, item, options) {
                // don't care which form it is, if the item was deleted then
                // close it
                if (!fhtable.isItemsEqual($scope.original, item)) { return }
                fhtable.trigger('editingEnd', item, item, options);
                fhtable.trigger('resetDraft', item, options);
            };

            CustomEventHandlersMixin(actionEvents, $attrs, fhtable);
            MiddlewaresMixin(actionEvents, $attrs, fhtable);
            CustomEventHandlersMixin(displayEvents, $attrs, fhtable);
            MiddlewaresMixin(displayEvents, $attrs, fhtable, true);

            EventHandlersMixin(
                _.merge(actionEvents, displayEvents),
                {
                    scope: $scope,
                    fhtable: fhtable,
                    optionsGetter: getEventOptions
                });

            if (originalData) {
                fhtable.trigger('updateFormData', originalData,
                        getEventOptions());
            }
        };

        return myDirective;
    }])
;
