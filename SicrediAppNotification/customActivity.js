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
        { "label": "Step 1", "key": "step1" },
        { "label": "Step 2", "key": "step2" }
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
        $('#message').change(function() {
            var message = getMessage();

            connection.trigger('updateButton', { button: 'next', enabled: camposPreenchidos() });

            $('#divMessage').html( message);
        });
    }

    function initialize (data) {
        if (data) {
            payload = data;
        }
        var message = '';
        var title = '';

        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        // $.each(inArguments, function(index, inArgument) {
        //     $.each(inArgument, function(key, val) {
        //         if (key === 'message') {
        //             message = val;
        //         }
        //         if (key === 'title') {
        //             title = val;
        //         }
        //     });
        // });

        // If there is no message selected, disable the next button
        if (!inArguments[0].message ) {
            showStep(null, 1);
            connection.trigger('updateButton', { button: 'next', enabled: false });
            // If there is a message, skip to the summary step
        } else {
            $('#message').val(inArguments[0].message);
            $('#divMessage').html(getMessage());
            $('#title').html(inArguments[0].title);
            $('#prioridade').html(inArguments[0].prioridade);
            $('#from').html(inArguments[0].from);
            $('#action').html(inArguments[0].action);
            //$('#action').html(inArguments[0].title + ' - ' + message );
            showStep(null, 2);
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
        if (currentStep.key === 'step2') {
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
                    enabled: Boolean(getMessage())
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
        }
    }

    function save() {
        var name = $('#message').val();
        //var value = getMessage();

        // 'payload' is initialized on 'initActivity' above.
        // Journey Builder sends an initial payload with defaults
        // set by this activity's config.json file.  Any property
        // may be overridden as desired.
        payload.name = 'Push Notification App';

        payload['arguments'].execute.inArguments[0].message = $('#message').val();
        payload['arguments'].execute.inArguments[0].priority = $('#prioridade').val();
        payload['arguments'].execute.inArguments[0].from = $('#from').val();
        payload['arguments'].execute.inArguments[0].action = $('#action').val();
        payload['arguments'].execute.inArguments[0].title = $('#title').val();

        payload['metaData'].isConfigured = true;

        connection.trigger('updateActivity', payload);
    }

    function  camposPreenchidos(){
        if($('#action').val() == '' || $('#title').val() == '' || $('#from').val() == '' || $('#message').val() == ''){
            return false;
        }
        else{
            return true;
        }
    }
    function getMessage() {
        return $('#title').val().trim() + ' - ' + $('#message').val().trim();
    }

});
