const Joi = require('joi');

exports.dispenseSchema = Joi.object({
  prescriptionId: Joi.string().required(),
  items: Joi.array().items(Joi.object({
    drugName: Joi.string().required(),
    batchNumber: Joi.string(),
    expiryDate: Joi.date(),
    quantityDispensed: Joi.number().min(1).required(),
    unitPrice: Joi.number().min(0).required(),
    instructions: Joi.string()
  })).min(1).required(),
  paymentMethod: Joi.string().valid('wallet', 'cash', 'card', 'invoice'),
  notes: Joi.string()
});
