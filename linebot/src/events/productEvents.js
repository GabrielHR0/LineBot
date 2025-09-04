
const EventEmitter = require('events');
class ProductEventEmitter extends EventEmitter {}
const productEvents = new ProductEventEmitter();

// Eventos disponíveis
module.exports = {
  PRODUCT_UPDATED: 'productUpdated',
  productEvents
};