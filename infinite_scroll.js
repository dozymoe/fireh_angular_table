'use strict';

require('jquery-infinite-scroll-helper');

angular.module('fireh-angular-table', [])

    .directive('fhInfiniteScroll', ['$timeout', function($timeout) {
        var myDirective = {
            restrict: 'A',
            scope: false
        };

        myDirective.link = function(scope, el, attrs) {
            var callback_completed_fn;
            var params = attrs.params || attrs.fhInfiniteScroll || scope.params;

            function callback(page, done) {
                callback_completed_fn = done;
                params.trigger('fetchItems', {page: 'next'});
            }

            var ish = new InfiniteScrollHelper(el, {
                bottomBuffer: 200, // px
                loadMore: callback,
                triggerInitialLoad: false
            });

            function performIshAsyncComplete() {
                if (callback_completed_fn) {
                    callback_completed_fn();
                    callback_completed_fn = void(0);
                }
            }

            params.on('itemsUpdated', function(event, options) {
                performIshAsyncComplete();
                if (options.hasNextItems) {
                    $timeout(function() {
                        ish.$scrollContainer.trigger('scroll.infiniteScrollHelper');
                    });
                }
            });
            params.on('itemsUpdateFailed', performIshAsyncComplete);
        };

        return myDirective;
    }])
;
