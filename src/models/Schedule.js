const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({

    weekSchedule: [{
        dayOfWeek: {  // 0 (Domingo) a 6 (Sábado)
            type: Number,
            required: true,
            min: 0,
            max: 6
        },
        workingHours: [{
            start: {      // Formato "HH:MM" em 24h
                type: String,
                required: true,
                match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
            },
            end: {        // Formato "HH:MM" em 24h
                type: String,
                required: true,
                match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
            }
        }],
        active: {
            type: Boolean,
            default: true
        }
    }],
    daysOff: {     // Datas no formato "YYYY-MM-DD"
        type: [String],
        default: [],
        validate: {
            validator: function(dates) {
                return dates.every(date => /^\d{4}-\d{2}-\d{2}$/.test(date));
            }
        }
    },
    settings: {
        timeSlot: {
            type: Number,
            default: 30,
            min: 1
        }
    },
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    }]
});

ScheduleSchema.statics.getSingleton = async function() {
    let schedule = await this.findOne();
    if (!schedule) {
        schedule = await this.create({
            weekSchedule: [1, 2, 3, 4, 5].map(dayOfWeek => ({
                dayOfWeek,
                workingHours: [{
                    start: '00:00',
                    end: '23:59'
                }],
                active: true
            })),
            daysOff: []
        });
    }
    return schedule;
};

module.exports = mongoose.model('Schedule', ScheduleSchema);