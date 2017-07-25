(function() {
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
            var cleanupCallbacks = [];

            $scope.data = {};

            //// element attributes

            var originalData = $scope[$attrs.fhpFormItem];
            var editableFields = $attrs.fhpEditableFields || '';

            TableDefinitionMixin($scope, $attrs, 'fhForm');
            // generate initial form-id
            FormIdMixin($scope, $attrs, originalData, true);

            //// scope variables

            $scope.editableFields = [];
            $scope.modifiedFields = {};

            $scope.original = originalData || {};
            $scope.draft = {};

            $scope.formErrors = {};

            var fhtable = $scope.fhtable;

            Array.prototype.push.apply($scope.editableFields,
                    fhtable.editableFields);

            _.forEach(editableFields.split(/\s*,\s*/), function(fieldStr) {
                var fieldName = fieldStr.trim();
                if (fieldName.length === 0) { return; }
                $scope.editableFields.push(fieldName);
            });
            $scope.editableFields.sort();
            $scope.editableFields = _.sortedUniq($scope.editableFields);

            //// scope functions

            function getEventOptions() {
                return {
                    // allows for dynamic form-id
                    formId: FormIdMixin($scope, $attrs, $scope.original)
                };
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
                var draft = $scope.draft;
                // only submit whitelisted draft fields, the rest of the fields
                // are taken from stored original data
                if ($scope.editableFields.length) {
                    draft = _.cloneDeep($scope.original);
                    _.merge(draft, _.pick($scope.draft, $scope.editableFields));
                }

                fhtable.trigger('addItem', draft, $scope.original,
                        getEventOptions());
            };

            $scope.save = function formSave() {
                var draft = $scope.draft;
                // only submit whitelisted draft fields, the rest of the fields
                // are taken from stored original data
                if ($scope.editableFields.length) {
                    draft = _.cloneDeep($scope.original);
                    _.merge(draft, _.pick($scope.draft, $scope.editableFields));
                }

                fhtable.trigger('updateItemData', draft, $scope.original,
                        getEventOptions());
            };

            $scope.resetField = function resetField(fieldName) {
                fhtable.trigger('draftSetField', $scope.original, fieldName,
                        $scope.original[fieldName], getEventOptions());
            };

            //// events

            fhtable.on('addEditableField', function(event, fieldName,
                    options) {

                // draft events are always related to a form
                if (options.formId !== $scope.formId) { return; }

                var indexOfFn = _.sortedIndexOf ? _.sortedIndexOf : _.indexOf;
                var index = indexOfFn($scope.editableFields, fieldName);
                if (index === -1) {
                    $scope.editableFields.push(fieldName);
                    $scope.editableFields.sort();
                }

            }, cleanupCallbacks);

            fhtable.on('setFormErrors', function(event, errors, options) {
                if (options.formId !== $scope.formId) { return; }
                $scope.formErrors = errors;
            }, cleanupCallbacks);

            var actionEvents = {};

            actionEvents.draftSetField = function(event, item, fieldName,
                    value, options) {

                if (options.formId !== $scope.formId) { return; }
                var field = $scope.draft;
                var fieldNames = fieldName.split('.');
                for (var ii=0; ii < fieldNames.length - 1; ii++)
                {
                    if (field[fieldNames[ii]] === void(0))
                    {
                        field[fieldNames[ii]] = {};
                    }
                    field = field[fieldNames[ii]];
                }
                field[fieldNames[fieldNames.length - 1]] = value;

                fhtable.trigger('draftUpdated', $scope.draft, item, options);
            };

            actionEvents.draftUnsetField = function(event, item, fieldName,
                    value, options) {

                if (options.formId !== $scope.formId) { return; }
                var field = $scope.draft;
                var fieldNames = fieldName.split('.');
                for (var ii=0; ii < fieldNames.length - 1; ii++)
                {
                    if (field[fieldNames[ii]] === void(0))
                    {
                        fhtable.trigger('draftUpdated', $scope.draft, item,
                                options);

                        return;
                    }
                    field = field[fieldNames[ii]];
                }
                field[fieldNames[fieldNames.length - 1]] = null;

                fhtable.trigger('draftUpdated', $scope.draft, item, options);
            };

            actionEvents.resetDraft = function(event, newItem, oldItem,
                    options) {

                if (options.formId !== $scope.formId) { return; }

                $scope.draft = _.cloneDeep(newItem);
                if (!_.isEmpty($scope.formErrors))
                {
                    $scope.formErrors = {};
                }

                fhtable.trigger('draftUpdated', $scope.draft, newItem, options);
            };

            actionEvents.updateFormData = function(event, item, options) {
                if (options.formId !== $scope.formId) { return; }

                if (!fhtable.isItemsEqual($scope.original, item) ||
                        _.isEmpty($scope.draft)) {

                    $scope.draft = _.cloneDeep(item);
                }
                $scope.original = item;

                fhtable.trigger('formDataUpdated', item, $scope.draft, options);
                fhtable.trigger('draftUpdated', $scope.draft, item, options);
            };

            actionEvents.refresh = function(event, options) {
                if (options.formId !== $scope.formId) { return; }
                $scope.$apply();
            };

            var displayEvents = {};

            displayEvents.draftUpdated = function(event, draft, item, options) {
                if (options.formId !== $scope.formId) { return; }

                _.forEach(draft, function(value, fieldName) {
                    $scope.modifiedFields[fieldName] =
                            !fhtable.isFieldsEqual(fieldName, value,
                            $scope.original[fieldName]);
                });
            };

            displayEvents.itemAdded = function(event, newItem, oldItem,
                    options) {

                if (options.formId !== $scope.formId) { return; }
                fhtable.trigger('editingEnd', newItem, oldItem, options);
                fhtable.trigger('resetDraft', newItem, oldItem, options);
            };

            displayEvents.itemDataUpdated = function(event, newItem, oldItem,
                    options) {

                if (options.formId === $scope.formId) {
                    // form related activities
                    fhtable.trigger('editingEnd', newItem, oldItem, options);
                    fhtable.trigger('resetDraft', newItem, oldItem, options);
                } else if (fhtable.isItemsEqual($scope.original, oldItem)) {
                    // order our own form data to be updated
                    fhtable.trigger('updateFormData', newItem,
                            getEventOptions());
                }
            };

            displayEvents.itemDeleted = function(event, item, options) {
                // don't care which form it is, if the item was deleted then
                // close it
                if (!fhtable.isItemsEqual($scope.original, item)) { return; }
                fhtable.trigger('editingEnd', item, item, options);
                fhtable.trigger('resetDraft', {}, item, options);
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
                },
                cleanupCallbacks);

            if (originalData) {
                fhtable.trigger('updateFormData', originalData,
                        getEventOptions());
            }

            //// cleanup

            $scope.$on('$destroy', function() {
                _.forEach(cleanupCallbacks, function(fn) { fn(); });
            });
        };

        return myDirective;
    }])
;
}());
