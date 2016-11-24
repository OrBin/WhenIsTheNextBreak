// In breaks.json:
// The days should be formatted as dddd (Sunday-Saturday).
// The times should be formatted as HH:mm (00:00 to 23:59).
// The length should be in minutes.

angular.module('NextBreakApp', ['timer'])
    .controller('NextBreakController', ['$scope', '$compile', '$timeout', function ($scope, $compile, $timeout) {

        var breaksData = null;
        var lastUpdatedBreaks = new Date(0);
        var timerParentElem = angular.element(document.querySelector("#timer-parent"))

        $scope.fetchBreaksData = function () {
            var oReq = new XMLHttpRequest();
            oReq.onload = reqListener;
            oReq.open("get", "breaks.json", false);
            oReq.send();

            function reqListener(e) {
                breaksData = JSON.parse(this.responseText);

                // Saving only the update date, without the time
                lastUpdatedBreaks = new Date();
                lastUpdatedBreaks.setHours(0, 0, 0, 0);
            }

        };

        $scope.getNextBreak = function () {
            var today = new Date();
            today.setHours(0, 0, 0, 0);

            // If the last update was not today
            if (today > lastUpdatedBreaks)
                $scope.fetchBreaksData();

            var todaysWeekday = moment().format("dddd");

            if (todaysWeekday in breaksData)
            {
                var breakTimeMoment;
                for (var breakStr in breaksData[todaysWeekday])
                {
                    breakTimeMoment = moment(breaksData[todaysWeekday][breakStr]["time"], "HH:mm");
                    breakEndTimeMoment = moment(breakTimeMoment).add(breaksData[todaysWeekday][breakStr]["length"], 'minutes');

                    // if this break is after now
                    if (moment() < breakEndTimeMoment)
                    {
                        console.log("Found upcoming/current break:");
                        console.log(breaksData[todaysWeekday][breakStr]);

                        return {
                            "startBreakMillis": breakTimeMoment.valueOf(),
                            "endBreakMillis": breakEndTimeMoment.valueOf(),
                            "length": breaksData[todaysWeekday][breakStr]["length"]
                        };
                    }
                }
            }

            return null;
        };

        $scope.updateDisplay = function() {

            var nextBreakData = $scope.getNextBreak();

            timerParentElem.empty();

            if (nextBreakData == null)
            {
                timerParentElem.append('<div class="timer-title">אין עוד הפסקות היום! :(</div>');
            }
            else
            {
                $scope.endTime = nextBreakData["startBreakMillis"];
                $scope.currBreakLength = nextBreakData["length"];

                // If the break did not begin
                if (moment() < moment(nextBreakData["startBreakMillis"]))
                {
                    timerParentElem.append('<div class="timer-title">ההפסקה הבאה בעוד:</div>\
                                        </br>\
                                        <timer class="timer-element" ng-attr-end-time="endTime" interval="1000" finish-callback="updateDisplay()"> \
                                            {{hhours}}:{{mminutes}}:{{sseconds}}\
                                       </timer>');

                    $compile(timerParentElem.contents())($scope);
                }
                // If the break is now
                else
                {
                    timerParentElem.append('<div class="timer-title">עכשיו הפסקה! D:</div>\
                                            <div class="break-length">({{currBreakLength}} דקות)</div>');
                    $compile(timerParentElem.contents())($scope);


                    $timeout(function () {
                        $scope.updateDisplay();
                    }, nextBreakData["endBreakMillis"] - moment().valueOf());
                }
            }
        };

        $scope.updateDisplay();

    }]);