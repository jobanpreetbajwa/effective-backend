const mongoose = require('mongoose');

const offerTypePriority = {
  flash: 1,
  seasonal: 2,
  loyalty: 3,
  buyX_getY: 4,
  free_shipping: 5,
  percentage: 6,
  fixed: 7,
};

const offerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping', 'buyX_getY', 'seasonal', 'loyalty', 'flash'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requiredQuantity: {
    type: Number,
    required: function() {
      return this.type === 'buyX_getY';
    }
  },
  freeQuantity: {
    type: Number,
    required: function() {
      return this.type === 'buyX_getY';
    }
  },
  discountPercent: {
    type: Number,
    required: function() {
      return ['percentage', 'fixed', 'seasonal', 'loyalty', 'flash'].includes(this.type);
    }
  },
  discountUpto: {
    type: Number,
    required: function() {
      return ['percentage', 'fixed', 'seasonal', 'loyalty', 'flash'].includes(this.type);
    }
  },
  minOrderValue: {
    type: Number,
    required: function() {
      return ['percentage', 'fixed', 'seasonal', 'loyalty', 'flash'].includes(this.type);
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  timeStamp: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: Number,
    default: function() {
      return offerTypePriority[this.type];
    }
  }
});

offerSchema.pre('save', function(next) {
  if (!this.priority) {
    this.priority = offerTypePriority[this.type];
  }
  next();
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;