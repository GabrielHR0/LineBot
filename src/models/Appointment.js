const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: {
        type: String, // Formato YYYY-MM-DD
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: 'Formato de data inválido. Use YYYY-MM-DD.'
        }
    },
    start: {      // Formato "HH:MM" em 24h
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    end: {        // Formato "HH:MM" em 24h
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: 200
    },
    rescheduledFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
}, {timestamps:true});


module.exports = mongoose.model('Appointment', AppointmentSchema);