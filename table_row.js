(function() {
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

            // fh-table-row borrows $scope.data from fh-table

            //// element attributes

            var originalData = $scope[$attrs.fhTableRow || $attrs.fhpRowItem];
            var editable = $attrs.fhpEditable !== void(0) &&
                    $attrs.fhpEditable !== 'false';

            var editableFields = $attrs.fhpEditableFields || '';

            TableDefinitionMixin($scope, $attrs);
            // generate initial form-id
            FormIdMixin($scope, $attrs, originalData, editable,
                    'fh-table-row-');

            //// scope variables

            $scope.editableFields = [];
            $scope.modifiedFields = {};

            $scope.original = originalData;
            $scope.draft = {};
            $scope.isEditing = false;

            $scope.formErrors = {};

            var fhtable = $scope.fhtable;

            $scope.isSelected = _.find($scope.data.selectedItems,
                    fhtable.getItemId(originalData));

            _.forEach(editableFields.split(/\s*,\s*/), function(fieldStr) {
                var fieldName = fieldStr.trim();
                if (fieldName.length === 0) { return; }
                $scope.editableFields.push(fieldName);
            });
            $scope.editableFields.sort();

            //// scope functions

            function displayNonEditableError() {
                if (console.assert) {
                    console.assert(editable, 'data-fhp-editable required');
                }
            }

            function getEventOptions() {
                return {
                    // allows for dynamic form-id
                    formId: FormIdMixin($scope, $attrs, $scope.original,
                            false, 'fh-table-row-')
                };
            }

            $scope.cancel = function rowEditCancel() {
                fhtable.trigger('editingEnd', $scope.draft, $scope.original,
                        getEventOptions());
            };

            $scope.delete = function rowDelete() {
                displayNonEditableError();
                fhtable.trigger('deleteItem', $scope.original,
                        getEventOptions());
            };

            $scope.edit = function rowEdit() {
                displayNonEditableError();
                fhtable.trigger('updateFormData', $scope.original,
                        getEventOptions());
                fhtable.trigger('editingBegin', $scope.draft, $scope.original,
                        getEventOptions());
            };

            $scope.create = function rowCreate() {
                displayNonEditableError();

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

            $scope.save = function rowSave() {
                displayNonEditableError();

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
                displayNonEditableError();
                fhtable.trigger('draftSetField', $scope.original, fieldName,
                        $scope.original[fieldName], getEventOptions());
            };

            $scope.toggleSelect = function toggleSelect(event) {
                var eventName = event.currentTarget.checked ? 'selectItem'
                        : 'deselectItem';

                fhtable.trigger(eventName, $scope.original, getEventOptions());
            };

            $scope.select = function select() {
                $scope.toggleSelect({currentTarget: {checked: true}});
            };

            $scope.triggerDraftUpdated = function triggerDraftUpdated() {
                fhtable.trigger('draftUpdated', $scope.draft, $scope.original,
                        getEventOptions());
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
            });

            var actionEvents = {};

            actionEvents.draftSetField = function(event, item, fieldName,
                    value, options) {

                // draft events are always related to a form
                if (options.formId !== $scope.formId) { return; }
                $scope.draft[fieldName] = value;

                fhtable.trigger('draftUpdated', $scope.draft, item, options);
            };

            actionEvents.draftUnsetField = function(event, item, fieldName,
                    value, options) {

                // draft events are always related to a form
                if (options.formId !== $scope.formId) { return; }
                $scope.draft[fieldName] = null;

                fhtable.trigger('draftUpdated', $scope.draft, item, options);
            };

            actionEvents.editingBegin = function(event, draft, item, options) {
                // editingBegin is always related to a form
                if (options.formId !== $scope.formId) { return; }
                $scope.isEditing = true;
            };

            actionEvents.editingEnd = function(event, draft, item, options) {
                // editingBegin is always related to a form
                if (options.formId !== $scope.formId) { return; }
                $scope.isEditing = false;
            };

            actionEvents.resetDraft = function(event, newItem, oldItem,
                    options) {

                // resetDraft is always related to a form
                if (options.formId !== $scope.formId) { return; }

                $scope.draft = _.cloneDeep(newItem);
                if (!_.isEmpty($scope.formErrors))
                {
                    $scope.formErrors = {};
                }

                fhtable.trigger('draftUpdated', $scope.draft, newItem, options);
            };

            actionEvents.updateFormData = function(event, item, options) {
                // updateFormData is always related to a form
                if (!$scope.formId || options.formId !== $scope.formId) {
                    return;
                }

                if (!fhtable.isItemsEqual($scope.original, item) ||
                        _.isEmpty($scope.draft)) {

                    $scope.draft = _.cloneDeep(item);
                }
                $scope.original = item;

                fhtable.trigger('formDataUpdated', item, $scope.draft, options);
                fhtable.trigger('draftUpdated', $scope.draft, item, options);
            };

            var displayEvents = {};

            displayEvents.draftUpdated = function(event, draft, item, options) {
                // draft events are always related to a form
                if (options.formId !== $scope.formId) { return; }

                _.forEach(draft, function(value, fieldName) {
                    $scope.modifiedFields[fieldName] =
                            !fhtable.isFieldsEqual(fieldName, value,
                            $scope.original[fieldName]);
                });
            };

            displayEvents.itemAdded = function(event, newItem, oldItem,
                    options) {

                // only interested in form related activities
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

            displayEvents.itemDeselected = function(event, item, options) {
                if (!fhtable.isItemsEqual($scope.original, item)) { return; }
                $scope.isSelected = false;
            };

            displayEvents.itemSelected = function(event, item, options) {
                if (!fhtable.isItemsEqual($scope.original, item)) { return; }
                $scope.isSelected = true;
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

            //// cleanup

            $scope.$on('$destroy', function() {
                _.forEach(cleanupCallbacks, function(fn) { fn(); });
            });
        };

        return myDirective;
    }])
;
}());
