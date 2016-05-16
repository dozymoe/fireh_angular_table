'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .factory('FhFormSessionStorage', function() {
        var FhFormSessionStorage = function(userOptions) {
            var options = _.merge(
                {
                    pruneInterval: 300, // in seconds
                },
                userOptions);
            var storage = window.sessionStorage;

            function getStorageKey(formId) {
                return 'fh-formcache-' + formId;
            }

            function _onDraftUpdated(event, draft, item, options) {
                var widgetOptions = this.optionsGetter();

                if (options.formId === widgetOptions.formId) {
                    var fhtable = this.fhtable;
                    var scope = this.scope;

                    var storageKey = getStorageKey(options.formId);

                    var isEqual = _.transform(
                        draft,
                        function(result, value, fieldName) {
                            result = fhtable.isFieldsEqual(fieldName, value,
                                scope.original[fieldName]);
                            return result;
                        });
                    if (isEqual) {
                        storage.removeItem(storageKey);
                    } else {
                        storage.setItem(
                            storageKey,
                            JSON.stringify({
                                timestamp: new Date(),
                                content: draft
                            }));
                    }
                }
                this.nextCallback(event, draft, item, options);
            }

            function _onUpdateFormData(event, item, options) {
                var widgetOptions = this.optionsGetter();

                if (options.formId !== widgetOptions.formId) {
                    this.nextCallback(event, item, options);
                    return;
                }

                var fhtable = this.fhtable;
                var scope = this.scope;

                scope.original = item;

                var dataStr = storage.getItem(getStorageKey(options.formId));

                if (dataStr) {
                    scope.draft = JSON.parse(dataStr).content;
                } else {
                    scope.draft = _.cloneDeep(item);
                }

                fhtable.trigger('formDataUpdated', item, options);
                fhtable.trigger('draftUpdated', scope.draft, item, options);

                // we drop next callback (presumably the widget's original,
                // not other middlewares)
            }

            this.getEventHandlers = function() {
                if (!storage) { return {} }

                return {
                    draftUpdated: _onDraftUpdated,
                    updateFormData: _onUpdateFormData
                }
            };
        };

        return FhFormSessionStorage;
    })
;
