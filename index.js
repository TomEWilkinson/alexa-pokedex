// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
//const pokedex = require('./pokemonApi');
const https = require('https');

const PokedexIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'PokedexIntent';
  },
   async handle(handlerInput) {
    const pokemon = handlerInput.requestEnvelope.request.intent.slots.pokemon.value;
    const response = await GetPokemon(pokemon);
    const repromptText = `If you want to know more about pokemon, say the name of another`;

    return handlerInput.responseBuilder
            .speak(`${response}`)
            .reprompt(repromptText)
            .getResponse();
  },
};

 const GetPokemon = async function (pokemon) {
     //needed to replace the accented characters and to lowercase the string that comes from alexa
     pokemon = pokemon.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
     return new Promise(((resolve, reject) => {
        var options = {
            host: 'pokeapi.co',
            port: 443,
            path: `/api/v2/pokemon-species/${pokemon}`,
            method: 'GET',
        };
        
        const request = https.request(options, (response) => {
          response.setEncoding('utf8');
          let returnData = '';
        
          response.on('data', (chunk) => {
            returnData += chunk;
          });
        
          response.on('end', () => {
            console.log(response.statusCode);
            console.log(returnData);
            
            if(response.statusCode === 404)
            {
                console.log("this is a 404");
                resolve("Pokemon not found, we only have generation one!")
                return;
            }
            
            let data = JSON.parse(returnData);
            let description = "";
            let i = 0;
            
            while(description === "")
            {
                if(data.flavor_text_entries[i].language.name === "en")
                {
                    description = data.flavor_text_entries[i].flavor_text;
                }
                
                i++;
                
                if(data.flavor_text_entries[i].length < i )
                {
                    description = "no english entry found";
                }
            }
            resolve(description);
          });
    
          response.on('error', (error) => {
            reject(error);
          });
        });
        request.end();
      }));
    }

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = `Welcome, what pokemon would you like to hear more about?`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = `You can ask me about a pokemon's description, which one would you like to know more about?`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        PokedexIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
