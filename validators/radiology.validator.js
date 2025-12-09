const Joi = require('joi');

exports.orderScanSchema = Joi.object({
  patientId: Joi.string().required(),
  admissionId: Joi.string(),
  scanType: Joi.string().valid('xray', 'ct', 'mri', 'ultrasound', 'mammography', 'fluoroscopy', 'other').required(),
  bodyPart: Joi.string().required(),
  priority: Joi.string().valid('routine', 'urgent', 'stat'),
  clinicalIndication: Joi.string().required(),
  contrastUsed: Joi.boolean()
});

exports.updateScanResultSchema = Joi.object({
  findings: Joi.string(),
  impression: Joi.string(),
  recommendations: Joi.string(),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'reported')
});

