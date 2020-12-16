const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')
const { BasicCard } = require('actions-on-google')

let username = "";
let password = "";
let token = "";

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = ""
if (USE_LOCAL_ENDPOINT){
ENDPOINT_URL = "http://127.0.0.1:5000"
} else{
ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu"
}

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i === 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function findProduct(name) {
  let products = await getProducts();
  // console.log(products);
  let similar_score_max = 0.0;
  let most_similar_product = undefined;
  for (let i = 0; i < products.length; i++) {
    let score = similarity(name, products[i].name);
    if (score > similar_score_max) {
      similar_score_max = score;
      most_similar_product = products[i];
    }
  }
  return most_similar_product;
}

async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/login',request)
  const serverResponse = await serverReturn.json()
  token = serverResponse.token

  return token;
}

async function navigate(endpoint) {
  fetch(ENDPOINT_URL + '/application', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    },
    body: JSON.stringify({
      "back": false,
      "dialogflowUpdated": true,
      "page": endpoint
    })
  })
  .then(res => res.json())
  .then(res => console.log(res.message))
  .catch(err => console.log(err));
}

async function addMessage(date, isUser, msg) {
  fetch(ENDPOINT_URL + '/application/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    },
    body: JSON.stringify({
      "date": date,
      "isUser": isUser,
      "text": msg
    })
  })
  .then(res => res.json())
  .then(res => console.log(res.message))
  .catch(err => console.log(err));
}

async function deleteMessages() {
  fetch(ENDPOINT_URL + '/application/messages', {
    method: 'DELETE',
    headers: {
      'x-access-token': token
    }
  })
  .then(res => res.json())
  .then(res => console.log(res.message))
  .catch(err => console.log(err));
}

async function getCategories() {
  let categories = fetch(ENDPOINT_URL + '/categories', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => {
    // console.log(res);
    return res.categories.slice(0, -1).join(", ") + " and " + res.categories.slice(-1)[0];
  })
  .catch(err => console.log(err));
  return categories;
}

async function getTags(category) {
  let tags = fetch(ENDPOINT_URL + '/categories/' + category + '/tags', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => {
    // console.log(res);
    return res.tags.slice(0, -1).join(", ") + " and " + res.tags.slice(-1)[0];
  })
  .catch(err => console.log(err));
  return tags;
}

async function getCartItems() {
  let products = fetch(ENDPOINT_URL + '/application/products', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    }
  })
  .then(res => res.json())
  .then(res => {
    // console.log(res);
    return res.products;
  })
  .catch(err => console.log(err));
  return products;
}

async function getProducts() {
  let products = fetch(ENDPOINT_URL + '/products', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => {
    // console.log(res);
    return res.products;
  })
  .catch(err => console.log(err));
  return products;
}

async function getProductReivews(id) {
  let reviews = fetch(ENDPOINT_URL + '/products/' + id + '/reviews', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => {
    // console.log(res);
    return res.reviews;
  })
  .catch(err => console.log(err));
  return reviews;
}

async function getAllTags() {
  let tags = fetch(ENDPOINT_URL + '/tags', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => {
    return res.tags;
  })
  .catch(err => console.log(err));
  return tags;
}

async function addTag(tag_value) {
  fetch(ENDPOINT_URL + '/application/tags/' + tag_value, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    }
  })
  .then(res => res.json())
  .then(res => console.log(res.message))
  .catch(err => console.log(err));
}

async function addToCart(id) {
  fetch(ENDPOINT_URL + '/application/products/' + id, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    }
  })
  .then(res => res.json())
  .then(res => console.log(res.message))
  .catch(err => console.log(err));
}

async function removeFromCart(id) {
  fetch(ENDPOINT_URL + '/application/products/' + id, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    }
  })
  .then(res => res.json())
  .then(res => console.log(res.message))
  .catch(err => console.log(err));
}

async function clearCart() {
  fetch(ENDPOINT_URL + '/application/products', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    }
  })
  .then(res => res.json())
  .then(res => console.log(res.message))
  .catch(err => console.log(err));
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome () {
    agent.add('Webhook works!')
    console.log(ENDPOINT_URL)
  }

  async function login () {
    username = agent.parameters.username;
    password = agent.parameters.password;
    await getToken();
    deleteMessages();
    await navigate("/" + username);
    for (const msg of agent.consoleMessages) {
      await addMessage(new Date().toISOString(), false, msg.text);
    }
    agent.add(token);
  }

  async function queryCategories () {
    addMessage(new Date().toISOString(), true, agent.query);
    let categories = await getCategories();
    // console.log(categories);
    let response = "No problem! There are " + categories + ".";
    addMessage(new Date().toISOString(), false, response);
    agent.add(response);
  }

  async function queryTags () {
    addMessage(new Date().toISOString(), true, agent.query);
    let tags = await getTags(agent.parameters.category);
    // console.log(tags);
    let response = "Sure! The tags of " + agent.parameters.category + " include " + tags + ".";
    addMessage(new Date().toISOString(), false, response);
    agent.add(response);
  }

  async function queryCartItems () {
    addMessage(new Date().toISOString(), true, agent.query);
    let products = await getCartItems();
    // console.log(products);
    await navigate("/" + username + "/cart");
    let response = "Let me see. You have " + products.length + " items in the cart, including ";
    for (let i = 0; i < products.length; i++) {
      response += products[i].count + " " + products[i].name
      if (i < products.length - 2) {
        response += ", ";
      } else if (i === products.length - 2) {
        response += " and ";
      }
    }
    response += ".";
    addMessage(new Date().toISOString(), false, response);
    agent.add(response);
  }

  async function queryCartCost () {
    addMessage(new Date().toISOString(), true, agent.query);
    let products = await getCartItems();
    // console.log(products);
    await navigate("/" + username + "/cart");
    let response = "Based on my calculation, the total cost of items in your cart is ";
    let cost = 0;
    for (let i = 0; i < products.length; i++) {
      cost += products[i].count * products[i].price;
    }
    response += cost + " dollars.";
    addMessage(new Date().toISOString(), false, response);
    agent.add(response);
  }

  async function queryProduct () {
    addMessage(new Date().toISOString(), true, agent.query);
    let most_similar_product = await findProduct(agent.parameters.product);
    await navigate("/" + username + "/" + most_similar_product.category + "/products/" + most_similar_product.id);
    let response = "Nice choice! The price of " + most_similar_product.name + " is " + most_similar_product.price + " dollars. "
      + most_similar_product.description;
    addMessage(new Date().toISOString(), false, response);
    agent.add(response);
  }

  async function queryProductReviews () {
    addMessage(new Date().toISOString(), true, agent.query);
    let most_similar_product = await findProduct(agent.parameters.product);
    await navigate("/" + username + "/" + most_similar_product.category + "/products/" + most_similar_product.id);
    let reviews = await getProductReivews(most_similar_product.id);
    let response = "Sorry, I didn't find any reviews about " + most_similar_product.name + ".";
    if (reviews.length > 0) {
      let review_text = "";
      let ratings = 0.0;
      for (let i = 0; i < reviews.length; i++) {
        review_text += '"' + reviews[i].text + '"';
        ratings += reviews[i].stars;
        if (i < reviews.length - 2) {
          review_text += ", ";
        } else if (i === reviews.length - 2) {
          review_text += " and ";
        }
      }
      ratings /= reviews.length;
      response = "It looks like the averatge rating is " + ratings.toFixed(2) + " stars. Here are some reviews of " + 
        most_similar_product.name + ": " + review_text;
    }
    addMessage(new Date().toISOString(), false, response);
    agent.add(response);
  }

  async function actionTags () {
    addMessage(new Date().toISOString(), true, agent.query);

    let tags = await getAllTags();
    // console.log(tags);
    let similar_score_max = 0.0;
    let most_similar_tag = "";
    for (let i = 0; i < tags.length; i++) {
      let score = similarity(agent.parameters.tag, tags[i]);
      if (score > similar_score_max) {
        similar_score_max = score;
        most_similar_tag = tags[i];
      }
    }
    await addTag(most_similar_tag);

    for (const msg of agent.consoleMessages) {
      await addMessage(new Date().toISOString(), false, msg.text);
    }
    agent.add(most_similar_tag);
  }

  async function actionCartAdd () {
    addMessage(new Date().toISOString(), true, agent.query);
    let product = agent.contexts[0].parameters.product;
    // console.log(agent.contexts);
    let most_similar_product = await findProduct(product);
    await addToCart(most_similar_product.id);

    let response = "Sure! " + most_similar_product.name + " has been added to your cart."
    addMessage(new Date().toISOString(), false, response);
    agent.add(response);
  }

  async function actionCartRemove () {
    addMessage(new Date().toISOString(), true, agent.query);
    // console.log(agent.parameters);
    let products = await getCartItems();
    let product = undefined;
    await navigate("/" + username + "/cart");
    if (agent.parameters.ordinal) {
      product = products[agent.parameters.ordinal - 1];
    } else if (agent.parameters.product) {
      product = await findProduct(agent.parameters.product);
    } else {
      agent.add("Please specify which item you want to remove from the cart.");
    }
    await removeFromCart(product.id);

    let response = "No problem! " + product.name + " has been removed from your cart."
    addMessage(new Date().toISOString(), false, response);
    agent.add(response);
  }

  async function actionCartClear () {
    addMessage(new Date().toISOString(), true, agent.query);
    await navigate("/" + username + "/cart");
    await clearCart();

    for (const msg of agent.consoleMessages) {
      await addMessage(new Date().toISOString(), false, msg.text);
    }
    agent.add("clear");
  }

  async function actionCartReview () {
    addMessage(new Date().toISOString(), true, agent.query);
    await navigate("/" + username + "/cart-review");
    for (const msg of agent.consoleMessages) {
      await addMessage(new Date().toISOString(), false, msg.text);
    }
    agent.add("proceed to check out");
  }

  async function actionCartReviewYes () {
    addMessage(new Date().toISOString(), true, agent.query);
    await navigate("/" + username + "/cart-confirmed");
    for (const msg of agent.consoleMessages) {
      await addMessage(new Date().toISOString(), false, msg.text);
    }
    agent.add("your order has been placed");
  }

  async function actionCartReviewNo () {
    addMessage(new Date().toISOString(), true, agent.query);
    await navigate("/" + username + "/cart");
    for (const msg of agent.consoleMessages) {
      await addMessage(new Date().toISOString(), false, msg.text);
    }
    agent.add("back");
  }

  async function actionNavigation () {
    addMessage(new Date().toISOString(), true, agent.query);
    let endpoint = undefined;
    if (agent.parameters.page) {
      endpoint = agent.parameters.page;
    } else if (agent.parameters.category) {
      endpoint = agent.parameters.category;
    } else {
      agent.add("Please specify which page you would like to go to.");
    }
    if (endpoint == "homepage") endpoint = "";
    await navigate("/" + username + "/" + endpoint);
    for (const msg of agent.consoleMessages) {
      await addMessage(new Date().toISOString(), false, msg.text);
    }
    agent.add(endpoint);
  }

  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  // You will need to declare this `Login` content in DialogFlow to make this work
  intentMap.set('Login', login) 
  intentMap.set('Query.categories', queryCategories) 
  intentMap.set('Query.tags', queryTags) 
  intentMap.set('Query.cart.items', queryCartItems) 
  intentMap.set('Query.cart.cost', queryCartCost) 
  intentMap.set('Query.product', queryProduct)
  intentMap.set('Query.product.reviews', queryProductReviews)
  intentMap.set('Action.tags', actionTags)
  intentMap.set('Action.cart.add', actionCartAdd)
  intentMap.set('Action.cart.remove', actionCartRemove)
  intentMap.set('Action.cart.clear', actionCartClear)
  intentMap.set('Action.cart.review', actionCartReview)
  intentMap.set('Action.cart.review - yes', actionCartReviewYes)
  intentMap.set('Action.cart.review - no', actionCartReviewNo)
  intentMap.set('Action.navigation', actionNavigation)

  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)