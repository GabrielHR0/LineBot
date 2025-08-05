const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const moment = require('moment');


class ScheduleController {

    async getSchedule(req, res) {
        try {
            const schedule = await Schedule.getSingleton();
            res.status(200).json(schedule);
        }
        catch (error) {
            console.error('Error fetching schedule:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateSettings(req, res) {
        try {
            const { timeSlot } = req.body;
            if (timeSlot < 1) {
                return res.status(400).json({ error: 'Time slot must be at least 1 minute.' });
            }
            const schedule = await Schedule.getSingleton();
            schedule.settings.timeSlot = timeSlot;
            await schedule.save();
            res.status(200).json(schedule);
        }
        catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateDayOfWeek(req, res) {
        try {
            const { dayOfWeek, workingHours, active } = req.body;
            const schedule = await Schedule.getSingleton();
            const day = schedule.weekSchedule.find(day => day.dayOfWeek === dayOfWeek);
            if (!day) {
                return res.status(404).json({ error: 'Day of week not found' });
            }
            day.workingHours = workingHours;
            day.active = active;
            await schedule.save();
            res.status(200).json(schedule);
        }
        catch (error) {
            console.error('Error updating day of week:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getByDate(req, res) {
        try {
            const { date } = req.params;
            const [day, month, year] = date.split('-');
            const dateObj = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
            if (!dateObj.isValid()) {
                return res.status(400).json({ error: 'Invalid date format. Use DD-MM-YYYY.' });
            }
            const schedule = await Schedule.getSingleton();
            const dayOfWeek = dateObj.day(); // 0 (Domingo) a 6 (Sábado)
            const daySchedule = schedule.weekSchedule.find(day => day.dayOfWeek === dayOfWeek);
            if (!daySchedule || !daySchedule.active) {
                return res.status(404).json({ error: 'No schedule found for this date.' });
            }
            const isDayOff = schedule.daysOff.includes(dateObj.format('YYYY-MM-DD'));
            if (isDayOff) {
                return res.status(404).json({ error: 'This date is a day off.' });
            }
            res.status(200).json({
                date: dateObj.format('YYYY-MM-DD'),
                workingHours: daySchedule.workingHours,
            });

        } catch (error) {
            console.error('Error fetching schedule by date:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAvailableTimeSlots(req, res) {
        try {
            const { date } = req.body;
            const [day, month, year] = date.split('/');
            const dateObj = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
            //console.log("date: ", dateObj);
            if (!dateObj.isValid()) {
                return res.status(400).json({ error: 'Invalid date format. Use DD/MM/YYYY.' });
            }
            const schedule = await Schedule.getSingleton();
            //console.log("schedule: ", schedule);
            const dayOfWeek = dateObj.day();
            const daySchedule = schedule.weekSchedule.find(day => day.dayOfWeek === dayOfWeek);
            if (!daySchedule || !daySchedule.active) {
                return res.status(404).json({ error: 'No schedule found for this date.' });
            }
            //console.log("daySchedule: ", daySchedule);

            const isDayOff = schedule.daysOff.includes(dateObj.format('YYYY-MM-DD'));
            if (isDayOff) {
                return res.status(404).json({ error: 'This date is a day off.' });
            }

        const appointments = await Appointment.find({ date: dateObj.format('YYYY-MM-DD') });
        const now = moment().seconds(0).milliseconds(0);
        const today = now.clone().startOf('day');
        const timeSlots = [];
        for (const hours of daySchedule.workingHours) {
            let startTime = moment(`${dateObj.format('YYYY-MM-DD')} ${hours.start}`, 'YYYY-MM-DD HH:mm');
            const endTime = moment(`${dateObj.format('YYYY-MM-DD')} ${hours.end}`, 'YYYY-MM-DD HH:mm');
            while (startTime.isBefore(endTime)) {
                const slotStart = startTime.format('HH:mm');
                const slotEnd = startTime.clone().add(schedule.settings.timeSlot, 'minutes').format('HH:mm');

                if (dateObj.isSame(today, 'day') && startTime.isBefore(now)) {
                    
                    startTime.add(schedule.settings.timeSlot, 'minutes');
                    continue;
                }


                // Verifica em memória se existe conflito de horário
                const hasConflict = appointments.some(app =>
                    app.start === slotStart && app.end === slotEnd && app.status !== 'cancelled'
                );


                if (!hasConflict) {
                    timeSlots.push({
                        id: startTime.valueOf(),
                        value: `${slotStart} - ${slotEnd}`,
                    });
                }
                startTime.add(schedule.settings.timeSlot, 'minutes');
            }
        }
        res.status(200).json(timeSlots);
        } catch (error) {
            console.error('Error fetching available time slots:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async scheduleAppointment(req, res) {
        try {
            const { id, client, title, description = null } = req.body;
            const slotMoment = moment(Number(id));
            if (!slotMoment.isValid()) {
                return res.status(400).json({ error: 'Invalid slot ID.' });
            }
            const dateStr = slotMoment.format('YYYY-MM-DD');
            const timeStr = slotMoment.format('HH:mm');
            const schedule = await Schedule.getSingleton();
            const isDayOff = schedule.daysOff.includes(dateStr);
            if (isDayOff) {
                return res.status(400).json({ error: 'This date is a day off.' });
            }
            const endMoment = slotMoment.clone().add(schedule.settings.timeSlot, 'minutes');
            const existingAppointment = await Appointment.findOne({
                date: dateStr,
                start: timeStr,
                end: endMoment.format('HH:mm'),
                status: { $ne: 'cancelled' }
            });
            if (existingAppointment) {
                return res.status(400).json({ error: 'Time slot already booked.' });
            }
            const newAppointment = new Appointment({
                title,
                description,
                date: dateStr,
                start: timeStr,
                end: endMoment.format('HH:mm'),
                status: 'confirmed',
                client
            });
            await newAppointment.save();
            res.status(201).json(newAppointment);
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

}

module.exports = new ScheduleController();
