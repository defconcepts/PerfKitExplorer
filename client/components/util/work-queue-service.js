/**
 * @copyright Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @fileoverview workQueue is an angular service that manages a queue
 * of pending work item promises, running them with concurrency and
 * priority control.
 * @author klausw@google.com (Klaus Weidner)
 */

goog.provide('p3rf.perfkit.explorer.components.util.WorkQueueService');

goog.scope(function() {
const explorer = p3rf.perfkit.explorer;

/**
 * See module docstring for more information about purpose and usage.
 *
 * @param {!angular.$q} $q
 * @param {angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
explorer.components.util.WorkQueueService = function($q, $timeout) {
  this.q_ = $q;
  this.timeout_ = $timeout;
  this.queuePending_ = [];
  this.queueExecuting_ = 0;
};
const WorkQueueService = explorer.components.util.WorkQueueService;

WorkQueueService.NOTIFICATION = {
  STARTED: 'Started'
};

WorkQueueService.WorkItem = function(workFactory, deferred) {
  this.workFactory = workFactory;
  this.deferred = deferred;
};

WorkQueueService.WorkItem.prototype.start = function() {
  var workPromise = this.workFactory();
  workPromise.then(
      this.deferred.resolve.bind(this),
      this.deferred.reject.bind(this));
  return this.deferred.promise;
};

WorkQueueService.prototype.enqueue = function(worker, runNow) {
  var workItem = new WorkQueueService.WorkItem(worker, this.q_.defer());
  if (runNow) {
    this.executeItem(workItem);
  } else {
    this.queuePending_.push(workItem);
    this.updateQueue();
  }
  return workItem.deferred.promise;
};

WorkQueueService.prototype.updateQueue = function() {
  var maxParallel = 4;

  console.log('updateQueue: executing:', this.queueExecuting_,
              'waiting:', this.queuePending_.length);

  while (this.queuePending_.length && this.queueExecuting_ < maxParallel) {
    var workItem = this.queuePending_.shift();

    this.executeItem(workItem);
  }
};

WorkQueueService.prototype.executeItem = function(workItem) {
  ++this.queueExecuting_;
  var onFinished = () => {
    --this.queueExecuting_;
    this.updateQueue();
  };
  this.timeout_(() => {
    console.log('work start');
    workItem.deferred.notify(WorkQueueService.NOTIFICATION.STARTED);
  });

  workItem.start().then(onFinished, onFinished);
};

WorkQueueService.prototype.canShowStatus = function() {
  return this.queueExecuting_ > 0 || this.queuePending_.length > 0;
};

WorkQueueService.prototype.getStatus = function() {
  var msg = 'Loading: ' + this.queueExecuting_;
  if (this.queuePending_.length > 0) {
    msg += ', queued: ' + this.queuePending_.length;
  }
  return msg;
};

});  // goog.scope
