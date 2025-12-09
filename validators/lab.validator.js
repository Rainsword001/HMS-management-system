const Joi = require('joi');

exports.orderLabTestSchema = Joi.object({
  patientId: Joi.string().required(),
  admissionId: Joi.string(),
  testCategory: Joi.string().valid('hematology', 'biochemistry', 'microbiology', 'urinalysis', 'serology', 'histopathology', 'other').required(),
  testType: Joi.string().required(),
  priority: Joi.string().valid('routine', 'urgent', 'stat'),
  clinicalHistory: Joi.string(),
  specimenType: Joi.string()
});

exports.updateLabResultSchema = Joi.object({
  results: Joi.array().items(Joi.object({
    testName: Joi.string().required(),
    result: Joi.string().required(),
    unit: Joi.string(),
    referenceRange: Joi.string(),
    flag: Joi.string().valid('normal', 'low', 'high', 'critical')
  })).min(1),
  interpretation: Joi.string(),
  status: Joi.string().valid('collected', 'processing', 'completed', 'verified')
});
