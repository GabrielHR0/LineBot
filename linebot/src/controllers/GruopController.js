const Group = require('../models/Group')

class GroupController {

    async create(name, description = "", key){
        return await Group.create({
            name,
            description,
            key
        })
    }

    async getAll(){
        return await Group.find();
    }

    async deleteById(_id){
        return await Group.deleteOne({ _id });
    }

    async getById(_id){
        return await Group.findOne({ _id });
    }

    async edit(_id, data) {
        return await Group.findOneAndUpdate({ _id }, data, { new: true });
    }

}

module.exports = new GroupController();