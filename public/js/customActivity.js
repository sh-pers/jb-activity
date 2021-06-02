define([
    'postmonger'
], function(
    Postmonger
) {
    'use strict';

    var connection = new Postmonger.Session();
    var payload = {};
    var lastStepEnabled = false;
    var steps = [ // initialize to the same value as what's set in config.json for consistency
        { "label": "Step 1", "key": "step1" }
    ];
    var currentStep = steps[0].key;

    $(window).ready(onRender);

    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);

    connection.on('clickedNext', onClickedNext);
    connection.on('clickedBack', onClickedBack);
    connection.on('gotoStep', onGotoStep);

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');

        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');

        // Disable the next button if a value isn't selected
        $('#url').change(function() {
            var url = getURL();
            connection.trigger('updateButton', { button: 'next', enabled: Boolean(url) });

            //$('#message').html(url);
        });

        $('#payload').change(function() {
            var contentJSON = getcontentJSON();
            connection.trigger('updateButton', { button: 'next', enabled: Boolean(contentJSON) });

            //$('#message').html(url);
        });

        // Toggle step 4 active/inactive
        // If inactive, wizard hides it and skips over it during navigation
       
    }

    function initialize (data) {
        if (data) {
            payload = data;
        }

        var url;
        var contentJSON;
        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        $.each(inArguments, function(index, inArgument) {
            $.each(inArgument, function(key, val) {
                console.log("key: " + key);
                console.log("val: " + key);
                if (key === 'url') {
                    url = val;
                }

                if (key === 'contentJSON') {
                    contentJSON = val;
                }
            });
        });

        // If there is no message selected, disable the next button
        if (!url) {
            showStep(null, 1);
            connection.trigger('updateButton', { button: 'next', enabled: false });
            // If there is a message, skip to the summary step
        } else {
            $('#url').val(url);
            $('#payload').val(contentJSON);
            //$('#message').html(message);
            showStep(null, 1);
        }
    }

    function onGetTokens (tokens) {
        // Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
        // console.log(tokens);
    }

    function onGetEndpoints (endpoints) {
        // Response: endpoints = { restHost: <url> } i.e. "rest.s1.qa1.exacttarget.com"
        // console.log(endpoints);
    }

    function onClickedNext () {
        if (
            /*(currentStep.key === 'step3' && steps[3].active === false) ||
            currentStep.key === 'step4'*/
            currentStep.key === 'step1'

        ) {
            save();
        } else {
            connection.trigger('nextStep');
        }
    }

    function onClickedBack () {
        connection.trigger('prevStep');
    }

    function onGotoStep (step) {
        showStep(step);
        connection.trigger('ready');
    }

    function showStep(step, stepIndex) {
        if (stepIndex && !step) {
            step = steps[stepIndex-1];
        }

        currentStep = step;

        $('.step').hide();

        switch(currentStep.key) {
            case 'step1':
                $('#step1').show();
                connection.trigger('updateButton', {
                    button: 'next',
                    enabled: Boolean(getURL())
                });
                connection.trigger('updateButton', {
                    button: 'back',
                    visible: false
                });
                break;
            case 'step2':
                $('#step2').show();
                connection.trigger('updateButton', {
                    button: 'back',
                    visible: true
                });
                connection.trigger('updateButton', {
                    button: 'next',
                    text: 'next',
                    visible: true
                });
                break;
            case 'step3':
                $('#step3').show();
                connection.trigger('updateButton', {
                     button: 'back',
                     visible: true
                });
                if (lastStepEnabled) {
                    connection.trigger('updateButton', {
                        button: 'next',
                        text: 'next',
                        visible: true
                    });
                } else {
                    connection.trigger('updateButton', {
                        button: 'next',
                        text: 'done',
                        visible: true
                    });
                }
                break;
            case 'step4':
                $('#step4').show();
                break;
        }
    }

    function save() {
        var name = 'Webhook Settings';
        var url = getURL();
        var contentJSON = getcontentJSON();
        var log = writeLog();
        // 'payload' is initialized on 'initActivity' above.
        // Journey Builder sends an initial payload with defaults
        // set by this activity's config.json file.  Any property
        // may be overridden as desired.
        payload.name = name;

        payload['arguments'].execute.inArguments = [{ "url": url }, {"contentJSON": contentJSON}];

        payload['metaData'].isConfigured = true;

        connection.trigger('updateActivity', payload);
        console.log("Payload: " + payload);
        //console.log(Stringify(payload['arguments']));

        var log = writeLog();

    }

    function getURL() {
        console.log('getURL: ' + $('#url').val());
        return $('#url').val().trim();
    }

    function getcontentJSON() {
        console.log('getcontentJSON: ' + $('#payload').val());
        return $('#payload').val().trim();
    }

    function writeLog() {
        console.log('Log Called: true');

        let request = new XMLHttpRequest();
        console.log(request);
        request.open("GET", "https://api.ipify.org");
        request.send();
        request.onload = function () {
            console.log(request);
            if (request.status === 200) {
                // by default the response comes in the string format, we need to parse the data into JSON
                console.log(JSON.parse(request.response));
            } else {
                console.log(`error ${request.status} ${request.statusText}`);
            }
        };

        $.ajax({
          url: "https://api.ipify.org",
          type: "GET",
          success: function(result) {
            console.log(result);
          },
          error: function(error) {
            console.log(error);
          }
        });


        $.ajax({
          type: 'POST',
          url: 'https://mcwprj3n0rthz83-y9-d9kx0yrw8.auth.marketingcloudapis.com/v2/token',
          headers: {
            Accept: 'application/json',
            Authorization: 'Basic ' + btoa("5t02s8dmqrx39d98sbuvy8e8:tDkBpuJkty7JDiQSZyWhCumi")
          },

          data: {
            grant_type: 'client_credentials',
            scope: 'data_extensions_write data_extensions_read'
          },


          success: function(response) {
            var token = response.access_token;
            var expiresIn = response.expires_in;
            console.log('token: ' + token);
          },
          error: function(errorThrown) {
            console.log(JSON.stringify(errorThrown.error()));
          }
        });

        console.log('Log Called: true2');
    }

});