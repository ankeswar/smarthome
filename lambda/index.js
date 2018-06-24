var mqtt = require('mqtt'),
    my_topic_name = 'ankeswar/feeds/device';

var client = {
    'connected': false
};;
exports.handler = function (request, context) {
    if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
        log("DEBUG:", "Discover request",  JSON.stringify(request));
        handleDiscovery(request, context, "");
    }
    else if (request.directive.header.namespace === 'Alexa.PowerController') {
        if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
            log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
            handlePowerControl(request, context);
        }
    }
    else{
        log("DEBUG:", "UNKNOWN Request", JSON.stringify(request));
    }







    function handleDiscovery(request, context) {
        var payload = {
            "endpoints":
                [
                    {
                        "endpointId": "ir_adapter",
                        "manufacturerName": "Sony",
                        "friendlyName": "TV",
                        "description": "Smart Switch for TVs",
                        "displayCategories": ["SWITCH"],
                        "cookie": {
                            "onoff": "supported",
                            "sources": "not yet"
                        },
                        "capabilities":
                            [
                                {
                                    "type": "AlexaInterface",
                                    "interface": "Alexa",
                                    "version": "3"
                                },
                                {
                                    "interface": "Alexa.PowerController",
                                    "version": "3",
                                    "type": "AlexaInterface",
                                    "properties": {
                                        "supported": [
                                            {
                                                "name": "powerState"
                                            }
                                        ],
                                        "retrievable": false,
                                        "proactivelyReported": false
                                    }
                                }
                            ]
                    }
                ]
        };
        var header = request.directive.header;
        header.name = "Discover.Response";
        log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }

    function log(message, message1, message2) {
        console.log(message + message1 + message2);
    }

    function handlePowerControl(request, context) {
        // get device ID passed in during discovery
        var requestMethod = request.directive.header.name;
        // get user token pass in request
        var requestToken = request.directive.endpoint.scope.token;
        var powerResult;


        if (requestMethod === "TurnOn") {

            // Make the call to your device cloud for control
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
            powerResult = "ON";

        }
        else if (requestMethod === "TurnOff") {
            // Make the call to your device cloud for control and check for success
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
            powerResult = "OFF";
        }
        var contextResult = {
            "properties": [{
                "namespace": "Alexa.PowerController",
                "name": "powerState",
                "value": powerResult,
                "timeOfSample": "2017-09-03T16:20:50.52Z", //retrieve from result.
                "uncertaintyInMilliseconds": 50
            }]
        };
        var responseHeader = request.directive.header;
        var responseEndpont = request.directive.endpoint;
        responseHeader.namespace = "Alexa";
        responseHeader.name = "Response";
        responseHeader.messageId = responseHeader.messageId + "-R";
        var response = {
            context: contextResult,
            event: {
                header: responseHeader,
                endpoint: responseEndpont,
                payload: {}
            }

        };
        log("DEBUG", "Alexa.PowerController ", JSON.stringify(response));

        if (!client.connected){
            log("DEBUG", "Alexa.PowerController ", "MQTT NOT connected " );
            /*
            Tell lambda to stop when I issue the callback.
            This is super important or the lambda funciton will always go until it hits the timeout limit you set.
            */
            context.callbackWaitsForEmptyEventLoop = false;

            client = new mqtt.connect('mqtts://io.adafruit.com',{
                port: 8883,
                username: 'ankeswar',
                password: '94508c6d93ef4ad0a24e6caeed2bcf22'
            });
            client.on('connect', function () {
                log("DEBUG", "Alexa.PowerController ", "MQTT Connected ");
                log("DEBUG", "Alexa.PowerController ", "MQTT publishing " + requestMethod);
                context.callbackWaitsForEmptyEventLoop = true;
                client.publish(my_topic_name, requestMethod);
                context.succeed(response);
            });
            client.on('error', function () {
                log("DEBUG", "Alexa.PowerController ", "MQTT error ");
            });



        }else{
            log("DEBUG", "Alexa.PowerController ", "MQTT publishing " + requestMethod);
            context.callbackWaitsForEmptyEventLoop = true;
            client.publish(my_topic_name, requestMethod);
            context.succeed(response);
        }

    }
};